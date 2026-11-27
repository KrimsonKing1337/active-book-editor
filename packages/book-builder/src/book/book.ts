import type { JSONContent } from '@tiptap/core';

import { type AuthoredAudioEffect, validateAudioEffects } from '../audioEffects/validation';

import { isRecord } from '../effects/utils';
import { type AuthoredVisualEffect, isAuthoredVisualEffect } from '../visualEffects';

export type BookPage = {
  id: string;
  document: JSONContent;
};

/** Page position is its array index + 1. Page 0 is not an authored page. */
export type BookDocument = {
  type: 'book';
  pages: BookPage[];
  visualEffects: AuthoredVisualEffect[];
  audioEffects?: readonly AuthoredAudioEffect[];
};

type BookStructure = Omit<BookDocument, 'audioEffects'> & {
  audioEffects?: unknown
};

export const isBookStructure = (value: unknown): value is BookStructure => {
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
  const ranges = value.visualEffects;

  if (!hasNonEmptyPages || !Array.isArray(ranges)) {
    return false;
  }

  const hasValidRanges = ranges.every((rangeCur: unknown) => {
    return isAuthoredVisualEffect(rangeCur) && rangeCur.lifetime.type === 'range';
  });

  if (!hasValidRanges) {
    return false;
  }

  const ids = new Set<string>();
  const visualIds = new Set<string>();

  for (const rangeCur of ranges) {
    if (visualIds.has(rangeCur.effect.id)) {
      return false;
    }

    visualIds.add(rangeCur.effect.id);
  }

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

    const attrs = document.attrs;

    if (attrs !== undefined && !isRecord(attrs)) {
      return false;
    }

    const specialized = attrs?.pageEffects;

    const hasObsoleteVisualEffects = isRecord(specialized)
      && ('background' in specialized || 'frame' in specialized || 'audio' in specialized);

    if (hasObsoleteVisualEffects) {
      return false;
    }

    const visuals = attrs?.visualEffects ?? [];

    if (!Array.isArray(visuals)) {
      return false;
    }

    for (const visualCur of visuals) {
      if (!isAuthoredVisualEffect(visualCur)) {
        return false;
      }

      const belongsToPage = visualCur.lifetime.type === 'page'
        && visualCur.lifetime.pageId === id;
      const hasDuplicateId = visualIds.has(visualCur.effect.id);

      if (!belongsToPage || hasDuplicateId) {
        return false;
      }

      visualIds.add(visualCur.effect.id);
    }

    ids.add(id);

    return true;
  });
};


export const isBookDocument = (value: unknown): value is BookDocument => {
  if (!isBookStructure(value)) {
    return false;
  }

  try {
    const pageIds = value.pages.map(({ id }) => id);
    validateAudioEffects(value.audioEffects, { pageIds, allowUnselectedSource: true });

    return true;
  } catch {
    return false;
  }
};
