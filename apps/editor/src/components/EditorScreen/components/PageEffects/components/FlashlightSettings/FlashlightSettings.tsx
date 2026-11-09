import { type ChangeEvent, useState } from 'react';

import { useSelector } from '@active-book/core/store';

import { configSelectors } from '@active-book/core/store/config';
import { mainSelectors } from '@active-book/core/store/main';

import { useFlashlight } from '@active-book/core/hooks/effects';

import type { FlashlightEffectDraft, FlashlightOptions, OptionUpdater } from '../../@types';

import { IntegerInput } from '../IntegerInput';
import { TextInput, Checkbox, Button } from '../EffectControls';

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
    withFrameShadow: options.withFrameShadow,
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
  const canPreview = options.duration > 0 && (canUseTorch || options.withFrameShadow);

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

  const handleDurationChange = (value: number) => {
    updateNumber('duration', String(value));
  };

  const handleDelayChange = (value: number) => {
    updateNumber('delay', String(value));
  };

  const handleSpeedChange = (value: number) => {
    updateNumber('speed', String(value));
  };

  const handlePlayOnLoadChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateOption('playOnLoad', event.target.checked);
  };

  const handleFrameShadowChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateOption('withFrameShadow', event.target.checked);
  };

  const handlePreview = () => {
    if (!canPreview) {
      return;
    }

    // Preview plays immediately, bypassing the saved page-load delay.
    void flashlightOn(options.duration);
  };

  let previewDescription = 'Фонарик недоступен. Включите frameShadow для экранной имитации';

  if (!options.duration) {
    previewDescription = 'Установите длительность больше нуля для проверки';
  } else if (canPreview && canUseTorch && isFlashlightAvailable === null) {
    previewDescription = 'Проверка запускается сразу. Браузер может запросить доступ к камере';
  } else if (canPreview) {
    previewDescription = 'Проверка запускается сразу, без задержки';
  } else if (!flashlightEnabled) {
    previewDescription = 'Фонарик отключён в настройках. Можно использовать frameShadow';
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

          <TextInput
            type="text"
            maxLength={120}
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
            <TextInput
              id="flashlight-effect-id"
              type="text"
              maxLength={80}
              value={idDraft}
              onChange={handleIdChange}
              aria-invalid={Boolean(idError)}
              aria-describedby={flashLightEffectIdAriaDescribedBy}
              spellCheck={false}
            />

            <Button variant="success" disabled={flashLightEffectIdButtonIsDisabled} onClick={updateId}>
              Применить
            </Button>
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
            value={options.duration}
            onValueChange={handleDurationChange}
          />
        </label>

        <label className={styles.Field}>
          <span>
            Задержка (мс)
          </span>

          <IntegerInput
            min={0}
            max={999999}
            value={options.delay}
            onValueChange={handleDelayChange}
          />

          <small>
            Пауза перед вспышкой после открытия страницы. При проверке не учитывается
          </small>
        </label>

        <Checkbox checked={options.playOnLoad} onChange={handlePlayOnLoadChange}>
          Включать вспышку при открытии страницы
        </Checkbox>

        <Checkbox checked={options.withFrameShadow} onChange={handleFrameShadowChange}>
          Дублировать вспышку экранной подсветкой (frameShadow)
        </Checkbox>

        {options.withFrameShadow && (
          <label className={styles.Field}>
            <span>
              Период мерцания frameShadow (мс)
            </span>

            <IntegerInput
              min={1}
              max={99999}
              value={options.speed}
              onValueChange={handleSpeedChange}
            />
          </label>
        )}

        <div className={styles.Preview}>
          <Button type="button" disabled={!canPreview} onClick={handlePreview}>
            Проверить вспышку
          </Button>

          <small>
            {previewDescription}
          </small>
        </div>
      </div>

      <div className={styles.Actions}>
        <Button type="button" onClick={onDuplicate}>
          Дублировать
        </Button>

        <Button type="button" variant="danger" onClick={onDelete}>
          Удалить эффект
        </Button>
      </div>
    </div>
  );
};
