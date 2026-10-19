import type { AudioEffectDraft, VibrationEffectDraft, FlashlightEffectDraft } from './@types';

export const createAudioEffect = (): AudioEffectDraft => {
  return {
    id: crypto.randomUUID(),
    type: 'audio',
    slug: 'Новый звук',
    options: {
      src: '',
      type: 'sfx',
      loop: false,
      playOnLoad: false,
      stopBy: 0,
      delay: 0,
      relativeVolume: 100,
      screamer: false,
      fadeOutWhenUnload: true,
    },
  };
};

export const createVibrationEffect = (): VibrationEffectDraft => {
  return {
    id: crypto.randomUUID(),
    type: 'vibration',
    slug: 'Новая вибрация',
    options: {
      duration: 200,
      delay: 0,
      playOnLoad: true,
    },
  };
};

export const createFlashlightEffect = (): FlashlightEffectDraft => {
  return {
    id: crypto.randomUUID(),
    type: 'flashlight',
    slug: 'Новая вспышка',
    options: {
      duration: 200,
      delay: 0,
      playOnLoad: true,
      withSideShadow: true,
      speed: 150,
    },
  };
};
