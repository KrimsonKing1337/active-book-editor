import type { FrameSide } from 'activeBook-core/hooks/effects/frame/@types';

import {
  type FrameShadowPreset,
  FRAME_SHADOW_PRESETS,
} from 'activeBook-core/components/FrameEffects/components/FrameShadow/presets';

import type { FrameOptions } from '@active-book/book-builder/effects';

type ShadowItem = NonNullable<FrameOptions['shadow']>;

type PositionOption = {
  value: NonNullable<ShadowItem['position']>;
  label: string;
};

export const positions: PositionOption[] = [
  {
    value: 'top-left',
    label: 'Сверху слева',
  },
  {
    value: 'top',
    label: 'Сверху',
  },
  {
    value: 'top-right',
    label: 'Сверху справа',
  },
  {
    value: 'left',
    label: 'Слева',
  },
  {
    value: 'center',
    label: 'По центру',
  },
  {
    value: 'right',
    label: 'Справа',
  },
  {
    value: 'bottom-left',
    label: 'Снизу слева',
  },
  {
    value: 'bottom',
    label: 'Снизу',
  },
  {
    value: 'bottom-right',
    label: 'Снизу справа',
  },
];

type FrameSides = {
  value: FrameSide;
  label: string;
};

export const frameSides: FrameSides[] = [
  {
    value: 'top',
    label: 'Сверху',
  },
  {
    value: 'right',
    label: 'Справа',
  },
  {
    value: 'bottom',
    label: 'Снизу',
  },
  {
    value: 'left',
    label: 'Слева',
  },
];

export const shadowPresets: FrameShadowPreset[] = [...FRAME_SHADOW_PRESETS];

export const textPresets = [
  {
    value: 'scroll' as const,
    label: 'Прокрутка',
  },
  {
    value: 'none' as const,
    label: 'Без анимации',
  },
];
