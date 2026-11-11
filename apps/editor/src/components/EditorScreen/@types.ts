export type BuildState = 'idle' | 'building' | 'success' | 'error';

export type TextBlock =
  | { type: 'paragraph' }
  | { type: 'heading'; attrs: { level: 1 | 2 } };
