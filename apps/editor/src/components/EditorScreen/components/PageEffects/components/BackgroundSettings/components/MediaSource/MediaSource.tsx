import type { ChangeEvent } from 'react';

import type { FilePickerWindow, ProjectFileHandle } from '@project/fileSystemAccess';

import { useEffect, useId, useRef, useState } from 'react';

import { isAbortError } from '@project/errors';

import styles from '../../BackgroundSettings.module.scss';

type MediaKind = 'image' | 'video';

type MediaSourceProps = {
  kind: MediaKind;
  src: string;
  canImport: boolean;
  onChange: (path: string) => void;
  onImportAsset: (file: File, fileHandle?: ProjectFileHandle) => Promise<string>;
};

const imageMediaType = {
  label: 'Путь к изображению',
  placeholder: 'assets/forest.webp',
  description: 'Изображения',
  accept: 'image/*',
  extensions: ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.svg', '.bmp'],
};

const videoMediaType = {
  label: 'Путь к видео',
  placeholder: 'assets/fog.webm',
  description: 'Видеофайлы',
  accept: 'video/*',
  extensions: ['.mp4', '.webm', '.ogv', '.mov', '.m4v'],
};

const mediaTypes = {
  image: imageMediaType,
  video: videoMediaType,
};

export const MediaSource = ({ kind, src, canImport, onChange, onImportAsset }: MediaSourceProps) => {
  const sourceInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');

  const {
    label,
    placeholder,
    description,
    accept,
    extensions,
  } = mediaTypes[kind];

  const importFile = async (file: File, fileHandle?: ProjectFileHandle) => {
    setIsImporting(true);
    setImportError('');

    try {
      const path = await onImportAsset(file, fileHandle);

      onChangeRef.current(path);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Не удалось импортировать файл');
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

    const acceptedExtensions = {
      [accept]: extensions,
    };

    const mediaType = {
      description,
      accept: acceptedExtensions,
    };

    const pickerOptions = {
      id: `active-book-${kind}`,
      types: [mediaType],
    };

    try {
      const [fileHandle] = await pickerWindow.showOpenFilePicker(pickerOptions);

      if (!fileHandle) {
        return;
      }

      const file = await fileHandle.getFile();

      await importFile(file, fileHandle);
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }

      setImportError(error instanceof Error ? error.message : 'Не удалось выбрать файл');
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    e.target.value = '';

    if (file) {
      await importFile(file);
    }
  };

  const handleSourceChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    void handleFileChange(e);
  };

  const chooseFileButtonLabel = isImporting ? 'Импорт...' : 'Выбрать файл';
  const chooseFileButtonDisabled = !canImport || isImporting;

  return (
    <div className={styles.Field}>
      <label htmlFor={sourceInputId}>
        {label}
      </label>

      <div className={styles.SourceRow}>
        <input
          id={sourceInputId}
          type="text"
          value={src}
          placeholder={placeholder}
          spellCheck={false}
          onChange={handleSourceChange}
        />

        <button type="button" disabled={chooseFileButtonDisabled} onClick={handleChooseFile}>
          {chooseFileButtonLabel}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          hidden
          onChange={handleFileInputChange}
        />
      </div>

      <small className={styles.SourceNote}>
        Файлы из assets/ используются без копирования. Внешние файлы копируются в корень assets/
      </small>

      {importError && (
        <small className={styles.ImportError} role="alert">
          {importError}
        </small>
      )}
    </div>
  );
};
