
import type { FrameSide } from 'activeBook-core/hooks/effects/side/@types';
import type { SideShadowPreset } from 'activeBook-core/components/SideEffects/components/SideShadow/presets';

import { SIDE_SHADOW_PRESETS } from 'activeBook-core/components/SideEffects/components/SideShadow/presets';

import type { SideOptions } from '@active-book/book-builder/effects';

type ShadowItem = NonNullable<SideOptions['shadow']>;

type PositionOption = {
  value: NonNullable<ShadowItem['position']>;
  label: string;
};

export const positions: PositionOption[] = [
  { value: 'top-left', label: 'Сверху слева' },
  { value: 'top', label: 'Сверху' },
  { value: 'top-right', label: 'Сверху справа' },
  { value: 'left', label: 'Слева' },
  { value: 'center', label: 'По центру' },
  { value: 'right', label: 'Справа' },
  { value: 'bottom-left', label: 'Снизу слева' },
  { value: 'bottom', label: 'Снизу' },
  { value: 'bottom-right', label: 'Снизу справа' },
];

export const frameSides: { value: FrameSide; label: string }[] = [
  { value: 'top', label: 'Сверху' },
  { value: 'right', label: 'Справа' },
  { value: 'bottom', label: 'Снизу' },
  { value: 'left', label: 'Слева' },
];

export const shadowPresets: SideShadowPreset[] = [...SIDE_SHADOW_PRESETS];

export const textPresets = [
  { value: 'scroll' as const, label: 'Прокрутка' },
  { value: 'none' as const, label: 'Без анимации' },
];
