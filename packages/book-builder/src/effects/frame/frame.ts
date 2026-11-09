import type { CSSProperties } from 'react';

import type { JsonObject } from '@active-book/types';

import type { FrameShadowItem, FrameTextItem } from '@active-book/core/hooks/effects/frame/@types';

import type { BackgroundComponentReference } from '../background';
import type { FilterOperation } from '../style';
import type { VisualLayout } from '../@types';

import { resolveStyle } from '../style';
import { isRecord } from '../utils';

type StyleFilters = {
  styleFilters?: FilterOperation[];
};

export type StyledFrameShadow = FrameShadowItem & StyleFilters;
export type StyledFrameText = FrameTextItem & StyleFilters;

export const frameEffectKinds = ['shadow', 'text', 'component'] as const;

export type FrameEffectKind = (typeof frameEffectKinds)[number];

export type FrameOptions = {
  custom?: JsonObject;
  componentKey?: string | number;
  style?: CSSProperties;
  styleFilters?: FilterOperation[];
  shadow?: StyledFrameShadow;
  text?: StyledFrameText;
  component?: BackgroundComponentReference;
};

export type FrameEffect = VisualLayout & {
  id: string;
  type: 'frame';
  kind: FrameEffectKind;
  slug: string;
  options: FrameOptions;
};

export type BuiltFrameEffect = Omit<FrameEffect, 'slug' | 'placement' | 'depth'>;

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

export const resolveFrameOptions = (options: FrameOptions) => {
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

export const normalizeFrameEffects = (value: unknown): FrameEffect[] => {
  if (!isRecord(value)) {
    return [];
  }

  if (!Array.isArray(value.frame)) {
    return [];
  }

  const result: FrameEffect[] = [];

  for (const effectCur of value.frame) {
    if (!isRecord(effectCur)) {
      continue;
    }

    const hasCorrectType = effectCur.type === 'frame';

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

    const kind = frameEffectKinds.find((kindCur) => {
      return kindCur === effectCur.kind;
    });

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

    const slug = typeof effectCur.slug === 'string' ? effectCur.slug : 'Новый рамочный эффект';
    const resultOptions = options as FrameOptions;

    result.push({
      id,
      type: 'frame',
      kind,
      slug,
      options: resultOptions,
    });
  }

  return result;
};
