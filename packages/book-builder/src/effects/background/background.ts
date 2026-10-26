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

type StyledLayer = {
  style?: CSSProperties;
  styleFilters?: FilterOperation[];
};

const resolveLayerStyle = <T extends StyledLayer>(layer: T) => {
  const {
    styleFilters,
    style,
    ...layerOptions
  } = layer;

  const resolvedStyle = resolveStyle(style, styleFilters);

  return {
    ...layerOptions,
    style: resolvedStyle,
  };
};

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
  const resolvedImage = image ? resolveLayerStyle(image) : undefined;
  const resolvedVideo = video ? resolveLayerStyle(video) : undefined;
  const resolvedShadow = shadow ? resolveLayerStyle(shadow) : undefined;

  return {
    ...rest,
    style: resolvedStyle,
    image: resolvedImage,
    video: resolvedVideo,
    shadow: resolvedShadow,
  };
};

export const normalizeBackgroundEffects = (value: unknown): BackgroundEffect[] => {
  if (!isRecord(value)) {
    return [];
  }

  if (!Array.isArray(value.background)) {
    return [];
  }

  const result: BackgroundEffect[] = [];

  for (const effectCur of value.background) {
    if (!isRecord(effectCur)) {
      continue;
    }

    const hasCorrectType = effectCur.type === 'background';

    if (!hasCorrectType) {
      continue;
    }

    const options = effectCur.options;

    if (!isRecord(options)) {
      continue;
    }

    const id = effectCur.id;

    if (typeof id !== 'string' || !id.trim()) {
      continue;
    }

    const kind = backgroundEffectKinds.find((kindCur) => {
      return kindCur === effectCur.kind;
    });

    if (!kind) {
      continue;
    }

    if (kind === 'image' || kind === 'video') {
      const media = options[kind];

      if (!isRecord(media)) {
        continue;
      }

      const mediaId = media.id;
      const mediaSource = media.src;

      const hasValidMediaId = typeof mediaId === 'string' && Boolean(mediaId.trim());
      const hasValidSource = typeof mediaSource === 'string';

      if (!hasValidMediaId || !hasValidSource) {
        continue;
      }
    }

    const slug = typeof effectCur.slug === 'string' ? effectCur.slug : 'Новый фоновый эффект';

    result.push({
      id,
      type: 'background',
      kind,
      slug,
      options: options as BackgroundOptions,
    });
  }

  return result;
};
