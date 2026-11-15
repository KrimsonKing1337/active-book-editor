import {
  type ChangeEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

import type { AudioEffectOptions } from '@active-book/core/@types';

import { Slider } from '@active-book/core/components';

import type { BookProject } from '@project/@types';
import type { FilePickerWindow, ProjectFileHandle } from '@project/@types/fileSystemAccess';

import { isAbortError } from '@project/errors';

import { AudioPreview } from '../AudioPreview';

import type {
  AudioEffectDraft,
  AudioOptions,
  OptionUpdater,
} from '../../@types';

import { IntegerInput } from '../IntegerInput';

import {
  TextInput,
  Select,
  Checkbox,
  Button,
  FileChooser,
} from '../EffectControls';

import styles from './AudioSettings.module.scss';

type NumericAudioOptionName = keyof Pick<
  AudioEffectOptions,
  | 'relativeVolume'
  | 'delay'
  | 'stopBy'
>;

export type AudioSettingsProps = {
  effect: AudioEffectDraft;
  project: BookProject | null;
  existingIds: string[];

  onLoadingChange: (loading: boolean, message?: string) => void;
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
  const [isImporting, setIsImporting] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [importError, setImportError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadingMessage = isImporting
      ? 'Загружаем аудиофайл...'
      : 'Подготавливаем аудио...';

    const isLoading = isImporting || isPreviewLoading;

    onLoadingChange(isLoading, loadingMessage);
  }, [
    isImporting,
    isPreviewLoading,
    onLoadingChange,
  ]);

  useEffect(() => {
    return () => {
      onLoadingChange(false);
    };
  }, [onLoadingChange]);

  const normalizedId = idDraft.trim();
  const idIsEmpty = normalizedId.length === 0;

  const idAlreadyExists = existingIds.some((idCur) => {
    if (idCur === effect.id) {
      return false;
    }

    return idCur === normalizedId;
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

  const updateOption: OptionUpdater<AudioOptions> = (name, value) => {
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

  const updateNumber = (name: NumericAudioOptionName, value: string) => {
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

  const importAudioFile = async (file: File, fileHandle?: ProjectFileHandle) => {
    if (!project) {
      setImportError('Сначала создайте или откройте проект книги');

      return;
    }

    setIsImporting(true);
    setImportError('');

    try {
      const source = await project.storage.importAssetFile(file, fileHandle);

      updateOption('src', source);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Не удалось импортировать аудиофайл');
    } finally {
      setIsImporting(false);
    }
  };

  const handleChooseFile = async () => {
    const pickerWindow = window as unknown as FilePickerWindow;

    if (typeof pickerWindow.showOpenFilePicker !== 'function') {
      fileInputRef.current?.click();

      return;
    }

    try {
      const [fileHandle] = await pickerWindow.showOpenFilePicker({
        id: 'active-book-audio',
        types: [
          {
            description: 'Аудиофайлы',
            accept: {
              'audio/*': [
                '.mp3',
                '.ogg',
                '.wav',
                '.flac',
                '.m4a',
                '.aac',
              ],
            },
          },
        ],
      });

      if (!fileHandle) {
        return;
      }

      const file = await fileHandle.getFile();

      await importAudioFile(file, fileHandle);
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }

      const errorText = error instanceof Error ? error.message : 'Не удалось выбрать аудиофайл';

      setImportError(errorText);
    }
  };

  const handleAudioFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) {
      return;
    }

    await importAudioFile(file);
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

  const handleDelayChange = (value: number) => {
    updateNumber('delay', String(value));
  };

  const handleStopByChange = (value: number) => {
    updateNumber('stopBy', String(value));
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
            Название эффекта
          </span>

          <TextInput
            type="text"
            maxLength={120}
            value={effect.slug}
            onChange={handleSlugChange}
            placeholder="Например, звук дождя"
          />

          <small>
            Человекочитаемая подпись на плитке эффекта
          </small>
        </label>

        <div className={styles.Field}>
          <label htmlFor="page-effect-id">
            ID эффекта
          </label>

          <div className={styles.IdRow}>
            <TextInput
              id="page-effect-id"
              type="text"
              maxLength={80}
              value={idDraft}
              onChange={handleIdDraftChange}
              aria-invalid={Boolean(idError)}
              aria-describedby={idDescriptionId}
              spellCheck={false}
            />

            <Button
              variant="success"
              disabled={idUpdateDisabled}
              onClick={updateId}
            >
              Применить
            </Button>
          </div>

          {idError && (
            <small id="page-effect-id-error" className={styles.IdError}>
              {idError}
            </small>
          )}

          {!idError && (
            <small>
              ID должен быть уникальным. После изменения нажмите «Применить»
            </small>
          )}
        </div>

        <div className={styles.Field}>
          <label htmlFor="audio-source-path">
            Путь к аудиофайлу
          </label>

          <FileChooser
            inputId="audio-source-path"
            value={options.src}
            fileInputRef={fileInputRef}
            accept="audio/*,.mp3,.ogg,.wav,.flac,.m4a,.aac"
            placeholder="assets/ambient.mp3"
            disabled={!project}

            onChange={(src) => updateOption('src', src)}
            onChoose={handleChooseFile}
            onFileChange={handleAudioFileChange}
          />

          <small>
            Файлы из assets/ используются без копирования.
            Внешние файлы копируются в корень assets/
          </small>

          {importError && (
            <small role="alert" className={styles.ImportError}>
              {importError}
            </small>
          )}
        </div>

        <label className={styles.Field}>
          <span>
            Тип звука
          </span>

          <Select value={options.type} onChange={handleTypeChange}>
            <option value="sfx">
              Звуковой эффект (sfx)
            </option>

            <option value="music">
              Музыка (music)
            </option>

            <option value="bg">
              Фоновый звук (bg)
            </option>
          </Select>
        </label>

        <Checkbox checked={options.playOnLoad} onChange={handlePlayOnLoadChange}>
          Воспроизводить при открытии страницы
        </Checkbox>

        <small>
          Автозапуск работает только в собранной книге (режим чтения).
          В редакторе доступно ручное прослушивание
        </small>

        <AudioPreview
          effect={effect}
          onLoadingChange={setIsPreviewLoading}
        />

        <Checkbox checked={options.loop} onChange={handleLoopChange}>
          Зациклить воспроизведение
        </Checkbox>

        <div className={styles.Field}>
          <span className={styles.VolumeLabel}>
            Относительная громкость

            <strong>
              {options.relativeVolume}%
            </strong>
          </span>

          <Slider value={options.relativeVolume} onChange={handleVolumeChange} />
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

              <IntegerInput
                min={0}
                max={999999}
                value={options.delay}
                onValueChange={handleDelayChange}
              />
            </label>

            <label className={styles.Field}>
              <span>
                Остановить через (мс)
              </span>

              <IntegerInput
                min={0}
                max={999999}
                value={options.stopBy}
                onValueChange={handleStopByChange}
              />

              <small>
                0 — без автоматической остановки
              </small>
            </label>

            <Checkbox checked={options.fadeOutWhenUnload} onChange={handleFadeOutChange}>
              Плавно затухать при выгрузке
            </Checkbox>

            <Checkbox checked={options.screamer} onChange={handleScreamerChange}>
              Режим скримера (сверхгромкость)
            </Checkbox>
          </div>
        </details>
      </div>

      <div className={styles.Actions}>
        <Button type="button" onClick={onDuplicate}>
          Дублировать
        </Button>

        <Button variant="danger" onClick={onDelete}>
          Удалить эффект
        </Button>
      </div>
    </div>
  );
};
