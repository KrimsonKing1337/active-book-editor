import { useCallback, useEffect, useRef, useState } from 'react';

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
  writeEffects: (effects: EditorEffectDraft[]) => void;
};

export const useStylePreviews = ({ editor, writeEffects }: UseStylePreviewsParams) => {
  const [backgroundStylePreviews, setBackgroundStylePreviews] = useState<BackgroundStylePreviews>({});
  const [frameStylePreviews, setFrameStylePreviews] = useState<FrameStylePreviews>({});

  const backgroundStylesRef = useRef<BackgroundStylePreviews>({});
  const frameStylesRef = useRef<FrameStylePreviews>({});
  const sideFrameRef = useRef<number | null>(null);
  const backgroundFrameRef = useRef<number | null>(null);
  const hasUnsavedStylesRef = useRef(false);

  const updateBackgroundStylePreview = useCallback<BackgroundStylePreviewUpdater>((update) => {
    const { style } = update;
    const key = getBackgroundPreviewKey(update);

    backgroundStylesRef.current = {
      ...backgroundStylesRef.current,
      [key]: style,
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
  }, []);

  const updateFrameStylePreview = useCallback((update: FrameStylePreviewUpdate) => {
    const { style } = update;
    const key = getFrameStylePreviewKey(update);

    frameStylesRef.current = {
      ...frameStylesRef.current,
      [key]: style,
    };

    hasUnsavedStylesRef.current = true;

    setHasPendingStyles(true);

    if (sideFrameRef.current !== null) {
      cancelAnimationFrame(sideFrameRef.current);
    }

    sideFrameRef.current = requestAnimationFrame(() => {
      setFrameStylePreviews(frameStylesRef.current);

      sideFrameRef.current = null;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (sideFrameRef.current !== null) {
        cancelAnimationFrame(sideFrameRef.current);
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

    if (sideFrameRef.current !== null) {
      cancelAnimationFrame(sideFrameRef.current);

      sideFrameRef.current = null;
    }

    return true;
  }, [editor, writeEffects]);

  const hasUnsavedStyleChanges = useCallback(() => {
    return hasUnsavedStylesRef.current;
  }, []);

  const markStylesSaved = useCallback(() => {
    hasUnsavedStylesRef.current = false;

    setHasPendingStyles(false);
  }, []);

  return {
    backgroundStylePreviews,
    frameStylePreviews,
    updateBackgroundStylePreview,
    updateFrameStylePreview,
    flushStylePreviews,
    hasUnsavedStyleChanges,
    markStylesSaved,
  };
};
