import type { CSSProperties } from 'react';

import type {
  BackgroundEffectMediaOptions,
  BackgroundEffectVideoOptions,
  BackgroundEffectShadowOptions,
} from 'activeBook-core/hooks/effects/background/@types';

import { isRecord } from './utils';

export type BackgroundComponentReference = {
  package: string;
  name: string;
};

export type BackgroundOptions = {
  style?: CSSProperties;
  images?: BackgroundEffectMediaOptions[];
  videos?: BackgroundEffectVideoOptions[];
  shadow?: BackgroundEffectShadowOptions;
  component?: BackgroundComponentReference;
};

export type BackgroundEffect = {
  id: string;
  type: 'background';
  slug: string;
  options: BackgroundOptions;
};

export type BuiltBackgroundEffect = Omit<BackgroundEffect, 'slug'>;

export const normalizeBackgroundEffects = (value: unknown): BackgroundEffect[] => {
  if (!isRecord(value) || !Array.isArray(value.background)) {
    return [];
  }

  const result: BackgroundEffect[] = [];

  for (const effect of value.background) {
    if (!isRecord(effect) || effect.type !== 'background' || !isRecord(effect.options)) {
      continue;
    }

    if (typeof effect.id !== 'string' || !effect.id.trim()) {
      continue;
    }

    const images = Array.isArray(effect.options.images) ? effect.options.images : [];
    const videos = Array.isArray(effect.options.videos) ? effect.options.videos : [];

    const imagesAreValid = images.every((cur) => isRecord(cur) && typeof cur.src === 'string');

    const videosAreValid = videos.every((videoCur) => {
      return isRecord(videoCur) && typeof videoCur.id === 'string' && typeof videoCur.src === 'string';
    });

    if (!imagesAreValid || !videosAreValid) {
      continue;
    }

    const slug = typeof effect.slug === 'string' ? effect.slug : 'Новый фон';
    const options = effect.options as BackgroundOptions;

    // Older book.json files can contain background images without IDs.
    if (options.images?.some((image) => !image.id?.trim())) {
      options.images = options.images.map((image, index) => {
        return {
          ...image,
          id: image.id?.trim() || `legacy-image:${effect.id}:${index}`,
        };
      });
    }

    result.push({
      id: effect.id,
      type: 'background',
      slug,
      options,
    });
  }

  return result;
};
