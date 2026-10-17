import type { BuiltAudioEffect, BuiltVibrationEffect } from './effects/index';
import { normalizePageEffects, isRecord } from './effects/utils';

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
