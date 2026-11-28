import type { AudioEffect, PageRange } from '@active-book/types';

import { isContentAssetPath } from '../content';
import { isRecord } from '../effects/utils';

export type AuthoredAudioEffect = AudioEffect & {
  slug?: string;
};

type Validation = {
  pageIds: readonly string[];
  allowSourceDraft?: boolean;
};

type DescriptionLocation = Validation & {
  path: string;
};

type AudioSourceValidationOptions = {
  src: unknown;
  address: string;
  allowSourceDraft: Validation['allowSourceDraft'];
};

type AudioLifetimeValidationOptions = {
  lifetime: unknown;
  address: string;
  pageIds: Validation['pageIds'];
};

const booleanOptions = [
  'loop',
  'playOnLoad',
  'fadeIn',
  'fadeOut',
  'waitTillTheEnd',
  'screamer',
];

const allowedFields = new Set([
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
  if (typeof value !== 'number') {
    return false;
  }

  return Number.isFinite(value) && value >= 0;
};

const isRemoteAudioSource = (source: string): boolean => {
  if (/^data:audio\/[^,]+,.+/i.test(source)) {
    return true;
  }

  if (!/^https?:\/\//i.test(source)) {
    return false;
  }

  try {
    const url = new URL(source);

    return !!url.hostname;
  } catch {
    return false;
  }
};

const isValidRange = (range: unknown, pageCount: number): range is PageRange => {
  if (!isRecord(range)) {
    return false;
  }

  const { from, to } = range;

  const isFromValid = typeof from === 'number' && Number.isInteger(from);
  const isToValid = typeof to === 'number' && Number.isInteger(to);

  const hasIntegerBounds = isFromValid && isToValid;

  if (!hasIntegerBounds) {
    return false;
  }

  const hasUnexpectedField = Object.keys(range).some((keyCur) => {
    return keyCur !== 'from' && keyCur !== 'to';
  });

  if (hasUnexpectedField) {
    return false;
  }

  return from >= 1 && to >= from && to <= pageCount;
};

// Для assertion-функций намеренно используем function declaration.
// Стрелочная функция с asserts требует явной типизации самой переменной,
// иначе TypeScript не выполняет сужение типа при вызове (TS2775).
function assertAudioId(id: unknown, path: string): asserts id is string {
  const errorMessage = `${path}.id: expected a nonempty audio ID distinct from reserved object keys`;

  if (!isNonemptyString(id)) {
    throw new Error(errorMessage);
  }

  if (Object.hasOwn(Object.prototype, id)) {
    throw new Error(errorMessage);
  }
}

const assertAudioSource = ({
  src,
  address,
  allowSourceDraft,
}: AudioSourceValidationOptions) => {
  if (allowSourceDraft && typeof src === 'string') {
    return;
  }

  if (isContentAssetPath(src)) {
    return;
  }

  if (typeof src === 'string') {
    if (isRemoteAudioSource(src)) {
      return;
    }
  }

  throw new Error(`${address}.src: expected a file inside assets/ or an HTTP(S) or audio data URL`);
};

const assertAudioLifetime = ({
  lifetime,
  address,
  pageIds,
}: AudioLifetimeValidationOptions) => {
  if (!isRecord(lifetime)) {
    throw new Error(`${address}.lifetime: expected a page or a positional range`);
  }

  switch (lifetime.type) {
    case 'page': {
      const { page } = lifetime;

      const hasUnexpectedField = Object.keys(lifetime).some((keyCur) => {
        return keyCur !== 'type' && keyCur !== 'page';
      });

      if (hasUnexpectedField) {
        throw new Error(`${address}.lifetime: expected only type and page`);
      }

      if (typeof page !== 'string' || !pageIds.includes(page)) {
        throw new Error(`${address}.lifetime.page: unknown page ID "${String(page)}"`);
      }

      return;
    }

    case 'range': {
      const { range } = lifetime;

      const hasUnexpectedField = Object.keys(lifetime).some((keyCur) => {
        return keyCur !== 'type' && keyCur !== 'range';
      });

      const errorMessage = `${address}.lifetime.range: expected at least one positional range`;

      if (hasUnexpectedField || !Array.isArray(range)) {
        throw new Error(errorMessage);
      }

      if (range.length === 0) {
        throw new Error(errorMessage);
      }

      const pageCount = pageIds.length;

      for (const [index, rangeCur] of range.entries()) {
        if (!isValidRange(rangeCur, pageCount)) {
          throw new Error(`${address}.lifetime.range[${index}]: expected 1 <= from <= to <= ${pageCount}`);
        }
      }

      return;
    }

    default:
      throw new Error(`${address}.lifetime.type: expected "page" or "range"`);
  }
};

const assertAudioOptions = (effect: Record<string, unknown>, address: string) => {
  const {
    type,
    relativeVolume,
    format,
    slug,
  } = effect;

  if (type !== undefined) {
    const isValidType = type === 'bg' || type === 'music' || type === 'sfx';

    if (!isValidType) {
      throw new Error(`${address}.type: expected "bg", "music" or "sfx"`);
    }
  }

  if (relativeVolume !== undefined) {
    const isNonnegative = isNonnegativeNumber(relativeVolume);

    if (!isNonnegative || relativeVolume > 100) {
      throw new Error(`${address}.relativeVolume: expected a number from 0 to 100`);
    }
  }

  for (const keyCur of ['delay', 'stopBy']) {
    const milliseconds = effect[keyCur];

    if (milliseconds === undefined) {
      continue;
    }

    if (!isNonnegativeNumber(milliseconds)) {
      throw new Error(`${address}.${keyCur}: expected nonnegative finite milliseconds`);
    }
  }

  for (const keyCur of booleanOptions) {
    const value = effect[keyCur];

    if (value === undefined) {
      continue;
    }

    if (typeof value !== 'boolean') {
      throw new Error(`${address}.${keyCur}: expected a boolean`);
    }
  }

  if (format !== undefined) {
    const errorMessage = `${address}.format: expected an array of nonempty format names`;

    if (!Array.isArray(format)) {
      throw new Error(errorMessage);
    }

    for (const formatCur of format) {
      if (!isNonemptyString(formatCur)) {
        throw new Error(errorMessage);
      }
    }
  }

  if (slug !== undefined && typeof slug !== 'string') {
    throw new Error(`${address}.slug: expected a string`);
  }
};

const assertAudioFields = (effect: Record<string, unknown>, address: string) => {
  for (const keyCur of Object.keys(effect)) {
    if (!allowedFields.has(keyCur)) {
      throw new Error(`${address}.${keyCur}: unknown audio field`);
    }
  }
};

// Function declaration используется намеренно, как и в assertAudioId.
// Это позволяет TypeScript учитывать asserts без отдельного типа
// сигнатуры функции и избегать ошибки TS2775.
function assertEffect(
  effect: unknown,
  location: DescriptionLocation,
): asserts effect is AuthoredAudioEffect {
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
  } = effect;

  assertAudioId(id, path);

  const address = `${path} ("${id}")`;

  assertAudioSource({
    src,
    address,
    allowSourceDraft,
  });

  assertAudioLifetime({
    lifetime,
    address,
    pageIds,
  });

  assertAudioOptions(effect, address);
  assertAudioFields(effect, address);
}

export const hasPageAudio = (attrs: Record<string, unknown>): boolean => {
  if ('audioEffects' in attrs) {
    return true;
  }

  const { pageEffects } = attrs;

  return isRecord(pageEffects) && 'audio' in pageEffects;
};

export const validateAudioEffects = (
  effects: unknown,
  validation: Validation,
): readonly AuthoredAudioEffect[] => {
  if (effects === undefined) {
    return [];
  }

  if (!Array.isArray(effects)) {
    throw new Error('audioEffects: expected an array of audio effects');
  }

  const ids = new Set<string>();
  const validatedEffects: AuthoredAudioEffect[] = [];

  for (const [index, effectCur] of effects.entries()) {
    const path = `audioEffects[${index}]`;

    assertEffect(effectCur, { ...validation, path });

    const { id } = effectCur;

    if (ids.has(id)) {
      throw new Error(`${path}.id: duplicate audio ID "${id}"`);
    }

    ids.add(id);
    validatedEffects.push(effectCur);
  }

  return validatedEffects;
};
