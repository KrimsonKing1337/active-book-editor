import type { PageEffects } from './@types';
import { normalizeAudioEffects } from './audio';
import { normalizeVibrationEffects } from './vibration';

export * from './@types';
export * from './audio';
export * from './vibration';

export const normalizePageEffects = (value: unknown): PageEffects => {
  const audio = normalizeAudioEffects(value);
  const vibration = normalizeVibrationEffects(value);

  return { audio, vibration };
};
