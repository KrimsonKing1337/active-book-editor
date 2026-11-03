import type { VibrationProps } from 'activeBook-core/components/ProxyHooks';

import { isRecord } from '../utils';

export type VibrationOptions = Required<Pick<VibrationProps, 'duration' | 'delay' | 'playOnLoad'>>;

export type VibrationEffect = {
  id: string;
  type: 'vibration';
  slug: string;
  options: VibrationOptions;
};

export type BuiltVibrationEffect = Omit<VibrationEffect, 'slug'>;

export const normalizeVibrationEffects = (value: unknown): VibrationEffect[] => {
  if (!isRecord(value) || !Array.isArray(value.vibration)) {
    return [];
  }

  const vibration: VibrationEffect[] = [];

  for (const effect of value.vibration) {
    if (!isRecord(effect) || effect.type !== 'vibration' || !isRecord(effect.options)) {
      continue;
    }

    if (typeof effect.id !== 'string' || !effect.id.trim()) {
      continue;
    }

    const {
      duration,
      delay,
      playOnLoad,
    } = effect.options;

    if (typeof duration !== 'number' || !Number.isFinite(duration) || duration < 0) {
      continue;
    }

    if (typeof delay !== 'number' || !Number.isFinite(delay) || delay < 0) {
      continue;
    }

    if (typeof playOnLoad !== 'boolean') {
      continue;
    }

    vibration.push({
      id: effect.id,
      type: 'vibration',
      slug: typeof effect.slug === 'string' ? effect.slug : 'Новая вибрация',
      options: {
        duration,
        delay,
        playOnLoad,
      },
    });
  }

  return vibration;
};
