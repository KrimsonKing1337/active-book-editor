import type { BuiltVibrationEffect, BuiltFlashlightEffect } from '@active-book/book-builder/effects';

import type { PageDocument } from '@types';

export const getVibrationEffects = (document: PageDocument): BuiltVibrationEffect[] => {
  const pageEffects = document.attrs?.pageEffects;

  return pageEffects?.vibration ?? [];
};

export const getFlashlightEffects = (document: PageDocument): BuiltFlashlightEffect[] => {
  const pageEffects = document.attrs?.pageEffects;

  return pageEffects?.flashlight ?? [];
};
