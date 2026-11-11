import type { VisualEffectRegistration } from '@active-book/types';

import type { BookDocument } from '../book/book';
import { compileVisualEffects } from '../visualEffects';

import { isBookDocument } from '../book/book';
import { assertContentDocument } from '../content/content';

import type {
  BuiltAudioEffect,
  BuiltVibrationEffect,
  BuiltFlashlightEffect,

  AudioEffect,
  VibrationEffect,
  FlashlightEffect,
} from '../effects';

import { normalizePageEffects, isRecord } from '../effects/utils';

type EffectForGetMappedEffects = AudioEffect | VibrationEffect | FlashlightEffect;
type MappedEffect<T extends EffectForGetMappedEffects> = Omit<T, 'slug'>;
type GetMappedEffects = <T extends EffectForGetMappedEffects>(effects: T[]) => MappedEffect<T>[];

const getMappedEffects: GetMappedEffects = (effects) => {
  return effects.map((effectCur) => {
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      slug: _slug,
      ...builtEffect
    } = effectCur;

    return builtEffect;
  });
};

export const compilePageDocument = (document: unknown, path = 'document'): Record<string, unknown> => {
  if (!isRecord(document) || document.type !== 'doc') {
    throw new Error('book.json must contain an Active Book document');
  }

  assertContentDocument(document, path);

  const attributes = isRecord(document.attrs) ? document.attrs : {};
  const builtAttributes = { ...attributes };
  delete builtAttributes.visualEffects;
  const pageEffects = normalizePageEffects(attributes.pageEffects);

  const effectsAudio = pageEffects.audio ?? [];
  const effectsVibration = pageEffects.vibration ?? [];
  const effectsFlashlight = pageEffects.flashlight ?? [];

  const audio: BuiltAudioEffect[] = getMappedEffects(effectsAudio);
  const vibration: BuiltVibrationEffect[] = getMappedEffects(effectsVibration);
  const flashlight: BuiltFlashlightEffect[] = getMappedEffects(effectsFlashlight);

  return {
    ...document,

    attrs: {
      ...builtAttributes,

      pageEffects: {
        audio,
        vibration,
        flashlight,
      },
    },
  };
};

export type BuiltBookDocument = Omit<BookDocument, 'visualEffects'> & {
  visualEffects: VisualEffectRegistration[];
};

export const compileBookDocument = (book: unknown): BuiltBookDocument => {
  if (!isBookDocument(book)) {
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

  return {
    ...book,
    pages,
    visualEffects,
  };
};
