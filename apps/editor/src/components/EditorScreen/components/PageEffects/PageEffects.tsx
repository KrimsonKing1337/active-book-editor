import { useEffect, useState } from 'react';

import type { Editor } from '@tiptap/core';

import type { PageEffects as GroupedPageEffects } from '@active-book/book-builder/effects';
import { normalizePageEffects } from '@active-book/book-builder/effects/utils';

import type { BookProject } from '@project/@types';

import {
  createAudioEffect,
  createFlashlightEffect,
  createVibrationEffect,
} from '@components/EditorScreen/components/PageEffects/utils';

import type {
  AudioEffectDraft,
  EditorEffectDraft,
  VibrationEffectDraft,
  FlashlightEffectDraft,
} from './@types';

import { EffectsModal } from './components';

import styles from './PageEffects.module.scss';

export type PageEffectsProps = {
  editor: Editor | null;
  project: BookProject | null;
};

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

  const audio = Array.isArray(grouped.audio) ? grouped.audio : [];
  const vibration = Array.isArray(grouped.vibration) ? grouped.vibration : [];
  const flashlight = Array.isArray(grouped.flashlight) ? grouped.flashlight : [];

  return [
    ...audio,
    ...vibration,
    ...flashlight,
  ];
};

export const PageEffects = ({ editor, project }: PageEffectsProps) => {
  const [effects, setEffects] = useState<EditorEffectDraft[]>(() => getPageEffects(editor));
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEffectId, setSelectedEffectId] = useState<string | null>(null);

  useEffect(() => {
    if (!editor) {
      setEffects([]);

      return;
    }

    const syncEffects = () => {
      const nextEffects = getPageEffects(editor);

      setEffects((current) => {
        const currentAndNextEffectsHaveEqualLength = current.length === nextEffects.length;

        const everyEffectsAreEqual = current.every((effectCur, index) => {
          return effectCur === nextEffects[index];
        });

        const isUnchanged = currentAndNextEffectsHaveEqualLength && everyEffectsAreEqual;

        return isUnchanged ? current : nextEffects;
      });
    };

    editor.on('transaction', syncEffects);

    syncEffects();

    return () => {
      editor.off('transaction', syncEffects);
    };
  }, [editor]);

  const writeEffects = (nextEffects: EditorEffectDraft[]) => {
    if (!editor || editor.isDestroyed) {
      return;
    }

    const currentPageEffects = normalizePageEffects(editor.state.doc.attrs.pageEffects);

    const groupedEffects: GroupedPageEffects = {
      ...currentPageEffects,
      audio: nextEffects.filter((cur): cur is AudioEffectDraft => cur.type === 'audio'),
      vibration: nextEffects.filter((cur): cur is VibrationEffectDraft => cur.type === 'vibration'),
      flashlight: nextEffects.filter((cur): cur is FlashlightEffectDraft => cur.type === 'flashlight'),
    };

    const transaction = editor.state.tr.setDocAttribute('pageEffects', groupedEffects);

    editor.view.dispatch(transaction);
  };

  const selectedEffect = effects.find((cur) => cur.id === selectedEffectId) ?? null;

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

  const addVibration = () => {
    const effect = createVibrationEffect();

    writeEffects([...effects, effect]);
    setSelectedEffectId(effect.id);
  };

  const addFlashlight = () => {
    const effect = createFlashlightEffect();

    writeEffects([...effects, effect]);
    setSelectedEffectId(effect.id);
  };

  const updateEffect = (previousId: string, updatedEffect: EditorEffectDraft) => {
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

    const nextEffects = effects.map((effect) => {
      return effect.id === previousId ? normalizedEffect : effect;
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

    const id = crypto.randomUUID();
    const slug = `${selectedEffect.slug} (копия)`;

    if (selectedEffect.type === 'audio') {
      const duplicate: AudioEffectDraft = {
        ...selectedEffect,
        id,
        slug,
        options: {
          ...selectedEffect.options,
        },
      };

      writeEffects([...effects, duplicate]);
    } else if (selectedEffect.type === 'vibration') {
      const duplicate: VibrationEffectDraft = {
        ...selectedEffect,
        id,
        slug,
        options: {
          ...selectedEffect.options,
        },
      };

      writeEffects([...effects, duplicate]);
    } else {
      const duplicate: FlashlightEffectDraft = {
        ...selectedEffect,
        id,
        slug,
        options: {
          ...selectedEffect.options,
        },
      };

      writeEffects([...effects, duplicate]);
    }

    setSelectedEffectId(id);
  };

  const deleteEffect = () => {
    if (!selectedEffect) {
      return;
    }

    const shouldDelete = window.confirm(`Удалить эффект «${selectedEffect.slug}»?`);

    if (!shouldDelete) {
      return;
    }

    const filteredEffects = effects.filter((effect) => effect.id !== selectedEffect.id);

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
          {effects.length}
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
          onAddVibration={addVibration}
          onAddFlashlight={addFlashlight}
          onSelectEffect={setSelectedEffectId}
          onUpdateEffect={updateEffect}
          onDuplicateEffect={duplicateEffect}
          onDeleteEffect={deleteEffect}
        />
      )}
    </>
  );
};
