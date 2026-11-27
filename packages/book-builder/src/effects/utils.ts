import type { PageEffects } from './@types';

import { normalizeVibrationEffects } from './vibration';
import { normalizeFlashlightEffects } from './flashlight';
import { normalizeBackgroundEffects } from './background';
import { normalizeFrameEffects } from './frame';

export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const normalizePageEffects = (value: unknown): PageEffects => {
  const vibration = normalizeVibrationEffects(value);
  const flashlight = normalizeFlashlightEffects(value);
  const background = normalizeBackgroundEffects(value);
  const frame = normalizeFrameEffects(value);

  return {
    vibration,
    flashlight,
    background,
    frame,
  };
};

export const normalizeSpecializedEffects = (value: unknown) => {
  const grouped = normalizePageEffects(value);

  return {
    vibration: grouped.vibration,
    flashlight: grouped.flashlight,
  };
};
