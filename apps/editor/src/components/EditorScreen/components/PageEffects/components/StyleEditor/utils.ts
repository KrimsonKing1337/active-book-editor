import type { CSSProperties } from 'react';

export const getBlurPixels = (backdropFilter: CSSProperties['backdropFilter']): number => {
  const filter = String(backdropFilter ?? '');
  const match = filter.match(/blur\((\d+(?:\.\d+)?)px\)/);

  return match ? Number(match[1]) : 0;
};

export const getBlurFilter = (blur: number): string | undefined => {
  return blur ? `blur(${blur}px)` : undefined;
};

export const removeLeadingZeros = (value: string): string => {
  return value.replace(/^(-?)0+(?=\d)/, '$1');
};

export const normalizePropertyName = (name: string): string => {
  const trimmed = name.trim();

  if (trimmed.startsWith('--')) {
    return trimmed;
  }

  const replaceFunc = (_full: string, letter: string) => letter.toUpperCase();

  return trimmed.replace(/-([a-z])/g, replaceFunc);
};

export const isValidCssRule = (property: string, value: string): boolean => {
  const isCustomProperty = /^--[\w-]+$/.test(property);
  const isRegularProperty = /^[a-zA-Z][\w-]*$/.test(property);

  if (!isCustomProperty && !isRegularProperty) {
    return false;
  }

  const replaceFunc = (letter: string) => '-' + letter.toLowerCase();

  const cssProperty = property.replace(/[A-Z]/g, replaceFunc);

  try {
    return CSS.supports(cssProperty, value);
  } catch {
    return false;
  }
};
