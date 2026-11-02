import type { JsonObject } from '@active-book/types';

import { copyVisualData } from 'activeBook-core/controllers/visualEffects/utils/serialization';

import type { AuthoredVisualEffect } from './@types';
import { visualCategory } from './definitions';

const record = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const validLength = (value: unknown): boolean => record(value)
  && typeof value.value === 'number' && Number.isFinite(value.value)
  && (value.unit === 'px' || value.unit === '%');

const nonnegativeLength = (value: unknown): boolean => {
  return record(value) && validLength(value) && Number(value.value) >= 0;
};

const validPoint = (value: unknown): boolean => record(value) && validLength(value.x) && validLength(value.y);
const regions = new Set(['book', 'bookViewport', 'page', 'frame', 'narrativeViewport', 'narrativeContent']);
const anchors = new Set([
  'top-left', 'top', 'top-right', 'left', 'center', 'right', 'bottom-left', 'bottom', 'bottom-right',
]);
const sides = new Set(['top', 'right', 'bottom', 'left']);
const planes = new Set(['background', 'scene', 'aboveNarrative', 'aboveControls']);

const validPlacement = (value: unknown): boolean => {
  if (!record(value) || !record(value.anchor) || !record(value.size)) {
    return false;
  }

  return regions.has(String(value.coordinates))
    && regions.has(String(value.anchor.region)) && anchors.has(String(value.anchor.point))
    && anchors.has(String(value.origin)) && validPoint(value.offset)
    && nonnegativeLength(value.size.width) && nonnegativeLength(value.size.height);
};

const validMask = (value: unknown): boolean => {
  if (value === undefined) {
    return true;
  }
  if (!record(value)) {
    return false;
  }
  if (value.type === 'circle') {
    return validPoint(value.center) && nonnegativeLength(value.radius);
  }
  if (value.type !== 'polygon' || !Array.isArray(value.points)) {
    return false;
  }

  return value.points.length >= 3 && value.points.every(validPoint);
};

const validVisibility = (value: unknown): boolean => {
  if (!record(value) || !regions.has(String(value.region)) || !validMask(value.mask)) {
    return false;
  }
  if (value.region !== 'frame') {
    return true;
  }

  return Array.isArray(value.sides) && value.sides.every((cur) => sides.has(String(cur)));
};

const validLifetime = (value: unknown): boolean => {
  if (!record(value)) {
    return false;
  }
  if (value.type === 'page') {
    return typeof value.pageId === 'string' && !!value.pageId.trim();
  }
  if (value.type !== 'range' || !Array.isArray(value.range)) {
    return false;
  }

  return value.range.every((rangeCur: unknown) => {
    if (!record(rangeCur)) {
      return false;
    }

    return Number.isInteger(rangeCur.from) && Number.isInteger(rangeCur.to)
      && Number(rangeCur.from) >= 1 && Number(rangeCur.to) >= Number(rangeCur.from);
  });
};

export const isAuthoredVisualEffect = (value: unknown): value is AuthoredVisualEffect => {
  if (!record(value) || !record(value.effect) || typeof value.slug !== 'string') {
    return false;
  }
  const effect = value.effect;
  if (typeof effect.id !== 'string' || !effect.id.trim() || typeof effect.definitionId !== 'string') {
    return false;
  }
  if (!record(effect.params) || !record(effect.depth)) {
    return false;
  }

  try {
    const category = visualCategory(effect.definitionId);
    const kinds = category === 'background'
      ? ['background', 'image', 'video', 'shadow', 'component'] : ['shadow', 'text', 'component'];
    if (!effect.definitionId.startsWith('custom.') && !kinds.includes(String(effect.params.kind))) {
      return false;
    }
    // Unlike JSON.stringify, this rejects functions, DOM resources, cycles and non-finite values.
    copyVisualData(value as JsonObject);
  } catch {
    return false;
  }

  return validPlacement(effect.placement) && validVisibility(effect.visibility)
    && planes.has(String(effect.depth.plane))
    && typeof effect.depth.order === 'number' && Number.isInteger(effect.depth.order)
    && validLifetime(value.lifetime);
};
