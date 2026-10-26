import type { CSSProperties } from 'react';

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
  style?: CSSProperties;
  styleFilters?: FilterOperation[];
  shadow?: StyledSideShadow;
  text?: StyledSideText;
  component?: BackgroundComponentReference;
};

export type SideEffect = {
  id: string;
  type: 'side';
  kind: SideEffectKind;
  slug: string;
  options: SideOptions;
};

export type BuiltSideEffect = Omit<SideEffect, 'slug'>;

export const resolveSideOptions = (options: SideOptions) => {
  const shadow = options.shadow && {
    ...options.shadow,
    style: resolveStyle(options.shadow.style, options.shadow.styleFilters),
  };

  const text = options.text && {
    ...options.text,
    style: resolveStyle(options.text.style, options.text.styleFilters),
  };

  const style = resolveStyle(options.style, options.styleFilters);

  return { shadow, text, style };
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

    const kind = sideEffectKinds.find((current) => current === effectCur.kind);

    if (!kind) {
      continue;
    }

    const options = effectCur.options;

    if (kind === 'shadow') {
      if (!isRecord(options.shadow) || typeof options.shadow.id !== 'string'
        || !options.shadow.id.trim()) {
        continue;
      }
    }

    if (kind === 'text') {
      if (!isRecord(options.text) || typeof options.text.id !== 'string'
        || !options.text.id.trim() || typeof options.text.leftText !== 'string'
        || typeof options.text.rightText !== 'string') {
        continue;
      }
    }

    const slug = typeof effectCur.slug === 'string' ? effectCur.slug : 'Новый боковой эффект';

    result.push({
      id: effectCur.id,
      type: 'side',
      kind,
      slug,
      options: options as SideOptions,
    });
  }

  return result;
};
