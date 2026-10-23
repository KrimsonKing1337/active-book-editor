import type { CSSProperties } from 'react';

export const FILTER_FUNCTIONS = [
  'blur',
  'brightness',
  'contrast',
  'grayscale',
  'hue-rotate',
  'invert',
  'opacity',
  'saturate',
  'sepia',
] as const;

export type FilterFunction = typeof FILTER_FUNCTIONS[number];
export type FilterProperty = 'filter' | 'backdropFilter';

export type FilterOperation = {
  id: string;
  property: FilterProperty;
  function: FilterFunction;
  value: string;
};

export const resolveStyle = (
  style: CSSProperties | undefined,
  operations: FilterOperation[] | undefined,
): CSSProperties => {
  if (!operations) {
    return style ?? {};
  }

  const result = { ...style };

  // A present array is authoritative, even when it is empty.
  delete result.filter;
  delete result.backdropFilter;

  const properties: FilterProperty[] = ['filter', 'backdropFilter'];

  for (const property of properties) {
    const value = operations
      .filter((operation) => operation.property === property)
      .map((operation) => `${operation.function}(${operation.value})`)
      .join(' ');

    if (value) {
      result[property] = value;
    }
  }

  return result;
};
