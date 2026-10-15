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

export type EditorEffect = AudioEffect;

export type PageEffects = {
  [K in EditorEffect['type']]?: Extract<EditorEffect, { type: K }>[];
};

// Runtime effects do not include editor-only metadata such as slug.
export type BuiltAudioEffect = Pick<AudioEffect, 'id' | 'type' | 'options'>;

export type BuiltEffect = BuiltAudioEffect;

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

export const normalizePageEffects = (value: unknown): PageEffects => {
  const audio: AudioEffect[] = [];

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

  return { audio };
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

  return {
    ...document,
    attrs: {
      ...attributes,
      pageEffects: { audio },
    },
  };
};
