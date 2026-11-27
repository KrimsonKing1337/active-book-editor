import type { BuiltPageEffects } from '@root/packages/book-builder/src/effects';

export type PageDocumentAttrs = {
  pageEffects?: Pick<BuiltPageEffects, 'vibration' | 'flashlight'>;
};

export type PageDocument = {
  type?: string;
  attrs?: PageDocumentAttrs;
  content?: unknown[];
};
