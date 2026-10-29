import { type PropsWithChildren, useMemo } from 'react';

import type { Editor } from '@tiptap/core';

import {
  usePageEffectsState,
  useFrameItemPreviews,
  useStylePreviews,
} from './hooks';

import {
  BackgroundStylePreviewUpdaterContext,
  BackgroundStylePreviewsContext,
  PageEffectsContext,
} from './contexts';

type PageEffectsProviderProps = PropsWithChildren & {
  editor: Editor | null;
};

export const PageEffectsProvider = ({ children, editor }: PageEffectsProviderProps) => {
  const {
    effects,
    writeEffects,
    getCurrentEffects,
    audioPreviewStatuses,
    setAudioPreviewStatus,
  } = usePageEffectsState(editor);

  const {
    backgroundStylePreviews,
    frameStylePreviews,
    updateBackgroundStylePreview,
    updateFrameStylePreview,
    flushStylePreviews,
    hasUnsavedStyleChanges,
    markStylesSaved,
  } = useStylePreviews({
    editor,
    writeEffects,
  });

  const {
    frameItemPreviews,
    updateFrameItemPreview,
  } = useFrameItemPreviews();

  const value = useMemo(() => ({
    effects,
    writeEffects,
    getCurrentEffects,
    audioPreviewStatuses,
    setAudioPreviewStatus,
    flushStylePreviews,
    hasUnsavedStyleChanges,
    markStylesSaved,
    frameItemPreviews,
    frameStylePreviews,
    updateFrameItemPreview,
    updateFrameStylePreview,
  }), [
    effects,
    writeEffects,
    getCurrentEffects,
    audioPreviewStatuses,
    setAudioPreviewStatus,
    flushStylePreviews,
    hasUnsavedStyleChanges,
    markStylesSaved,
    frameItemPreviews,
    frameStylePreviews,
    updateFrameItemPreview,
    updateFrameStylePreview,
  ]);

  return (
    <PageEffectsContext.Provider value={value}>
      <BackgroundStylePreviewUpdaterContext.Provider value={updateBackgroundStylePreview}>
        <BackgroundStylePreviewsContext.Provider value={backgroundStylePreviews}>
          {children}
        </BackgroundStylePreviewsContext.Provider>
      </BackgroundStylePreviewUpdaterContext.Provider>
    </PageEffectsContext.Provider>
  );
};
