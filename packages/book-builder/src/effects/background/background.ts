import type { CSSProperties } from 'react';

import type {
  BackgroundEffectMediaOptions,
  BackgroundEffectVideoOptions,
  BackgroundEffectShadowOptions,
} from 'activeBook-core/hooks/effects/background/@types';

import type { FilterOperation } from '../style';

import { resolveStyle } from '../style';
import { isRecord } from '../utils';

export type BackgroundComponentReference = {
  package: string;
  name: string;
};

export type StyledBackgroundMedia = BackgroundEffectMediaOptions & {
  styleFilters?: FilterOperation[];
};

export type StyledBackgroundVideo = BackgroundEffectVideoOptions & {
  styleFilters?: FilterOperation[];
};

export type StyledBackgroundShadow = BackgroundEffectShadowOptions & {
  styleFilters?: FilterOperation[];
};

export const backgroundEffectKinds = ['background', 'image', 'video', 'shadow', 'component'] as const;

export type BackgroundEffectKind = (typeof backgroundEffectKinds)[number];

export type BackgroundOptions = {
  style?: CSSProperties;
  styleFilters?: FilterOperation[];
  images?: StyledBackgroundMedia[];
  videos?: StyledBackgroundVideo[];
  shadow?: StyledBackgroundShadow;
  component?: BackgroundComponentReference;
};

export type BackgroundEffect = {
  id: string;
  type: 'background';
  kind?: BackgroundEffectKind;
  slug: string;
  options: BackgroundOptions;
};

export type BuiltBackgroundEffect = Omit<BackgroundEffect, 'slug'>;

export const resolveBackgroundOptions = (options: BackgroundOptions) => {
  const {
    style,
    styleFilters,
    images,
    videos,
    shadow,
    ...rest
  } = options;

  const resolvedStyle = resolveStyle(style, styleFilters);

  const resolvedImages = images?.map((imageCur) => {
    const {
      style: mediaStyle,
      styleFilters: mediaFilters,
      ...mediaOptions
    } = imageCur;

    const resolvedMediaStyle = resolveStyle(mediaStyle, mediaFilters);

    return {
      ...mediaOptions,
      style: resolvedMediaStyle,
    };
  });

  const resolvedVideos = videos?.map((videoCur) => {
    const {
      style: mediaStyle,
      styleFilters: mediaFilters,
      ...mediaOptions
    } = videoCur;

    const resolvedMediaStyle = resolveStyle(mediaStyle, mediaFilters);

    return {
      ...mediaOptions,
      style: resolvedMediaStyle,
    };
  });

  let resolvedShadow;

  if (shadow) {
    const style = resolveStyle(shadow.style, shadow.styleFilters);

    resolvedShadow = {
      show: shadow.show,
      style,
    };
  }

  return {
    ...rest,
    style: resolvedStyle,
    images: resolvedImages,
    videos: resolvedVideos,
    shadow: resolvedShadow,
  };
};

export const normalizeBackgroundEffects = (value: unknown): BackgroundEffect[] => {
  if (!isRecord(value) || !Array.isArray(value.background)) {
    return [];
  }

  const result: BackgroundEffect[] = [];

  for (const effectCur of value.background) {
    if (
      !isRecord(effectCur)
      || effectCur.type !== 'background'
      || !isRecord(effectCur.options)
    ) {
      continue;
    }

    if (typeof effectCur.id !== 'string' || !effectCur.id.trim()) {
      continue;
    }

    const images = Array.isArray(effectCur.options.images) ? effectCur.options.images : [];
    const videos = Array.isArray(effectCur.options.videos) ? effectCur.options.videos : [];

    const imagesAreValid = images.every((imageCur) => {
      if (!isRecord(imageCur)) {
        return false;
      }

      const idIsValid = typeof imageCur.id === 'string' && !!imageCur.id.trim();
      const srcIsValid = typeof imageCur.src === 'string';

      return idIsValid && srcIsValid;
    });

    const videosAreValid = videos.every((videoCur) => {
      if (!isRecord(videoCur)) {
        return false;
      }

      const idIsValid = typeof videoCur.id === 'string';
      const srcIsValid = typeof videoCur.src === 'string';

      return idIsValid && srcIsValid;
    });

    if (!imagesAreValid || !videosAreValid) {
      continue;
    }

    const slug = typeof effectCur.slug === 'string' ? effectCur.slug : 'Новый фон';
    const options = effectCur.options as BackgroundOptions;

    const kind = backgroundEffectKinds.find((current) => current === effectCur.kind);

    result.push({
      id: effectCur.id,
      type: 'background',
      ...(kind ? { kind } : {}),
      slug,
      options,
    });
  }

  return result;
};
