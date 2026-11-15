import type { BrowserLibrary } from '@active-book/book-builder/components/custom/browser';

import { loadBrowserLibrary } from '@active-book/book-builder/components/custom/browser';

import type { ProjectStorage } from '../@types';

import { LOCAL_FILE_PATH } from './constants';
import { readProjectPackage } from './utils';

const getArchivePath = (specifier: string): string => {
  const dependenciesPath = `${LOCAL_FILE_PATH}dependencies/`;

  if (!specifier.startsWith(dependenciesPath)) {
    throw new Error(`Active Book поддерживает только готовые TGZ из dependencies/: ${specifier}`);
  }

  const path = specifier.slice(LOCAL_FILE_PATH.length);

  const pathSlashesAmount = path.split('/').length;
  const pathTgzIsValid = path.toLowerCase().endsWith('.tgz');

  if (pathSlashesAmount !== 2 || !pathTgzIsValid) {
    throw new Error(`Некорректный путь к TGZ: ${specifier}`);
  }

  return path;
};

type LoadProjectLibrariesSignal = {
  signal?: AbortSignal;
};

export const loadProjectLibraries = async (
  storage: ProjectStorage,
  { signal }: LoadProjectLibrariesSignal = {},
): Promise<BrowserLibrary[]> => {
  const description = await readProjectPackage(storage);

  const libraries: BrowserLibrary[] = [];
  const dependencies = description.dependencies ?? {};

  try {
    for (const [packageName, specifier] of Object.entries(dependencies)) {
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
    for (const libraryCur of libraries) {
      libraryCur.dispose();
    }

    throw error;
  }
};
