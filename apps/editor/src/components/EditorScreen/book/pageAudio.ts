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
  return effect.lifetime.type === 'page' && effect.lifetime.page === pageId;
};

export const getPageAudio = (audioEffects: readonly AuthoredAudioEffect[], pageId: string): AudioDraft[] => {
  const authored = audioEffects.filter((effect) => belongsToPage(effect, pageId));

  return authored.map((effect) => ({
    id: effect.id,
    type: 'audio',
    slug: effect.slug ?? 'Новый звук',
    options: {
      src: effect.src,
      type: effect.type ?? 'sfx',
      relativeVolume: effect.relativeVolume ?? 100,
      loop: effect.loop ?? false,
      playOnLoad: effect.playOnLoad ?? false,
      delay: effect.delay ?? 0,
      stopBy: effect.stopBy ?? 0,
      fadeIn: effect.fadeIn ?? false,
      fadeOut: effect.fadeOut ?? false,
      waitTillTheEnd: effect.waitTillTheEnd ?? false,
      screamer: effect.screamer ?? false,
      format: effect.format,
    },
  }));
};

export const toPageAudio = ({ pageId, effects }: PageAudioChange): AuthoredAudioEffect[] => {
  return effects.map(({
    id,
    slug,
    options,
  }) => ({
    ...options,
    id,
    slug,
    lifetime: { type: 'page', page: pageId },
  }));
};
