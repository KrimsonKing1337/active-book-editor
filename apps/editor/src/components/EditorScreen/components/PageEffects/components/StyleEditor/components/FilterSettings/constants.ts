import type { FilterFunction } from '@active-book/book-builder/effects';

import { FILTER_FUNCTIONS } from '@active-book/book-builder/effects';

import type { NumericConfig } from '../NumericControl';

export const CONFIG: Record<FilterFunction, NumericConfig> = {
  blur: {
    min: 0,
    max: 50,
    step: 1,
    unit: 'px',
    initial: '0',
  },
  brightness: {
    min: 0,
    max: 300,
    step: 1,
    unit: '%',
    initial: '100',
  },
  contrast: {
    min: 0,
    max: 300,
    step: 1,
    unit: '%',
    initial: '100',
  },
  grayscale: {
    min: 0,
    max: 100,
    step: 1,
    unit: '%',
    initial: '0',
  },
  'hue-rotate': {
    min: -360,
    max: 360,
    step: 1,
    unit: 'deg',
    initial: '0',
  },
  invert: {
    min: 0,
    max: 100,
    step: 1,
    unit: '%',
    initial: '0',
  },
  opacity: {
    min: 0,
    max: 100,
    step: 1,
    unit: '%',
    initial: '100',
  },
  saturate: {
    min: 0,
    max: 300,
    step: 1,
    unit: '%',
    initial: '100',
  },
  sepia: {
    min: 0,
    max: 100,
    step: 1,
    unit: '%',
    initial: '0',
  },
};

export const PROPERTY_OPTIONS = [
  {
    value: 'filter',
    label: 'filter',
  },
  {
    value: 'backdropFilter',
    label: 'backdrop-filter',
  },
];

export const FUNCTION_OPTIONS = FILTER_FUNCTIONS.map((filterCur) => {
  return {
    value: filterCur,
    label: filterCur,
  };
});

