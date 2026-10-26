import type { Editor } from '@tiptap/core';

import type { EditorEffectDraft } from '../@types';

import type {
  BackgroundStylePreviewUpdater,
  BackgroundStylePreviews,
  SideStylePreviewUpdate,
  SideStylePreviews,
} from './@types';

import { useCallback, useEffect, useRef, useState } from 'react';

import { markStylePreviewsCommitted, setHasPendingStyles } from '@project/pendingOperations';

import {
  applyPendingStylePreviews,
  getBackgroundPreviewKey,
  getPageEffects,
  getSideStylePreviewKey,
} from './utils';

type UseStylePreviewsParams = {
  editor: Editor | null;
  writeEffects: (effects: EditorEffectDraft[]) => void;
};

export const useStylePreviews = ({ editor, writeEffects }: UseStylePreviewsParams) => {
  const [backgroundStylePreviews, setBackgroundStylePreviews] = useState<BackgroundStylePreviews>({});
  const [sideStylePreviews, setSideStylePreviews] = useState<SideStylePreviews>({});

  const backgroundStylesRef = useRef<BackgroundStylePreviews>({});
  const sideStylesRef = useRef<SideStylePreviews>({});
  const sideFrameRef = useRef<number | null>(null);
  const backgroundFrameRef = useRef<number | null>(null);
  const hasUnsavedStylesRef = useRef(false);

  const updateBackgroundStylePreview = useCallback<BackgroundStylePreviewUpdater>((update) => {
    const { style } = update;
    const key = getBackgroundPreviewKey(update);

    const updatedStyles = {
      ...backgroundStylesRef.current,
      [key]: style,
    };

    backgroundStylesRef.current = updatedStyles;
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

  const updateSideStylePreview = useCallback((update: SideStylePreviewUpdate) => {
    const { style } = update;
    const key = getSideStylePreviewKey(update);

    const updatedStyles = {
      ...sideStylesRef.current,
      [key]: style,
    };

    sideStylesRef.current = updatedStyles;
    hasUnsavedStylesRef.current = true;

    setHasPendingStyles(true);

    if (sideFrameRef.current !== null) {
      cancelAnimationFrame(sideFrameRef.current);
    }

    sideFrameRef.current = requestAnimationFrame(() => {
      setSideStylePreviews(sideStylesRef.current);

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
    const pendingSide = sideStylesRef.current;

    if (Object.keys(pending).length === 0 && Object.keys(pendingSide).length === 0) {
      return true;
    }

    if (!editor || editor.isDestroyed) {
      return false;
    }

    const nextEffects = applyPendingStylePreviews({
      effects: getPageEffects(editor),
      backgroundPreviews: pending,
      sidePreviews: pendingSide,
    });

    try {
      writeEffects(nextEffects);
    } catch (error) {
      console.error('[background] Failed to commit style changes', error);

      return false;
    }

    backgroundStylesRef.current = {};
    sideStylesRef.current = {};

    setBackgroundStylePreviews({});
    setSideStylePreviews({});
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
    sideStylePreviews,
    updateBackgroundStylePreview,
    updateSideStylePreview,
    flushStylePreviews,
    hasUnsavedStyleChanges,
    markStylesSaved,
  };
};
