import { type ChangeEvent, useEffect, useState } from 'react';

import { useSelector } from 'activeBook-core/store';
import { configSelectors } from 'activeBook-core/store/config';
import { mainSelectors } from 'activeBook-core/store/main';
import { useVibration } from 'activeBook-core/hooks/effects/vibration';

import type { VibrationEffectDraft, VibrationOptions } from '../../@types';

import styles from './VibrationSettings.module.scss';

type NumericVibrationOptionName = keyof Pick<VibrationOptions, 'duration' | 'delay'>;

type VibrationSettingsProps = {
  effect: VibrationEffectDraft;
  existingIds: string[];
  onUpdate: (previousId: string, effect: VibrationEffectDraft) => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export const VibrationSettings = ({
  effect,
  existingIds,
  onUpdate,
  onDuplicate,
  onDelete,
}: VibrationSettingsProps) => {
  const { options } = effect;

  const [idDraft, setIdDraft] = useState(effect.id);
  const { vibrationOn } = useVibration();

  const isVibrationAvailable = useSelector(mainSelectors.isVibrationAvailable);
  const vibrationIsEnabled = useSelector(configSelectors.vibration);

  const normalizedId = idDraft.trim();
  const idIsEmpty = normalizedId.length === 0;
  const idAlreadyExists = existingIds.some((id) => id !== effect.id && id === normalizedId);
  let idError = '';

  if (idIsEmpty) {
    idError = 'ID не может быть пустым';
  } else if (idAlreadyExists) {
    idError = 'Такой ID уже существует';
  }
  const canPreview = Boolean(isVibrationAvailable && vibrationIsEnabled && options.duration > 0);

  // A vibration started in the preview should stop when the settings dialog is closed.
  useEffect(() => {
    return () => {
      if (typeof navigator.vibrate === 'function') {
        navigator.vibrate(0);
      }
    };
  }, []);

  const updateId = () => {
    if (idError || idDraft === effect.id) {
      return;
    }

    onUpdate(effect.id, { ...effect, id: normalizedId });
  };

  const updateSlug = (slug: string) => {
    onUpdate(effect.id, { ...effect, slug });
  };

  const updateOption = <K extends keyof VibrationOptions>(name: K, value: VibrationOptions[K]) => {
    const nextOptions = { ...options, [name]: value };
    onUpdate(effect.id, { ...effect, options: nextOptions });
  };

  const updateNumber = (name: NumericVibrationOptionName, value: string) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return;
    }

    let normalized = Math.max(0, number);

    if (name === 'duration') {
      normalized = Math.min(10000, normalized);
    }

    updateOption(name, normalized);
  };

  const handleIdChange = (event: ChangeEvent<HTMLInputElement>) => {
    setIdDraft(event.target.value);
  };

  const handleSlugChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateSlug(event.target.value);
  };

  const handleDurationChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateNumber('duration', event.target.value);
  };

  const handleDelayChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateNumber('delay', event.target.value);
  };

  const handlePlayOnLoadChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateOption('playOnLoad', event.target.checked);
  };

  const handlePreview = () => {
    if (!canPreview) {
      return;
    }

    // The preview is immediate; delay only applies when opening the page in the reader.
    vibrationOn(options.duration);
  };

  let previewDescription = 'Вибрация недоступна в этом браузере или на этом устройстве.';

  if (isVibrationAvailable && !vibrationIsEnabled) {
    previewDescription = 'Вибрация отключена в настройках читателя.';
  } else if (canPreview) {
    previewDescription = 'Проверка запускается сразу, без задержки.';
  } else if (isVibrationAvailable) {
    previewDescription = 'Установите длительность больше нуля для проверки.';
  }

  return (
    <div className={styles.VibrationSettings}>
      <div className={styles.Fields}>
        <label className={styles.Field}>
          <span>
            Метка (slug)
          </span>

          <input
            type="text"
            value={effect.slug}
            onChange={handleSlugChange}
            placeholder="Например, лёгкий толчок"
          />

          <small>
            Подпись на плитке эффекта, не попадает в сборку
          </small>
        </label>

        <div className={styles.Field}>
          <label htmlFor="vibration-effect-id">
            ID эффекта
          </label>

          <div className={styles.IdRow}>
            <input
              id="vibration-effect-id"
              type="text"
              value={idDraft}
              onChange={handleIdChange}
              aria-invalid={Boolean(idError)}
              aria-describedby={idError ? 'vibration-effect-id-error' : undefined}
              spellCheck={false}
            />

            <button type="button" disabled={Boolean(idError) || idDraft === effect.id} onClick={updateId}>
              Применить
            </button>
          </div>

          {idError && (
            <small id="vibration-effect-id-error" className={styles.Error}>
              {idError}
            </small>
          )}
        </div>

        <label className={styles.Field}>
          <span>
            Длительность вибрации (мс)
          </span>

          <input
            type="number"
            min={0}
            max={10000}
            step={100}
            value={options.duration}
            onChange={handleDurationChange}
          />
        </label>

        <label className={styles.Field}>
          <span>
            Задержка (мс)
          </span>

          <input
            type="number"
            min={0}
            step={100}
            value={options.delay}
            onChange={handleDelayChange}
          />

          <small>
            Пауза перед вибрацией после открытия страницы. При проверке не учитывается
          </small>
        </label>

        <label className={styles.Checkbox}>
          <input
            type="checkbox"
            checked={options.playOnLoad}
            onChange={handlePlayOnLoadChange}
          />

          <span>
            Вибрировать при открытии страницы
          </span>
        </label>

        <div className={styles.Preview}>
          <button type="button" disabled={!canPreview} onClick={handlePreview}>
            Проверить вибрацию
          </button>

          <small>
            {previewDescription}
          </small>
        </div>
      </div>

      <div className={styles.Actions}>
        <button type="button" onClick={onDuplicate}>
          Дублировать
        </button>

        <button type="button" className={styles.Delete} onClick={onDelete}>
          Удалить эффект
        </button>
      </div>
    </div>
  );
};
