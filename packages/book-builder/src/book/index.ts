import type { JSONContent } from '@tiptap/core';

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
};

export const isBookDocument = (value: unknown): value is BookDocument => {
  if (!isRecord(value)) {
    return false;
  }

  const isBook = value.type === 'book';
  const pages = value.pages;
  const hasPages = Array.isArray(pages);

  if (!isBook || !hasPages || 'rangeEffects' in value) {
    return false;
  }

  const hasNonEmptyPages = pages.length > 0;
  const ranges = value.visualEffects;

  const getEveryRangesAreValid = (ranges: AuthoredVisualEffect[]) => {
    return ranges.every((cur) => {
      return isAuthoredVisualEffect(cur) && cur.lifetime.type === 'range';
    });
  };

  const hasValidRanges = Array.isArray(ranges) && getEveryRangesAreValid(ranges);

  if (!hasNonEmptyPages || !hasValidRanges) {
    return false;
  }

  const ids = new Set<string>();
  const visualIds = new Set<string>();

  for (const rangeCur of ranges as AuthoredVisualEffect[]) {
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

    const getSpecializedEffectChecks = (specialized: Record<string, unknown>) => {
      return 'background' in specialized || 'frame' in specialized;
    };

    if (isRecord(specialized) && getSpecializedEffectChecks(specialized)) {
      return false;
    }

    const visuals = attrs?.visualEffects ?? [];

    if (!Array.isArray(visuals)) {
      return false;
    }

    for (const visualCur of visuals) {
      const { lifetime, effect } = visualCur;

      const lifetimeIsValid = lifetime.type === 'page' || lifetime.pageId === id;
      const effectIsAuthorised = isAuthoredVisualEffect(visualCur);
      const effectIdIsVisual = visualIds.has(effect.id);

      if (!effectIsAuthorised || !lifetimeIsValid || effectIdIsVisual) {
        return false;
      }

      visualIds.add(effect.id);
    }

    ids.add(id);

    return true;
  });
};
