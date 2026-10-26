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
  image?: StyledBackgroundMedia;
  video?: StyledBackgroundVideo;
  shadow?: StyledBackgroundShadow;
  component?: BackgroundComponentReference;
};

export type BackgroundEffect = {
  id: string;
  type: 'background';
  kind: BackgroundEffectKind;
  slug: string;
  options: BackgroundOptions;
};

export type BuiltBackgroundEffect = Omit<BackgroundEffect, 'slug'>;

export const resolveBackgroundOptions = (options: BackgroundOptions) => {
  const {
    style,
    styleFilters,
    image,
    video,
    shadow,
    ...rest
  } = options;

  const resolvedStyle = resolveStyle(style, styleFilters);

  const resolvedImage = image && (() => {
    const { styleFilters: filters, style, ...media } = image;

    const resolvedStyle = resolveStyle(style, filters);

    return {
      ...media,
      style: resolvedStyle,
    };
  })();

  const resolvedVideo = video && (() => {
    const { styleFilters: filters, style, ...media } = video;

    const resolvedStyle = resolveStyle(style, filters);

    return {
      ...media,
      style: resolvedStyle,
    };
  })();

  const resolvedShadow = shadow && (() => {
    const { styleFilters: filters, style, ...shadowOptions } = shadow;

    const resolvedStyle = resolveStyle(style, filters);

    return {
      ...shadowOptions,
      style: resolvedStyle,
    };
  })();

  return {
    ...rest,
    style: resolvedStyle,
    image: resolvedImage,
    video: resolvedVideo,
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

    const kind = backgroundEffectKinds.find((current) => current === effectCur.kind);

    if (!kind) {
      continue;
    }

    const options = effectCur.options;

    if (kind === 'image' || kind === 'video') {
      const media = options[kind];

      if (
        !isRecord(media)
        || typeof media.id !== 'string'
        || !media.id.trim()
        || typeof media.src !== 'string'
      ) {
        continue;
      }
    }

    const slug = typeof effectCur.slug === 'string' ? effectCur.slug : 'Новый фоновый эффект';

    result.push({
      id: effectCur.id,
      type: 'background',
      kind,
      slug,
      options: options as BackgroundOptions,
    });
  }

  return result;
};
