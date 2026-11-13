import type { CSSProperties } from 'react';

import type { BookMediaAttributes } from '@active-book/types';

type MediaStyle = CSSProperties & {
  [name: `--book-media-${string}`]: string;
};

export const getMediaStyle = (attrs: BookMediaAttributes): MediaStyle => {
  let width = '100%';
  let height = 'auto';
  let start = '0px';
  let end = 'auto';

  if (attrs.width) {
    width = `${attrs.width.value}${attrs.width.unit}`;
  }

  if (attrs.height) {
    height = `${attrs.height.value}px`;
  }

  if (attrs.align === 'center' || attrs.align === 'right') {
    start = 'auto';
  }

  if (attrs.align === 'right') {
    end = '0px';
  }

  return {
    '--book-media-width': width,
    '--book-media-height': height,
    '--book-media-start': start,
    '--book-media-end': end,
    '--book-media-fit': attrs.fit ?? 'contain',
  };
};

export const contentAssetUrl = (path: string): string => {
  return `./${path.split('/').map(encodeURIComponent).join('/')}`;
};
