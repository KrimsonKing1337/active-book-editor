import type { MouseEvent, ReactNode, SyntheticEvent } from 'react';
import { useEffect, useRef, useState, useMemo } from 'react';

import { createPortal } from 'react-dom';

import type { BookProject } from '@project/@types';

import type { EditorEffectDraft } from '../../@types';

import { AudioSettings } from '../AudioSettings';
import { VibrationSettings } from '../VibrationSettings';
import { FlashlightSettings } from '../FlashlightSettings';

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
  onAddFlashlight: () => void;
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
  onAddFlashlight,
  onSelectEffect,
  onUpdateEffect,
  onDuplicateEffect,
  onDeleteEffect,
}: EffectsModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const mouseDownTargetRef = useRef<EventTarget | null>(null);

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

  const isSettingsOpen = Boolean(selectedEffect);
  const isEffectsEmpty = effects.length === 0;
  const existingIds = effects.map((cur) => cur.id);

  const buttons = useMemo(() => {
    return [
      {
        id: 'audio',
        label: 'Добавить Audio',
        onClick: onAddAudio,
      },
      {
        id: 'vibration',
        label: 'Добавить Vibration',
        onClick: onAddVibration,
      },
      {
        id: 'flashlight',
        label: 'Добавить Flashlight',
        onClick: onAddFlashlight,
      },
    ];
  }, [onAddAudio, onAddVibration, onAddFlashlight]);

  let modalTitle = 'Эффекты страницы';
  let modalDescription = 'Невидимые эффекты, которые относятся к странице';
  let notice = 'Эффекты с автозапуском срабатывают при чтении собранной книги';

  let modalContent: ReactNode = (
    <>
      {isEffectsEmpty && (
        <div className={styles.Empty}>
          Пока нет эффектов
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

        {buttons.map((buttonCur) => {
          const { id, label, onClick } = buttonCur;

          return (
            <button
              key={id}
              className={styles.AddTile}
              type="button"
              onClick={onClick}
            >
              <span className={styles.AddIcon} aria-hidden="true">
                +
              </span>

              {label}
            </button>
          );
        })}
      </div>
    </>
  );

  if (selectedEffect?.type === 'audio') {
    modalTitle = 'Настройки Audio';
    modalDescription = 'Параметры сохраняются в book.json и применяются в собранной книге';
    notice = 'Звук с playOnLoad запускается только при чтении; в редакторе нажмите «Прослушать»';

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
    notice = 'Для тестирования вибрации в редакторе нажмите «Проверить»';

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
  } else if (selectedEffect?.type === 'flashlight') {
    modalTitle = 'Настройки Flashlight';
    modalDescription = 'Вспышка доступна на поддерживаемых устройствах; sideShadow имитирует её на экране';
    notice = 'Для тестирования вспышки в редакторе нажмите «Проверить»';

    modalContent = (
      <FlashlightSettings
        key={selectedEffect.id}
        effect={selectedEffect}
        existingIds={existingIds}
        onUpdate={onUpdateEffect}
        onDuplicate={onDuplicateEffect}
        onDelete={onDeleteEffect}
      />
    );
  }

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
