import type { ComponentType } from 'react';

import { type BrowserLibrary, loadBrowserLibrary } from '@active-book/book-builder/components/custom/browser';

import customPackageList from '../../custom-components.json';

export type LoadCustomComponentsAttrs = {
  components: Record<string, ComponentType>;
  libraries: BrowserLibrary[];
};

export const loadCustomComponents = async (): Promise<LoadCustomComponentsAttrs> => {
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

      const noDependencies = parts.length !== 2 || parts[0] !== 'dependencies';
      const noTgz = !parts[1].toLowerCase().endsWith('.tgz');

      if (noDependencies || noTgz) {
        throw new Error(`Invalid Active Book library path: ${specifier}`);
      }

      const url = new URL(filePath, document.baseURI);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Cannot load Active Book library ${packageName}: HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const library = await loadBrowserLibrary(blob);

      if (library.packageName !== packageName) {
        library.dispose();

        throw new Error(`Unexpected library name: ${library.packageName}`);
      }

      libraries.push(library);

      Object.assign(components, library.components);
    }

    return {
      libraries,
      components,
    };
  } catch (error) {
    for (const libraryCur of libraries) {
      libraryCur.dispose();
    }

    throw error;
  }
};
