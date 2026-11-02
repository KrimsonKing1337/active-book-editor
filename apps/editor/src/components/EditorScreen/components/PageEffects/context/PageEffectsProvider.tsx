import { type PropsWithChildren, useLayoutEffect, useMemo } from 'react';

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
  pageId?: string;
  ownerPageId?: string;
  onStylesFlusher?: (flush: (() => boolean) | null) => void;
};

export const PageEffectsProvider = ({
  children,
  editor,
  pageId = 'page',
  ownerPageId = pageId,
  onStylesFlusher,
}: PageEffectsProviderProps) => {
  const {
    effects,
    writeEffects,
    getCurrentEffects,
    audioPreviewStatuses,
    setAudioPreviewStatus,
  } = usePageEffectsState({ editor, pageId, ownerPageId });

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
    pageId,
    writeEffects,
  });

  const {
    frameItemPreviews,
    updateFrameItemPreview,
  } = useFrameItemPreviews(pageId);

  useLayoutEffect(() => {
    onStylesFlusher?.(flushStylePreviews);

    return () => onStylesFlusher?.(null);
  }, [flushStylePreviews, onStylesFlusher]);

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
