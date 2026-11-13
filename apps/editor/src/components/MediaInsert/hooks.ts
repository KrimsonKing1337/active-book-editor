import {
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import type { Editor } from '@tiptap/core';

import type { BookProject } from '@project/@types';
import type { ProjectFileHandle } from '@project/fileSystemAccess';

import { isAbortError } from '@project/errors';

import type { MediaKind } from '../MediaNode/attributes';

import {
  assertMediaFile,
  hasFilePicker,
  mediaFormats,
} from './utils';

type MediaImportOptions = {
  editor: Editor | null;
  project: BookProject | null;
  scope: string;
};

type ImportSource = {
  kind: MediaKind;
  file: File;
  handle?: ProjectFileHandle;
};

export const useMediaImport = (options: MediaImportOptions) => {
  const current = useRef<MediaImportOptions | null>(options);
  const [isImporting, setImporting] = useState(false);
  const [error, setError] = useState('');

  const {
    editor,
    project,
    scope,
  } = options;

  useLayoutEffect(() => {
    current.current = {
      editor,
      project,
      scope,
    };
    setImporting(false);
    setError('');

    return () => {
      current.current = null;
    };
  }, [
    editor,
    project,
    scope,
  ]);

  const isCurrent = (owner: MediaImportOptions) => {
    return current.current?.editor === owner.editor && current.current?.project === owner.project
      && current.current?.scope === owner.scope && !owner.editor?.isDestroyed;
  };

  const importFile = async (source: ImportSource, owner = options) => {
    if (!owner.project || !owner.editor || !isCurrent(owner)) {
      return;
    }

    setImporting(true);
    setError('');

    try {
      assertMediaFile(source.file, source.kind);
      const src = await owner.project.storage.importAssetFile(source.file, source.handle);

      if (isCurrent(owner)) {
        const chain = owner.editor.chain().focus().insertContent({ type: source.kind, attrs: { src } });
        const inserted = chain.command(({ commands }) => {
          // An atom at a block edge needs a caret paragraph; within text it is already available.
          commands.createParagraphNear();

          return true;
        }).run();

        if (!inserted) {
          throw new Error('Не удалось вставить медиа в выбранное место документа');
        }
      }
    } catch (cause) {
      if (isCurrent(owner)) {
        setError(cause instanceof Error ? cause.message : 'Не удалось импортировать медиа');
      }
    } finally {
      if (isCurrent(owner)) {
        setImporting(false);
      }
    }
  };

  const chooseFile = async (kind: MediaKind): Promise<boolean> => {
    if (!hasFilePicker(window)) {
      return false;
    }

    const owner = options;
    setImporting(true);
    setError('');

    try {
      const [handle] = await window.showOpenFilePicker({
        id: `active-book-content-${kind}`,
        types: [{ description: 'Медиа', accept: mediaFormats[kind] }],
      });

      if (handle) {
        await importFile({
          kind,
          file: await handle.getFile(),
          handle,
        }, owner);
      }
    } catch (cause) {
      if (!isAbortError(cause) && isCurrent(owner)) {
        setError(cause instanceof Error ? cause.message : 'Не удалось выбрать файл');
      }
    } finally {
      if (isCurrent(owner)) {
        setImporting(false);
      }
    }

    return true;
  };

  return {
    isImporting,
    error,
    importFile,
    chooseFile,
  };
};
