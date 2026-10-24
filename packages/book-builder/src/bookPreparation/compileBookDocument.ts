import type {
  BuiltAudioEffect,
  BuiltVibrationEffect,
  BuiltFlashlightEffect,
  BuiltBackgroundEffect,

  AudioEffect,
  VibrationEffect,
  FlashlightEffect,
  BackgroundEffect,
} from '../effects';

import { normalizePageEffects, isRecord } from '../effects/utils';

type EffectForGetMappedEffects = AudioEffect | VibrationEffect | FlashlightEffect | BackgroundEffect;
type MappedEffect<T extends EffectForGetMappedEffects> = Pick<T, 'id' | 'type' | 'options'>;

const getMappedEffects = <T extends EffectForGetMappedEffects>(effects: T[]): MappedEffect<T>[] => {
  return effects.map((effectCur) => {
    return {
      id: effectCur.id,
      type: effectCur.type,
      options: effectCur.options,
    };
  });
};

export const compileBookDocument = (document: unknown): Record<string, unknown> => {
  if (!isRecord(document) || document.type !== 'doc') {
    throw new Error('book.json must contain an Active Book document');
  }

  const attributes = isRecord(document.attrs) ? document.attrs : {};
  const pageEffects = normalizePageEffects(attributes.pageEffects);

  const effectsAudio = pageEffects.audio ?? [];
  const effectsVibration = pageEffects.vibration ?? [];
  const effectsFlashlight = pageEffects.flashlight ?? [];
  const effectsBackground = pageEffects.background ?? [];

  const audio: BuiltAudioEffect[] = getMappedEffects(effectsAudio);
  const vibration: BuiltVibrationEffect[] = getMappedEffects(effectsVibration);
  const flashlight: BuiltFlashlightEffect[] = getMappedEffects(effectsFlashlight);
  const background: BuiltBackgroundEffect[] = getMappedEffects(effectsBackground);

  return {
    ...document,

    attrs: {
      ...attributes,

      pageEffects: {
        audio,
        vibration,
        flashlight,
        background,
      },
    },
  };
};
