import type { AudioEffect as AudioDescription } from '@active-book/types';

type OptionalAudioFormat = Pick<AudioDescription, 'format'>;

export type AudioOptions = Required<Omit<AudioDescription, 'id' | 'lifetime' | 'format'>> & OptionalAudioFormat;

/** Editable representation used by the page effects dialog. */
export type AudioEffect = {
  id: string;
  type: 'audio';
  slug: string;
  options: AudioOptions;
};
