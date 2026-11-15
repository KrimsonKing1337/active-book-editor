import type {
  VisualDepth,
  VisualPlacement,
  VisualVisibility,
} from '@active-book/types';

import type { AudioEffect, BuiltAudioEffect } from './audio';
import type { BuiltVibrationEffect, VibrationEffect } from './vibration';
import type { BuiltFlashlightEffect, FlashlightEffect } from './flashlight';
import type { BackgroundEffect, BuiltBackgroundEffect } from './background';
import type { FrameEffect, BuiltFrameEffect } from './frame';

export type VisualLayout = {
  placement?: VisualPlacement;
  depth?: VisualDepth;
  visibility?: VisualVisibility;
};

export type EditorEffect =
  | AudioEffect
  | VibrationEffect
  | FlashlightEffect
  | BackgroundEffect
  | FrameEffect;

export type PageEffects = {
  [K in EditorEffect['type']]?: Extract<EditorEffect, {
    type: K
  }>[];
};

export type BuiltEffect =
  | BuiltAudioEffect
  | BuiltVibrationEffect
  | BuiltFlashlightEffect
  | BuiltBackgroundEffect
  | BuiltFrameEffect;

export type BuiltPageEffects = {
  [K in BuiltEffect['type']]?: Extract<BuiltEffect, {
    type: K
  }>[];
};
