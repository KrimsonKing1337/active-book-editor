import type { AudioEffect, PageRange } from '@active-book/types';

import { isContentAssetPath } from '../content/media';
import { isRecord } from '../effects/utils';

export type AuthoredAudioEffect = AudioEffect & {
  slug?: string;
};

const booleanOptions = [
  'loop',
  'playOnLoad',
  'fadeIn',
  'fadeOut',
  'waitTillTheEnd',
  'screamer',
];

const fields = new Set([
  'id',
  'src',
  'lifetime',
  'slug',
  'type',
  'format',
  'relativeVolume',
  'delay',
  'stopBy',
  ...booleanOptions,
]);

const isNonemptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

const isNonnegativeNumber = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
};

const isRemoteAudioSource = (source: string): boolean => {
  if (/^data:audio\/[^,]+,.+/i.test(source)) {
    return true;
  }

  if (!/^https?:\/\//i.test(source)) {
    return false;
  }

  try {
    return !!new URL(source).hostname;
  } catch {
    return false;
  }
};

type Validation = {
  pageIds: readonly string[];
  allowSourceDraft?: boolean;
};

const isValidRange = (range: unknown, pageCount: number): range is PageRange => {
  if (!isRecord(range)) {
    return false;
  }

  const { from, to } = range;
  const hasIntegerBounds = typeof from === 'number' && typeof to === 'number'
    && Number.isInteger(from) && Number.isInteger(to);

  const hasUnexpectedField = Object.keys(range).some((key) => key !== 'from' && key !== 'to');

  return hasIntegerBounds && !hasUnexpectedField && from >= 1 && to >= from && to <= pageCount;
};

type DescriptionLocation = Validation & {
  path: string
};

function assertEffect(effect: unknown, location: DescriptionLocation): asserts effect is AuthoredAudioEffect {
  const {
    path,
    pageIds,
    allowSourceDraft,
  } = location;

  if (!isRecord(effect)) {
    throw new Error(`${path}: expected an audio effect object`);
  }

  const {
    id,
    src,
    lifetime,
    type,
    format,
    relativeVolume,
    slug,
  } = effect;

  if (!isNonemptyString(id) || Object.prototype.hasOwnProperty.call(Object.prototype, id)) {
    throw new Error(`${path}.id: expected a nonempty audio ID distinct from reserved object keys`);
  }

  const address = `${path} ("${id}")`;
  const isDraftSource = allowSourceDraft && typeof src === 'string';
  const isAsset = isContentAssetPath(src);
  const isRemote = typeof src === 'string' && isRemoteAudioSource(src);

  if (!isDraftSource && !isAsset && !isRemote) {
    throw new Error(`${address}.src: expected a file inside assets/ or an HTTP(S) or audio data URL`);
  }

  if (!isRecord(lifetime)) {
    throw new Error(`${address}.lifetime: expected a page or a positional range`);
  }

  if (lifetime.type === 'page') {
    const { page } = lifetime;

    const hasUnexpectedField = Object.keys(lifetime).some((key) => key !== 'type' && key !== 'page');

    if (hasUnexpectedField) {
      throw new Error(`${address}.lifetime: expected only type and page`);
    }

    if (typeof page !== 'string' || !pageIds.includes(page)) {
      throw new Error(`${address}.lifetime.page: unknown page ID "${String(page)}"`);
    }
  } else if (lifetime.type === 'range') {
    const { range } = lifetime;

    const hasUnexpectedField = Object.keys(lifetime).some((key) => key !== 'type' && key !== 'range');

    if (hasUnexpectedField || !Array.isArray(range) || range.length === 0) {
      throw new Error(`${address}.lifetime.range: expected at least one positional range`);
    }

    for (const [index, interval] of range.entries()) {
      if (!isValidRange(interval, pageIds.length)) {
        throw new Error(`${address}.lifetime.range[${index}]: expected 1 <= from <= to <= ${pageIds.length}`);
      }
    }
  } else {
    throw new Error(`${address}.lifetime.type: expected "page" or "range"`);
  }

  if (type !== undefined && type !== 'bg' && type !== 'music' && type !== 'sfx') {
    throw new Error(`${address}.type: expected "bg", "music" or "sfx"`);
  }

  if (relativeVolume !== undefined && (!isNonnegativeNumber(relativeVolume) || relativeVolume > 100)) {
    throw new Error(`${address}.relativeVolume: expected a number from 0 to 100`);
  }

  for (const key of ['delay', 'stopBy']) {
    const milliseconds = effect[key];

    if (milliseconds !== undefined && !isNonnegativeNumber(milliseconds)) {
      throw new Error(`${address}.${key}: expected nonnegative finite milliseconds`);
    }
  }

  for (const key of booleanOptions) {
    if (effect[key] !== undefined && typeof effect[key] !== 'boolean') {
      throw new Error(`${address}.${key}: expected a boolean`);
    }
  }

  if (format !== undefined && (!Array.isArray(format) || !format.every(isNonemptyString))) {
    throw new Error(`${address}.format: expected an array of nonempty format names`);
  }

  if (slug !== undefined && typeof slug !== 'string') {
    throw new Error(`${address}.slug: expected a string`);
  }

  for (const key of Object.keys(effect)) {
    if (!fields.has(key)) {
      throw new Error(`${address}.${key}: unknown audio field`);
    }
  }
}

export const validateAudioEffects = (effects: unknown, validation: Validation): readonly AuthoredAudioEffect[] => {
  if (effects === undefined) {
    return [];
  }

  if (!Array.isArray(effects)) {
    throw new Error('audioEffects: expected an array of audio effects');
  }

  const ids = new Set<string>();
  const validated: AuthoredAudioEffect[] = [];

  for (const [index, effect] of effects.entries()) {
    const path = `audioEffects[${index}]`;
    assertEffect(effect, { ...validation, path });

    if (ids.has(effect.id)) {
      throw new Error(`${path}.id: duplicate audio ID "${effect.id}"`);
    }

    ids.add(effect.id);
    validated.push(effect);
  }

  return validated;
};
