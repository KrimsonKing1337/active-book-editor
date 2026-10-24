import type { FlashlightProps } from 'activeBook-core/components/ProxyHooks';

import { isRecord } from '../utils';

export type FlashlightOptions = Required<Pick<
  FlashlightProps,
  'duration' | 'delay' | 'playOnLoad' | 'withSideShadow' | 'speed'
>>;

export type FlashlightEffect = {
  id: string;
  type: 'flashlight';
  slug: string;
  options: FlashlightOptions;
};

export type BuiltFlashlightEffect = Omit<FlashlightEffect, 'slug'>;

export const normalizeFlashlightEffects = (value: unknown): FlashlightEffect[] => {
  if (!isRecord(value) || !Array.isArray(value.flashlight)) {
    return [];
  }

  const flashlight: FlashlightEffect[] = [];

  for (const effect of value.flashlight) {
    if (!isRecord(effect) || effect.type !== 'flashlight' || !isRecord(effect.options)) {
      continue;
    }

    if (typeof effect.id !== 'string' || !effect.id.trim()) {
      continue;
    }

    const { duration, delay, playOnLoad, withSideShadow, speed } = effect.options;

    if (typeof duration !== 'number' || !Number.isFinite(duration) || duration < 0) {
      continue;
    }

    if (typeof delay !== 'number' || !Number.isFinite(delay) || delay < 0) {
      continue;
    }

    if (typeof playOnLoad !== 'boolean' || typeof withSideShadow !== 'boolean') {
      continue;
    }

    if (typeof speed !== 'number' || !Number.isFinite(speed) || speed <= 0) {
      continue;
    }

    flashlight.push({
      id: effect.id,
      type: 'flashlight',
      slug: typeof effect.slug === 'string' ? effect.slug : 'Новая вспышка',
      options: { duration, delay, playOnLoad, withSideShadow, speed },
    });
  }

  return flashlight;
};
