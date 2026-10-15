import type { AudioEffectOptions } from 'activeBook-core/@types';

// Configurations stored in the editor's book.json.
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

export type VibrationOptions = {
  duration: number;
  delay: number;
  playOnLoad: boolean;
};

export type VibrationEffect = {
  id: string;
  type: 'vibration';
  slug: string;
  options: VibrationOptions;
};

export type EditorEffect = AudioEffect | VibrationEffect;

export type PageEffects = {
  [K in EditorEffect['type']]?: Extract<EditorEffect, { type: K }>[];
};

// Runtime effects do not include editor-only metadata such as slug.
export type BuiltAudioEffect = Omit<AudioEffect, 'slug'>;
export type BuiltVibrationEffect = Omit<VibrationEffect, 'slug'>;
export type BuiltEffect = BuiltAudioEffect | BuiltVibrationEffect;

export type BuiltPageEffects = {
  [K in BuiltEffect['type']]?: Extract<BuiltEffect, { type: K }>[];
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const getAudioEffects = (value: unknown): unknown[] => {
  // Previous editor versions stored pageEffects directly as an array.
  if (Array.isArray(value)) {
    return value;
  }

  if (isRecord(value) && Array.isArray(value.audio)) {
    return value.audio;
  }

  return [];
};

const getVibrationEffects = (value: unknown): unknown[] => {
  if (isRecord(value) && Array.isArray(value.vibration)) {
    return value.vibration;
  }

  return [];
};

export const normalizePageEffects = (value: unknown): PageEffects => {
  const audio: AudioEffect[] = [];
  const vibration: VibrationEffect[] = [];

  for (const effect of getAudioEffects(value)) {
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

  for (const effect of getVibrationEffects(value)) {
    if (!isRecord(effect) || effect.type !== 'vibration' || !isRecord(effect.options)) {
      continue;
    }

    if (typeof effect.id !== 'string' || !effect.id.trim()) {
      continue;
    }

    const { duration, delay, playOnLoad } = effect.options;

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
      options: { duration, delay, playOnLoad },
    });
  }

  return { audio, vibration };
};

export const compileBookDocument = (document: unknown): Record<string, unknown> => {
  if (!isRecord(document) || document.type !== 'doc') {
    throw new Error('book.json must contain an Active Book document');
  }

  const attributes = isRecord(document.attrs) ? document.attrs : {};
  const pageEffects = normalizePageEffects(attributes.pageEffects);

  const audio: BuiltAudioEffect[] = (pageEffects.audio ?? []).map((effect) => {
    return {
      id: effect.id,
      type: effect.type,
      options: effect.options,
    };
  });

  const vibration: BuiltVibrationEffect[] = (pageEffects.vibration ?? []).map((effect) => {
    return {
      id: effect.id,
      type: effect.type,
      options: effect.options,
    };
  });

  return {
    ...document,
    attrs: {
      ...attributes,
      pageEffects: { audio, vibration },
    },
  };
};
