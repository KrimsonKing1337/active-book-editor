import { type ChangeEvent, useState } from 'react';

import { useSelector } from 'activeBook-core/store';

import { configSelectors } from 'activeBook-core/store/config';
import { mainSelectors } from 'activeBook-core/store/main';

import { useFlashlight } from 'activeBook-core/hooks/effects';

import type { FlashlightEffectDraft, FlashlightOptions, OptionUpdater } from '../../@types';

import { IntegerInput } from '../IntegerInput';

import styles from './FlashlightSettings.module.scss';

type NumericFlashlightOptionName = keyof Pick<FlashlightOptions, 'duration' | 'delay' | 'speed'>;

export type FlashlightSettingsProps = {
  effect: FlashlightEffectDraft;
  existingIds: string[];

  onUpdate: (previousId: string, effect: FlashlightEffectDraft) => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export const FlashlightSettings = ({
  effect,
  existingIds,
  onUpdate,
  onDuplicate,
  onDelete,
}: FlashlightSettingsProps) => {
  const { options } = effect;

  const [idDraft, setIdDraft] = useState(effect.id);

  const { flashlightOn } = useFlashlight({
    withSideShadow: options.withSideShadow,
    speed: options.speed,
  });

  const isFlashlightAvailable = useSelector(mainSelectors.isFlashlightAvailable);
  const flashlightEnabled = useSelector(configSelectors.flashlight);

  const normalizedId = idDraft.trim();
  const idIsEmpty = normalizedId.length === 0;

  const idAlreadyExists = existingIds.some((idCur) => {
    return idCur !== effect.id && idCur === normalizedId;
  });

  let idError = '';

  if (idIsEmpty) {
    idError = 'ID не может быть пустым';
  } else if (idAlreadyExists) {
    idError = 'Такой ID уже существует';
  }

  const canUseTorch = flashlightEnabled && isFlashlightAvailable !== false;
  const canPreview = options.duration > 0 && (canUseTorch || options.withSideShadow);

  const updateId = () => {
    if (idError || idDraft === effect.id) {
      return;
    }

    const updatedEffect = {
      ...effect,
      id: normalizedId,
    };

    onUpdate(effect.id, updatedEffect);
  };

  const updateSlug = (slug: string) => {
    const updatedEffect = {
      ...effect,
      slug,
    };

    onUpdate(effect.id, updatedEffect);
  };

  const updateOption: OptionUpdater<FlashlightOptions> = (name, value) => {
    const updatedEffect = {
      ...effect,

      options: {
        ...options,
        [name]: value,
      },
    };

    onUpdate(effect.id, updatedEffect);
  };

  const updateNumber = (name: NumericFlashlightOptionName, value: string) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return;
    }

    let normalized = Math.max(0, number);

    if (name === 'duration') {
      normalized = Math.min(10000, normalized);
    } else if (name === 'speed') {
      normalized = Math.max(1, normalized);
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

  const handleSpeedChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateNumber('speed', event.target.value);
  };

  const handlePlayOnLoadChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateOption('playOnLoad', event.target.checked);
  };

  const handleSideShadowChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateOption('withSideShadow', event.target.checked);
  };

  const handlePreview = () => {
    if (!canPreview) {
      return;
    }

    // Preview plays immediately, bypassing the saved page-load delay.
    void flashlightOn(options.duration);
  };

  let previewDescription = 'Фонарик недоступен. Включите sideShadow для экранной имитации';

  if (!options.duration) {
    previewDescription = 'Установите длительность больше нуля для проверки';
  } else if (canPreview && canUseTorch && isFlashlightAvailable === null) {
    previewDescription = 'Проверка запускается сразу. Браузер может запросить доступ к камере';
  } else if (canPreview) {
    previewDescription = 'Проверка запускается сразу, без задержки';
  } else if (!flashlightEnabled) {
    previewDescription = 'Фонарик отключён в настройках. Можно использовать sideShadow';
  }

  const flashLightEffectIdAriaDescribedBy = idError ? 'flashlight-effect-id-error' : undefined;
  const flashLightEffectIdButtonIsDisabled = Boolean(idError) || idDraft === effect.id;

  return (
    <div className={styles.FlashlightSettings}>
      <div className={styles.Fields}>
        <label className={styles.Field}>
          <span>
            Название эффекта
          </span>

          <input
            type="text"
            value={effect.slug}
            onChange={handleSlugChange}
            placeholder="Например, разряд молнии"
          />

          <small>
            Подпись на плитке эффекта, не попадает в сборку
          </small>
        </label>

        <div className={styles.Field}>
          <label htmlFor="flashlight-effect-id">
            ID эффекта
          </label>

          <div className={styles.IdRow}>
            <input
              id="flashlight-effect-id"
              type="text"
              value={idDraft}
              onChange={handleIdChange}
              aria-invalid={Boolean(idError)}
              aria-describedby={flashLightEffectIdAriaDescribedBy}
              spellCheck={false}
            />

            <button type="button" disabled={flashLightEffectIdButtonIsDisabled} onClick={updateId}>
              Применить
            </button>
          </div>

          {idError && (
            <small id="flashlight-effect-id-error" className={styles.Error}>
              {idError}
            </small>
          )}
        </div>

        <label className={styles.Field}>
          <span>
            Длительность вспышки (мс)
          </span>

          <IntegerInput
            min={0}
            max={10000}
            maxDigits={5}
            step={100}
            value={options.duration}
            onChange={handleDurationChange}
          />
        </label>

        <label className={styles.Field}>
          <span>
            Задержка (мс)
          </span>

          <IntegerInput
            min={0}
            step={100}
            value={options.delay}
            onChange={handleDelayChange}
          />

          <small>
            Пауза перед вспышкой после открытия страницы. При проверке не учитывается
          </small>
        </label>

        <label className={styles.Checkbox}>
          <input
            type="checkbox"
            checked={options.playOnLoad}
            onChange={handlePlayOnLoadChange}
          />

          <span>
            Включать вспышку при открытии страницы
          </span>
        </label>

        <label className={styles.Checkbox}>
          <input
            type="checkbox"
            checked={options.withSideShadow}
            onChange={handleSideShadowChange}
          />

          <span>
            Дублировать вспышку экранной подсветкой (sideShadow)
          </span>
        </label>

        {options.withSideShadow && (
          <label className={styles.Field}>
            <span>
              Период мерцания sideShadow (мс)
            </span>

            <IntegerInput
              min={1}
              step={10}
              value={options.speed}
              onChange={handleSpeedChange}
            />
          </label>
        )}

        <div className={styles.Preview}>
          <button type="button" disabled={!canPreview} onClick={handlePreview}>
            Проверить вспышку
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
