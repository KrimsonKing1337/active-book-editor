
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

const isFiniteNumber = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isFinite(value);
};

const isValidLength = (value: unknown): value is VisualLength => {
  if (!isRecord(value)) {
    return false;
  }

  const isValidNumber = isFiniteNumber(value.value);
  const isValidUnit = value.unit === 'px' || value.unit === '%';

  return isValidNumber && isValidUnit;
};

const isNonnegativeLength = (value: unknown): boolean => {
  if (!isValidLength(value)) {
    return false;
  }

  return value.value >= 0;
};

const isValidFrameWidth = (value: unknown): boolean => {
  if (isNonnegativeLength(value)) {
    return true;
  }

  if (!isRecord(value)) {
    return false;
  }

  const keys = Object.keys(value);

  if (keys.length !== FRAME_SIDES.length) {
    return false;
  }

  const hasOnlySides = keys.every((key) => sides.has(key));

  if (!hasOnlySides) {
    return false;
  }

  return FRAME_SIDES.every((side) => isNonnegativeLength(value[side]));
};

const isValidPoint = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  const hasValidX = isValidLength(value.x);
  const hasValidY = isValidLength(value.y);

  return hasValidX && hasValidY;
};

const isValidSize = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  const hasValidWidth = isNonnegativeLength(value.width);
  const hasValidHeight = isNonnegativeLength(value.height);

  return hasValidWidth && hasValidHeight;
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

  if ('coordinates' in value) {
    return false;
  }

  if (!regions.has(String(region))) {
    return false;
  }

  if (anchor !== undefined && !anchors.has(String(anchor))) {
    return false;
  }

  if (origin !== undefined && !anchors.has(String(origin))) {
    return false;
  }

  if (offset !== undefined && !isValidPoint(offset)) {
    return false;
  }

  if (size !== undefined && !isValidSize(size)) {
    return false;
  }

  if (scale !== undefined && !isFiniteNumber(scale)) {
    return false;
  }

  if (rotate !== undefined && !isFiniteNumber(rotate)) {
    return false;
  }

  return true;
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

  if (!isRecord(value)) {
    return false;
  }

  if ('region' in value) {
    return false;
  }

  if (!isValidMask(value.mask)) {
    return false;
  }

  if (value.frameWidth !== undefined && !isValidFrameWidth(value.frameWidth)) {
    return false;
  }

  if (value.sides === undefined) {
    return true;
  }

  if (!Array.isArray(value.sides)) {
    return false;
  }

  return value.sides.every((side) => sides.has(String(side)));
};

const isValidRange = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  const { from, to } = value;

  if (typeof from !== 'number' || !Number.isInteger(from)) {
    return false;
  }

  if (typeof to !== 'number' || !Number.isInteger(to)) {
    return false;
  }

  const hasValidStart = from >= 1;
  const hasValidEnd = to >= from;

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

  if (!hasValidPlane) {
    return false;
  }

  if (value.order === undefined) {
    return true;
  }

  return typeof value.order === 'number' && Number.isInteger(value.order);
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
