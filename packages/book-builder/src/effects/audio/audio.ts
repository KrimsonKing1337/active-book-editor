import type { AudioEffectOptions } from 'activeBook-core/@types';

import { isRecord } from '../utils';

export type AudioOptions = Required<Pick<
  AudioEffectOptions,
  | 'src'
  | 'type'
  | 'loop'
  | 'playOnLoad'
  | 'stopBy'
  | 'delay'
  | 'relativeVolume'
  | 'screamer'
  | 'fadeOutWhenUnload'
>>;

export type AudioEffect = {
  id: string;
  type: 'audio';
  slug: string;
  options: AudioOptions;
};

export type BuiltAudioEffect = Omit<AudioEffect, 'slug'>;

export const normalizeAudioEffects = (value: unknown): AudioEffect[] => {
  if (!isRecord(value) || !Array.isArray(value.audio)) {
    return [];
  }

  const audio: AudioEffect[] = [];

  for (const effect of value.audio) {
    if (!isRecord(effect) || !isRecord(effect.options)) {
      continue;
    }

    if (typeof effect.id !== 'string' || typeof effect.options.src !== 'string') {
      continue;
    }

    if (effect.type !== 'audio') {
      continue;
    }

    const slug = typeof effect.slug === 'string' ? effect.slug : 'Новый звук';
    const options = effect.options as AudioOptions;

    audio.push({
      id: effect.id,
      type: 'audio',
      slug,
      options,
    });
  }

  return audio;
};
