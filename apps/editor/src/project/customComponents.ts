import { inspectBrowserArchive, loadBrowserLibrary } from '@active-book/book-builder/customComponents/browser';
import type { BrowserLibrary } from '@active-book/book-builder/customComponents/browser';

import type { ProjectStorage } from './@types';
import type { FilePickerWindow, ProjectFileHandle } from './fileSystemAccess';

type PackageDescription = {
  dependencies?: Record<string, string>;
  [key: string]: unknown;
};

const getDependencies = async (storage: ProjectStorage): Promise<PackageDescription> => {
  return JSON.parse(await storage.readPackageJson()) as PackageDescription;
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

const trustArchive = async (archive: File): Promise<void> => {
  const hash = await crypto.subtle.digest('SHA-256', await archive.arrayBuffer());
  const digest = [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  const trustKey = `activeBook-editor:trusted-tgz:${digest}`;

  if (localStorage.getItem(trustKey) === 'true') {
    return;
  }

  const approved = window.confirm(
    `Библиотека ${archive.name} содержит сторонний JavaScript, который будет выполняться в редакторе. `
    + 'Подключать только проверенные библиотеки. Продолжить?',
  );

  if (!approved) {
    throw new Error('Запуск сторонней библиотеки отменён');
  }

  localStorage.setItem(trustKey, 'true');
};

export const loadProjectLibraries = async (storage: ProjectStorage): Promise<BrowserLibrary[]> => {
  const description = await getDependencies(storage);
  const libraries: BrowserLibrary[] = [];

  try {
    for (const [packageName, specifier] of Object.entries(description.dependencies ?? {})) {
      const archivePath = getArchivePath(specifier);
      const file = await storage.getDependencyFile(archivePath);

      await trustArchive(file);

      const library = await loadBrowserLibrary(file);

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

const pickArchive = async (): Promise<{ file: File; handle: ProjectFileHandle }> => {
  if (!('showOpenFilePicker' in window)) {
    throw new Error('Браузер не поддерживает выбор TGZ через File System Access API');
  }

  const [handle] = await (window as FilePickerWindow).showOpenFilePicker({
    id: 'active-book-custom-package',
    types: [{
      description: 'Готовые библиотеки Active Book (.tgz)',
      accept: { 'application/gzip': ['.tgz'] },
    }],
  });

  return { file: await handle.getFile(), handle };
};

export const importBrowserLibrary = async (storage: ProjectStorage): Promise<string | null> => {
  const { file, handle } = await pickArchive();

  if (!file.name.toLowerCase().endsWith('.tgz')) {
    throw new Error('Выбери готовый пакет формата .tgz');
  }

  const { packageName, manifest } = await inspectBrowserArchive(file);
  const description = await getDependencies(storage);
  const existing = description.dependencies?.[packageName];

  if (existing && !window.confirm(`Библиотека ${packageName} уже подключена. Заменить её?`)) {
    return null;
  }

  await trustArchive(file);

  const path = await storage.importDependencyFile(file, handle);
  const previousDescription = await storage.readPackageJson();

  description.dependencies = {
    ...description.dependencies,
    [packageName]: `file:./${path}`,
  };

  await storage.writePackageJson(`${JSON.stringify(description, null, 2)}\n`);

  return `${packageName} (${Object.keys(manifest.components).length} компонентов)`;
};
