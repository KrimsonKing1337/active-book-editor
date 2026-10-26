export type {
  AudioEffect as AudioEffectDraft,
  AudioOptions,
  EditorEffect as EditorEffectDraft,
  VibrationEffect as VibrationEffectDraft,
  VibrationOptions,
  FlashlightEffect as FlashlightEffectDraft,
  FlashlightOptions,
  BackgroundEffect as BackgroundEffectDraft,
  BackgroundOptions,
  BackgroundEffectKind,
  SideEffect as SideEffectDraft,
  SideOptions,
  SideEffectKind,
} from '@active-book/book-builder/effects';

export type OptionUpdater<T> = <K extends keyof T>(name: K, value: T[K]) => void;
