import type { JsonObject, VisualLength } from '@active-book/types';

import { copyVisualData } from 'activeBook-core/controllers/visualEffects/utils/serialization';

import type { AuthoredVisualEffect } from './@types';

import { backgroundEffectKinds } from '../effects/background';
import { frameEffectKinds } from '../effects/frame';

import {
  FRAME_SIDES,
  VISUAL_ANCHORS,
  VISUAL_PLANES,
  VISUAL_REGIONS,
} from './constants';
import { getVisualCategory } from './definitions';

const regions = new Set<string>(VISUAL_REGIONS);
const anchors = new Set<string>(VISUAL_ANCHORS);
const sides = new Set<string>(FRAME_SIDES);
const planes = new Set<string>(VISUAL_PLANES);

const backgroundKinds = new Set<string>(backgroundEffectKinds);
const frameKinds = new Set<string>(frameEffectKinds);

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isValidLength = (value: unknown): value is VisualLength => {
  if (!isRecord(value)) {
    return false;
  }

  const length = value.value;
  const unit = value.unit;

  const isValidNumber = typeof length === 'number' && Number.isFinite(length);
  const isValidUnit = unit === 'px' || unit === '%';

  return isValidNumber && isValidUnit;
};

const isNonnegativeLength = (value: unknown): boolean => {
  if (!isValidLength(value)) {
    return false;
  }

  return value.value >= 0;
};

const isValidPoint = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  const hasValidX = isValidLength(value.x);
  const hasValidY = isValidLength(value.y);

  return hasValidX && hasValidY;
};

const isValidPlacement = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  const {
    region,
    anchor,
    origin,
    offset,
    size,
    scale,
    rotate,
  } = value;
  if ('coordinates' in value || !regions.has(String(region))) {
    return false;
  }

  const hasValidAnchor = anchor === undefined || anchors.has(String(anchor));
  const hasValidOrigin = origin === undefined || anchors.has(String(origin));
  const hasValidOffset = offset === undefined || isValidPoint(offset);
  const hasValidSize = size === undefined || (isRecord(size)
    && isNonnegativeLength(size.width) && isNonnegativeLength(size.height));
  const hasValidScale = scale === undefined || (typeof scale === 'number' && Number.isFinite(scale));
  const hasValidRotate = rotate === undefined || (typeof rotate === 'number' && Number.isFinite(rotate));

  return hasValidAnchor && hasValidOrigin && hasValidOffset && hasValidSize && hasValidScale && hasValidRotate;
};

const isValidMask = (value: unknown): boolean => {
  if (value === undefined) {
    return true;
  }

  if (!isRecord(value)) {
    return false;
  }

  if (value.type === 'circle') {
    const hasValidCenter = isValidPoint(value.center);
    const hasValidRadius = isNonnegativeLength(value.radius);

    return hasValidCenter && hasValidRadius;
  }

  if (value.type !== 'polygon') {
    return false;
  }

  if (!Array.isArray(value.points)) {
    return false;
  }

  const hasEnoughPoints = value.points.length >= 3;
  const hasValidPoints = value.points.every(isValidPoint);

  return hasEnoughPoints && hasValidPoints;
};

const isValidVisibility = (value: unknown): boolean => {
  if (value === undefined) {
    return true;
  }

  if (!isRecord(value) || 'region' in value || !isValidMask(value.mask)
    || (value.frameWidth !== undefined && !isNonnegativeLength(value.frameWidth))) {
    return false;
  }

  return value.sides === undefined || (Array.isArray(value.sides)
    && value.sides.every((side) => sides.has(String(side))));
};

const isValidRange = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  const { from, to } = value;

  const hasIntegerBounds = Number.isInteger(from) && Number.isInteger(to);

  if (!hasIntegerBounds) {
    return false;
  }

  const start = Number(from);
  const end = Number(to);

  const hasValidStart = start >= 1;
  const hasValidEnd = end >= start;

  return hasValidStart && hasValidEnd;
};

const isValidLifetime = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  if (value.type === 'page') {
    const pageId = value.pageId;

    return typeof pageId === 'string' && pageId.trim().length > 0;
  }

  if (value.type !== 'range') {
    return false;
  }

  if (!Array.isArray(value.range)) {
    return false;
  }

  return value.range.every(isValidRange);
};

const isValidDepth = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  const hasValidPlane = planes.has(String(value.plane));
  const hasValidOrder = value.order === undefined || (typeof value.order === 'number' && Number.isInteger(value.order));

  return hasValidPlane && hasValidOrder;
};

const isValidEffectKind = (definitionId: string, kind: unknown): boolean => {
  const category = getVisualCategory(definitionId);

  if (definitionId.startsWith('custom.')) {
    return true;
  }

  let allowedKinds = frameKinds;

  if (category === 'background') {
    allowedKinds = backgroundKinds;
  }

  return allowedKinds.has(String(kind));
};

export const isAuthoredVisualEffect = (value: unknown): value is AuthoredVisualEffect => {
  if (!isRecord(value)) {
    return false;
  }

  const {
    effect,
    slug,
    lifetime,
  } = value;

  if (!isRecord(effect) || typeof slug !== 'string') {
    return false;
  }

  const {
    id,
    definitionId,
    params,
    placement,
    visibility,
    depth,
  } = effect;

  const hasValidId = typeof id === 'string' && id.trim().length > 0;
  const hasValidDefinitionId = typeof definitionId === 'string';

  if (!hasValidId || !hasValidDefinitionId) {
    return false;
  }

  if (!isRecord(params)) {
    return false;
  }

  const hasValidPlacement = isValidPlacement(placement);
  const hasValidVisibility = isValidVisibility(visibility);
  const hasValidDepth = isValidDepth(depth);
  const hasValidLifetime = isValidLifetime(lifetime);

  if (!hasValidPlacement || !hasValidVisibility || !hasValidDepth || !hasValidLifetime) {
    return false;
  }

  try {
    const hasValidKind = isValidEffectKind(definitionId, params.kind);

    if (!hasValidKind) {
      return false;
    }

    // Проверяем JSON-совместимость всего описания эффекта.
    copyVisualData(value as JsonObject);
  } catch {
    return false;
  }

  return true;
};
