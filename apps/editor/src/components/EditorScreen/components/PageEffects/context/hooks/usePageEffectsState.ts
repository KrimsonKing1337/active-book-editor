import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import type { Editor } from '@tiptap/core';

import { normalizePageEffects } from '@active-book/book-builder/effects/utils';

import type { EditorEffectDraft } from '../../@types';
import type { AudioPreviewStatus } from '../@types';

import { getPageEffects, groupPageEffects } from '../utils';

export const usePageEffectsState = (editor: Editor | null, pageId: string) => {
  const [source, setSource] = useState(() => ({ pageId, effects: getPageEffects(editor) }));
  const effects = source.pageId === pageId ? source.effects : [];
  const currentPageRef = useRef(pageId);
  currentPageRef.current = pageId;
  const [audioPreviewStatuses, setAudioPreviewStatuses] = useState<Record<string, AudioPreviewStatus>>({});

  const setAudioPreviewStatus = useCallback((id: string, status: AudioPreviewStatus | null) => {
    if (currentPageRef.current !== pageId) return;
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
  }, [pageId]);

  useLayoutEffect(() => {
    if (!editor) {
      setSource({ pageId, effects: [] });

      return;
    }

    setAudioPreviewStatuses({});

    const syncEffects = () => {
      const nextEffects = getPageEffects(editor);

      setSource((previous) => {
        const current = previous.effects;
        const hasSameEffectCount = current.length === nextEffects.length;

        const everyEffectMatch = current.every((effectCur, index) => {
          return effectCur === nextEffects[index];
        });

        const allEffectReferencesMatch = hasSameEffectCount && everyEffectMatch;

        return allEffectReferencesMatch && previous.pageId === pageId
          ? previous : { pageId, effects: nextEffects };
      });
    };

    editor.on('transaction', syncEffects);

    syncEffects();

    return () => {
      editor.off('transaction', syncEffects);
    };
  }, [editor, pageId]);

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

  return {
    effects,
    writeEffects,
    getCurrentEffects,
    audioPreviewStatuses,
    setAudioPreviewStatus,
  };
};
