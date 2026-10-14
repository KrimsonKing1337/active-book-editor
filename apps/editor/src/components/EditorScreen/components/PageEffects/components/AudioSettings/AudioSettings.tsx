import { type ChangeEvent, useState } from 'react';

import { Slider } from 'activeBook-core/components';

import type { AudioEffectDraft, AudioOptions } from '../../@types';

import styles from './AudioSettings.module.scss';

type AudioSettingsProps = {
  effect: AudioEffectDraft;
  existingIds: string[];
  onUpdate: (previousId: string, effect: AudioEffectDraft) => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export const AudioSettings = ({
  effect,
  existingIds,
  onUpdate,
  onDuplicate,
  onDelete,
}: AudioSettingsProps) => {
  const { options } = effect;

  const [idDraft, setIdDraft] = useState(effect.id);

  const normalizedId = idDraft.trim();
  const idIsEmpty = normalizedId.length === 0;

  const idAlreadyExists = existingIds.some((id) => {
    if (id === effect.id) {
      return false;
    }

    return id === normalizedId;
  });

  let idError: string | null = null;

  if (idIsEmpty) {
    idError = 'ID не может быть пустым';
  } else if (idAlreadyExists) {
    idError = 'Такой ID уже существует';
  }

  const idUpdateDisabled = Boolean(idError) || idDraft === effect.id;

  let idDescriptionId: string | undefined;

  if (idError) {
    idDescriptionId = 'page-effect-id-error';
  }

  const updateId = () => {
    if (idUpdateDisabled) {
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

  const updateOption = <K extends keyof AudioOptions>(name: K, value: AudioOptions[K]) => {
    const updatedOptions = {
      ...options,
      [name]: value,
    };

    const updatedEffect = {
      ...effect,
      options: updatedOptions,
    };

    onUpdate(effect.id, updatedEffect);
  };

  const updateNumber = (name: 'relativeVolume' | 'delay' | 'stopBy', value: string) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return;
    }

    let normalized = Math.max(0, number);

    if (name === 'relativeVolume') {
      normalized = Math.min(100, normalized);
    }

    updateOption(name, normalized);
  };

  const handleIdDraftChange = (event: ChangeEvent<HTMLInputElement>) => {
    setIdDraft(event.target.value);
  };

  const handleSlugChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateSlug(event.target.value);
  };

  const handleSourceChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateOption('src', event.target.value);
  };

  const handleTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const type = event.target.value as AudioOptions['type'];

    updateOption('type', type);
  };

  const handlePlayOnLoadChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateOption('playOnLoad', event.target.checked);
  };

  const handleLoopChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateOption('loop', event.target.checked);
  };

  const handleVolumeChange = (value: number) => {
    updateOption('relativeVolume', value);
  };

  const handleDelayChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateNumber('delay', event.target.value);
  };

  const handleStopByChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateNumber('stopBy', event.target.value);
  };

  const handleFadeOutChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateOption('fadeOutWhenUnload', event.target.checked);
  };

  const handleScreamerChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateOption('screamer', event.target.checked);
  };

  return (
    <div className={styles.AudioSettings}>
      <div className={styles.Fields}>
        <label className={styles.Field}>
          <span>
            Метка (slug)
          </span>

          <input
            type="text"
            value={effect.slug}
            onChange={handleSlugChange}
            placeholder="Например, звук дождя"
          />

          <small>
            Человекочитаемая подпись на плитке эффекта.
          </small>
        </label>

        <div className={styles.Field}>
          <label htmlFor="page-effect-id">
            ID эффекта
          </label>

          <div className={styles.IdRow}>
            <input
              id="page-effect-id"
              type="text"
              value={idDraft}
              onChange={handleIdDraftChange}
              aria-invalid={Boolean(idError)}
              aria-describedby={idDescriptionId}
              spellCheck={false}
            />

            <button
              type="button"
              disabled={idUpdateDisabled}
              onClick={updateId}
            >
              Применить
            </button>
          </div>

          {idError && (
            <small id="page-effect-id-error" className={styles.IdError}>
              {idError}
            </small>
          )}

          {!idError && (
            <small>
              ID должен быть уникальным. После изменения нажми «Применить».
            </small>
          )}
        </div>

        <label className={styles.Field}>
          <span>
            Путь к аудиофайлу
          </span>

          <input
            type="text"
            value={options.src}
            onChange={handleSourceChange}
            placeholder="assets/audio/ambient.ogg"
            spellCheck={false}
          />

          <small>
            Пока можно указать путь вручную. Выбор файлов из проекта добавим позже.
          </small>
        </label>

        <label className={styles.Field}>
          <span>
            Тип звука
          </span>

          <select value={options.type} onChange={handleTypeChange}>
            <option value="sfx">
              Звуковой эффект (sfx)
            </option>

            <option value="music">
              Музыка (music)
            </option>

            <option value="bg">
              Фоновый звук (bg)
            </option>
          </select>
        </label>

        <label className={styles.Checkbox}>
          <input
            type="checkbox"
            checked={options.playOnLoad}
            onChange={handlePlayOnLoadChange}
          />

          <span>
            Воспроизводить при открытии страницы
          </span>
        </label>

        <label className={styles.Checkbox}>
          <input
            type="checkbox"
            checked={options.loop}
            onChange={handleLoopChange}
          />

          <span>
            Зациклить воспроизведение
          </span>
        </label>

        <div className={styles.Field}>
          <span className={styles.VolumeLabel}>
            Относительная громкость

            <strong>
              {options.relativeVolume}%
            </strong>
          </span>

          <Slider
            value={options.relativeVolume}
            onChange={handleVolumeChange}
          />
        </div>

        <details className={styles.Advanced}>
          <summary>
            Дополнительные параметры
          </summary>

          <div className={styles.AdvancedFields}>
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
            </label>

            <label className={styles.Field}>
              <span>
                Остановить через (мс)
              </span>

              <input
                type="number"
                min={0}
                step={100}
                value={options.stopBy}
                onChange={handleStopByChange}
              />

              <small>
                0 — без автоматической остановки.
              </small>
            </label>

            <label className={styles.Checkbox}>
              <input
                type="checkbox"
                checked={options.fadeOutWhenUnload}
                onChange={handleFadeOutChange}
              />

              <span>
                Плавно затухать при выгрузке
              </span>
            </label>

            <label className={styles.Checkbox}>
              <input
                type="checkbox"
                checked={options.screamer}
                onChange={handleScreamerChange}
              />

              <span>
                Режим скримера (полная громкость)
              </span>
            </label>
          </div>
        </details>
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
