import { type ChangeEvent, useEffect, useRef, useState } from 'react';

import { Slider } from 'activeBook-core/components';

import type { BookProject } from '@project/@types';

import { AudioPreview } from '../AudioPreview';

import type { AudioEffectDraft, AudioOptions } from '../../@types';

import styles from './AudioSettings.module.scss';

type AudioSettingsProps = {
  effect: AudioEffectDraft;
  project: BookProject | null;
  existingIds: string[];
  onLoadingChange: (loading: boolean) => void;
  onUpdate: (previousId: string, effect: AudioEffectDraft) => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export const AudioSettings = ({
  effect,
  project,
  existingIds,
  onLoadingChange,
  onUpdate,
  onDuplicate,
  onDelete,
}: AudioSettingsProps) => {
  const { options } = effect;

  const [idDraft, setIdDraft] = useState(effect.id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isImporting, setIsImporting] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [importError, setImportError] = useState('');

  useEffect(() => {
    onLoadingChange(isImporting || isPreviewLoading);
  }, [isImporting, isPreviewLoading, onLoadingChange]);

  useEffect(() => {
    return () => onLoadingChange(false);
  }, [onLoadingChange]);


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

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleAudioFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) {
      return;
    }

    if (!project) {
      setImportError('Сначала создай или открой проект книги');
      return;
    }

    setIsImporting(true);
    setImportError('');

    try {
      const source = await project.storage.importAudioFile(file);
      updateOption('src', source);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Не удалось импортировать аудиофайл');
    } finally {
      setIsImporting(false);
    }
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
              ID должен быть уникальным. После изменения нажмите «Применить».
            </small>
          )}
        </div>

        <label className={styles.Field}>
          <span>
            Путь к аудиофайлу
          </span>

          <div className={styles.SourceRow}>
            <input
              type="text"
              value={options.src}
              onChange={handleSourceChange}
              placeholder="assets/audio/ambient.ogg"
              spellCheck={false}
            />

            <button type="button" onClick={handleChooseFile} disabled={!project}>
              Выбрать файл
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.ogg,.wav,.flac,.m4a,.aac"
              onChange={handleAudioFileChange}
              hidden
            />
          </div>

          <small>
            Выбранный файл копируется в assets/audio/ проекта, путь подставляется автоматически.
          </small>

          {importError && (
            <small role="alert" className={styles.ImportError}>
              {importError}
            </small>
          )}
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

        <small>
          Автозапуск работает только в собранной книге (режим чтения). В редакторе доступно ручное прослушивание
        </small>

        <AudioPreview
          effect={effect}
          project={project}
          onLoadingChange={setIsPreviewLoading}
        />

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
