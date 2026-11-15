import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import type { Editor } from '@tiptap/core';

import { markStylePreviewsCommitted, setHasPendingStyles } from '@project/pendingOperations';

import type { EditorEffectDraft } from '../../@types';

import type {
  BackgroundStylePreviewUpdater,
  BackgroundStylePreviews,
  FrameStylePreviewUpdate,
  FrameStylePreviews,
} from '../@types';

import {
  applyPendingStylePreviews,
  getBackgroundPreviewKey,
  getPageEffects,
  getFrameStylePreviewKey,
} from '../utils';

type UseStylePreviewsParams = {
  editor: Editor | null;
  pageId: string;
  writeEffects: (effects: EditorEffectDraft[]) => void;
};

export const useStylePreviews = ({
  editor,
  pageId,
  writeEffects,
}: UseStylePreviewsParams) => {
  const [backgroundStylePreviews, setBackgroundStylePreviews] = useState<BackgroundStylePreviews>({});
  const [frameStylePreviews, setFrameStylePreviews] = useState<FrameStylePreviews>({});

  const backgroundStylesRef = useRef<BackgroundStylePreviews>({});
  const frameStylesRef = useRef<FrameStylePreviews>({});
  const framePreviewRafRef = useRef<number | null>(null);
  const backgroundFrameRef = useRef<number | null>(null);
  const hasUnsavedStylesRef = useRef(false);
  const previewPageRef = useRef(pageId);

  useEffect(() => {
    previewPageRef.current = pageId;
    backgroundStylesRef.current = {};
    frameStylesRef.current = {};
    hasUnsavedStylesRef.current = false;

    setBackgroundStylePreviews({});
    setFrameStylePreviews({});
    setHasPendingStyles(false);
  }, [pageId]);

  const updateBackgroundStylePreview = useCallback<BackgroundStylePreviewUpdater>((update) => {
    if (previewPageRef.current !== pageId) {
      return;
    }

    const key = getBackgroundPreviewKey(update);

    backgroundStylesRef.current = {
      ...backgroundStylesRef.current,
      [key]: update.style,
    };

    hasUnsavedStylesRef.current = true;

    setHasPendingStyles(true);

    if (backgroundFrameRef.current !== null) {
      cancelAnimationFrame(backgroundFrameRef.current);
    }

    backgroundFrameRef.current = requestAnimationFrame(() => {
      setBackgroundStylePreviews(backgroundStylesRef.current);

      backgroundFrameRef.current = null;
    });
  }, [pageId]);

  const updateFrameStylePreview = useCallback((update: FrameStylePreviewUpdate) => {
    if (previewPageRef.current !== pageId) {
      return;
    }

    const key = getFrameStylePreviewKey(update);

    frameStylesRef.current = {
      ...frameStylesRef.current,
      [key]: update.style,
    };

    hasUnsavedStylesRef.current = true;

    setHasPendingStyles(true);

    if (framePreviewRafRef.current !== null) {
      cancelAnimationFrame(framePreviewRafRef.current);
    }

    framePreviewRafRef.current = requestAnimationFrame(() => {
      setFrameStylePreviews(frameStylesRef.current);

      framePreviewRafRef.current = null;
    });
  }, [pageId]);

  useEffect(() => {
    return () => {
      if (framePreviewRafRef.current !== null) {
        cancelAnimationFrame(framePreviewRafRef.current);
      }

      if (backgroundFrameRef.current !== null) {
        cancelAnimationFrame(backgroundFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      setHasPendingStyles(false);
    };
  }, []);

  const flushStylePreviews = useCallback((): boolean => {
    const pending = backgroundStylesRef.current;
    const pendingFrame = frameStylesRef.current;

    if (Object.keys(pending).length === 0 && Object.keys(pendingFrame).length === 0) {
      return true;
    }

    if (!editor || editor.isDestroyed) {
      return false;
    }

    const nextEffects = applyPendingStylePreviews({
      effects: getPageEffects(editor),
      backgroundPreviews: pending,
      framePreviews: pendingFrame,
    });

    try {
      writeEffects(nextEffects);
    } catch (error) {
      console.error('[background] Failed to commit style changes', error);

      return false;
    }

    backgroundStylesRef.current = {};
    frameStylesRef.current = {};

    setBackgroundStylePreviews({});
    setFrameStylePreviews({});
    markStylePreviewsCommitted();

    if (backgroundFrameRef.current !== null) {
      cancelAnimationFrame(backgroundFrameRef.current);

      backgroundFrameRef.current = null;
    }

    if (framePreviewRafRef.current !== null) {
      cancelAnimationFrame(framePreviewRafRef.current);

      framePreviewRafRef.current = null;
    }

    return true;
  }, [editor, writeEffects]);

  const hasUnsavedStyleChanges = useCallback(() => {
    return hasUnsavedStylesRef.current;
  }, []);

  const markStylesSaved = useCallback(() => {
    if (previewPageRef.current !== pageId) {
      return;
    }

    hasUnsavedStylesRef.current = false;

    setHasPendingStyles(false);
  }, [pageId]);

  const currentBackgroundStylePreviews = previewPageRef.current === pageId ? backgroundStylePreviews : {};
  const currentFrameStylePreviews = previewPageRef.current === pageId ? frameStylePreviews : {};

  return {
    backgroundStylePreviews: currentBackgroundStylePreviews,
    frameStylePreviews: currentFrameStylePreviews,
    updateBackgroundStylePreview,
    updateFrameStylePreview,
    flushStylePreviews,
    hasUnsavedStyleChanges,
    markStylesSaved,
  };
};
