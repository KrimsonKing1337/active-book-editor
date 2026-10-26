import type { SideShadowItem, SideTextItem } from 'activeBook-core/hooks/effects/side/@types';

import type { BackgroundComponentReference } from '../background';
import { type FilterOperation, resolveStyle } from '../style';

import { isRecord } from '../utils';

type StyleFilters = {
  styleFilters?: FilterOperation[];
};

export type StyledSideShadow = SideShadowItem & StyleFilters;
export type StyledSideText = SideTextItem & StyleFilters;

export const sideEffectKinds = ['shadow', 'text', 'component'] as const;

export type SideEffectKind = (typeof sideEffectKinds)[number];

export type SideOptions = {
  shadows?: StyledSideShadow[];
  texts?: StyledSideText[];
  component?: BackgroundComponentReference;
};

export type SideEffect = {
  id: string;
  type: 'side';
  kind?: SideEffectKind;
  slug: string;
  options: SideOptions;
};

export type BuiltSideEffect = Omit<SideEffect, 'slug'>;

export const resolveSideOptions = (options: SideOptions) => {
  const shadows = options.shadows?.map((shadowCur) => {
    const {
      styleFilters,
      style,
      ...item
    } = shadowCur;

    const resolvedStyle = resolveStyle(style, styleFilters);

    return {
      ...item,
      style: resolvedStyle,
    };
  });

  const texts = options.texts?.map((textCur) => {
    const {
      styleFilters,
      style,
      ...item
    } = textCur;

    const resolvedStyle = resolveStyle(style, styleFilters);

    return {
      ...item,
      style: resolvedStyle,
    };
  });

  return {
    shadows,
    texts,
  };
};

export const normalizeSideEffects = (value: unknown): SideEffect[] => {
  if (!isRecord(value) || !Array.isArray(value.side)) {
    return [];
  }

  const result: SideEffect[] = [];

  for (const effectCur of value.side) {
    if (!isRecord(effectCur) || effectCur.type !== 'side' || !isRecord(effectCur.options)) {
      continue;
    }

    if (typeof effectCur.id !== 'string' || !effectCur.id.trim()) {
      continue;
    }

    const shadows = effectCur.options.shadows;
    const texts = effectCur.options.texts;

    if (shadows !== undefined && !Array.isArray(shadows)) {
      continue;
    }

    if (texts !== undefined && !Array.isArray(texts)) {
      continue;
    }

    const shadowsSafe = shadows ?? [];

    const validShadows = shadowsSafe.every((shadowCur: unknown) => {
      return isRecord(shadowCur)
        && typeof shadowCur.id === 'string'
        && Boolean(shadowCur.id.trim());
    });

    const textsSafe = texts ?? [];

    const validTexts = textsSafe.every((textCur: unknown) => {
      return isRecord(textCur)
        && typeof textCur.id === 'string'
        && Boolean(textCur.id.trim())
        && typeof textCur.leftText === 'string'
        && typeof textCur.rightText === 'string';
    });

    if (!validShadows || !validTexts) {
      continue;
    }

    const slug = typeof effectCur.slug === 'string'
      ? effectCur.slug
      : 'Новый боковой эффект';

    const options = effectCur.options as SideOptions;

    const kind = sideEffectKinds.find((current) => current === effectCur.kind);

    result.push({
      id: effectCur.id,
      type: 'side',
      ...(kind ? { kind } : {}),
      slug,
      options,
    });
  }

  return result;
};
