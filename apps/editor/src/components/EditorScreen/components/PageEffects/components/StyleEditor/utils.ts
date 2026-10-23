import type { CSSProperties } from 'react';

export const getBlurPixels = (backdropFilter: CSSProperties['backdropFilter']): number => {
  const filter = String(backdropFilter ?? '');
  const match = filter.match(/blur\((\d+(?:\.\d+)?)px\)/);

  return match ? Number(match[1]) : 0;
};
