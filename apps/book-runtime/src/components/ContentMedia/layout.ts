import type { CSSProperties } from 'react';

import type { BookMediaAttributes } from '@active-book/types';

type MediaStyle = CSSProperties & {
  [name: `--book-media-${string}`]: string;
};

export const getMediaStyle = (attrs: BookMediaAttributes): MediaStyle => {
  const {
    width,
    height,
    align,
    fit,
  } = attrs;

  let bookMediaWidth = '100%';
  let bookMediaHeight = 'auto';
  let bookMediaStart = '0px';
  let bookMediaEnd = 'auto';

  const bookMediaFit = fit ?? 'contain';

  if (width) {
    bookMediaWidth = `${width.value}${width.unit}`;
  }

  if (height) {
    bookMediaHeight = `${height.value}px`;
  }

  if (align === 'center' || align === 'right') {
    bookMediaStart = 'auto';
  }

  if (align === 'right') {
    bookMediaEnd = '0px';
  }

  return {
    '--book-media-width': bookMediaWidth,
    '--book-media-height': bookMediaHeight,
    '--book-media-start': bookMediaStart,
    '--book-media-end': bookMediaEnd,
    '--book-media-fit': bookMediaFit,
  };
};

export const contentAssetUrl = (path: string): string => {
  return `./${path.split('/').map(encodeURIComponent).join('/')}`;
};
