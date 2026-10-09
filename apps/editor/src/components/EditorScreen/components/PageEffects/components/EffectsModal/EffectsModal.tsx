import { type MouseEvent, type ReactNode, type SyntheticEvent, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import type { AudioEffectDraft } from '../../@types';

import { AudioSettings } from '../AudioSettings';

import { EffectTile } from './components';

import styles from './EffectsModal.module.scss';

type EffectsModalProps = {
  effects: AudioEffectDraft[];
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
          Пока нет эффектов. Добавь Audio, чтобы попробовать настройку звука.
        </div>
      )}

      <div className={styles.Tiles}>
        {effects.map((effect) => (
          <EffectTile
            key={effect.id}
            effect={effect}
            onSelect={onSelectEffect}
          />
        ))}

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
    modalDescription = 'Измени параметры звука. Пока изменения видны только в редакторе.';

    modalContent = (
      <AudioSettings
        key={selectedEffect.id}
        effect={selectedEffect}
        existingIds={existingIds}
        onUpdate={onUpdateEffect}
        onDuplicate={onDuplicateEffect}
        onDelete={onDeleteEffect}
      />
    );
  }

  useEffect(() => {
    const dialog = dialogRef.current;

    dialog?.showModal();

    return () => {
      dialog?.close();
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

        <button className={styles.Close} type="button" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
      </div>

      <div className={styles.Content}>
        {modalContent}
      </div>

      <p className={styles.Notice}>
        UI-прототип: эффекты не сохраняются в книге и пока не воспроизводятся.
      </p>
    </dialog>,
    document.body,
  );
};
