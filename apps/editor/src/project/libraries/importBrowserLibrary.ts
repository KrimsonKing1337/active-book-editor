import { inspectBrowserArchive } from '@active-book/book-builder/components/custom/browser';

import type { ProjectStorage } from '../@types';
import type { FilePickerWindow, ProjectFileHandle } from '../@types/fileSystemAccess';

import { LOCAL_FILE_PATH } from './constants';
import { readProjectPackage } from './utils';

type PickedArchive = {
  file: File;
  handle: ProjectFileHandle;
};

const pickArchive = async (): Promise<PickedArchive> => {
  if (!('showOpenFilePicker' in window)) {
    throw new Error('Браузер не поддерживает выбор TGZ через File System Access API');
  }

  const filePickerWindow = window as FilePickerWindow;

  const readyLibrariesType = {
    description: 'Готовые библиотеки Active Book (.tgz)',
    accept: {
      'application/gzip': ['.tgz'],
    },
  };

  const [handle] = await filePickerWindow.showOpenFilePicker({
    id: 'active-book-custom-package',
    types: [readyLibrariesType],
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
  const description = await readProjectPackage(storage);
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
    [packageName]: `${LOCAL_FILE_PATH}${path}`,
  };

  const descriptionJson = JSON.stringify(description, null, 2);

  await storage.writePackageJson(`${descriptionJson}\n`);

  const visualEffects = manifest.visualEffects ?? {};
  const componentCount = Object.keys(manifest.components).length + Object.keys(visualEffects).length;

  return `${packageName} (${componentCount} компонентов)`;
};
