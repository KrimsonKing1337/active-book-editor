import type { JSONContent } from '@tiptap/core';

import { isRecord } from '../effects/utils';

export type BookPage = {
  id: string;
  document: JSONContent;
};

/** Page position is its array index + 1. Page 0 is not an authored page. */
export type BookDocument = {
  type: 'book';
  pages: BookPage[];
};

const hasValidRangeMetadata = (value: unknown): boolean => {
  if (value === undefined) return true;
  if (!Array.isArray(value)) return false;

  return value.every((effectCur: unknown) => {
    if (!isRecord(effectCur) || !Array.isArray(effectCur.range)) return false;

    return effectCur.range.every((rangeCur: unknown) => {
      if (!isRecord(rangeCur)) return false;
      const { from, to } = rangeCur;
      if (typeof from !== 'number' || typeof to !== 'number') return false;

      return Number.isInteger(from)
        && Number.isInteger(to)
        && from >= 1
        && to >= from;
    });
  });
};

export const isBookDocument = (value: unknown): value is BookDocument => {
  if (
    !isRecord(value)
    || value.type !== 'book'
    || !Array.isArray(value.pages)
    || value.pages.length === 0
  ) {
    return false;
  }

  if (!hasValidRangeMetadata(value.rangeEffects)) return false;

  const ids = new Set<string>();

  return value.pages.every((pageCur: unknown) => {
    if (
      !isRecord(pageCur)
      || typeof pageCur.id !== 'string'
      || !pageCur.id.trim()
      || ids.has(pageCur.id)
      || !isRecord(pageCur.document)
      || pageCur.document.type !== 'doc'
      || !Array.isArray(pageCur.document.content)
    ) {
      return false;
    }

    ids.add(pageCur.id);

    return true;
  });
};
