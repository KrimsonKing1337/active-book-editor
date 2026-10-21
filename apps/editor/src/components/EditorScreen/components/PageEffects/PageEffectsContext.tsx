import { type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  createContext,
} from 'react';

import type { Editor } from '@tiptap/core';

import type { PageEffects as GroupedPageEffects } from '@active-book/book-builder/effects';

import { normalizePageEffects } from '@active-book/book-builder/effects/utils';

import type {
  AudioEffectDraft,
  EditorEffectDraft,
  FlashlightEffectDraft,
  VibrationEffectDraft,
} from './@types';

export type AudioPreviewStatus = {
  state: 'empty' | 'loading' | 'ready' | 'error';
  error?: string;
};

type PageEffectsContextValue = {
  effects: EditorEffectDraft[];
  writeEffects: (effects: EditorEffectDraft[]) => void;
  audioPreviewStatuses: Record<string, AudioPreviewStatus>;
  setAudioPreviewStatus: (id: string, status: AudioPreviewStatus | null) => void;
};

type PageEffectsProviderProps = PropsWithChildren<{
  editor: Editor | null;
}>;

const PageEffectsContext = createContext<PageEffectsContextValue | null>(null);

const getPageEffects = (editor: Editor | null): EditorEffectDraft[] => {
  const raw: unknown = editor?.state.doc.attrs.pageEffects;

  if (Array.isArray(raw)) {
    const grouped = normalizePageEffects(raw);

    const groupedAudio = grouped.audio ?? [];
    const groupedVibration = grouped.vibration ?? [];
    const groupedFlashlight = grouped.flashlight ?? [];

    return [
      ...groupedAudio,
      ...groupedVibration,
      ...groupedFlashlight,
    ];
  }

  if (!raw || typeof raw !== 'object') {
    return [];
  }

  const grouped = raw as GroupedPageEffects;

  const groupedAudio = Array.isArray(grouped.audio) ? grouped.audio : [];
  const groupedVibration = Array.isArray(grouped.vibration) ? grouped.vibration : [];
  const groupedFlashlight = Array.isArray(grouped.flashlight) ? grouped.flashlight : [];

  return [
    ...groupedAudio,
    ...groupedVibration,
    ...groupedFlashlight,
  ];
};

export const PageEffectsProvider = ({ children, editor }: PageEffectsProviderProps) => {
  const [effects, setEffects] = useState<EditorEffectDraft[]>(() => getPageEffects(editor));
  const [audioPreviewStatuses, setAudioPreviewStatuses] = useState<Record<string, AudioPreviewStatus>>({});

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
        const currentAndNextEffectsAreEqual = current.length === nextEffects.length;

        const currentEveryAndNextEffectsAreEqual = current.every((effectCur, index) => {
          return effectCur === nextEffects[index];
        });

        const isUnchanged = currentAndNextEffectsAreEqual && currentEveryAndNextEffectsAreEqual;

        return isUnchanged ? current : nextEffects;
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

    const groupedEffects: GroupedPageEffects = {
      ...currentPageEffects,
      audio: audioEffects,
      vibration: vibrationEffects,
      flashlight: flashlightEffects,
    };

    const transaction = editor.state.tr.setDocAttribute('pageEffects', groupedEffects);

    editor.view.dispatch(transaction);
  }, [editor]);

  const value = useMemo(() => ({
    effects,
    writeEffects,
    audioPreviewStatuses,
    setAudioPreviewStatus,
  }), [effects, writeEffects, audioPreviewStatuses, setAudioPreviewStatus]);

  return (
    <PageEffectsContext.Provider value={value}>
      {children}
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
