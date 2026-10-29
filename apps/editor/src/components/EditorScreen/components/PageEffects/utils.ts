import type {
  BackgroundEffectKind,
  FilterOperation,
  FrameEffectKind,
} from '@active-book/book-builder/effects';

import type {
  AudioEffectDraft,
  VibrationEffectDraft,
  FlashlightEffectDraft,
  BackgroundEffectDraft,
  FrameEffectDraft,
} from './@types';

export const createDefaultShadowFilters = (): FilterOperation[] => {
  const blurFilter: FilterOperation = {
    id: crypto.randomUUID(),
    property: 'backdropFilter',
    function: 'blur',
    value: '10px',
  };

  return [blurFilter];
};

export const createAudioEffect = (type: AudioEffectDraft['options']['type'] = 'sfx'): AudioEffectDraft => {
  const options: AudioEffectDraft['options'] = {
    src: '',
    type,
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
    withFrameShadow: true,
    speed: 150,
  };

  return {
    id: crypto.randomUUID(),
    type: 'flashlight',
    slug: 'Новая вспышка',
    options,
  };
};

export const createBackgroundEffect = (kind: BackgroundEffectKind): BackgroundEffectDraft => {
  const id = crypto.randomUUID();

  let slug = 'Новый фон';
  let options: BackgroundEffectDraft['options'] = {
    style: { zIndex: 0 },
  };

  if (kind === 'image') {
    slug = 'Новое изображение';
    options = {
      image: {
        id: crypto.randomUUID(),
        src: '',
        style: { zIndex: 1 },
      },
    };
  } else if (kind === 'video') {
    slug = 'Новое видео';
    options = {
      video: {
        id: crypto.randomUUID(),
        src: '',
        style: { zIndex: 1 },
      },
    };
  } else if (kind === 'shadow') {
    slug = 'Новое затемнение';
    options = {
      shadow: {
        show: true,
        style: { zIndex: 2 },
        styleFilters: createDefaultShadowFilters(),
      },
    };
  } else if (kind === 'component') {
    slug = 'Новый фоновый компонент';
    options = {
      style: { zIndex: 1 },
    };
  }

  return {
    id,
    type: 'background',
    kind,
    slug,
    options,
  };
};

export const createFrameEffect = (kind: FrameEffectKind): FrameEffectDraft => {
  const id = crypto.randomUUID();

  let slug = 'Новый боковой компонент';
  let options: FrameEffectDraft['options'] = {
    style: { zIndex: 1 },
  };

  if (kind === 'shadow') {
    slug = 'Новая боковая тень';
    options = {
      shadow: {
        id: crypto.randomUUID(),
        sides: ['left', 'right'],
        position: 'top-left',
        style: {
          color: '#ff0000',
          zIndex: 1,
        },
        thickness: 30,
        animation: {
          preset: 'none',
          duration: 1000,
          iterations: 'infinite',
        },
      },
    };
  } else if (kind === 'component') {
    options = {
      style: { zIndex: 1 },
      frameMask: {
        enabled: false,
        sides: ['top', 'right', 'bottom', 'left'],
      },
    };
  } else if (kind === 'text') {
    slug = 'Новый боковой текст';
    options = {
      text: {
        id: crypto.randomUUID(),
        leftText: 'Левая сторона',
        rightText: 'Правая сторона',
        style: {
          color: '#a3a3a3',
          zIndex: 1,
          fontSize: '12px',
        },
        animation: {
          preset: 'scroll',
          duration: 60000,
          iterations: 'infinite',
        },
      },
    };
  }

  return {
    id,
    type: 'frame',
    kind,
    slug,
    options: {
      ...options,
      layer: 'behind',
    },
  };
};
