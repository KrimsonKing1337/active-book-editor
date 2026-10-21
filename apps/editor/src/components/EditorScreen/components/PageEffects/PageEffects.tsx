import { useState } from 'react';

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

import { usePageEffects } from './PageEffectsContext';

import { EffectsModal } from './components';

import styles from './PageEffects.module.scss';

export type PageEffectsProps = {
  project: BookProject | null;
};

export const PageEffects = ({ project }: PageEffectsProps) => {
  const { effects, writeEffects } = usePageEffects();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedEffectId, setSelectedEffectId] = useState<string | null>(null);

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

    const idAlreadyExists = effects.some((effectCur) => {
      if (effectCur.id === previousId) {
        return false;
      }

      return effectCur.id === nextId;
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

    const filteredEffects = effects.filter((effectCur) => {
      return effectCur.id !== selectedEffect.id;
    });

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
