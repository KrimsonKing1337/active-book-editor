import {
  type BrowserLibrary,
  inspectBrowserArchive,
  loadBrowserLibrary,
} from '@active-book/book-builder/components/custom/browser';

import type { ProjectStorage } from './@types';
import type { FilePickerWindow, ProjectFileHandle } from './fileSystemAccess';

type PackageDescription = {
  dependencies?: Record<string, string>;
  [key: string]: unknown;
};

const getDependencies = async (storage: ProjectStorage): Promise<PackageDescription> => {
  const packageJson = await storage.readPackageJson();

  return JSON.parse(packageJson) as PackageDescription;
};

const getArchivePath = (specifier: string): string => {
  if (!specifier.startsWith('file:./dependencies/')) {
    throw new Error(`Active Book поддерживает только готовые TGZ из dependencies/: ${specifier}`);
  }

  const path = specifier.slice('file:./'.length);

  if (path.split('/').length !== 2 || !path.toLowerCase().endsWith('.tgz')) {
    throw new Error(`Некорректный путь к TGZ: ${specifier}`);
  }

  return path;
};

export const loadProjectLibraries = async (
  storage: ProjectStorage,
  { signal }: { signal?: AbortSignal } = {},
): Promise<BrowserLibrary[]> => {
  const description = await getDependencies(storage);
  const libraries: BrowserLibrary[] = [];

  try {
    for (const [packageName, specifier] of Object.entries(description.dependencies ?? {})) {
      const archivePath = getArchivePath(specifier);
      const file = await storage.getDependencyFile(archivePath);

      signal?.throwIfAborted();
      const library = await loadBrowserLibrary(file, { signal });

      if (library.packageName !== packageName) {
        library.dispose();

        throw new Error(`Имя библиотеки в TGZ отличается от package.json: ${packageName}`);
      }

      libraries.push(library);
    }

    return libraries;
  } catch (error) {
    for (const library of libraries) {
      library.dispose();
    }

    throw error;
  }
};

type PickedArchive = {
  file: File;
  handle: ProjectFileHandle;
};

const pickArchive = async (): Promise<PickedArchive> => {
  if (!('showOpenFilePicker' in window)) {
    throw new Error('Браузер не поддерживает выбор TGZ через File System Access API');
  }

  const filePickerWindow = window as FilePickerWindow;

  const [handle] = await filePickerWindow.showOpenFilePicker({
    id: 'active-book-custom-package',
    types: [{
      description: 'Готовые библиотеки Active Book (.tgz)',
      accept: {
        'application/gzip': ['.tgz'],
      },
    }],
  });

  const file = await handle.getFile();

  return {
    file,
    handle,
  };
};

export const importBrowserLibrary = async (storage: ProjectStorage): Promise<string | null> => {
  const { file, handle } = await pickArchive();

  if (!file.name.toLowerCase().endsWith('.tgz')) {
    throw new Error('Выбери готовый пакет формата .tgz');
  }

  const { packageName, manifest } = await inspectBrowserArchive(file);
  const description = await getDependencies(storage);
  const existingDependency = description.dependencies?.[packageName];

  if (existingDependency) {
    const replacementConfirmed = window.confirm(`Библиотека ${packageName} уже подключена. Заменить её?`);

    if (!replacementConfirmed) {
      return null;
    }
  }

  const path = await storage.importDependencyFile(file, handle);

  description.dependencies = {
    ...description.dependencies,
    [packageName]: `file:./${path}`,
  };

  const descriptionJson = JSON.stringify(description, null, 2);

  await storage.writePackageJson(`${descriptionJson}\n`);

  const componentCount = Object.keys(manifest.components).length + Object.keys(manifest.visualEffects ?? {}).length;

  return `${packageName} (${componentCount} компонентов)`;
};
