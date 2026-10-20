declare module 'virtual:active-book-custom-components' {
  import type { ComponentType } from 'react';

  export type CustomComponentDefinition = {
    id: string;
    packageName: string;
    name: string;
    title: string;
    description?: string;
  };

  export const customComponents: Record<string, ComponentType>;
  export const customComponentDefinitions: CustomComponentDefinition[];
}
