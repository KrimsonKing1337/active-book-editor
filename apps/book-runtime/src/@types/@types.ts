import type { BuiltPageEffects } from '@root/packages/book-builder/src/effects';

export type PageDocument = {
  type?: string;
  attrs?: {
    pageEffects?: Pick<BuiltPageEffects, 'audio' | 'vibration' | 'flashlight'>;
  };
  content?: unknown[];
};
