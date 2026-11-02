import * as React from 'react';

import * as jsxRuntime from 'react/jsx-runtime';

import * as jsxDevRuntime from 'react/jsx-dev-runtime';

import type { BookVisualRendererProps, JsonObject } from '@active-book/types';

import { copyVisualData } from 'activeBook-core/controllers/visualEffects/utils/serialization';

import { customVisualDefinitionId } from '../../visualEffects/definitions';
import type { VisualCategory } from '../../visualEffects/@types';



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
  return textDecoder.decode(data.subarray(offset, offset + size)).replace(/\0.*$/, '');
};

const readTar = (data: Uint8Array): Map<string, Uint8Array> => {
  const files = new Map<string, Uint8Array>();

  for (let offset = 0; offset + TAR_BLOCK_SIZE <= data.byteLength;) {
    const name = readTarString(data, offset, 100);
    const prefix = readTarString(data, offset + 345, 155);

    if (!name) {
      break;
    }

    const length = Number.parseInt(readTarString(data, offset + 124, 12).trim(), 8);
    const contentOffset = offset + TAR_BLOCK_SIZE;
    const contentEnd = contentOffset + length;
    const type = data[offset + 156];

    if (!Number.isSafeInteger(length) || length < 0 || contentEnd > data.byteLength) {
      throw new Error('Некорректный TGZ: повреждён TAR-заголовок');
    }

    const path = prefix ? `${prefix}/${name}` : name;

    if (path.startsWith('package/') && !path.split('/').includes('..')
      && (type === 0 || type === 48) && length <= MAX_FILE_BYTES) {
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

  const stream = archive.stream().pipeThrough(new DecompressionStream('gzip'));
  const buffer = await new Response(stream).arrayBuffer();

  if (buffer.byteLength > MAX_EXTRACTED_BYTES) {
    throw new Error('Распакованная библиотека превышает допустимый размер');
  }

  return readTar(new Uint8Array(buffer));
};

const getArchivePath = (relativePath: string): string => {
  if (!relativePath.startsWith('./') || relativePath.includes('\\')
    || relativePath.split('/').some((part) => part === '..' || part === '')) {
    throw new Error(`Некорректный путь в манифесте: ${relativePath}`);
  }

  return `package/${relativePath.slice(2)}`;
};

const getFile = (files: Map<string, Uint8Array>, path: string): Uint8Array => {
  const file = files.get(getArchivePath(path));

  if (!file) {
    throw new Error(`Файл ${path} отсутствует в TGZ`);
  }

  return file;
};

const getJson = <T>(files: Map<string, Uint8Array>, path: string): T => {
  return JSON.parse(textDecoder.decode(getFile(files, path))) as T;
};

export const inspectBrowserArchive = async (archive: Blob): Promise<{
  files: Map<string, Uint8Array>;
  packageName: string;
  manifest: BrowserManifest;
}> => {
  const files = await unpackBrowserArchive(archive);
  const packageJson = JSON.parse(textDecoder.decode(files.get('package/package.json'))) as BrowserPackage;

  if (!packageJson || typeof packageJson.name !== 'string' || typeof packageJson.activeBook !== 'string') {
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
  for (const visual of Object.values(visuals)) {
    if (!visual || (visual.category !== 'background' && visual.category !== 'frame')) {
      throw new Error('Визуальное определение должно указывать category background или frame');
    }
    const defaults = visual.defaultParams ?? {};
    if (typeof defaults !== 'object' || Array.isArray(defaults) || defaults === null) {
      throw new Error('defaultParams должен быть JSON-объектом');
    }
    copyVisualData(defaults);
  }
  for (const [name, component] of [...Object.entries(manifest.components), ...Object.entries(visuals)]) {
    if (!component || typeof component.title !== 'string'
      || typeof component.export !== 'string' || typeof component.entry !== 'string'
      || !component.entry.endsWith('.js') || !Array.isArray(component.styles ?? [])) {
      throw new Error(`Некорректный компонент ${name} в манифесте`);
    }

    getFile(files, component.entry);

    for (const stylePath of component.styles ?? []) {
      getFile(files, stylePath);
    }
  }

  return { files, packageName: packageJson.name, manifest };
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

export const loadBrowserLibrary = async (
  archive: Blob,
  { signal }: { signal?: AbortSignal } = {},
): Promise<BrowserLibrary> => {
  signal?.throwIfAborted();
  const { files, manifest, packageName } = await inspectBrowserArchive(archive);

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
    for (const link of links) {
      link.remove();
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
      for (const stylePath of component.styles ?? []) {
        if (links.some((link) => link.dataset.activeBookStyle === `${packageName}:${stylePath}`)) {
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
      const module = await import(/* @vite-ignore */ moduleUrl) as Record<string, unknown>;
      signal?.throwIfAborted();
      const exported = module[component.export];
      if (typeof exported !== 'function' && (typeof exported !== 'object' || exported === null)) {
        throw new Error(`Экспорт ${packageName}/${component.export} отсутствует в браузерном ESM`);
      }
      return exported as React.ComponentType;
    };

    for (const [name, component] of Object.entries(manifest.components)) {
      const id = `${packageName}/${name}`;
      components[id] = await loadExport(component);
      definitions.push({ id, name, packageName, title: component.title, description: component.description });
    }
    for (const [name, visual] of Object.entries(manifest.visualEffects ?? {})) {
      const id = customVisualDefinitionId(visual.category, `${packageName}/${name}`);
      visualComponents[id] = await loadExport(visual) as React.ComponentType<BookVisualRendererProps>;
      visualDefinitions.push({
        id, name, packageName, title: visual.title, description: visual.description,
        category: visual.category, defaultParams: visual.defaultParams ?? {},
      });
    }

    return { packageName, definitions, components, visualDefinitions, visualComponents, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
};
