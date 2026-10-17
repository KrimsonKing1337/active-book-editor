import type { PageEffects } from './@types';

import { normalizeAudioEffects } from './audio';
import { normalizeVibrationEffects } from './vibration';

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
