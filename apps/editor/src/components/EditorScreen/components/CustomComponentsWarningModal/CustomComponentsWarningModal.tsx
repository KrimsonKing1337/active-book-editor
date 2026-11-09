import { useEffect, useRef, useState } from 'react';

import type { MouseEvent, SyntheticEvent } from 'react';

import { createPortal } from 'react-dom';

import styles from './CustomComponentsWarningModal.module.scss';

type CustomComponentsWarningModalProps = {
  onClose: () => void;
  onConfirm: (doNotShowAgain: boolean) => void;
};

export const CustomComponentsWarningModal = ({ onClose, onConfirm }: CustomComponentsWarningModalProps) => {
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const mouseDownTargetRef = useRef<EventTarget | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    dialog.showModal();

    return () => {
      dialog.close();
    };
  }, []);

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    onClose();
  };

  const handleMouseDown = (event: MouseEvent<HTMLDialogElement>) => {
    mouseDownTargetRef.current = event.button === 0 ? event.target : null;
  };

  const handleMouseUp = (event: MouseEvent<HTMLDialogElement>) => {
    const isBackdrop = event.target === event.currentTarget;
    const startedOnBackdrop = mouseDownTargetRef.current === event.currentTarget;

    mouseDownTargetRef.current = null;

    if (isBackdrop && startedOnBackdrop) {
      onClose();
    }
  };

  return createPortal(
    <dialog
      ref={dialogRef}
      className={styles.Dialog}
      aria-labelledby="custom-components-warning-title"
      aria-describedby="custom-components-warning-description"
      onCancel={handleCancel}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <h2 id="custom-components-warning-title" className={styles.Title}>
        Импорт сторонней библиотеки
      </h2>

      <p id="custom-components-warning-description" className={styles.Description}>
        Подключаемая библиотека содержит сторонний JavaScript.
        Он будет выполняться внутри редактора и может получать доступ к данным текущего приложения.
        Устанавливайте библиотеки только из источников, которым доверяете.
      </p>

      <label className={styles.Checkbox}>
        <input
          type="checkbox"
          checked={doNotShowAgain}
          onChange={(event) => setDoNotShowAgain(event.target.checked)}
        />

        Больше не показывать
      </label>

      <div className={styles.Actions}>
        <button className={styles.Cancel} type="button" onClick={onClose}>
          Отмена
        </button>

        <button
          className={styles.Continue}
          type="button"
          onClick={() => onConfirm(doNotShowAgain)}
        >
          Продолжить импорт
        </button>
      </div>
    </dialog>,
    document.body,
  );
};
