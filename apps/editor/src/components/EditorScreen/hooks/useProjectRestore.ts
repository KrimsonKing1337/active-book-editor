import type { Editor } from '@tiptap/core';

import type { BookDocument } from '@active-book/book-builder/book';

import type { BookProject, PendingLocalProject } from '@project/@types';

import { restoreLastProject } from '@project/projectService';

import { useAsyncEffect } from '@hooks/useAsyncEffect';

import { getProjectErrorMessage } from '../utils';

import type { StateSetter } from './types';

type UseProjectRestoreParams = {
  editor: Editor | null;
  replaceDocument: (document: BookDocument) => void;
  setProject: StateSetter<BookProject | null>;
  setPendingRestore: StateSetter<PendingLocalProject | null>;
  setIsProjectBusy: StateSetter<boolean>;
  setProjectMessage: StateSetter<string>;
};

export const useProjectRestore = ({
  editor,
  replaceDocument,
  setProject,
  setPendingRestore,
  setIsProjectBusy,
  setProjectMessage,
}: UseProjectRestoreParams): void => {
  useAsyncEffect(async (signal) => {
    if (!editor) {
      return;
    }

    try {
      const result = await restoreLastProject();

      if (signal.aborted) {
        return;
      }

      if (result.status === 'opened') {
        replaceDocument(result.openedProject.document);
        setProject(result.openedProject.project);
        setProjectMessage(`Открыт последний проект: ${result.openedProject.project.name}`);
      } else if (result.status === 'permission-required') {
        setPendingRestore(result.project);
        setProjectMessage(`Нужно разрешение, чтобы снова открыть «${result.project.name}»`);
      } else if (result.status === 'unavailable') {
        setProjectMessage('Последний проект недоступен. Можно открыть другой проект вручную');
      } else {
        setProjectMessage('Новый несохранённый проект');
      }
    } catch (error) {
      if (signal.aborted) {
        return;
      }

      console.error('[project] Restore failed.', error);

      setProjectMessage(getProjectErrorMessage(error));
    } finally {
      if (!signal.aborted) {
        editor.setEditable(true);

        setIsProjectBusy(false);
      }
    }
  }, [editor, replaceDocument]);
};
