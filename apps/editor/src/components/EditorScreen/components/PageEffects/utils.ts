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
    style: {},
  };

  if (kind === 'image') {
    slug = 'Новое изображение';
    options = {
      image: {
        id: crypto.randomUUID(),
        src: '',
        style: {},
      },
    };
  } else if (kind === 'video') {
    slug = 'Новое видео';
    options = {
      video: {
        id: crypto.randomUUID(),
        src: '',
        style: {},
      },
    };
  } else if (kind === 'shadow') {
    slug = 'Новое затемнение';
    options = {
      shadow: {
        show: true,
        style: {},
        styleFilters: createDefaultShadowFilters(),
      },
    };
  } else if (kind === 'component') {
    slug = 'Новый фоновый компонент';
    options = {
      style: {},
    };
  }

  let order = 1;
  if (kind === 'shadow') {
    order = 2;
  }
  else if (kind === 'background') {
    order = 0;
  }

  return {
    id,
    type: 'background',
    depth: {
      plane: 'background',
      order,
    },
    placement: { region: 'storyViewport' },
    kind,
    slug,
    options,
  };
};

export const createFrameEffect = (kind: FrameEffectKind): FrameEffectDraft => {
  const id = crypto.randomUUID();

  let slug = 'Новый рамочный компонент';
  let options: FrameEffectDraft['options'] = {
    style: {},
  };

  if (kind === 'shadow') {
    slug = 'Новая рамочная тень';
    options = {
      shadow: {
        id: crypto.randomUUID(),
        sides: ['left', 'right'],
        position: 'top-left',
        style: {
          color: '#ff0000',
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
      style: {},

    };
  } else if (kind === 'text') {
    slug = 'Новый рамочный текст';
    options = {
      text: {
        id: crypto.randomUUID(),
        leftText: 'Левая сторона',
        rightText: 'Правая сторона',
        style: {
          color: '#a3a3a3',
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
    depth: {
      plane: 'belowNarrative',
      order: 1,
    },
    placement: { region: 'storyViewportFrame' },
    kind,
    slug,
    options,
  };
};
