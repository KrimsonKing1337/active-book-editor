import type { JSONContent } from '@tiptap/core';

import type { AuthoredAudioEffect } from '../audioEffects';
import type { AuthoredVisualEffect } from '../visualEffects';

import { validateAudioEffects } from '../audioEffects';
import { hasPageAudio } from '../audioEffects/validation';
import { isAuthoredVisualEffect } from '../visualEffects';
import { isRecord } from '../effects/utils';

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
  audioEffects?: unknown;
};

export const isBookStructure = (value: unknown): value is BookStructure => {
  if (!isRecord(value)) {
    return false;
  }

  if (value.type !== 'book') {
    return false;
  }

  const { pages, visualEffects: visualRanges } = value;

  if (!Array.isArray(pages) || pages.length === 0) {
    return false;
  }

  if (!Array.isArray(visualRanges)) {
    return false;
  }

  const pageIds = new Set<string>();
  const visualIds = new Set<string>();

  for (const rangeCur of visualRanges) {
    if (!isAuthoredVisualEffect(rangeCur)) {
      return false;
    }

    if (rangeCur.lifetime.type !== 'range') {
      return false;
    }

    const { id } = rangeCur.effect;

    if (visualIds.has(id)) {
      return false;
    }

    visualIds.add(id);
  }

  for (const pageCur of pages) {
    if (!isRecord(pageCur)) {
      return false;
    }

    const { id, document } = pageCur;

    if (typeof id !== 'string' || !id.trim()) {
      return false;
    }

    if (pageIds.has(id)) {
      return false;
    }

    if (!isRecord(document)) {
      return false;
    }

    if (document.type !== 'doc') {
      return false;
    }

    if (!Array.isArray(document.content)) {
      return false;
    }

    const { attrs } = document;

    if (attrs !== undefined && !isRecord(attrs)) {
      return false;
    }

    if (attrs && hasPageAudio(attrs)) {
      return false;
    }

    const pageEffects = attrs?.pageEffects;

    if (isRecord(pageEffects)) {
      const hasObsoletePageEffects =
        'background' in pageEffects
        || 'frame' in pageEffects;

      if (hasObsoletePageEffects) {
        return false;
      }
    }

    const visualEffects = attrs?.visualEffects ?? [];

    if (!Array.isArray(visualEffects)) {
      return false;
    }

    for (const visualCur of visualEffects) {
      if (!isAuthoredVisualEffect(visualCur)) {
        return false;
      }

      const { effect, lifetime } = visualCur;

      if (lifetime.type !== 'page') {
        return false;
      }

      if (lifetime.pageId !== id) {
        return false;
      }

      if (visualIds.has(effect.id)) {
        return false;
      }

      visualIds.add(effect.id);
    }

    pageIds.add(id);
  }

  return true;
};

export const isBookDocument = (value: unknown): value is BookDocument => {
  if (!isBookStructure(value)) {
    return false;
  }

  try {
    const pageIds = value.pages.map(({ id }) => id);

    validateAudioEffects(value.audioEffects, {
      pageIds,
      allowSourceDraft: true,
    });

    return true;
  } catch {
    return false;
  }
};
