import type { AudioEffect, BuiltAudioEffect } from './audio';
import type { BuiltVibrationEffect, VibrationEffect } from './vibration';
import type { BuiltFlashlightEffect, FlashlightEffect } from './flashlight';
import type { BackgroundEffect, BuiltBackgroundEffect } from './background';

export type EditorEffect = AudioEffect | VibrationEffect | FlashlightEffect | BackgroundEffect;

export type PageEffects = {
  [K in EditorEffect['type']]?: Extract<EditorEffect, { type: K }>[];
};

export type BuiltEffect = BuiltAudioEffect | BuiltVibrationEffect | BuiltFlashlightEffect | BuiltBackgroundEffect;

export type BuiltPageEffects = {
  [K in BuiltEffect['type']]?: Extract<BuiltEffect, { type: K }>[];
};
