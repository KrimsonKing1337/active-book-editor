import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import type { AudioEffectDraft } from '../../@types';

import { AudioSettings } from '../AudioSettings';

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

  useEffect(() => {
    const dialog = dialogRef.current;

    dialog?.showModal();

    return () => {
      dialog?.close();
    };
  }, []);

  return createPortal(
    <dialog
      ref={dialogRef}
      className={styles.Dialog}
      aria-label="Эффекты страницы"
      onCancel={(event) => {
        event.preventDefault();

        if (selectedEffect) {
          onBack();
        } else {
          onClose();
        }
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={styles.Header}>
        {selectedEffect && (
          <button className={styles.Back} type="button" onClick={onBack}>
            ← Назад
          </button>
        )}

        <div className={styles.Title}>
          <h2>{selectedEffect ? 'Настройки Audio' : 'Эффекты страницы'}</h2>
          <p>
            {selectedEffect
              ? 'Измени параметры звука. Пока изменения видны только в редакторе.'
              : 'Невидимые эффекты, которые относятся к странице.'}
          </p>
        </div>

        <button className={styles.Close} type="button" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
      </div>

      <div className={styles.Content}>
        {selectedEffect ? (
          <AudioSettings
            key={selectedEffect.id}
            effect={selectedEffect}
            existingIds={effects.map((effect) => effect.id)}
            onUpdate={onUpdateEffect}
            onDuplicate={onDuplicateEffect}
            onDelete={onDeleteEffect}
          />
        ) : (
          <>
            {effects.length === 0 && (
              <div className={styles.Empty}>
                Пока нет эффектов. Добавь Audio, чтобы попробовать настройку звука.
              </div>
            )}

            <div className={styles.Tiles}>
              {effects.map((effect) => (
                <button
                  key={effect.id}
                  className={styles.Tile}
                  type="button"
                  onClick={() => onSelectEffect(effect.id)}
                >
                  <span className={styles.Kind}>Audio · {effect.options.type}</span>
                  <strong>{effect.slug.trim() || 'Без названия'}</strong>
                  <span className={styles.Source}>{effect.options.src || 'Файл не выбран'}</span>
                  <code>{effect.id}</code>
                </button>
              ))}

              <button className={styles.AddTile} type="button" onClick={onAddAudio}>
                <span className={styles.AddIcon} aria-hidden="true">+</span>
                Добавить Audio
              </button>
            </div>
          </>
        )}
      </div>

      <p className={styles.Notice}>
        UI-прототип: эффекты не сохраняются в книге и пока не воспроизводятся.
      </p>
    </dialog>,
    document.body,
  );
};
