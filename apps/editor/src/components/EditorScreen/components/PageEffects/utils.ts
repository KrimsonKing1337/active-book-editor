import type { VisualDepth, VisualPlacement } from '@active-book/types';

import { DEFAULT_AUDIO_RELATIVE_VOLUME } from '@active-book/core/utils/effects/audio/audioVolume';

import type {
  BackgroundEffectKind,
  FilterOperation,
  FrameEffectKind,
  StyledFrameShadow,
} from '@active-book/book-builder/effects';

import type {
  AudioEffectDraft,
  VibrationEffectDraft,
  FlashlightEffectDraft,
  BackgroundEffectDraft,
  FrameEffectDraft,
} from './@types';

type AudioEffectDraftType = AudioEffectDraft['options']['type'];

type BackgroundDefaults = Pick<BackgroundEffectDraft, 'slug' | 'options'> & {
  order: number;
};

type FrameDefaults = Pick<FrameEffectDraft, 'slug' | 'options'>;

export const createDefaultShadowFilters = (): FilterOperation[] => {
  const id = crypto.randomUUID();

  const blurFilter: FilterOperation = {
    id,
    property: 'backdropFilter',
    function: 'blur',
    value: '10px',
  };

  return [blurFilter];
};

export const createAudioEffect = (type: AudioEffectDraftType = 'sfx'): AudioEffectDraft => {
  const id = crypto.randomUUID();

  const options: AudioEffectDraft['options'] = {
    src: '',
    type,
    loop: false,
    playOnLoad: false,
    stopBy: 0,
    delay: 0,
    relativeVolume: DEFAULT_AUDIO_RELATIVE_VOLUME,
    fadeIn: false,
    fadeOut: true,
    waitTillTheEnd: false,
  };

  return {
    id,
    type: 'audio',
    slug: 'Новый звук',
    options,
  };
};

export const createVibrationEffect = (): VibrationEffectDraft => {
  const id = crypto.randomUUID();

  const options: VibrationEffectDraft['options'] = {
    duration: 200,
    delay: 0,
    playOnLoad: true,
  };

  return {
    id,
    type: 'vibration',
    slug: 'Новая вибрация',
    options,
  };
};

export const createFlashlightEffect = (): FlashlightEffectDraft => {
  const id = crypto.randomUUID();

  const options: FlashlightEffectDraft['options'] = {
    duration: 200,
    delay: 0,
    playOnLoad: true,
    withFrameShadow: true,
    speed: 150,
  };

  return {
    id,
    type: 'flashlight',
    slug: 'Новая вспышка',
    options,
  };
};

const getBackgroundDefaults = (kind: BackgroundEffectKind): BackgroundDefaults => {
  switch (kind) {
    case 'background':
      return {
        slug: 'Новый фон',
        order: 0,
        options: {
          style: {},
        },
      };

    case 'image':
      return {
        slug: 'Новое изображение',
        order: 1,
        options: {
          image: {
            id: crypto.randomUUID(),
            src: '',
            style: {},
          },
        },
      };

    case 'video':
      return {
        slug: 'Новое видео',
        order: 1,
        options: {
          video: {
            id: crypto.randomUUID(),
            src: '',
            style: {},
          },
        },
      };

    case 'shadow': {
      const styleFilters = createDefaultShadowFilters();

      return {
        slug: 'Новое затемнение',
        order: 2,
        options: {
          shadow: {
            show: true,
            style: {},
            styleFilters,
          },
        },
      };
    }

    case 'component':
      return {
        slug: 'Новый фоновый компонент',
        order: 1,
        options: {
          style: {},
        },
      };

    default:
      return {
        slug: 'Новый фон',
        order: 1,
        options: {
          style: {},
        },
      };
  }
};

export const createBackgroundEffect = (kind: BackgroundEffectKind): BackgroundEffectDraft => {
  const id = crypto.randomUUID();

  const {
    slug,
    order,
    options,
  } = getBackgroundDefaults(kind);

  const depth: VisualDepth = {
    plane: 'background',
    order,
  };

  const placement: VisualPlacement = {
    region: 'storyViewport',
  };

  return {
    id,
    type: 'background',
    depth,
    placement,
    kind,
    slug,
    options,
  };
};

const getFrameDefaults = (kind: FrameEffectKind): FrameDefaults => {
  switch (kind) {
    case 'shadow': {
      const shadow: StyledFrameShadow = {
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
      };

      return {
        slug: 'Новая рамочная тень',
        options: {
          shadow,
        },
      };
    }

    case 'text':
      return {
        slug: 'Новый рамочный текст',
        options: {
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
        },
      };

    case 'component':
    default:
      return {
        slug: 'Новый рамочный компонент',
        options: {
          style: {},
        },
      };
  }
};

export const createFrameEffect = (kind: FrameEffectKind): FrameEffectDraft => {
  const id = crypto.randomUUID();
  const { slug, options } = getFrameDefaults(kind);

  const depth: VisualDepth = {
    plane: 'belowNarrative',
    order: 1,
  };

  const placement: VisualPlacement = {
    region: 'storyViewportFrame',
  };

  return {
    id,
    type: 'frame',
    depth,
    placement,
    kind,
    slug,
    options,
  };
};
