import type { CSSProperties } from 'react';

import type { EditorEffectDraft } from '../@types';

export type AudioPreviewStatus = {
  state: 'empty' | 'loading' | 'ready' | 'error';
  error?: string;
};

export type FrameItemPreview = {
  playState?: 'running' | 'paused' | 'stopped';
  hidden?: boolean;
};

export type FrameItemPreviews = Record<string, FrameItemPreview>;
export type FrameStylePreviews = Record<string, CSSProperties>;
export type BackgroundStylePreviews = Record<string, CSSProperties>;

export type BackgroundPreviewLayer = 'background' | 'shadow' | 'image' | 'video';
export type FramePreviewKind = 'shadow' | 'text' | 'component';

export type FrameStylePreviewKeyParams = {
  effectId: string;
  kind: FramePreviewKind;
  itemId: string;
};

export type FrameStylePreviewUpdate = FrameStylePreviewKeyParams & {
  style: CSSProperties;
};

export type FrameItemPreviewUpdate = {
  effectId: string;
  itemId: string;
  changes: Partial<FrameItemPreview>;
};

export type BackgroundPreviewKeyParams = {
  effectId: string;
  layer: BackgroundPreviewLayer;
  mediaId?: string | null;
};

export type BackgroundStylePreviewUpdate = BackgroundPreviewKeyParams & {
  style: CSSProperties;
};

export type BackgroundStylePreviewUpdater = (update: BackgroundStylePreviewUpdate) => void;

export type PageEffectsContextValue = {
  effects: EditorEffectDraft[];
  writeEffects: (effects: EditorEffectDraft[]) => void;
  getCurrentEffects: () => EditorEffectDraft[];
  audioPreviewStatuses: Record<string, AudioPreviewStatus>;
  setAudioPreviewStatus: (id: string, status: AudioPreviewStatus | null) => void;
  flushStylePreviews: () => boolean;
  hasUnsavedStyleChanges: () => boolean;
  markStylesSaved: () => void;
  frameItemPreviews: FrameItemPreviews;
  frameStylePreviews: FrameStylePreviews;
  updateFrameStylePreview: (update: FrameStylePreviewUpdate) => void;
  updateFrameItemPreview: (update: FrameItemPreviewUpdate) => void;
};
