import type { BookDocument } from '../book';

import { isBookDocument } from '../book';

import type {
  BuiltAudioEffect,
  BuiltVibrationEffect,
  BuiltFlashlightEffect,
  BuiltBackgroundEffect,
  BuiltFrameEffect,

  AudioEffect,
  VibrationEffect,
  FlashlightEffect,
  BackgroundEffect,
  FrameEffect,
} from '../effects';

import { normalizePageEffects, isRecord } from '../effects/utils';

type EffectForGetMappedEffects = AudioEffect | VibrationEffect | FlashlightEffect | BackgroundEffect | FrameEffect;
type MappedEffect<T extends EffectForGetMappedEffects> = Omit<T, 'slug'>;
type GetMappedEffects = <T extends EffectForGetMappedEffects>(effects: T[]) => MappedEffect<T>[];

const getMappedEffects: GetMappedEffects = (effects) => {
  return effects.map((effectCur) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { slug: _slug, ...builtEffect } = effectCur;

    return builtEffect;
  });
};

export const compilePageDocument = (document: unknown): Record<string, unknown> => {
  if (!isRecord(document) || document.type !== 'doc') {
    throw new Error('book.json must contain an Active Book document');
  }

  const attributes = isRecord(document.attrs) ? document.attrs : {};
  const pageEffects = normalizePageEffects(attributes.pageEffects);

  const effectsAudio = pageEffects.audio ?? [];
  const effectsVibration = pageEffects.vibration ?? [];
  const effectsFlashlight = pageEffects.flashlight ?? [];
  const effectsBackground = pageEffects.background ?? [];
  const effectsFrame = pageEffects.frame ?? [];

  const audio: BuiltAudioEffect[] = getMappedEffects(effectsAudio);
  const vibration: BuiltVibrationEffect[] = getMappedEffects(effectsVibration);
  const flashlight: BuiltFlashlightEffect[] = getMappedEffects(effectsFlashlight);
  const background: BuiltBackgroundEffect[] = getMappedEffects(effectsBackground);
  const frame: BuiltFrameEffect[] = getMappedEffects(effectsFrame);

  return {
    ...document,

    attrs: {
      ...attributes,

      pageEffects: {
        audio,
        vibration,
        flashlight,
        background,
        frame,
      },
    },
  };
};

export const compileBookDocument = (book: unknown): BookDocument => {
  if (!isBookDocument(book)) {
    throw new Error('book.json must contain a nonempty book with unique page IDs and valid positional ranges');
  }

  return {
    ...book,
    pages: book.pages.map((pageCur) => ({
      ...pageCur,
      document: compilePageDocument(pageCur.document),
    })),
  };
};
