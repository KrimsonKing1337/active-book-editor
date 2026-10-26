import type {
  BuiltAudioEffect,
  BuiltVibrationEffect,
  BuiltFlashlightEffect,
  BuiltBackgroundEffect,
  BuiltSideEffect,

  AudioEffect,
  VibrationEffect,
  FlashlightEffect,
  BackgroundEffect,
  SideEffect,
} from '../effects';

import { normalizePageEffects, isRecord } from '../effects/utils';

type EffectForGetMappedEffects = AudioEffect | VibrationEffect | FlashlightEffect | BackgroundEffect | SideEffect;
type MappedEffect<T extends EffectForGetMappedEffects> = Omit<T, 'slug'>;
type GetMappedEffects = <T extends EffectForGetMappedEffects>(effects: T[]) => MappedEffect<T>[];

const getMappedEffects: GetMappedEffects = (effects) => {
  return effects.map((effectCur) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { slug: _slug, ...rest } = effectCur;

    return rest;
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
  const effectsSide = pageEffects.side ?? [];

  const audio: BuiltAudioEffect[] = getMappedEffects(effectsAudio);
  const vibration: BuiltVibrationEffect[] = getMappedEffects(effectsVibration);
  const flashlight: BuiltFlashlightEffect[] = getMappedEffects(effectsFlashlight);
  const background: BuiltBackgroundEffect[] = getMappedEffects(effectsBackground);
  const side: BuiltSideEffect[] = getMappedEffects(effectsSide);

  return {
    ...document,

    attrs: {
      ...attributes,

      pageEffects: {
        audio,
        vibration,
        flashlight,
        background,
        side,
      },
    },
  };
};
