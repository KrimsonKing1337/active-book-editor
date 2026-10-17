import type { AudioEffectOptions } from 'activeBook-core/@types.d.ts';

import { isRecord } from './utils.ts';

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
  let effects: unknown[] = [];

  // Older projects stored pageEffects as an ungrouped audio array.
  if (Array.isArray(value)) {
    effects = value;
  } else if (isRecord(value) && Array.isArray(value.audio)) {
    effects = value.audio;
  }

  const audio: AudioEffect[] = [];

  for (const effect of effects) {
    if (!isRecord(effect) || !isRecord(effect.options)) {
      continue;
    }

    if (typeof effect.id !== 'string' || typeof effect.options.src !== 'string') {
      continue;
    }

    if (effect.type !== undefined && effect.type !== 'audio') {
      continue;
    }

    audio.push({
      id: effect.id,
      type: 'audio',
      slug: typeof effect.slug === 'string' ? effect.slug : 'Новый звук',
      options: effect.options as AudioOptions,
    });
  }

  return audio;
};
