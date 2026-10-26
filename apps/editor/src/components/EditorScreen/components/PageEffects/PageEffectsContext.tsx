import type { PropsWithChildren } from 'react';

import type { Editor } from '@tiptap/core';

import type { EditorEffectDraft } from './@types';

import type {
  AudioPreviewStatus,
  BackgroundStylePreviewUpdater,
  BackgroundStylePreviews,
  PageEffectsContextValue,
  SideItemPreview,
  SideItemPreviews,
  SideItemPreviewUpdate,
  SideStylePreviewUpdate,
  SideStylePreviews,
} from './PageEffectsContext.types';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { normalizePageEffects } from '@active-book/book-builder/effects/utils';

import { markStylePreviewsCommitted, setHasPendingStyles } from '@project/pendingOperations';

import {
  applyPendingStylePreviews,
  getBackgroundPreviewKey,
  getPageEffects,
  getSidePreviewKey,
  getSideStylePreviewKey,
  groupPageEffects,
} from './PageEffectsContext.utils';

export type {
  AudioPreviewStatus,
  BackgroundPreviewLayer,
  BackgroundStylePreviews,
  SideItemPreview,
  SideItemPreviews,
  SideItemPreviewUpdate,
  SideStylePreviewUpdate,
  SideStylePreviews,
} from './PageEffectsContext.types';

export {
  getBackgroundPreviewKey,
  getSidePreviewKey,
  getSideStylePreviewKey,
} from './PageEffectsContext.utils';

type PageEffectsProviderProps = PropsWithChildren<{
  editor: Editor | null;
}>;

const PageEffectsContext = createContext<PageEffectsContextValue | null>(null);
const BackgroundStylePreviewsContext = createContext<BackgroundStylePreviews>({});
const BackgroundStylePreviewUpdaterContext = createContext<BackgroundStylePreviewUpdater | null>(null);

export const PageEffectsProvider = ({ children, editor }: PageEffectsProviderProps) => {
  const [effects, setEffects] = useState<EditorEffectDraft[]>(() => getPageEffects(editor));
  const [audioPreviewStatuses, setAudioPreviewStatuses] = useState<Record<string, AudioPreviewStatus>>({});
  const [backgroundStylePreviews, setBackgroundStylePreviews] = useState<BackgroundStylePreviews>({});
  const [sideStylePreviews, setSideStylePreviews] = useState<SideStylePreviews>({});
  const [sideItemPreviews, setSideItemPreviews] = useState<SideItemPreviews>({});

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

  const setAudioPreviewStatus = useCallback((id: string, status: AudioPreviewStatus | null) => {
    setAudioPreviewStatuses((current) => {
      const previous = current[id];

      if (previous?.state === status?.state && previous?.error === status?.error) {
        return current;
      }

      if (!previous && !status) {
        return current;
      }

      const next = { ...current };

      if (status) {
        next[id] = status;
      } else {
        delete next[id];
      }

      return next;
    });
  }, []);

  useEffect(() => {
    if (!editor) {
      setEffects([]);

      return;
    }

    const syncEffects = () => {
      const nextEffects = getPageEffects(editor);

      setEffects((current) => {
        const hasSameEffectCount = current.length === nextEffects.length;

        const everyEffectMatch = current.every((effectCur, index) => {
          return effectCur === nextEffects[index];
        });

        const allEffectReferencesMatch = hasSameEffectCount && everyEffectMatch;

        return allEffectReferencesMatch ? current : nextEffects;
      });
    };

    editor.on('transaction', syncEffects);

    syncEffects();

    return () => {
      editor.off('transaction', syncEffects);
    };
  }, [editor]);

  const writeEffects = useCallback((nextEffects: EditorEffectDraft[]) => {
    if (!editor || editor.isDestroyed) {
      return;
    }

    const previous = normalizePageEffects(editor.state.doc.attrs.pageEffects);

    const groupedEffects = groupPageEffects({
      effects: nextEffects,
      previous,
    });

    const transaction = editor.state.tr.setDocAttribute('pageEffects', groupedEffects);

    editor.view.dispatch(transaction);
  }, [editor]);

  const getCurrentEffects = useCallback((): EditorEffectDraft[] => {
    return getPageEffects(editor);
  }, [editor]);

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

  const updateSideItemPreview = useCallback((update: SideItemPreviewUpdate) => {
    const { effectId, itemId, changes } = update;
    const key = getSidePreviewKey(effectId, itemId);

    setSideItemPreviews((current) => {
      const itemPreview = {
        ...current[key],
        ...changes,
      };

      return {
        ...current,
        [key]: itemPreview,
      };
    });
  }, []);

  const markStylesSaved = useCallback(() => {
    hasUnsavedStylesRef.current = false;

    setHasPendingStyles(false);
  }, []);

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

export const usePageEffects = (): PageEffectsContextValue => {
  const context = useContext(PageEffectsContext);

  if (!context) {
    throw new Error('usePageEffects must be used within PageEffectsProvider');
  }

  return context;
};

export const useBackgroundStylePreviews = (): BackgroundStylePreviews => {
  return useContext(BackgroundStylePreviewsContext);
};

export const useBackgroundStylePreviewUpdater = (): BackgroundStylePreviewUpdater => {
  const updater = useContext(BackgroundStylePreviewUpdaterContext);

  if (!updater) {
    throw new Error('useBackgroundStylePreviewUpdater must be used within PageEffectsProvider');
  }

  return updater;
};
