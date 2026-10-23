import type {
  AudioEffectDraft,
  VibrationEffectDraft,
  FlashlightEffectDraft,
  BackgroundEffectDraft,
} from './@types';

import { getBlurFilter } from './components/StyleEditor/utils';
export const createAudioEffect = (): AudioEffectDraft => {
  const options: AudioEffectDraft['options'] = {
    src: '',
    type: 'sfx',
    loop: false,
    playOnLoad: false,
    stopBy: 0,
    delay: 0,
    relativeVolume: 100,
    screamer: false,
    fadeOutWhenUnload: true,
  };

  return {
    id: crypto.randomUUID(),
    type: 'audio',
    slug: 'Новый звук',
    options,
  };
};

export const createVibrationEffect = (): VibrationEffectDraft => {
  const options: VibrationEffectDraft['options'] = {
    duration: 200,
    delay: 0,
    playOnLoad: true,
  };

  return {
    id: crypto.randomUUID(),
    type: 'vibration',
    slug: 'Новая вибрация',
    options,
  };
};

export const createFlashlightEffect = (): FlashlightEffectDraft => {
  const options: FlashlightEffectDraft['options'] = {
    duration: 200,
    delay: 0,
    playOnLoad: true,
    withSideShadow: true,
    speed: 150,
  };

  return {
    id: crypto.randomUUID(),
    type: 'flashlight',
    slug: 'Новая вспышка',
    options,
  };
};

export const createBackgroundEffect = (): BackgroundEffectDraft => {
  const shadowStyle = {
    zIndex: 2,
    backdropFilter: getBlurFilter(10),
  };

  const shadow = {
    show: false,
    style: shadowStyle,
  };

  const style = {
    zIndex: 0,
  };

  const options: BackgroundEffectDraft['options'] = {
    images: [],
    videos: [],
    shadow,
    style,
  };

  return {
    id: crypto.randomUUID(),
    type: 'background',
    slug: 'Новый фон',
    options,
  };
};
