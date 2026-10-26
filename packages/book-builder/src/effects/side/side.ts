import type { CSSProperties } from 'react';

import type { SideShadowItem, SideTextItem } from 'activeBook-core/hooks/effects/side/@types';

import type { BackgroundComponentReference } from '../background';
import type { FilterOperation } from '../style';

import { resolveStyle } from '../style';
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

type StyledItem = {
  style?: CSSProperties;
  styleFilters?: FilterOperation[];
};

const resolveItemStyle = <T extends StyledItem>(item: T) => {
  const {
    styleFilters,
    style,
    ...itemOptions
  } = item;

  const resolvedStyle = resolveStyle(style, styleFilters);

  return {
    ...itemOptions,
    style: resolvedStyle,
  };
};

export const resolveSideOptions = (options: SideOptions) => {
  const {
    shadow,
    text,
    style,
    styleFilters,
  } = options;

  const resolvedShadow = shadow ? resolveItemStyle(shadow) : undefined;
  const resolvedText = text ? resolveItemStyle(text) : undefined;
  const resolvedStyle = resolveStyle(style, styleFilters);

  return {
    shadow: resolvedShadow,
    text: resolvedText,
    style: resolvedStyle,
  };
};

export const normalizeSideEffects = (value: unknown): SideEffect[] => {
  if (!isRecord(value)) {
    return [];
  }

  if (!Array.isArray(value.side)) {
    return [];
  }

  const result: SideEffect[] = [];

  for (const effectCur of value.side) {
    if (!isRecord(effectCur)) {
      continue;
    }

    const hasCorrectType = effectCur.type === 'side';

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

    const kind = sideEffectKinds.find((cur) => cur === effectCur.kind);

    if (!kind) {
      continue;
    }

    if (kind === 'shadow') {
      const shadow = options.shadow;

      if (!isRecord(shadow)) {
        continue;
      }

      const shadowId = shadow.id;
      const hasValidShadowId = typeof shadowId === 'string' && Boolean(shadowId.trim());

      if (!hasValidShadowId) {
        continue;
      }
    }

    if (kind === 'text') {
      const text = options.text;

      if (!isRecord(text)) {
        continue;
      }

      const {
        id: textId,
        leftText,
        rightText,
      } = text;

      const hasValidTextId = typeof textId === 'string' && Boolean(textId.trim());
      const hasLeftText = typeof leftText === 'string';
      const hasRightText = typeof rightText === 'string';

      if (!hasValidTextId || !hasLeftText || !hasRightText) {
        continue;
      }
    }

    const slug = typeof effectCur.slug === 'string' ? effectCur.slug : 'Новый боковой эффект';

    result.push({
      id,
      type: 'side',
      kind,
      slug,
      options: options as SideOptions,
    });
  }

  return result;
};
