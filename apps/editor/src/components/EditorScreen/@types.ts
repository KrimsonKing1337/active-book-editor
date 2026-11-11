export type BuildState = 'idle' | 'building' | 'success' | 'error';

export type TextBlockAttrs = {
  level: 1 | 2;
};

export type TextBlock =
  | { type: 'paragraph' }
  | { type: 'heading'; attrs: TextBlockAttrs };
