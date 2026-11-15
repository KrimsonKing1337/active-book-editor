import { type ChangeEvent, useRef } from 'react';

import type { Editor } from '@tiptap/core';

import type { BookProject } from '@project/@types';

import type { MediaKind } from '../MediaNode/utils';

import { useMediaImport } from './hooks';
import { mediaFormats } from './utils';

type Inputs = Record<MediaKind, HTMLInputElement | null>;

type MediaInsertProps = {
  editor: Editor | null;
  project: BookProject | null;
  scope: string;
  disabled: boolean;
};

type Control = {
  kind: MediaKind;
  label: string;
};

export const MediaInsert = ({ disabled, ...options }: MediaInsertProps) => {
  const inputs = useRef<Inputs>({ image: null, video: null });

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

  const handleFile = (e: ChangeEvent<HTMLInputElement>, kind: MediaKind) => {
    const file = e.target.files?.[0];

    e.target.value = '';

    if (file) {
      void importFile({ kind, file });
    }
  };

  const controls: Control[] = [
    { kind: 'image', label: 'Добавить изображение' },
    { kind: 'video', label: 'Добавить видео' },
  ];

  return (
    <>
      {controls.map(({ kind, label }) => {
        const ref = (element: HTMLInputElement | null) => {
          inputs.current[kind] = element;
        };

        const inputAccept = Object.values(mediaFormats[kind]).flat().join(',');

        return (
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
              ref={ref}
              type="file"
              aria-label={label}
              hidden
              accept={inputAccept}
              disabled={isDisabled}
              onChange={(e) => handleFile(e, kind)}
            />
          </span>
        );
      })}

      {error && (
        <span role="alert">
          {error}
        </span>
      )}
    </>
  );
};
