import type { BackgroundOptions } from '../../@types';

import { createDefaultShadowFilters } from '../../utils';

export const DEFAULT_SHADOW_STYLE = {
};

export const DEFAULT_SHADOW_OPTIONS: NonNullable<BackgroundOptions['shadow']> = {
  show: false,
  style: DEFAULT_SHADOW_STYLE,
  styleFilters: createDefaultShadowFilters(),
};
