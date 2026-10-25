import type { SideShadowItem, SideTextItem } from 'activeBook-core/hooks/effects/side/@types';

import type { BackgroundComponentReference } from '../background';
import type { FilterOperation } from '../style';

import { resolveStyle } from '../style';

import { isRecord } from '../utils';

export type StyledSideShadow = SideShadowItem & { styleFilters?: FilterOperation[] };
export type StyledSideText = SideTextItem & { styleFilters?: FilterOperation[] };

export type SideOptions = {
  shadows?: StyledSideShadow[];
  texts?: StyledSideText[];
  component?: BackgroundComponentReference;
};

export type SideEffect = {
  id: string;
  type: 'side';
  slug: string;
  options: SideOptions;
};

export type BuiltSideEffect = Omit<SideEffect, 'slug'>;

export const resolveSideOptions = (options: SideOptions) => {
  const shadows = options.shadows?.map((shadowCur) => {
    const { styleFilters, style, ...item } = shadowCur;

    return {
      ...item,
      style: resolveStyle(style, styleFilters),
    };
  });

  const texts = options.texts?.map((textCur) => {
    const { styleFilters, style, ...item } = textCur;

    return {
      ...item,
      style: resolveStyle(style, styleFilters),
    };
  });

  return { shadows, texts };
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

    const validShadows = (shadows ?? []).every((shadowCur: unknown) => {
      return isRecord(shadowCur) && typeof shadowCur.id === 'string' && Boolean(shadowCur.id.trim());
    });

    const validTexts = (texts ?? []).every((textCur: unknown) => {
      return isRecord(textCur)
        && typeof textCur.id === 'string'
        && Boolean(textCur.id.trim())
        && typeof textCur.leftText === 'string'
        && typeof textCur.rightText === 'string';
    });

    if (!validShadows || !validTexts) {
      continue;
    }

    result.push({
      id: effectCur.id,
      type: 'side',
      slug: typeof effectCur.slug === 'string' ? effectCur.slug : 'Новый боковой эффект',
      options: effectCur.options as SideOptions,
    });
  }

  return result;
};
