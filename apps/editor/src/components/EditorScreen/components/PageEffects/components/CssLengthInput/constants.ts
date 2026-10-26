export const units = ['px', '%', 'rem', 'em', 'vw', 'vh'] as const;

export type Unit = typeof units[number];

const replacement = {
  n: /[0-9.-]/,
};

export const maskOptions = {
  mask: 'nnnnnnnn',
  replacement,
};
