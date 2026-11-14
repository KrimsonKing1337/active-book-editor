import { useCallback } from 'react';

import type { Editor } from '@tiptap/core';

import type { BookDocument } from '@active-book/book-builder/book';

import { buildProject } from '@build/buildProject';

import type { BookProject, PendingLocalProject } from '@project/@types';

import {
  clearCurrentProject,
  continueLastProject,
  isAbortError,
  openLocalProject,
} from '@project/projectService';

import { getHasPendingProjectChanges } from '@project/pendingOperations';

import type { BuildState } from '../@types';

import { createEmptyBook } from '../book/documents';
import { getProjectErrorMessage } from '../utils';

import type { StateSetter } from './@types';

type UseProjectActionsParams = {
  editor: Editor | null;
  pendingRestore: PendingLocalProject | null;
  isDirty: boolean;
  isProjectBusy: boolean;
  clearAutosaveTimer: () => void;
  replaceDocument: (document: BookDocument) => void;
  saveCurrentProject: () => Promise<BookProject | null>;
  waitForSaves: () => Promise<void>;
  setProject: StateSetter<BookProject | null>;
  setPendingRestore: StateSetter<PendingLocalProject | null>;
  setIsProjectBusy: StateSetter<boolean>;
  setProjectMessage: StateSetter<string>;
  setBuildState: StateSetter<BuildState>;
};

export const useProjectActions = ({
  editor,
  pendingRestore,
  isDirty,
  isProjectBusy,
  clearAutosaveTimer,
  replaceDocument,
  saveCurrentProject,
  waitForSaves,
  setProject,
  setPendingRestore,
  setIsProjectBusy,
  setProjectMessage,
  setBuildState,
}: UseProjectActionsParams) => {
  const confirmDiscardChanges = useCallback(() => {
    if (!isDirty && !getHasPendingProjectChanges()) {
      return true;
    }

    return window.confirm('Есть несохранённые изменения. Продолжить и потерять их?');
  }, [isDirty]);

  const handleNewProject = useCallback(async () => {
    const discardChangesConfirmed = confirmDiscardChanges();

    if (!editor || !discardChangesConfirmed) {
      return;
    }

    clearAutosaveTimer();
    setIsProjectBusy(true);

    try {
      await waitForSaves();
      await clearCurrentProject();

      setProject(null);
      setPendingRestore(null);
      setProjectMessage('Новый несохранённый проект');

      replaceDocument(createEmptyBook());
    } finally {
      setIsProjectBusy(false);
    }
  }, [
    editor,
    clearAutosaveTimer,
    replaceDocument,
    waitForSaves,
    confirmDiscardChanges,
    setProject,
    setPendingRestore,
    setIsProjectBusy,
    setProjectMessage,
  ]);

  const handleOpenProject = useCallback(async () => {
    const discardChangesConfirmed = confirmDiscardChanges();

    if (!editor || !discardChangesConfirmed) {
      return;
    }

    clearAutosaveTimer();
    setIsProjectBusy(true);

    try {
      await waitForSaves();

      const openedProject = await openLocalProject();

      replaceDocument(openedProject.document);

      setProject(openedProject.project);
      setPendingRestore(null);
      setProjectMessage(`Открыт проект: ${openedProject.project.name}`);
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }

      console.error('[project] Open failed.', error);

      setProjectMessage(getProjectErrorMessage(error));
    } finally {
      setIsProjectBusy(false);
    }
  }, [
    editor,
    clearAutosaveTimer,
    replaceDocument,
    waitForSaves,
    confirmDiscardChanges,
    setProject,
    setPendingRestore,
    setIsProjectBusy,
    setProjectMessage,
  ]);

  const handleSaveProject = useCallback(async () => {
    if (isProjectBusy) {
      return;
    }

    setIsProjectBusy(true);

    try {
      await saveCurrentProject();
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }

      console.error('[project] Save failed.', error);

      setProjectMessage(getProjectErrorMessage(error));
    } finally {
      setIsProjectBusy(false);
    }
  }, [
    isProjectBusy,
    saveCurrentProject,
    setIsProjectBusy,
    setProjectMessage,
  ]);

  const handleContinueLastProject = useCallback(async () => {
    const discardChangesConfirmed = confirmDiscardChanges();

    if (!pendingRestore || !editor || !discardChangesConfirmed) {
      return;
    }

    clearAutosaveTimer();
    setIsProjectBusy(true);

    try {
      await waitForSaves();

      const openedProject = await continueLastProject(pendingRestore);

      if (!openedProject) {
        setProjectMessage(`Нет разрешения на открытие «${pendingRestore.name}»`);

        return;
      }

      replaceDocument(openedProject.document);

      setProject(openedProject.project);
      setPendingRestore(null);
      setProjectMessage(`Открыт проект: ${openedProject.project.name}`);
    } catch (error) {
      console.error('[project] Continue failed.', error);

      setProjectMessage(getProjectErrorMessage(error));
    } finally {
      setIsProjectBusy(false);
    }
  }, [
    editor,
    pendingRestore,
    clearAutosaveTimer,
    replaceDocument,
    waitForSaves,
    confirmDiscardChanges,
    setProject,
    setPendingRestore,
    setIsProjectBusy,
    setProjectMessage,
  ]);

  const handleForgetLastProject = useCallback(async () => {
    setIsProjectBusy(true);

    try {
      await clearCurrentProject();

      setPendingRestore(null);
      setProjectMessage('Новый несохранённый проект');
    } finally {
      setIsProjectBusy(false);
    }
  }, [
    setPendingRestore,
    setIsProjectBusy,
    setProjectMessage,
  ]);

  const buildBook = useCallback(async () => {
    if (!editor || isProjectBusy) {
      return;
    }

    setIsProjectBusy(true);
    setBuildState('building');

    try {
      const savedProject = await saveCurrentProject();

      if (!savedProject) {
        setBuildState('idle');

        return;
      }

      await buildProject(savedProject.storage);

      setBuildState('success');
    } catch (error) {
      if (isAbortError(error)) {
        setBuildState('idle');

        return;
      }

      console.error('[book-builder]', error);

      setBuildState('error');
    } finally {
      setIsProjectBusy(false);
    }
  }, [
    editor,
    isProjectBusy,
    saveCurrentProject,
    setIsProjectBusy,
    setBuildState,
  ]);

  return {
    handleNewProject,
    handleOpenProject,
    handleSaveProject,
    handleContinueLastProject,
    handleForgetLastProject,
    buildBook,
  };
};
