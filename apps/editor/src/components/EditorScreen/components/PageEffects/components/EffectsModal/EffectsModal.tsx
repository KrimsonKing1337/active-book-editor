import type { MouseEvent, ReactNode, SyntheticEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import { createPortal } from 'react-dom';

import type { BookProject } from '@project/@types';

import type { EditorEffectDraft } from '../../@types';

import { AudioSettings } from '../AudioSettings';
import { VibrationSettings } from '../VibrationSettings';

import { EffectTile } from './components';

import styles from './EffectsModal.module.scss';

type EffectsModalProps = {
  effects: EditorEffectDraft[];
  project: BookProject | null;
  selectedEffect: EditorEffectDraft | null;
  onClose: () => void;
  onBack: () => void;
  onAddAudio: () => void;
  onAddVibration: () => void;
  onSelectEffect: (id: string) => void;
  onUpdateEffect: (previousId: string, effect: EditorEffectDraft) => void;
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
  onAddVibration,
  onSelectEffect,
  onUpdateEffect,
  onDuplicateEffect,
  onDeleteEffect,
}: EffectsModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const mouseDownTargetRef = useRef<EventTarget | null>(null);

  const isSettingsOpen = Boolean(selectedEffect);
  const isEffectsEmpty = effects.length === 0;
  const existingIds = effects.map((effect) => effect.id);

  let modalTitle = 'Эффекты страницы';
  let modalDescription = 'Невидимые эффекты, которые относятся к странице.';
  let notice = 'Эффекты с автозапуском срабатывают при чтении собранной книги.';

  let modalContent: ReactNode = (
    <>
      {isEffectsEmpty && (
        <div className={styles.Empty}>
          Пока нет эффектов. Добавьте Audio или Vibration
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

        <button className={styles.AddTile} type="button" onClick={onAddVibration}>
          <span className={styles.AddIcon} aria-hidden="true">
            +
          </span>

          Добавить Vibration
        </button>
      </div>
    </>
  );

  if (selectedEffect?.type === 'audio') {
    modalTitle = 'Настройки Audio';
    modalDescription = 'Параметры сохраняются в book.json и применяются в собранной книге';
    notice = 'Звук с playOnLoad запускается только при чтении; в редакторе нажмите «Прослушать».';

    modalContent = (
      <AudioSettings
        key={selectedEffect.id}
        effect={selectedEffect}
        project={project}
        existingIds={existingIds}
        onLoadingChange={setIsLoading}
        onUpdate={onUpdateEffect}
        onDuplicate={onDuplicateEffect}
        onDelete={onDeleteEffect}
      />
    );
  } else if (selectedEffect?.type === 'vibration') {
    modalTitle = 'Настройки Vibration';
    modalDescription = 'Вибрация запускается при открытии страницы на поддерживаемом устройстве';
    notice = 'Для тестирования вибрации в редакторе нажмите «Проверить».';

    modalContent = (
      <VibrationSettings
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

    if (isLoading) {
      return;
    }

    if (isSettingsOpen) {
      onBack();

      return;
    }

    onClose();
  };

  const handleBackdropMouseDown = (event: MouseEvent<HTMLDialogElement>) => {
    mouseDownTargetRef.current = event.button === 0 ? event.target : null;
  };

  const handleBackdropMouseUp = (event: MouseEvent<HTMLDialogElement>) => {
    const targetAndCurrentTargetAreEqual = event.target === event.currentTarget;
    const startedOnBackdrop = mouseDownTargetRef.current === event.currentTarget;

    mouseDownTargetRef.current = null;

    if (isLoading || !startedOnBackdrop || !targetAndCurrentTargetAreEqual) {
      return;
    }

    onClose();
  };

  return createPortal(
    <dialog
      ref={dialogRef}
      className={styles.Dialog}
      aria-label="Эффекты страницы"
      aria-busy={isLoading}
      onCancel={handleCancel}
      onMouseDown={handleBackdropMouseDown}
      onMouseUp={handleBackdropMouseUp}
    >
      <div className={styles.Header} inert={isLoading}>
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

      <div className={styles.Content} inert={isLoading}>
        {modalContent}
      </div>

      <p className={styles.Notice} inert={isLoading}>
        {notice}
      </p>

      {isLoading && (
        <div className={styles.LoadingOverlay} role="status" aria-live="polite">
          <span className={styles.LoadingSpinner} aria-hidden="true" />

          Подготавливаем аудио...
        </div>
      )}
    </dialog>,
    document.body,
  );
};
