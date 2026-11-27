import type { AudioEffect, EffectLifetime } from '@active-book/types';

import { contentAssetUrl, isContentAssetPath } from '../content/media';

import { validateAudioEffects } from './validation';

type AudioBookPage = {
  id: string;
};

type AudioBook = {
  pages: readonly AudioBookPage[];
  audioEffects?: unknown;
};

export const compileAudioEffects = (book: AudioBook, assets?: Set<string>): AudioEffect<number>[] => {
  const pageIds = book.pages.map(({ id }) => id);
  const descriptions = validateAudioEffects(book.audioEffects, { pageIds });

  return descriptions.map((descriptionCur) => {
    const {
      slug: _slug,
      src,
      lifetime,
      ...effect
    } = descriptionCur;

    let runtimeLifetime: EffectLifetime;
    let runtimeSource = src;

    if (lifetime.type === 'page') {
      const position = pageIds.indexOf(lifetime.page) + 1;

      runtimeLifetime = { type: 'page', page: position };
    } else {
      const range = lifetime.range.map(({ from, to }) => {
        return { from, to };
      });

      runtimeLifetime = { type: 'range', range };
    }

    if (isContentAssetPath(src)) {
      assets?.add(src);
      runtimeSource = contentAssetUrl(src);
    }

    return {
      ...effect,
      src: runtimeSource,
      lifetime: runtimeLifetime,
    };
  });
};
