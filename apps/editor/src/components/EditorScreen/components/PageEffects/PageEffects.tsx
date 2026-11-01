import { useLayoutEffect, useRef, useState } from 'react';

import type { BackgroundEffectKind, FrameEffectKind } from '@active-book/book-builder/effects';

import type { BookProject } from '@project/@types';

import type {
  AudioEffectDraft,
  BackgroundEffectDraft,
  EditorEffectDraft,
  VibrationEffectDraft,
  FlashlightEffectDraft,
  FrameEffectDraft,
} from './@types';

import { usePageEffects } from './context';

import { EffectsModal } from './components';

import {
  createAudioEffect,
  createBackgroundEffect,
  createFlashlightEffect,
  createVibrationEffect,
  createFrameEffect,
} from './utils';

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
  const mountedRef = useRef(true);

  useLayoutEffect(() => {
    mountedRef.current = true;

    return () => { mountedRef.current = false; };
  }, []);

  const persistStyles = async (): Promise<boolean> => {
    if (savingStylesRef.current) {
      return false;
    }

    const hasUnsaved = hasUnsavedStyleChanges();

    if (!hasUnsaved) {
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

      if (!mountedRef.current) return false;

      if (!savedProject) {
        throw new Error('Проект не был сохранён');
      }

      markStylesSaved();

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Не удалось сохранить изменения';

      setStyleSaveError(errorMessage);

      return false;
    } finally {
      savingStylesRef.current = false;

      setIsSavingStyles(false);
    }
  };

  const afterStylesSaved = (action: () => void) => {
    void persistStyles().then((saved) => {
      if (saved && mountedRef.current) {
        action();
      }
    });
  };

  const selectedEffect = effects.find((cur) => cur.id === selectedEffectId);

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

  const addAudio = (type: AudioEffectDraft['options']['type'] = 'sfx') => {
    const effect = createAudioEffect(type);
    const currentEffects = getCurrentEffects();

    writeEffects([...currentEffects, effect]);

    setSelectedEffectId(effect.id);
  };

  const addVibration = () => {
    const effect = createVibrationEffect();
    const currentEffects = getCurrentEffects();

    writeEffects([...currentEffects, effect]);

    setSelectedEffectId(effect.id);
  };

  const addBackground = (kind: BackgroundEffectKind) => {
    const effect = createBackgroundEffect(kind);
    const currentEffects = getCurrentEffects();

    writeEffects([...currentEffects, effect]);

    setSelectedEffectId(effect.id);
  };

  const addFrame = (kind: FrameEffectKind) => {
    const effect = createFrameEffect(kind);
    const currentEffects = getCurrentEffects();

    writeEffects([...currentEffects, effect]);

    setSelectedEffectId(effect.id);
  };

  const addFlashlight = () => {
    const effect = createFlashlightEffect();
    const currentEffects = getCurrentEffects();

    writeEffects([...currentEffects, effect]);

    setSelectedEffectId(effect.id);
  };

  const updateEffect = (previousId: string, updatedEffect: EditorEffectDraft) => {
    const nextId = updatedEffect.id.trim();

    if (nextId !== previousId && !flushStylePreviews()) {
      return;
    }

    const idIsEmpty = nextId.length === 0;

    const currentEffects = getCurrentEffects();

    const idAlreadyExists = currentEffects.some((effectCur) => {
      if (effectCur.id === previousId) {
        return false;
      }

      return effectCur.id === nextId;
    });

    if (idIsEmpty || idAlreadyExists) {
      return;
    }

    const currentEffect = currentEffects.find((cur) => cur.id === previousId);

    let normalizedEffect: EditorEffectDraft = {
      ...updatedEffect,
      id: nextId,
    };

    if (nextId !== previousId && currentEffect) {
      normalizedEffect = {
        ...currentEffect,
        id: nextId,
        slug: updatedEffect.slug,
      };
    }

    const nextEffects = currentEffects.map((effectCur) => {
      return effectCur.id === previousId ? normalizedEffect : effectCur;
    });

    writeEffects(nextEffects);

    if (nextId !== previousId) {
      setSelectedEffectId(nextId);
    }
  };

  const duplicateEffect = () => {
    afterStylesSaved(() => {
      const currentEffects = getCurrentEffects();
      const selectedEffect = currentEffects.find((cur) => cur.id === selectedEffectId);

      if (!selectedEffect) {
        return;
      }

      const id = crypto.randomUUID();
      const slug = `${selectedEffect.slug} (копия)`;

      if (selectedEffect.type === 'audio') {
        const options = {
          ...selectedEffect.options,
        };

        const duplicate: AudioEffectDraft = {
          ...selectedEffect,
          id,
          slug,
          options,
        };

        writeEffects([...currentEffects, duplicate]);
      } else if (selectedEffect.type === 'vibration') {
        const options = {
          ...selectedEffect.options,
        };

        const duplicate: VibrationEffectDraft = {
          ...selectedEffect,
          id,
          slug,
          options,
        };

        writeEffects([...currentEffects, duplicate]);
      } else if (selectedEffect.type === 'background') {
        const options = structuredClone(selectedEffect.options);

        if (options.image) {
          options.image.id = crypto.randomUUID();
        }

        if (options.video) {
          options.video.id = crypto.randomUUID();
        }

        const duplicate: BackgroundEffectDraft = {
          ...selectedEffect,
          id,
          slug,
          options,
        };

        writeEffects([...currentEffects, duplicate]);
      } else if (selectedEffect.type === 'frame') {
        const options = structuredClone(selectedEffect.options);

        if (options.shadow) {
          options.shadow.id = crypto.randomUUID();
        }

        if (options.text) {
          options.text.id = crypto.randomUUID();
        }

        const duplicate: FrameEffectDraft = {
          ...selectedEffect,
          id,
          slug,
          options,
        };

        writeEffects([...currentEffects, duplicate]);
      } else {
        const options = {
          ...selectedEffect.options,
        };

        const duplicate: FlashlightEffectDraft = {
          ...selectedEffect,
          id,
          slug,
          options,
        };

        writeEffects([...currentEffects, duplicate]);
      }

      setSelectedEffectId(id);
    });
  };

  const deleteEffect = () => {
    afterStylesSaved(() => {
      const currentEffects = getCurrentEffects();
      const selectedEffect = currentEffects.find((cur) => cur.id === selectedEffectId);

      if (!selectedEffect) {
        return;
      }

      const shouldDelete = window.confirm(`Удалить эффект «${selectedEffect.slug}»?`);

      if (!shouldDelete) {
        return;
      }

      const filteredEffects = currentEffects.filter((effectCur) => {
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
        data-active-book-effects-ui
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
          selectedEffect={selectedEffect ?? null}

          onClose={closeEffects}
          onBack={goBackToEffects}
          onAddAudio={addAudio}
          onAddVibration={addVibration}
          onAddFlashlight={addFlashlight}
          onAddBackground={addBackground}
          onAddFrame={addFrame}
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
