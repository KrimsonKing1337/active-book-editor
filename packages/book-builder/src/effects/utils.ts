import type { PageEffects } from './@types.ts';

import { normalizeAudioEffects } from './audio.ts';
import { normalizeVibrationEffects } from './vibration.ts';

export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const normalizePageEffects = (value: unknown): PageEffects => {
  const audio = normalizeAudioEffects(value);
  const vibration = normalizeVibrationEffects(value);

  return {
    audio,
    vibration,
  };
};
