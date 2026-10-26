import type { NumericConfig } from '../NumericControl';

export type AdvancedProperty = 'opacity' | 'borderRadius' | 'objectFit' | 'objectPosition';

export const NUMERIC: Partial<Record<AdvancedProperty, NumericConfig>> = {
  opacity: {
    min: 0,
    max: 1,
    step: 0.01,
    unit: '',
    initial: '1',
  },
  borderRadius: {
    min: 0,
    max: 100,
    step: 1,
    unit: 'px',
    initial: '0',
  },
};

export const PROPERTY_OPTIONS = [
  {
    value: 'opacity',
    label: 'opacity',
  },
  {
    value: 'borderRadius',
    label: 'border-radius',
  },
  {
    value: 'objectFit',
    label: 'object-fit',
  },
  {
    value: 'objectPosition',
    label: 'object-position',
  },
];

export const FIT_OPTIONS = [
  {
    value: 'fill',
    label: 'fill',
  },
  {
    value: 'contain',
    label: 'contain',
  },
  {
    value: 'cover',
    label: 'cover',
  },
  {
    value: 'none',
    label: 'none',
  },
  {
    value: 'scale-down',
    label: 'scale-down',
  },
];

export const X_OPTIONS = ['left', 'center', 'right'].map((cur) => ({
  value: cur,
  label: cur,
}));

export const Y_OPTIONS = ['top', 'center', 'bottom'].map((cur) => ({
  value: cur,
  label: cur,
}));

