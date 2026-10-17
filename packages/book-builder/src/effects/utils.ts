import type { PageEffects } from './@types';

import { normalizeAudioEffects } from './audio';
import { normalizeVibrationEffects } from './vibration';
import { normalizeFlashlightEffects } from './flashlight';

export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const normalizePageEffects = (value: unknown): PageEffects => {
  const audio = normalizeAudioEffects(value);
  const vibration = normalizeVibrationEffects(value);
  const flashlight = normalizeFlashlightEffects(value);

  return {
    audio,
    vibration,
    flashlight,
  };
};
