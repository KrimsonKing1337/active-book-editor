import type { MouseEvent, ReactNode, SyntheticEvent } from 'react';
import { useEffect, useRef } from 'react';

import { createPortal } from 'react-dom';

import type { BookProject } from '@project/@types';

import type { AudioEffectDraft } from '../../@types';

import { AudioSettings } from '../AudioSettings';

import { EffectTile } from './components';

import styles from './EffectsModal.module.scss';

type EffectsModalProps = {
  effects: AudioEffectDraft[];
  project: BookProject | null;
  selectedEffect: AudioEffectDraft | null;
  onClose: () => void;
  onBack: () => void;
  onAddAudio: () => void;
  onSelectEffect: (id: string) => void;
  onUpdateEffect: (previousId: string, effect: AudioEffectDraft) => void;
  onDuplicateEffect: () => void;
  onDeleteEffect: () => void;
};

export const EffectsModal = ({
  effects,
  project,
  selectedEffect,

  onClose,
  onBack,
  onAddAudio,
  onSelectEffect,
  onUpdateEffect,
  onDuplicateEffect,
  onDeleteEffect,
}: EffectsModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const isSettingsOpen = Boolean(selectedEffect);
  const isEffectsEmpty = effects.length === 0;
  const existingIds = effects.map((effect) => effect.id);

  let modalTitle = 'Эффекты страницы';
  let modalDescription = 'Невидимые эффекты, которые относятся к странице.';

  let modalContent: ReactNode = (
    <>
      {isEffectsEmpty && (
        <div className={styles.Empty}>
          Пока нет эффектов. Добавьте Audio, чтобы попробовать настройку звука
        </div>
      )}

      <div className={styles.Tiles}>
        {effects.map((effectCur) => {
          return (
            <EffectTile
              key={effectCur.id}
              effect={effectCur}
              onSelect={onSelectEffect}
            />
          );
        })}

        <button className={styles.AddTile} type="button" onClick={onAddAudio}>
          <span className={styles.AddIcon} aria-hidden="true">
            +
          </span>

          Добавить Audio
        </button>
      </div>
    </>
  );

  if (selectedEffect) {
    modalTitle = 'Настройки Audio';
    modalDescription = 'Параметры сохраняются в book.json и применяются в собранной книге';

    modalContent = (
      <AudioSettings
        key={selectedEffect.id}
        effect={selectedEffect}
        project={project}
        existingIds={existingIds}
        onUpdate={onUpdateEffect}
        onDuplicate={onDuplicateEffect}
        onDelete={onDeleteEffect}
      />
    );
  }

  useEffect(() => {
    const dialogElement = dialogRef.current;

    if (!dialogElement) {
      return;
    }

    dialogElement.showModal();

    return () => {
      dialogElement.close();
    };
  }, []);

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();

    if (isSettingsOpen) {
      onBack();

      return;
    }

    onClose();
  };

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    onClose();
  };

  return createPortal(
    <dialog
      ref={dialogRef}
      className={styles.Dialog}
      aria-label="Эффекты страницы"
      onCancel={handleCancel}
      onClick={handleBackdropClick}
    >
      <div className={styles.Header}>
        {isSettingsOpen && (
          <button className={styles.Back} type="button" onClick={onBack}>
            ← Назад
          </button>
        )}

        <div className={styles.Title}>
          <h2>
            {modalTitle}
          </h2>

          <p>
            {modalDescription}
          </p>
        </div>

        <button
          className={styles.Close}
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
        >
          ×
        </button>
      </div>

      <div className={styles.Content}>
        {modalContent}
      </div>

      <p className={styles.Notice}>
        Звук с playOnLoad запускается только при чтении; в редакторе нажмите «Прослушать».
      </p>
    </dialog>,
    document.body,
  );
};
