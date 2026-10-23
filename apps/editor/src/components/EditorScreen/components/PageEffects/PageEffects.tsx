import { useRef, useState } from 'react';

import type { BookProject } from '@project/@types';

import {
  createAudioEffect,
  createBackgroundEffect,
  createFlashlightEffect,
  createVibrationEffect,
} from '@components/EditorScreen/components/PageEffects/utils';

import type {
  AudioEffectDraft,
  BackgroundEffectDraft,
  EditorEffectDraft,
  VibrationEffectDraft,
  FlashlightEffectDraft,
} from './@types';

import { usePageEffects } from './PageEffectsContext';

import { EffectsModal } from './components';

import styles from './PageEffects.module.scss';

export type PageEffectsProps = {
  project: BookProject | null;
  onSaveProject: () => Promise<BookProject | null>;
};

export const PageEffects = ({ project, onSaveProject }: PageEffectsProps) => {
  const {
    effects,
    writeEffects,
    getCurrentEffects,
    flushStylePreviews,
    hasUnsavedStyleChanges,
    markStylesSaved,
  } = usePageEffects();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedEffectId, setSelectedEffectId] = useState<string | null>(null);
  const [isSavingStyles, setIsSavingStyles] = useState(false);
  const [styleSaveError, setStyleSaveError] = useState('');
  const savingStylesRef = useRef(false);

  const persistStyles = async (): Promise<boolean> => {
    if (savingStylesRef.current) {
      return false;
    }

    if (!hasUnsavedStyleChanges()) {
      return true;
    }

    savingStylesRef.current = true;
    setIsSavingStyles(true);
    setStyleSaveError('');

    try {
      if (!flushStylePreviews()) {
        throw new Error('Не удалось зафиксировать изменения CSS');
      }

      const savedProject = await onSaveProject();

      if (!savedProject) {
        throw new Error('Проект не был сохранён');
      }

      markStylesSaved();

      return true;
    } catch (error) {
      setStyleSaveError(error instanceof Error ? error.message : 'Не удалось сохранить изменения');

      return false;
    } finally {
      savingStylesRef.current = false;
      setIsSavingStyles(false);
    }
  };

  const afterStylesSaved = (action: () => void) => {
    void persistStyles().then((saved) => {
      if (saved) {
        action();
      }
    });
  };

  const selectedEffect = effects.find((cur) => cur.id === selectedEffectId) ?? null;

  const openEffects = () => {
    setIsOpen(true);
  };

  const closeEffects = () => {
    afterStylesSaved(() => {
      setIsOpen(false);
      setSelectedEffectId(null);
    });
  };

  const goBackToEffects = () => {
    afterStylesSaved(() => setSelectedEffectId(null));
  };

  const selectEffect = (id: string) => {
    afterStylesSaved(() => setSelectedEffectId(id));
  };

  const addAudio = () => {
    const effect = createAudioEffect();

    writeEffects([...getCurrentEffects(), effect]);
    setSelectedEffectId(effect.id);
  };

  const addVibration = () => {
    const effect = createVibrationEffect();

    writeEffects([...getCurrentEffects(), effect]);
    setSelectedEffectId(effect.id);
  };

  const addBackground = () => {
    const effect = createBackgroundEffect();

    writeEffects([...getCurrentEffects(), effect]);
    setSelectedEffectId(effect.id);
  };

  const addFlashlight = () => {
    const effect = createFlashlightEffect();

    writeEffects([...getCurrentEffects(), effect]);
    setSelectedEffectId(effect.id);
  };

  const updateEffect = (previousId: string, updatedEffect: EditorEffectDraft) => {
    const nextId = updatedEffect.id.trim();

    if (nextId !== previousId && !flushStylePreviews()) {
      return;
    }
    const idIsEmpty = nextId.length === 0;

    const idAlreadyExists = getCurrentEffects().some((effectCur) => {
      if (effectCur.id === previousId) {
        return false;
      }

      return effectCur.id === nextId;
    });

    if (idIsEmpty || idAlreadyExists) {
      return;
    }

    const currentEffect = getCurrentEffects().find((effect) => effect.id === previousId);

    const normalizedEffect: EditorEffectDraft = nextId !== previousId && currentEffect
      ? { ...currentEffect, id: nextId, slug: updatedEffect.slug }
      : { ...updatedEffect, id: nextId };

    const nextEffects = getCurrentEffects().map((effect) => {
      return effect.id === previousId ? normalizedEffect : effect;
    });

    writeEffects(nextEffects);

    if (nextId !== previousId) {
      setSelectedEffectId(nextId);
    }
  };

  const duplicateEffect = () => {
    afterStylesSaved(() => {
      const selectedEffect = getCurrentEffects().find((cur) => cur.id === selectedEffectId);

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

        writeEffects([...getCurrentEffects(), duplicate]);
      } else if (selectedEffect.type === 'vibration') {
        const duplicate: VibrationEffectDraft = {
          ...selectedEffect,
          id,
          slug,
          options: {
            ...selectedEffect.options,
          },
        };

        writeEffects([...getCurrentEffects(), duplicate]);
      } else if (selectedEffect.type === 'background') {
        const options = structuredClone(selectedEffect.options);

        options.images = options.images?.map((image) => {
          return { ...image, id: crypto.randomUUID() };
        });

        options.videos = options.videos?.map((video) => {
          return { ...video, id: crypto.randomUUID() };
        });

        const duplicate: BackgroundEffectDraft = {
          ...selectedEffect,
          id,
          slug,
          options,
        };

        writeEffects([...getCurrentEffects(), duplicate]);
      } else {
        const duplicate: FlashlightEffectDraft = {
          ...selectedEffect,
          id,
          slug,
          options: {
            ...selectedEffect.options,
          },
        };

        writeEffects([...getCurrentEffects(), duplicate]);
      }

      setSelectedEffectId(id);
    });
  };

  const deleteEffect = () => {
    afterStylesSaved(() => {
      const selectedEffect = getCurrentEffects().find((cur) => cur.id === selectedEffectId);

      if (!selectedEffect) {
        return;
      }

      const shouldDelete = window.confirm(`Удалить эффект «${selectedEffect.slug}»?`);

      if (!shouldDelete) {
        return;
      }

      const filteredEffects = getCurrentEffects().filter((effectCur) => {
        return effectCur.id !== selectedEffect.id;
      });

      writeEffects(filteredEffects);
      setSelectedEffectId(null);
    });
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
          onAddBackground={addBackground}
          onSelectEffect={selectEffect}
          onUpdateEffect={updateEffect}
          onDuplicateEffect={duplicateEffect}
          onDeleteEffect={deleteEffect}
          isSavingStyles={isSavingStyles}
          styleSaveError={styleSaveError}
          onBeforeCollapse={persistStyles}
        />
      )}
    </>
  );
};
