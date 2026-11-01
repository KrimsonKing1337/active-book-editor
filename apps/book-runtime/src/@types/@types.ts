import type { ComponentType } from 'react';

import type { BookComponentProps } from '@active-book/types';

import type { BuiltPageEffects } from '@root/packages/book-builder/src/effects';

export type BookMark = {
  type?: string;
  attrs?: Record<string, unknown>;
};

export type BookNodeAttrs = {
  level?: number;
  name?: string;
  [key: string]: unknown;
};

export type BookNode = {
  type?: string;
  text?: string;
  marks?: BookMark[];
  attrs?: BookNodeAttrs;
  content?: BookNode[];
};

export type PageDocument = {
  type?: string;
  attrs?: {
    pageEffects?: BuiltPageEffects;
  };
  content?: BookNode[];
};

export type CustomComponentType = ComponentType<BookComponentProps> | undefined;
