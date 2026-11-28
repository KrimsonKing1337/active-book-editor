import { DEFAULT_AUDIO_RELATIVE_VOLUME } from '@active-book/core/utils/effects/audio/audioVolume';

import type { AuthoredAudioEffect } from '@active-book/book-builder/audioEffects';
import type { AudioEffect as AudioDraft } from '@active-book/book-builder/effects';

export type PageAudioChange = {
  pageId: string;
  effects: readonly AudioDraft[];
};

export type PageAudioAccess = {
  effects: readonly AudioDraft[];
  ids: readonly string[];
  read: (pageId: string) => readonly AudioDraft[];
  write: (change: PageAudioChange) => void;
};

export const belongsToPage = (effect: AuthoredAudioEffect, pageId: string): boolean => {
  if (effect.lifetime.type !== 'page') {
    return false;
  }

  return effect.lifetime.page === pageId;
};

export const getPageAudio = (audioEffects: readonly AuthoredAudioEffect[], pageId: string): AudioDraft[] => {
  const pageAudioEffects = audioEffects.filter((effectCur) => {
    return belongsToPage(effectCur, pageId);
  });

  return pageAudioEffects.map((effectCur) => {
    const slug = effectCur.slug ?? 'Новый звук';

    const options = {
      src: effectCur.src,
      type: effectCur.type ?? 'sfx',
      relativeVolume: effectCur.relativeVolume ?? DEFAULT_AUDIO_RELATIVE_VOLUME,
      loop: effectCur.loop ?? false,
      playOnLoad: effectCur.playOnLoad ?? false,
      delay: effectCur.delay ?? 0,
      stopBy: effectCur.stopBy ?? 0,
      fadeIn: effectCur.fadeIn ?? false,
      fadeOut: effectCur.fadeOut ?? false,
      waitTillTheEnd: effectCur.waitTillTheEnd ?? false,
      format: effectCur.format,
    };

    return {
      id: effectCur.id,
      type: 'audio',
      slug,
      options,
    };
  });
};

export const toPageAudio = ({ pageId, effects }: PageAudioChange): AuthoredAudioEffect[] => {
  return effects.map((effectCur) => {
    const {
      id,
      slug,
      options,
    } = effectCur;

    const lifetime: AuthoredAudioEffect['lifetime'] = {
      type: 'page',
      page: pageId,
    };

    return {
      ...options,
      id,
      slug,
      lifetime,
    };
  });
};
