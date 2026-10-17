import type { AudioEffect, BuiltAudioEffect } from './audio';
import type { BuiltVibrationEffect, VibrationEffect } from './vibration';
import type { BuiltFlashlightEffect, FlashlightEffect } from './flashlight';

export type EditorEffect = AudioEffect | VibrationEffect | FlashlightEffect;

export type PageEffects = {
  [K in EditorEffect['type']]?: Extract<EditorEffect, { type: K }>[];
};

export type BuiltEffect = BuiltAudioEffect | BuiltVibrationEffect | BuiltFlashlightEffect;

export type BuiltPageEffects = {
  [K in BuiltEffect['type']]?: Extract<BuiltEffect, { type: K }>[];
};
