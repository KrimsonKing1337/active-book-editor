import type { VisualEffectInstance } from '@active-book/types';

import type { VisualDisplayRegion } from '../effects';

/** Recognize a fill without rounding or rewriting any authored coordinates. */
export const getDisplayRegion = ({ placement, visibility }: VisualEffectInstance): VisualDisplayRegion => {
  const region = placement.coordinates;

  if (region !== 'storyViewport' && region !== 'narrativeFrame') {
    return 'custom';
  }

  const fillsRegion = placement.anchor.region === region
    && placement.anchor.point === 'top-left'
    && placement.origin === 'top-left'
    && placement.offset.x.value === 0
    && placement.offset.y.value === 0
    && placement.size.width.value === 100
    && placement.size.width.unit === '%'
    && placement.size.height.value === 100
    && placement.size.height.unit === '%';

  const matchesVisibility = visibility.region === region || visibility.region === 'frame';

  return fillsRegion && matchesVisibility ? region : 'custom';
};
