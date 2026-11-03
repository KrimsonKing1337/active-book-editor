import type { JSONContent } from '@tiptap/core';

import type { VisualEffectRegistration } from '@active-book/types';

import type { AuthoredVisualEffect } from './@types';
import { resolveVisualParams } from './drafts';

export const pageVisualEffects = (document: JSONContent): AuthoredVisualEffect[] => {
  return document.attrs?.visualEffects ?? [];
};

type BookPage = {
  id: string;
  document: JSONContent;
};

type Book = {
  pages: BookPage[];
  visualEffects: AuthoredVisualEffect[];
};

export const compileVisualEffects = (book: Book): VisualEffectRegistration[] => {
  const pagePositions = new Map<string, number>();

  for (const [index, pageCur] of book.pages.entries()) {
    const pageNumber = index + 1;

    pagePositions.set(pageCur.id, pageNumber);
  }

  const pageDescriptions = book.pages.flatMap((pageCur) => {
    return pageVisualEffects(pageCur.document);
  });

  const descriptions = [
    ...book.visualEffects,
    ...pageDescriptions,
  ];

  return descriptions.map((descriptionCur) => {
    const { lifetime } = descriptionCur;

    let resolvedLifetime: VisualEffectRegistration['lifetime'];

    if (lifetime.type === 'page') {
      const pageNumber = pagePositions.get(lifetime.pageId);

      if (pageNumber === undefined) {
        throw new Error(`Unknown visual page: ${lifetime.pageId}`);
      }

      resolvedLifetime = {
        type: 'page',
        page: pageNumber,
      };
    } else {
      resolvedLifetime = lifetime;
    }

    const params = resolveVisualParams(descriptionCur);

    const effect = {
      ...descriptionCur.effect,
      params,
    };

    const registration: VisualEffectRegistration = {
      effect,
      lifetime: resolvedLifetime,
    };

    return registration;
  });
};
