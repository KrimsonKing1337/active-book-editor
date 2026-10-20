import { useSyncExternalStore } from 'react';

import type { BrowserLibrary, BrowserComponentDefinition } from '@active-book/book-builder/customComponents/browser';
import type { ComponentType } from 'react';

export type CustomComponentRegistry = {
  components: Record<string, ComponentType>;
  definitions: BrowserComponentDefinition[];
};

const empty: CustomComponentRegistry = {
  components: {},
  definitions: [],
};

let current: CustomComponentRegistry = empty;
let installedLibraries: BrowserLibrary[] = [];

const subscribers = new Set<() => void>();

const subscribe = (listener: () => void): (() => void) => {
  subscribers.add(listener);

  return () => subscribers.delete(listener);
};

const getSnapshot = (): CustomComponentRegistry => current;

export const useCustomComponents = (): CustomComponentRegistry => {
  return useSyncExternalStore(subscribe, getSnapshot);
};

export const replaceCustomLibraries = (libraries: BrowserLibrary[]): void => {
  const oldLibraries = installedLibraries;
  const components: Record<string, ComponentType> = {};
  const definitions: BrowserComponentDefinition[] = [];

  for (const library of libraries) {
    Object.assign(components, library.components);
    definitions.push(...library.definitions);
  }

  installedLibraries = libraries;
  current = { components, definitions };

  for (const listener of subscribers) {
    listener();
  }

  for (const library of oldLibraries) {
    library.dispose();
  }
};
