import type {
  PageRange,
  VisualEffectInstance,
  VisualEffectRegistration,
} from '@active-book/types';

export type AuthoredVisualLifetime =
  | {
    type: 'page';
    pageId: string
  }
  | {
    type: 'range';
    range: readonly PageRange[];
  };

export type AuthoredVisualEffect = {
  effect: VisualEffectInstance;
  lifetime: AuthoredVisualLifetime;
  slug: string;
};

export type BuiltVisualEffects = VisualEffectRegistration[];
export type VisualCategory = 'background' | 'frame';
