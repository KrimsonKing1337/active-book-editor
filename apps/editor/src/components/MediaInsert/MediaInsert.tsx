import type { ChangeEvent } from 'react';

import { useRef } from 'react';

import type { Editor } from '@tiptap/core';

import type { BookProject } from '@project/@types';

import type { MediaKind } from '../MediaNode/attributes';

import { useMediaImport } from './hooks';
import { mediaFormats } from './utils';

type MediaInsertProps = {
  editor: Editor | null;
  project: BookProject | null;
  scope: string;
  disabled: boolean;
};

export const MediaInsert = ({ disabled, ...options }: MediaInsertProps) => {
  const inputs = useRef<Record<MediaKind, HTMLInputElement | null>>({ image: null, video: null });
  const {
    isImporting,
    error,
    importFile,
    chooseFile,
  } = useMediaImport(options);
  const isDisabled = disabled || isImporting || !options.project;
  let title: string | undefined;

  if (!options.project) {
    title = 'Сначала сохраните или откройте проект';
  }

  const choose = async (kind: MediaKind) => {
    const hasChosen = await chooseFile(kind);

    if (!hasChosen) {
      inputs.current[kind]?.click();
    }
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>, kind: MediaKind) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (file) {
      void importFile({ kind, file });
    }
  };

  const controls: {
    kind: MediaKind;
    label: string;
  }[] = [{ kind: 'image', label: 'Добавить изображение' }, { kind: 'video', label: 'Добавить видео' }];

  return (
    <>
      {controls.map(({ kind, label }) => (
        <span key={kind}>
          <button
            type="button"
            title={title}
            disabled={isDisabled}
            onClick={() => void choose(kind)}
          >
            {label}
          </button>

          <input
            ref={(element) => {
              inputs.current[kind] = element;
            }}
            type="file"
            aria-label={label}
            hidden
            accept={Object.values(mediaFormats[kind]).flat().join(',')}
            disabled={isDisabled}
            onChange={(event) => handleFile(event, kind)}
          />
        </span>
      ))}

      {error && (
        <span role="alert">
          {error}
        </span>
      )}
    </>
  );
};
