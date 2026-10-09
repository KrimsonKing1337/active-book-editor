import { useState } from 'react';

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

  const idError = !normalizedId
    ? 'ID не может быть пустым'
    : existingIds.some((id) => id !== effect.id && id === normalizedId)
      ? 'Такой ID уже существует'
      : null;

  const updateId = () => {
    if (idError || idDraft === effect.id) {
      return;
    }

    onUpdate(effect.id, { ...effect, id: normalizedId });
  };

  const updateSlug = (slug: string) => {
    onUpdate(effect.id, { ...effect, slug });
  };

  const updateOption = <K extends keyof AudioOptions>(name: K, value: AudioOptions[K]) => {
    onUpdate(effect.id, {
      ...effect,
      options: {
        ...options,
        [name]: value,
      },
    });
  };

  const updateNumber = (name: 'relativeVolume' | 'delay' | 'stopBy', value: string) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return;
    }

    const normalized = name === 'relativeVolume'
      ? Math.max(0, Math.min(100, number))
      : Math.max(0, number);

    updateOption(name, normalized);
  };

  return (
    <div className={styles.AudioSettings}>
      <div className={styles.Fields}>
        <label className={styles.Field}>
          <span>Метка (slug)</span>
          <input
            type="text"
            value={effect.slug}
            onChange={(event) => updateSlug(event.target.value)}
            placeholder="Например, звук дождя"
          />
          <small>Человекочитаемая подпись на плитке эффекта.</small>
        </label>

        <div className={styles.Field}>
          <label htmlFor="page-effect-id">ID эффекта</label>
          <div className={styles.IdRow}>
            <input
              id="page-effect-id"
              type="text"
              value={idDraft}
              onChange={(event) => setIdDraft(event.target.value)}
              aria-invalid={!!idError}
              aria-describedby={idError ? 'page-effect-id-error' : undefined}
              spellCheck={false}
            />
            <button
              type="button"
              disabled={!!idError || idDraft === effect.id}
              onClick={updateId}
            >
              Применить
            </button>
          </div>
          {idError ? (
            <small id="page-effect-id-error" className={styles.IdError}>{idError}</small>
          ) : (
            <small>ID должен быть уникальным. После изменения нажми «Применить».</small>
          )}
        </div>

        <label className={styles.Field}>
          <span>Путь к аудиофайлу</span>
          <input
            type="text"
            value={options.src}
            onChange={(event) => updateOption('src', event.target.value)}
            placeholder="assets/audio/ambient.ogg"
            spellCheck={false}
          />
          <small>Пока можно указать путь вручную. Выбор файлов из проекта добавим позже.</small>
        </label>

        <label className={styles.Field}>
          <span>Тип звука</span>
          <select
            value={options.type}
            onChange={(event) => updateOption('type', event.target.value as AudioOptions['type'])}
          >
            <option value="sfx">Звуковой эффект (sfx)</option>
            <option value="music">Музыка (music)</option>
            <option value="bg">Фоновый звук (bg)</option>
          </select>
        </label>

        <label className={styles.Checkbox}>
          <input
            type="checkbox"
            checked={options.playOnLoad}
            onChange={(event) => updateOption('playOnLoad', event.target.checked)}
          />
          <span>Воспроизводить при открытии страницы</span>
        </label>

        <label className={styles.Checkbox}>
          <input
            type="checkbox"
            checked={options.loop}
            onChange={(event) => updateOption('loop', event.target.checked)}
          />
          <span>Зациклить воспроизведение</span>
        </label>

        <label className={styles.Field}>
          <span className={styles.VolumeLabel}>
            Относительная громкость
            <strong>{options.relativeVolume}%</strong>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={options.relativeVolume}
            onChange={(event) => updateNumber('relativeVolume', event.target.value)}
          />
        </label>

        <details className={styles.Advanced}>
          <summary>Дополнительные параметры</summary>

          <div className={styles.AdvancedFields}>
            <label className={styles.Field}>
              <span>Задержка (мс)</span>
              <input
                type="number"
                min={0}
                step={100}
                value={options.delay}
                onChange={(event) => updateNumber('delay', event.target.value)}
              />
            </label>

            <label className={styles.Field}>
              <span>Остановить через (мс)</span>
              <input
                type="number"
                min={0}
                step={100}
                value={options.stopBy}
                onChange={(event) => updateNumber('stopBy', event.target.value)}
              />
              <small>0 — без автоматической остановки.</small>
            </label>

            <label className={styles.Checkbox}>
              <input
                type="checkbox"
                checked={options.fadeOutWhenUnload}
                onChange={(event) => updateOption('fadeOutWhenUnload', event.target.checked)}
              />
              <span>Плавно затухать при выгрузке</span>
            </label>

            <label className={styles.Checkbox}>
              <input
                type="checkbox"
                checked={options.screamer}
                onChange={(event) => updateOption('screamer', event.target.checked)}
              />
              <span>Режим скримера (полная громкость)</span>
            </label>
          </div>
        </details>
      </div>

      <div className={styles.Actions}>
        <button type="button" onClick={onDuplicate}>Дублировать</button>
        <button type="button" className={styles.Delete} onClick={onDelete}>Удалить эффект</button>
      </div>
    </div>
  );
};
