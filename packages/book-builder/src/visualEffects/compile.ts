import type { JSONContent } from '@tiptap/core';

import type { VisualEffectRegistration } from '@active-book/types';

import type { AuthoredVisualEffect } from './@types';
import { resolveVisualParams } from './drafts';

export const pageVisualEffects = (document: JSONContent): AuthoredVisualEffect[] => document.attrs?.visualEffects ?? [];

export const compileVisualEffects = (book: {
  pages: { id: string; document: JSONContent }[];
  visualEffects: AuthoredVisualEffect[];
}): VisualEffectRegistration[] => {
  const positions = new Map(book.pages.map((cur, index) => [cur.id, index + 1]));
  const descriptions = [...book.visualEffects, ...book.pages.flatMap((cur) => pageVisualEffects(cur.document))];

  return descriptions.map((descriptionCur) => {
    const lifetime = descriptionCur.lifetime;
    let resolvedLifetime: VisualEffectRegistration['lifetime'];
    if (lifetime.type === 'page') {
      const position = positions.get(lifetime.pageId);
      if (!position) {
        throw new Error(`Unknown visual page: ${lifetime.pageId}`);
      }
      resolvedLifetime = {
        type: 'page',
        page: position,
      };
    } else {
      resolvedLifetime = lifetime;
    }

    const effect = {
      ...descriptionCur.effect,
      params: resolveVisualParams(descriptionCur),
    };

    return {
      effect,
      lifetime: resolvedLifetime,
    };
  });
};
