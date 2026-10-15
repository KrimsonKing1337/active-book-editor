import { useEffect, useState } from 'react';

import type { Editor } from '@tiptap/core';

import { normalizePageEffects } from '@active-book/book-builder/effects';
import type { PageEffects as GroupedPageEffects } from '@active-book/book-builder/effects';

import type { BookProject } from '@project/@types';

import type { AudioEffectDraft } from './@types';

import { EffectsModal } from './components';

import styles from './PageEffects.module.scss';

const createAudioEffect = (): AudioEffectDraft => ({
  id: crypto.randomUUID(),
  type: 'audio',
  slug: 'Новый звук',
  options: {
    src: '',
    type: 'sfx',
    loop: false,
    playOnLoad: false,
    stopBy: 0,
    delay: 0,
    relativeVolume: 100,
    screamer: false,
    fadeOutWhenUnload: true,
  },
});

type PageEffectsProps = {
  editor: Editor | null;
  project: BookProject | null;
};

const getPageEffects = (editor: Editor | null): AudioEffectDraft[] => {
  const pageEffects: unknown = editor?.state.doc.attrs.pageEffects;

  if (Array.isArray(pageEffects)) {
    return normalizePageEffects(pageEffects).audio ?? [];
  }

  if (!pageEffects || typeof pageEffects !== 'object' || !('audio' in pageEffects)) {
    return [];
  }

  const audio = (pageEffects as GroupedPageEffects).audio;

  return Array.isArray(audio) ? audio : [];
};

export const PageEffects = ({ editor, project }: PageEffectsProps) => {
  const [effects, setEffects] = useState<AudioEffectDraft[]>(() => getPageEffects(editor));
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEffectId, setSelectedEffectId] = useState<string | null>(null);

  useEffect(() => {
    if (!editor) {
      setEffects([]);

      return;
    }

    const syncEffects = () => {
      const nextEffects = getPageEffects(editor);

      setEffects((current) => current === nextEffects ? current : nextEffects);
    };

    editor.on('transaction', syncEffects);
    syncEffects();

    return () => {
      editor.off('transaction', syncEffects);
    };
  }, [editor]);

  const writeEffects = (nextEffects: AudioEffectDraft[]) => {
    if (!editor || editor.isDestroyed) {
      return;
    }

    const currentPageEffects = normalizePageEffects(editor.state.doc.attrs.pageEffects);
    const groupedEffects: GroupedPageEffects = {
      ...currentPageEffects,
      audio: nextEffects,
    };

    const transaction = editor.state.tr.setDocAttribute('pageEffects', groupedEffects);

    editor.view.dispatch(transaction);
  };

  const selectedEffect = effects.find((effect) => effect.id === selectedEffectId) ?? null;
  const effectsCount = effects.length;

  const openEffects = () => {
    setIsOpen(true);
  };

  const closeEffects = () => {
    setIsOpen(false);
    setSelectedEffectId(null);
  };

  const goBackToEffects = () => {
    setSelectedEffectId(null);
  };

  const addAudio = () => {
    const effect = createAudioEffect();

    writeEffects([...effects, effect]);

    setSelectedEffectId(effect.id);
  };

  const updateEffect = (previousId: string, updatedEffect: AudioEffectDraft) => {
    const nextId = updatedEffect.id.trim();
    const idIsEmpty = nextId.length === 0;

    const idAlreadyExists = effects.some((effect) => {
      if (effect.id === previousId) {
        return false;
      }

      return effect.id === nextId;
    });

    if (idIsEmpty || idAlreadyExists) {
      return;
    }

    const normalizedEffect = {
      ...updatedEffect,
      id: nextId,
    };

    const nextEffects = effects.map((effectCur) => {
      if (effectCur.id !== previousId) {
        return effectCur;
      }

      return normalizedEffect;
    });

    writeEffects(nextEffects);

    if (nextId !== previousId) {
      setSelectedEffectId(nextId);
    }
  };

  const duplicateEffect = () => {
    if (!selectedEffect) {
      return;
    }

    const duplicate: AudioEffectDraft = {
      ...selectedEffect,
      id: crypto.randomUUID(),
      slug: `${selectedEffect.slug} (копия)`,
      options: {
        ...selectedEffect.options,
      },
    };

    writeEffects([...effects, duplicate]);

    setSelectedEffectId(duplicate.id);
  };

  const deleteEffect = () => {
    if (!selectedEffect) {
      return;
    }

    const shouldDelete = window.confirm(`Удалить эффект «${selectedEffect.slug}»?`);

    if (!shouldDelete) {
      return;
    }

    const effectId = selectedEffect.id;

    const filteredEffects = effects.filter((cur) => cur.id !== effectId);

    writeEffects(filteredEffects);

    setSelectedEffectId(null);
  };

  return (
    <>
      <button
        className={styles.Trigger}
        type="button"
        title="Эффекты страницы"
        aria-label="Эффекты страницы"
        aria-haspopup="dialog"
        onClick={openEffects}
      >
        <span className={styles.Icon} aria-hidden="true">
          ⚙
        </span>

        <span>
          Эффекты
        </span>

        <span className={styles.Count}>
          {effectsCount}
        </span>
      </button>

      {isOpen && (
        <EffectsModal
          effects={effects}
          project={project}
          selectedEffect={selectedEffect}
          onClose={closeEffects}
          onBack={goBackToEffects}
          onAddAudio={addAudio}
          onSelectEffect={setSelectedEffectId}
          onUpdateEffect={updateEffect}
          onDuplicateEffect={duplicateEffect}
          onDeleteEffect={deleteEffect}
        />
      )}
    </>
  );
};
