import type { CSSProperties, PropsWithChildren } from 'react';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { Editor } from '@tiptap/core';

import type { PageEffects as GroupedPageEffects } from '@active-book/book-builder/effects';

import { normalizePageEffects } from '@active-book/book-builder/effects/utils';

import { markStylePreviewsCommitted, setHasPendingStyles } from '@project/pendingOperations';

import type {
  AudioEffectDraft,
  BackgroundEffectDraft,
  EditorEffectDraft,
  FlashlightEffectDraft,
  VibrationEffectDraft,
  SideEffectDraft,
} from './@types';

export type AudioPreviewStatus = {
  state: 'empty' | 'loading' | 'ready' | 'error';
  error?: string;
};

export type SideItemPreview = {
  playState?: 'running' | 'paused' | 'stopped';
  hidden?: boolean;
};

export type SideItemPreviews = Record<string, SideItemPreview>;

export type SideStylePreviewUpdate = {
  effectId: string;
  kind: 'shadow' | 'text' | 'component';
  itemId: string;
  style: CSSProperties;
};

export const getSidePreviewKey = (effectId: string, itemId: string): string => {
  return JSON.stringify([effectId, itemId]);
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
  sideItemPreviews: SideItemPreviews;
  sideStylePreviews: SideStylePreviews;
  updateSideStylePreview: (update: SideStylePreviewUpdate) => void;
  updateSideItemPreview: (effectId: string, itemId: string, changes: Partial<SideItemPreview>) => void;
};

export type BackgroundPreviewLayer = 'background' | 'shadow' | 'image' | 'video';

export type BackgroundStylePreviews = Record<string, CSSProperties>;
export type SideStylePreviews = Record<string, CSSProperties>;

export const getSideStylePreviewKey = (
  effectId: string,
  kind: 'shadow' | 'text' | 'component',
  itemId: string,
): string => {
  return JSON.stringify([effectId, kind, itemId]);
};

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
  const groupedBackground = grouped.background?.filter((cur) => Boolean(cur.kind)) ?? [];
  const groupedSide = grouped.side?.filter((cur) => Boolean(cur.kind)) ?? [];

  return [
    ...groupedAudio,
    ...groupedVibration,
    ...groupedFlashlight,
    ...groupedBackground,
    ...groupedSide,
  ];
};

export const PageEffectsProvider = ({ children, editor }: PageEffectsProviderProps) => {
  const [effects, setEffects] = useState<EditorEffectDraft[]>(() => getPageEffects(editor));
  const [audioPreviewStatuses, setAudioPreviewStatuses] = useState<Record<string, AudioPreviewStatus>>({});
  const [backgroundStylePreviews, setBackgroundStylePreviews] = useState<BackgroundStylePreviews>({});
  const [sideStylePreviews, setSideStylePreviews] = useState<SideStylePreviews>({});
  const [sideItemPreviews, setSideItemPreviews] = useState<SideItemPreviews>({});

  const previewStylesRef = useRef<BackgroundStylePreviews>({});
  const sideStylesRef = useRef<SideStylePreviews>({});
  const sideFrameRef = useRef<number | null>(null);
  const previewFrameRef = useRef<number | null>(null);
  const unsavedStylesRef = useRef(false);

  const updateBackgroundStylePreview = useCallback<BackgroundStylePreviewUpdater>(
    (effectId, layer, mediaId, style) => {
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

  const updateSideStylePreview = useCallback((update: SideStylePreviewUpdate) => {
    const {
      effectId,
      kind,
      itemId,
      style,
    } = update;
    const key = getSideStylePreviewKey(effectId, kind, itemId);

    sideStylesRef.current = {
      ...sideStylesRef.current,
      [key]: style,
    };

    unsavedStylesRef.current = true;
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

    const sideEffects = nextEffects.filter((effectCur): effectCur is SideEffectDraft => {
      return effectCur.type === 'side';
    });

    const groupedEffects: GroupedPageEffects = {
      ...currentPageEffects,
      audio: audioEffects,
      vibration: vibrationEffects,
      flashlight: flashlightEffects,
      background: backgroundEffects,
      side: sideEffects,
    };

    const transaction = editor.state.tr.setDocAttribute('pageEffects', groupedEffects);

    editor.view.dispatch(transaction);
  }, [editor]);

  const getCurrentEffects = useCallback((): EditorEffectDraft[] => {
    return getPageEffects(editor);
  }, [editor]);

  const flushStylePreviews = useCallback((): boolean => {
    const pending = previewStylesRef.current;
    const pendingSide = sideStylesRef.current;

    if (Object.keys(pending).length === 0 && Object.keys(pendingSide).length === 0) {
      return true;
    }

    if (!editor || editor.isDestroyed) {
      return false;
    }

    const nextEffects = getPageEffects(editor).map((effectCur) => {
      if (effectCur.type === 'side') {
        const { shadow, text } = effectCur.options;

        const shadowStyle = shadow && pendingSide[getSideStylePreviewKey(effectCur.id, 'shadow', shadow.id)];
        const textStyle = text && pendingSide[getSideStylePreviewKey(effectCur.id, 'text', text.id)];
        const componentStyle = pendingSide[getSideStylePreviewKey(effectCur.id, 'component', effectCur.id)];

        if (!shadowStyle && !textStyle && !componentStyle) {
          return effectCur;
        }

        const options = {
          ...effectCur.options,
          shadow: shadowStyle && shadow ? { ...shadow, style: shadowStyle } : shadow,
          text: textStyle && text ? { ...text, style: textStyle } : text,
          style: componentStyle ?? effectCur.options.style,
        };

        return { ...effectCur, options };
      }

      if (effectCur.type !== 'background') {
        return effectCur;
      }

      const { image, video, shadow } = effectCur.options;
      const previewStyle = (layer: BackgroundPreviewLayer, mediaId: string | null = null) => {
        return pending[getBackgroundPreviewKey(effectCur.id, layer, mediaId)];
      };

      const backgroundStyle = previewStyle('background');
      const imageStyle = image && previewStyle('image', image.id);
      const videoStyle = video && previewStyle('video', video.id);
      const shadowStyle = previewStyle('shadow');

      if (
        !backgroundStyle
        && !imageStyle
        && !videoStyle
        && !shadowStyle
      ) {
        return effectCur;
      }

      const options = {
        ...effectCur.options,
        style: backgroundStyle ?? effectCur.options.style,
        image: imageStyle && image ? { ...image, style: imageStyle } : image,
        video: videoStyle && video ? { ...video, style: videoStyle } : video,
        shadow: shadowStyle && shadow ? { ...shadow, style: shadowStyle } : shadow,
      };

      return { ...effectCur, options };
    });

    try {
      writeEffects(nextEffects);
    } catch (error) {
      console.error('[background] Failed to commit style changes', error);

      return false;
    }

    previewStylesRef.current = {};
    sideStylesRef.current = {};

    setBackgroundStylePreviews({});
    setSideStylePreviews({});
    markStylePreviewsCommitted();

    if (previewFrameRef.current !== null) {
      cancelAnimationFrame(previewFrameRef.current);

      previewFrameRef.current = null;
    }

    if (sideFrameRef.current !== null) {
      cancelAnimationFrame(sideFrameRef.current);

      sideFrameRef.current = null;
    }

    return true;
  }, [editor, writeEffects]);

  const hasUnsavedStyleChanges = useCallback(() => {
    return unsavedStylesRef.current;
  }, []);

  const updateSideItemPreview = useCallback((
    effectId: string,
    itemId: string,
    changes: Partial<SideItemPreview>,
  ) => {
    const key = getSidePreviewKey(effectId, itemId);

    setSideItemPreviews((current) => {
      return {
        ...current,
        [key]: {
          ...current[key],
          ...changes,
        },
      };
    });
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
