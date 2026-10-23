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
  const result = { ...style };
  delete result.filter;
  delete result.backdropFilter;

  const properties: FilterProperty[] = ['filter', 'backdropFilter'];
  const filterOperations = operations ?? [];

  for (const propertyCur of properties) {
    const filterValue = filterOperations
      .filter((cur) => cur.property === propertyCur)
      .map((cur) => `${cur.function}(${cur.value})`)
      .join(' ');

    if (filterValue) {
      result[propertyCur] = filterValue;
    }
  }

  return result;
};
