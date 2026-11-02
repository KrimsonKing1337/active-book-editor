import type { VisualEffectInstance, VisualEffectLifetime, VisualEffectRegistration } from '@active-book/types';

export type AuthoredVisualLifetime =
  | { type: 'page'; pageId: string }
  | Extract<VisualEffectLifetime, { type: 'range' }>;

export type AuthoredVisualEffect = {
  effect: VisualEffectInstance;
  lifetime: AuthoredVisualLifetime;
  slug: string;
};

export type BuiltVisualEffects = VisualEffectRegistration[];
export type VisualCategory = 'background' | 'frame';
