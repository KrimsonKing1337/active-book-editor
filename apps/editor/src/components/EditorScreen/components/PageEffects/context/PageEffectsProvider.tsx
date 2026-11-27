import type { PropsWithChildren } from 'react';

import {
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';

import type { Editor } from '@tiptap/core';

import type { PageAudioAccess } from '../../../book/pageAudio';

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

type StylesFlusher = (() => boolean) | null;

type PageEffectsProviderProps = PropsWithChildren & {
  editor: Editor | null;
  pageId?: string;
  ownerPageId?: string;
  pageAudio?: PageAudioAccess;
  onStylesFlusher?: (flush: StylesFlusher) => void;
};

export const PageEffectsProvider = ({
  children,
  editor,
  pageId = 'page',
  ownerPageId = pageId,
  pageAudio,
  onStylesFlusher,
}: PageEffectsProviderProps) => {
  const [selectedVisualEffectId, setSelectedVisualEffectId] = useState<string | null>(null);

  const bookAudioIds = pageAudio?.ids;

  const {
    effects,
    writeEffects,
    getCurrentEffects,
    audioPreviewStatuses,
    setAudioPreviewStatus,
  } = usePageEffectsState({
    editor,
    pageId,
    ownerPageId,
    pageAudio,
  });

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

  const { frameItemPreviews, updateFrameItemPreview } = useFrameItemPreviews(pageId);

  useLayoutEffect(() => {
    onStylesFlusher?.(flushStylePreviews);

    return () => {
      return onStylesFlusher?.(null);
    };
  }, [flushStylePreviews, onStylesFlusher]);

  const value = useMemo(() => ({
    selectedVisualEffectId,
    setSelectedVisualEffectId,
    effects,
    writeEffects,
    getCurrentEffects,
    bookAudioIds,
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
    selectedVisualEffectId,
    effects,
    writeEffects,
    getCurrentEffects,
    bookAudioIds,
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
