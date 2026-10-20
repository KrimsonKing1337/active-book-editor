import type { ComponentType } from 'react';

import { loadBrowserLibrary, type BrowserLibrary } from '@active-book/book-builder/customComponents/browser';

import customPackageList from '../../custom-components.json';

export const loadCustomComponents = async (): Promise<{
  components: Record<string, ComponentType>;
  libraries: BrowserLibrary[];
}> => {
  const dependencies: Record<string, string> = customPackageList.dependencies ?? {};
  const libraries: BrowserLibrary[] = [];
  const components: Record<string, ComponentType> = {};

  try {
    for (const [packageName, specifier] of Object.entries(dependencies)) {
      if (!specifier.startsWith('file:./dependencies/')) {
        throw new Error(`Unsupported Active Book custom dependency: ${specifier}`);
      }

      const filePath = specifier.slice('file:./'.length);
      const parts = filePath.split('/');

      if (parts.length !== 2 || parts[0] !== 'dependencies'
        || !parts[1].toLowerCase().endsWith('.tgz')) {
        throw new Error(`Invalid Active Book library path: ${specifier}`);
      }

      const url = new URL(filePath, document.baseURI);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Cannot load Active Book library ${packageName}: HTTP ${response.status}`);
      }

      const library = await loadBrowserLibrary(await response.blob());

      if (library.packageName !== packageName) {
        library.dispose();
        throw new Error(`Unexpected library name: ${library.packageName}`);
      }

      libraries.push(library);
      Object.assign(components, library.components);
    }

    return { libraries, components };
  } catch (error) {
    for (const library of libraries) {
      library.dispose();
    }

    throw error;
  }
};
