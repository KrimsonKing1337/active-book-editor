import type { SideOptions } from '@active-book/book-builder/effects';

import { SIDE_SHADOW_PRESETS } from 'activeBook-core/components/SideEffects/components/SideShadow/presets';

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

export const shadowPresets = [...SIDE_SHADOW_PRESETS];

export const textPresets = [
  { value: 'scroll' as const, label: 'Прокрутка' },
  { value: 'none' as const, label: 'Без анимации' },
];
