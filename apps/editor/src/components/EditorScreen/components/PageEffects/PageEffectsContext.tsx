import type { CSSProperties, PropsWithChildren } from 'react';

import type { Editor } from '@tiptap/core';

import type { PageEffects as GroupedPageEffects } from '@active-book/book-builder/effects';

import type {
  AudioEffectDraft,
  BackgroundEffectDraft,
  EditorEffectDraft,
  FlashlightEffectDraft,
  VibrationEffectDraft,
} from './@types';

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
export type AudioPreviewStatus = {
  state: 'empty' | 'loading' | 'ready' | 'error';
  error?: string;
};

type PageEffectsContextValue = {
  effects: EditorEffectDraft[];
  writeEffects: (effects: EditorEffectDraft[]) => void;
  getCurrentEffects: () => EditorEffectDraft[];
  audioPreviewStatuses: Record<string, AudioPreviewStatus>;
  setAudioPreviewStatus: (id: string, status: AudioPreviewStatus | null) => void;
  flushStylePreviews: () => boolean;
  hasUnsavedStyleChanges: () => boolean;
  markStylesSaved: () => void;
};

export type BackgroundPreviewLayer = 'background' | 'shadow' | 'image' | 'video';

export type BackgroundStylePreviews = Record<string, CSSProperties>;

type BackgroundStylePreviewUpdater = (
  effectId: string,
  layer: BackgroundPreviewLayer,
  mediaId: string | null,
  style: CSSProperties
) => void;

export const getBackgroundPreviewKey = (
  effectId: string,
  layer: BackgroundPreviewLayer,
  mediaId: string | null = null,
): string => {
  return JSON.stringify([effectId, layer, mediaId]);
};

type PageEffectsProviderProps = PropsWithChildren<{
  editor: Editor | null;
}>;

const PageEffectsContext = createContext<PageEffectsContextValue | null>(null);
const BackgroundStylePreviewsContext = createContext<BackgroundStylePreviews>({});
const BackgroundStylePreviewUpdaterContext = createContext<BackgroundStylePreviewUpdater | null>(null);

const getPageEffects = (editor: Editor | null): EditorEffectDraft[] => {
  const grouped = editor?.state.doc.attrs.pageEffects as GroupedPageEffects | undefined;

  if (!grouped) {
    return [];
  }

  const groupedAudio = grouped.audio ?? [];
  const groupedVibration = grouped.vibration ?? [];
  const groupedFlashlight = grouped.flashlight ?? [];
  const groupedBackground = grouped.background ?? [];

  return [
    ...groupedAudio,
    ...groupedVibration,
    ...groupedFlashlight,
    ...groupedBackground,
  ];
};

export const PageEffectsProvider = ({ children, editor }: PageEffectsProviderProps) => {
  const [effects, setEffects] = useState<EditorEffectDraft[]>(() => getPageEffects(editor));
  const [audioPreviewStatuses, setAudioPreviewStatuses] = useState<Record<string, AudioPreviewStatus>>({});
  const [backgroundStylePreviews, setBackgroundStylePreviews] = useState<BackgroundStylePreviews>({});

  const previewStylesRef = useRef<BackgroundStylePreviews>({});
  const previewFrameRef = useRef<number | null>(null);
  const unsavedStylesRef = useRef(false);

  const updateBackgroundStylePreview = useCallback<BackgroundStylePreviewUpdater>((effectId, layer, mediaId, style) => {
    const key = getBackgroundPreviewKey(effectId, layer, mediaId);

    previewStylesRef.current = {
      ...previewStylesRef.current,
      [key]: style,
    };

    unsavedStylesRef.current = true;
    setHasPendingStyles(true);

    if (previewFrameRef.current !== null) {
      cancelAnimationFrame(previewFrameRef.current);
    }

    previewFrameRef.current = requestAnimationFrame(() => {
      setBackgroundStylePreviews(previewStylesRef.current);
      previewFrameRef.current = null;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (previewFrameRef.current !== null) {
        cancelAnimationFrame(previewFrameRef.current);
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

        const allEffectReferencesMatch = hasSameEffectCount && current.every((currentEffect, index) => {
          return currentEffect === nextEffects[index];
        });

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

    const currentPageEffects = normalizePageEffects(editor.state.doc.attrs.pageEffects);

    const audioEffects = nextEffects.filter((effectCur): effectCur is AudioEffectDraft => {
      return effectCur.type === 'audio';
    });

    const vibrationEffects = nextEffects.filter((effectCur): effectCur is VibrationEffectDraft => {
      return effectCur.type === 'vibration';
    });

    const flashlightEffects = nextEffects.filter((effectCur): effectCur is FlashlightEffectDraft => {
      return effectCur.type === 'flashlight';
    });

    const backgroundEffects = nextEffects.filter((effectCur): effectCur is BackgroundEffectDraft => {
      return effectCur.type === 'background';
    });

    const groupedEffects: GroupedPageEffects = {
      ...currentPageEffects,
      audio: audioEffects,
      vibration: vibrationEffects,
      flashlight: flashlightEffects,
      background: backgroundEffects,
    };

    const transaction = editor.state.tr.setDocAttribute('pageEffects', groupedEffects);

    editor.view.dispatch(transaction);
  }, [editor]);

  const getCurrentEffects = useCallback((): EditorEffectDraft[] => {
    return getPageEffects(editor);
  }, [editor]);

  const flushStylePreviews = useCallback((): boolean => {
    const pending = previewStylesRef.current;

    if (Object.keys(pending).length === 0) {
      return true;
    }

    if (!editor || editor.isDestroyed) {
      return false;
    }

    const nextEffects = getPageEffects(editor).map((effectCur) => {
      if (effectCur.type !== 'background') {
        return effectCur;
      }

      const previewStyle = (layer: BackgroundPreviewLayer, mediaId: string | null = null) => {
        return pending[getBackgroundPreviewKey(effectCur.id, layer, mediaId)];
      };

      const backgroundStyle = previewStyle('background');
      const shadowStyle = previewStyle('shadow');

      const hasImageChanges = effectCur.options.images?.some((imageCur) => {
        return previewStyle('image', imageCur.id) !== undefined;
      });

      const hasVideoChanges = effectCur.options.videos?.some((videoCur) => {
        return previewStyle('video', videoCur.id) !== undefined;
      });

      if (!backgroundStyle && !shadowStyle && !hasImageChanges && !hasVideoChanges) {
        return effectCur;
      }

      const previousShadow = effectCur.options.shadow;
      const nextShadow = shadowStyle && previousShadow
        ? { ...previousShadow, style: shadowStyle }
        : previousShadow;

      const images = effectCur.options.images?.map((imageCur) => {
        const style = previewStyle('image', imageCur.id);

        if (!style) {
          return imageCur;
        }

        return {
          ...imageCur,
          style,
        };
      });

      const videos = effectCur.options.videos?.map((videoCur) => {
        const style = previewStyle('video', videoCur.id);

        if (!style) {
          return videoCur;
        }

        return {
          ...videoCur,
          style,
        };
      });

      const options = {
        ...effectCur.options,
        style: backgroundStyle ?? effectCur.options.style,
        shadow: nextShadow,
        images,
        videos,
      };

      return {
        ...effectCur,
        options,
      };
    });

    try {
      writeEffects(nextEffects);
    } catch (error) {
      console.error('[background] Failed to commit style changes', error);

      return false;
    }

    previewStylesRef.current = {};
    setBackgroundStylePreviews({});
    markStylePreviewsCommitted();

    if (previewFrameRef.current !== null) {
      cancelAnimationFrame(previewFrameRef.current);
      previewFrameRef.current = null;
    }

    return true;
  }, [editor, writeEffects]);

  const hasUnsavedStyleChanges = useCallback(() => {
    return unsavedStylesRef.current;
  }, []);

  const markStylesSaved = useCallback(() => {
    unsavedStylesRef.current = false;
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
  }), [
    effects,
    writeEffects,
    getCurrentEffects,
    audioPreviewStatuses,
    setAudioPreviewStatus,
    flushStylePreviews,
    hasUnsavedStyleChanges,
    markStylesSaved,
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
