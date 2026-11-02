import type { PageEffects } from './@types';

import { normalizeAudioEffects } from './audio';
import { normalizeVibrationEffects } from './vibration';
import { normalizeFlashlightEffects } from './flashlight';
import { normalizeBackgroundEffects } from './background';
import { normalizeFrameEffects } from './frame';

export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const normalizePageEffects = (value: unknown): PageEffects => {
  const audio = normalizeAudioEffects(value);
  const vibration = normalizeVibrationEffects(value);
  const flashlight = normalizeFlashlightEffects(value);
  const background = normalizeBackgroundEffects(value);
  const frame = normalizeFrameEffects(value);

  return {
    audio,
    vibration,
    flashlight,
    background,
    frame,
  };
};

export const normalizeSpecializedEffects = (value: unknown) => {
  const grouped = normalizePageEffects(value);
  return { audio: grouped.audio, vibration: grouped.vibration, flashlight: grouped.flashlight };
};
