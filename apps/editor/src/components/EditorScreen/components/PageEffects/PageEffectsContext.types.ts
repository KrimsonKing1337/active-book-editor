import type { CSSProperties } from 'react';

import type { EditorEffectDraft } from './@types';

export type AudioPreviewStatus = {
  state: 'empty' | 'loading' | 'ready' | 'error';
  error?: string;
};

export type SideItemPreview = {
  playState?: 'running' | 'paused' | 'stopped';
  hidden?: boolean;
};

export type SideItemPreviews = Record<string, SideItemPreview>;
export type SideStylePreviews = Record<string, CSSProperties>;
export type BackgroundStylePreviews = Record<string, CSSProperties>;

export type BackgroundPreviewLayer = 'background' | 'shadow' | 'image' | 'video';
export type SidePreviewKind = 'shadow' | 'text' | 'component';

export type SideStylePreviewKeyParams = {
  effectId: string;
  kind: SidePreviewKind;
  itemId: string;
};

export type SideStylePreviewUpdate = SideStylePreviewKeyParams & {
  style: CSSProperties;
};

export type SideItemPreviewUpdate = {
  effectId: string;
  itemId: string;
  changes: Partial<SideItemPreview>;
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
  sideItemPreviews: SideItemPreviews;
  sideStylePreviews: SideStylePreviews;
  updateSideStylePreview: (update: SideStylePreviewUpdate) => void;
  updateSideItemPreview: (update: SideItemPreviewUpdate) => void;
};
