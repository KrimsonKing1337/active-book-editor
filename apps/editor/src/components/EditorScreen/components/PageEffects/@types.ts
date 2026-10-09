import type { AudioEffectOptions } from 'activeBook-core/@types';

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

export type AudioEffectDraft = {
  id: string;
  slug: string;
  options: AudioOptions;
};
