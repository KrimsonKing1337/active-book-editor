import type {
  BuiltAudioEffect,
  BuiltVibrationEffect,
  BuiltFlashlightEffect,
} from '@active-book/book-builder/effects';

import type { PageDocument } from '@types';

export const getAudioEffects = (document: PageDocument): BuiltAudioEffect[] => {
  const pageEffects = document.attrs?.pageEffects;
  const audio = pageEffects?.audio ?? [];

  return audio.filter((cur) => Boolean(cur.options.src?.trim()));
};

export const getVibrationEffects = (document: PageDocument): BuiltVibrationEffect[] => {
  const pageEffects = document.attrs?.pageEffects;

  return pageEffects?.vibration ?? [];
};

export const getFlashlightEffects = (document: PageDocument): BuiltFlashlightEffect[] => {
  const pageEffects = document.attrs?.pageEffects;

  return pageEffects?.flashlight ?? [];
};
