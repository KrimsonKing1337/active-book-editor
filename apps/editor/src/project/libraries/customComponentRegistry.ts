import {
  type ComponentType,
  createContext,
  useContext,
} from 'react';

import type {
  BrowserComponentDefinition,
  BrowserVisualDefinition,
} from '@active-book/book-builder/components/custom/browser';

export type CustomComponentRegistry = {
  components: Record<string, ComponentType>;
  definitions: BrowserComponentDefinition[];
  visualDefinitions: BrowserVisualDefinition[];
};

export const emptyCustomComponents: CustomComponentRegistry = {
  components: {},
  definitions: [],
  visualDefinitions: [],
};

export const CustomComponentsContext = createContext<CustomComponentRegistry>(emptyCustomComponents);

export const useCustomComponents = (): CustomComponentRegistry => useContext(CustomComponentsContext);
