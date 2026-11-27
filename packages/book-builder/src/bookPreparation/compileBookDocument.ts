import type { AudioEffect, VisualEffectRegistration } from '@active-book/types';

import { compileVisualEffects } from '../visualEffects';

import { type BookDocument, isBookStructure } from '../book';
import { compileAudioEffects } from '../audioEffects';
import { assertContentDocument } from '../content';

import type {
  BuiltVibrationEffect,
  BuiltFlashlightEffect,
  VibrationEffect,
  FlashlightEffect,
} from '../effects';

import { normalizePageEffects, isRecord } from '../effects/utils';

type EffectForGetMappedEffects = VibrationEffect | FlashlightEffect;
type MappedEffect<T extends EffectForGetMappedEffects> = Omit<T, 'slug'>;
type GetMappedEffects = <T extends EffectForGetMappedEffects>(effects: T[]) => MappedEffect<T>[];

const getMappedEffects: GetMappedEffects = (effects) => {
  return effects.map((effectCur) => {
    const {
      slug: _slug,
      ...builtEffect
    } = effectCur;

    return builtEffect;
  });
};

export const compilePageDocument = (
  document: unknown,
  path = 'document',
): Record<string, unknown> => {
  if (!isRecord(document) || document.type !== 'doc') {
    throw new Error('book.json must contain an Active Book document');
  }

  assertContentDocument(document, path);

  const attributes = isRecord(document.attrs) ? document.attrs : {};

  const builtAttributes = { ...attributes };
  delete builtAttributes.visualEffects;

  const pageEffects = normalizePageEffects(attributes.pageEffects);

  const effectsVibration = pageEffects.vibration ?? [];
  const effectsFlashlight = pageEffects.flashlight ?? [];

  const vibration: BuiltVibrationEffect[] = getMappedEffects(effectsVibration);
  const flashlight: BuiltFlashlightEffect[] = getMappedEffects(effectsFlashlight);

  return {
    ...document,

    attrs: {
      ...builtAttributes,

      pageEffects: {
        vibration,
        flashlight,
      },
    },
  };
};

export type BuiltBookDocument = Omit<BookDocument, 'visualEffects' | 'audioEffects'> & {
  visualEffects: VisualEffectRegistration[];
  audioEffects: AudioEffect<number>[];
};

export const compileBookDocument = (
  book: unknown,
  audioAssets?: Set<string>,
): BuiltBookDocument => {
  if (!isBookStructure(book)) {
    throw new Error('book.json must contain a nonempty book with unique page IDs and valid positional ranges');
  }

  const pages = book.pages.map((pageCur, index) => {
    const document = compilePageDocument(pageCur.document, `pages[${index}].document`);

    return {
      ...pageCur,
      document,
    };
  });

  const visualEffects = compileVisualEffects(book);
  const audioEffects = compileAudioEffects(book, audioAssets);

  return {
    ...book,
    pages,
    visualEffects,
    audioEffects,
  };
};
