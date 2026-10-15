import type { BuiltPageEffects } from '@active-book/book-builder/effects';

export type BookMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type BookNodeAttrs = {
  level?: number;
  name?: string;
  [key: string]: unknown;
};

export type BookNode = {
  type: string;
  text?: string;
  marks?: BookMark[];
  attrs?: BookNodeAttrs;
  content?: BookNode[];
};

export type BookDocument = {
  type: string;
  attrs?: {
    pageEffects?: BuiltPageEffects;
  };
  content?: BookNode[];
};
