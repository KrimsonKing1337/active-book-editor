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
  if (value === undefined) {
    return true;
  }

  if (!Array.isArray(value)) {
    return false;
  }

  return value.every((effectCur: unknown) => {
    if (!isRecord(effectCur) || !Array.isArray(effectCur.range)) {
      return false;
    }

    return effectCur.range.every((rangeCur: unknown) => {
      if (!isRecord(rangeCur)) {
        return false;
      }

      const { from, to } = rangeCur;

      if (typeof from !== 'number' || typeof to !== 'number') {
        return false;
      }

      const hasIntegerBounds = Number.isInteger(from) && Number.isInteger(to);
      const hasOrderedBounds = from >= 1 && to >= from;

      return hasIntegerBounds && hasOrderedBounds;
    });
  });
};

export const isBookDocument = (value: unknown): value is BookDocument => {
  if (!isRecord(value)) {
    return false;
  }

  const isBook = value.type === 'book';
  const pages = value.pages;
  const hasPages = Array.isArray(pages);

  if (!isBook || !hasPages) {
    return false;
  }

  const hasNonEmptyPages = pages.length > 0;
  const hasValidRanges = hasValidRangeMetadata(value.rangeEffects);

  if (!hasNonEmptyPages || !hasValidRanges) {
    return false;
  }

  const ids = new Set<string>();

  return pages.every((pageCur: unknown) => {
    if (!isRecord(pageCur)) {
      return false;
    }

    const { id, document } = pageCur;

    const hasValidId = typeof id === 'string' && !!id.trim();
    const isUniqueId = typeof id === 'string' && !ids.has(id);

    const hasValidDocument = isRecord(document)
      && document.type === 'doc'
      && Array.isArray(document.content);

    if (!hasValidId || !isUniqueId || !hasValidDocument) {
      return false;
    }

    ids.add(id);

    return true;
  });
};
