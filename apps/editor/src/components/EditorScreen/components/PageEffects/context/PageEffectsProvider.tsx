import { type PropsWithChildren, useMemo } from 'react';

import type { Editor } from '@tiptap/core';

import {
  usePageEffectsState,
  useSideItemPreviews,
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
    sideStylePreviews,
    updateBackgroundStylePreview,
    updateSideStylePreview,
    flushStylePreviews,
    hasUnsavedStyleChanges,
    markStylesSaved,
  } = useStylePreviews({
    editor,
    writeEffects,
  });

  const {
    sideItemPreviews,
    updateSideItemPreview,
  } = useSideItemPreviews();

  const value = useMemo(() => ({
    effects,
    writeEffects,
    getCurrentEffects,
    audioPreviewStatuses,
    setAudioPreviewStatus,
    flushStylePreviews,
    hasUnsavedStyleChanges,
    markStylesSaved,
    sideItemPreviews,
    sideStylePreviews,
    updateSideItemPreview,
    updateSideStylePreview,
  }), [
    effects,
    writeEffects,
    getCurrentEffects,
    audioPreviewStatuses,
    setAudioPreviewStatus,
    flushStylePreviews,
    hasUnsavedStyleChanges,
    markStylesSaved,
    sideItemPreviews,
    sideStylePreviews,
    updateSideItemPreview,
    updateSideStylePreview,
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
