import * as React from 'react';

import * as jsxRuntime from 'react/jsx-runtime';
import * as jsxDevRuntime from 'react/jsx-dev-runtime';

import type { BookVisualRendererProps, JsonObject } from '@active-book/types';

import { copyVisualData } from 'activeBook-core/controllers/visualEffects/utils/serialization';

import { type VisualCategory, customVisualDefinitionId } from '../../visualEffects';

import {
  MAX_ARCHIVE_BYTES,
  MAX_EXTRACTED_BYTES,
  MAX_FILE_BYTES,
  TAR_BLOCK_SIZE,
  textDecoder,
} from './constants';

type ManifestComponent = {
  title: string;
  description?: string;
  entry: string;
  export: string;
  styles?: string[];
};

type ManifestVisualEffect = ManifestComponent & {
  category: VisualCategory;
  defaultParams?: JsonObject;
};

type BrowserManifest = {
  schemaVersion: number;
  components: Record<string, ManifestComponent>;
  visualEffects?: Record<string, ManifestVisualEffect>;
};

type BrowserPackage = {
  name: string;
  activeBook: string;
};

export type BrowserComponentDefinition = {
  id: string;
  name: string;
  packageName: string;
  title: string;
  description?: string;
};

export type BrowserVisualDefinition = BrowserComponentDefinition & {
  category: VisualCategory;
  defaultParams: JsonObject;
};

export type BrowserLibrary = {
  packageName: string;
  definitions: BrowserComponentDefinition[];
  components: Record<string, React.ComponentType>;
  visualDefinitions: BrowserVisualDefinition[];
  visualComponents: Record<string, React.ComponentType<BookVisualRendererProps>>;
  dispose: () => void;
};

const readTarString = (data: Uint8Array, offset: number, size: number): string => {
  const subarray = data.subarray(offset, offset + size);
  const decodedText = textDecoder.decode(subarray);

  return decodedText.replace(/\0.*$/, '');
};

const readTar = (data: Uint8Array): Map<string, Uint8Array> => {
  const files = new Map<string, Uint8Array>();

  for (let offset = 0; offset + TAR_BLOCK_SIZE <= data.byteLength;) {
    const name = readTarString(data, offset, 100);
    const prefix = readTarString(data, offset + 345, 155);

    if (!name) {
      break;
    }

    const tarString = readTarString(data, offset + 124, 12).trim();
    const length = Number.parseInt(tarString, 8);
    const contentOffset = offset + TAR_BLOCK_SIZE;
    const contentEnd = contentOffset + length;
    const type = data[offset + 156];

    const validLength = Number.isSafeInteger(length) && length >= 0;
    const validContent = contentEnd <= data.byteLength;

    if (!validLength || !validContent) {
      throw new Error('Некорректный TGZ: повреждён TAR-заголовок');
    }

    const path = prefix ? `${prefix}/${name}` : name;

    const pathIsValid = path.startsWith('package/')
      && !path.split('/').includes('..');

    const typeIsValid = type === 0 || type === 48;
    const lengthIsValid = length <= MAX_FILE_BYTES;

    if (pathIsValid && typeIsValid && lengthIsValid) {
      files.set(path, data.subarray(contentOffset, contentEnd));
    }

    offset = contentOffset + Math.ceil(length / TAR_BLOCK_SIZE) * TAR_BLOCK_SIZE;
  }

  return files;
};

export const unpackBrowserArchive = async (archive: Blob): Promise<Map<string, Uint8Array>> => {
  if (archive.size > MAX_ARCHIVE_BYTES) {
    throw new Error('Максимальный размер библиотеки — 50 МБ');
  }

  if (!('DecompressionStream' in globalThis)) {
    throw new Error('Этот браузер не поддерживает распаковку TGZ');
  }

  const decompressedStream = new DecompressionStream('gzip');
  const stream = archive.stream().pipeThrough(decompressedStream);
  const buffer = await new Response(stream).arrayBuffer();

  if (buffer.byteLength > MAX_EXTRACTED_BYTES) {
    throw new Error('Распакованная библиотека превышает допустимый размер');
  }

  return readTar(new Uint8Array(buffer));
};

const getArchivePath = (relativePath: string): string => {
  const hasRelativePrefix = relativePath.startsWith('./');
  const hasBackslash = relativePath.includes('\\');

  const pathParts = relativePath.split('/');

  const hasInvalidParts = pathParts.some((partCur) => {
    return partCur === '..' || partCur === '';
  });

  const isInvalidPath = !hasRelativePrefix || hasBackslash || hasInvalidParts;

  if (isInvalidPath) {
    throw new Error(`Некорректный путь в манифесте: ${relativePath}`);
  }

  const archivePath = relativePath.slice(2);

  return `package/${archivePath}`;
};

const getFile = (files: Map<string, Uint8Array>, path: string): Uint8Array => {
  const archivePath = getArchivePath(path);
  const file = files.get(archivePath);

  if (!file) {
    throw new Error(`Файл ${path} отсутствует в TGZ`);
  }

  return file;
};

const getJson = <T>(files: Map<string, Uint8Array>, path: string): T => {
  const file = getFile(files, path);
  const decodedText = textDecoder.decode(file);

  return JSON.parse(decodedText) as T;
};

type BrowserArchive = {
  files: Map<string, Uint8Array>;
  packageName: string;
  manifest: BrowserManifest;
};

export const inspectBrowserArchive = async (archive: Blob): Promise<BrowserArchive> => {
  const files = await unpackBrowserArchive(archive);
  const file = files.get('package/package.json');
  const decodedText = textDecoder.decode(file);
  const packageJson = JSON.parse(decodedText) as BrowserPackage;

  const packageJsonIsValid = typeof packageJson?.name === 'string'
    && typeof packageJson?.activeBook === 'string';

  if (!packageJson || !packageJsonIsValid) {
    throw new Error('TGZ не содержит корректный package.json с полем activeBook');
  }

  const manifest = getJson<BrowserManifest>(files, packageJson.activeBook);

  if (!manifest.components && manifest.visualEffects) {
    manifest.components = {};
  }

  if (manifest.schemaVersion !== 1 || !manifest.components || Array.isArray(manifest.components)) {
    throw new Error('Неподдерживаемый манифест Active Book');
  }

  const visuals = manifest.visualEffects ?? {};

  if (typeof visuals !== 'object' || Array.isArray(visuals)) {
    throw new Error('Некорректный раздел visualEffects');
  }

  for (const visualCur of Object.values(visuals)) {
    const categoryIsValid = visualCur?.category === 'background' || visualCur?.category === 'frame';

    if (!visualCur || !categoryIsValid) {
      throw new Error('Визуальное определение должно указывать category background или frame');
    }

    const defaults = visualCur.defaultParams ?? {};
    const defaultsHasValidType = typeof defaults === 'object' && defaults !== null;

    if (!defaultsHasValidType || Array.isArray(defaults)) {
      throw new Error('defaultParams должен быть JSON-объектом');
    }

    copyVisualData(defaults);
  }

  const components = [
    ...Object.entries(manifest.components),
    ...Object.entries(visuals),
  ];

  for (const [name, component] of components) {
    const hasComponent = Boolean(component);

    const hasValidTitle = typeof component?.title === 'string';
    const hasValidExport = typeof component?.export === 'string';
    const hasValidEntry = typeof component?.entry === 'string';

    const isJavaScriptFile = hasValidEntry && component.entry.endsWith('.js');
    const hasValidStyles = Array.isArray(component?.styles ?? []);

    const isValidComponent = hasComponent
      && hasValidTitle
      && hasValidExport
      && hasValidEntry
      && isJavaScriptFile
      && hasValidStyles;

    if (!isValidComponent) {
      throw new Error(`Некорректный компонент ${name} в манифесте`);
    }

    getFile(files, component.entry);

    const styles = component.styles ?? [];

    for (const stylePath of styles) {
      getFile(files, stylePath);
    }
  }

  return {
    files,
    packageName: packageJson.name,
    manifest,
  };
};

// The official boilerplate references these objects from its already built ESM.
// No npm installation, Vite transform or second copy of React is involved.
const prepareSharedReact = (): void => {
  const host = globalThis as typeof globalThis & {
    __ACTIVE_BOOK_HOST__?: {
      react: typeof React;
      jsxRuntime: typeof jsxRuntime;
      jsxDevRuntime: typeof jsxDevRuntime;
    };
  };

  host.__ACTIVE_BOOK_HOST__ = {
    react: React,
    jsxRuntime,
    jsxDevRuntime,
  };
};

type Signal = {
  signal?: AbortSignal;
};

export const loadBrowserLibrary = async (
  archive: Blob,
  { signal }: Signal = {},
): Promise<BrowserLibrary> => {
  signal?.throwIfAborted();

  const {
    files,
    manifest,
    packageName,
  } = await inspectBrowserArchive(archive);

  prepareSharedReact();

  const resources = new Map<string, string>();
  const links: HTMLLinkElement[] = [];

  const getResourceUrl = (path: string, mimeType: string): string => {
    signal?.throwIfAborted();

    const existing = resources.get(path);

    if (existing) {
      return existing;
    }

    const contents = getFile(files, path);
    const url = URL.createObjectURL(new Blob([new Uint8Array(contents)], { type: mimeType }));

    resources.set(path, url);

    return url;
  };

  const dispose = () => {
    signal?.removeEventListener('abort', dispose);

    for (const linkCur of links) {
      linkCur.remove();
    }

    for (const url of resources.values()) {
      URL.revokeObjectURL(url);
    }

    resources.clear();

    links.length = 0;
  };

  signal?.addEventListener('abort', dispose, { once: true });

  try {
    signal?.throwIfAborted();

    const definitions: BrowserComponentDefinition[] = [];
    const components: Record<string, React.ComponentType> = {};

    const visualDefinitions: BrowserVisualDefinition[] = [];
    const visualComponents: BrowserLibrary['visualComponents'] = {};

    const loadExport = async (component: ManifestComponent) => {
      const styles = component.styles ?? [];

      for (const stylePath of styles) {
        const someLinkHasStyle = links.some((linkCur) => {
          return linkCur.dataset.activeBookStyle === `${packageName}:${stylePath}`;
        });

        if (someLinkHasStyle) {
          continue;
        }

        const link = document.createElement('link');

        link.rel = 'stylesheet';
        link.href = getResourceUrl(stylePath, 'text/css');
        link.dataset.activeBookStyle = `${packageName}:${stylePath}`;

        document.head.appendChild(link);

        links.push(link);
      }
      const moduleUrl = getResourceUrl(component.entry, 'text/javascript');

      // Модуль загружается по URL, созданному во время выполнения.
      // Vite не должен пытаться включить его в сборку.
      const module = await import(/* @vite-ignore */ moduleUrl) as Record<string, unknown>;

      signal?.throwIfAborted();

      const exported = module[component.export];

      if (typeof exported !== 'function' && (typeof exported !== 'object' || exported === null)) {
        const componentName = `${packageName}/${component.export}`;

        throw new Error(`Экспорт ${componentName} отсутствует в браузерном ESM`);
      }

      return exported as React.ComponentType;
    };

    for (const [name, component] of Object.entries(manifest.components)) {
      const id = `${packageName}/${name}`;

      components[id] = await loadExport(component);

      definitions.push({
        id,
        name,
        packageName,
        title: component.title,
        description: component.description,
      });
    }

    for (const [name, visual] of Object.entries(manifest.visualEffects ?? {})) {
      const id = customVisualDefinitionId(visual.category, `${packageName}/${name}`);

      visualComponents[id] = await loadExport(visual) as React.ComponentType<BookVisualRendererProps>;

      visualDefinitions.push({
        id,
        name,
        packageName,
        title: visual.title,
        description: visual.description,
        category: visual.category,
        defaultParams: visual.defaultParams ?? {},
      });
    }

    return {
      packageName,
      definitions,
      components,
      visualDefinitions,
      visualComponents,
      dispose,
    };
  } catch (error) {
    dispose();

    throw error;
  }
};
