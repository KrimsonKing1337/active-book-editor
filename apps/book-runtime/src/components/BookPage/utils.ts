import type { BuiltAudioEffect, BuiltVibrationEffect } from '@active-book/book-builder/effects';

import type { BookDocument } from '@types';

export const getAudioEffects = (document: BookDocument): BuiltAudioEffect[] => {
  const pageEffects = document.attrs?.pageEffects;
  const audio = pageEffects?.audio ?? [];

  return audio.filter((cur) => Boolean(cur.options.src?.trim()));
};

export const getVibrationEffects = (document: BookDocument): BuiltVibrationEffect[] => {
  const pageEffects = document.attrs?.pageEffects;

  return pageEffects?.vibration ?? [];
};
