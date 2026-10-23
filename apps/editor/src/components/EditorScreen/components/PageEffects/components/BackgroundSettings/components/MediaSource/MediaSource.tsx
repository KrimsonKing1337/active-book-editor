import { type ChangeEvent, useEffect, useId, useRef, useState } from 'react';

import type { FilePickerWindow, ProjectFileHandle } from '@project/fileSystemAccess';
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

const mediaTypes = {
  image: {
    label: 'Путь к изображению',
    placeholder: 'assets/forest.webp',
    description: 'Изображения',
    accept: 'image/*',
    extensions: ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.svg', '.bmp'],
  },
  video: {
    label: 'Путь к видео',
    placeholder: 'assets/fog.webm',
    description: 'Видеофайлы',
    accept: 'video/*',
    extensions: ['.mp4', '.webm', '.ogv', '.mov', '.m4v'],
  },
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

  const { label, placeholder, description, accept, extensions } = mediaTypes[kind];

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

    try {
      const [fileHandle] = await pickerWindow.showOpenFilePicker({
        id: 'active-book-' + kind,
        types: [{
          description,
          accept: {
            [accept]: extensions,
          },
        }],
      });

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

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (file) {
      await importFile(file);
    }
  };

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
          onChange={(event) => onChange(event.target.value)}
        />

        <button type="button" disabled={!canImport || isImporting} onClick={handleChooseFile}>
          {isImporting ? 'Импорт...' : 'Выбрать файл'}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          hidden
          onChange={(event) => void handleFileChange(event)}
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
