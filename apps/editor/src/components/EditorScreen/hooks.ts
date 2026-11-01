import {
  type Dispatch,
  type SetStateAction,

  useCallback,
  useEffect,
  useRef,
} from 'react';

import type { Editor } from '@tiptap/core';

import type { BookDocument } from '@active-book/book-builder/book';


import { buildProject } from '@build/buildProject';

import type { BookProject, PendingLocalProject } from '@project/@types';

import {
  clearCurrentProject,
  continueLastProject,
  createLocalProject,
  isAbortError,
  openLocalProject,
  restoreLastProject,
  saveProject,
} from '@project/projectService';

import { hasPendingProjectChanges, markProjectStylesSaved } from '@project/pendingOperations';

import { useAsyncEffect } from '@hooks/useAsyncEffect';

import { createEmptyBook } from './book/documents';

import type { BuildState } from './@types';

import { AUTO_SAVE_DELAY, getProjectErrorMessage } from './utils';

type StateSetter<T> = Dispatch<SetStateAction<T>>;

type UseAutosaveParams = {
  editor: Editor | null;
  project: BookProject | null;
  isDirty: boolean;
  isProjectBusy: boolean;
  bookRevision: number;
  getBookSnapshot: () => BookDocument;
  getBookRevision: () => number;
  replaceBook: (book: BookDocument) => void;
  setProject: StateSetter<BookProject | null>;
  setPendingRestore: StateSetter<PendingLocalProject | null>;
  setIsDirty: StateSetter<boolean>;
  setShowSavedStatus: StateSetter<boolean>;
  setProjectMessage: StateSetter<string>;
};

export const useAutosave = ({
  editor,
  project,
  isDirty,
  isProjectBusy,
  bookRevision,
  getBookSnapshot,
  getBookRevision,
  replaceBook,
  setProject,
  setPendingRestore,
  setIsDirty,
  setShowSavedStatus,
  setProjectMessage,
}: UseAutosaveParams) => {
  const autosaveTimerRef = useRef<number | null>(null);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const savedRevisionRef = useRef(0);
  const sessionRef = useRef(0);
  const projectRef = useRef(project);
  const busyRef = useRef(isProjectBusy);

  const clearAutosaveTimer = useCallback(() => {
    if (autosaveTimerRef.current !== null) {
      window.clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
  }, []);

  const markSaved = useCallback((revision: number) => {
    if (revision !== getBookRevision()) {
      return;
    }
    savedRevisionRef.current = revision;
    setIsDirty(false);
    setShowSavedStatus(true);
    setProjectMessage('Локальный проект');
    markProjectStylesSaved();
  }, [getBookRevision, setIsDirty, setShowSavedStatus, setProjectMessage]);

  const scheduleAutosave = useCallback(() => {
    clearAutosaveTimer();
    autosaveTimerRef.current = window.setTimeout(() => {
      autosaveTimerRef.current = null;
      const target = projectRef.current;
      if (!target || busyRef.current) {
        return;
      }
      const session = sessionRef.current;
      const job = saveQueueRef.current.then(async () => {
        if (session !== sessionRef.current || target !== projectRef.current) {
          return;
        }
        // Read at execution time: an older queued autosave must not overwrite a newer manual save.
        const book = getBookSnapshot();
        const revision = getBookRevision();
        await saveProject(target, book);
        if (session === sessionRef.current && target === projectRef.current) markSaved(revision);
      });
      saveQueueRef.current = job.catch((error: unknown) => {
        console.error('[project] Autosave failed.', error);
        if (session === sessionRef.current) setProjectMessage(getProjectErrorMessage(error));
      });
    }, AUTO_SAVE_DELAY);
  }, [clearAutosaveTimer, getBookSnapshot, getBookRevision, markSaved, setProjectMessage]);

  const replaceDocument = useCallback((book: BookDocument) => {
    clearAutosaveTimer();
    sessionRef.current += 1;
    replaceBook(book);
    savedRevisionRef.current = getBookRevision();
    setIsDirty(false);
    setShowSavedStatus(false);
  }, [clearAutosaveTimer, replaceBook, getBookRevision, setIsDirty, setShowSavedStatus]);

  const saveCurrentProject = useCallback((): Promise<BookProject | null> => {
    if (!editor) {
      return Promise.resolve(null);
    }
    clearAutosaveTimer();
    const session = sessionRef.current;
    const job = saveQueueRef.current.then(async () => {
      if (session !== sessionRef.current) {
        return null;
      }
      const book = getBookSnapshot();
      const revision = getBookRevision();
      let target = projectRef.current;
      if (target) {
        await saveProject(target, book);
      } else {
        target = await createLocalProject(book);
      }
      if (session !== sessionRef.current) {
        return target;
      }
      projectRef.current = target;
      setProject(target);
      setPendingRestore(null);
      markSaved(revision);
      if (revision !== getBookRevision()) {
        setIsDirty(true);
        setShowSavedStatus(false);
        scheduleAutosave();
      }
      return target;
    });
    // Both manual and automatic writes use this queue, including failures.
    saveQueueRef.current = job.then(() => {}, () => {});
    return job;
  }, [editor, clearAutosaveTimer, getBookSnapshot, getBookRevision, markSaved,
    scheduleAutosave, setProject, setPendingRestore, setIsDirty, setShowSavedStatus]);

  useEffect(() => {
    projectRef.current = project;
    clearAutosaveTimer();
  }, [project, clearAutosaveTimer]);

  useEffect(() => { busyRef.current = isProjectBusy; }, [isProjectBusy]);

  useEffect(() => {
    if (bookRevision !== savedRevisionRef.current) {
      setIsDirty(true);
      setShowSavedStatus(false);
    }
  }, [bookRevision, setIsDirty, setShowSavedStatus]);

  useEffect(() => {
    if (editor && project && isDirty && !isProjectBusy) scheduleAutosave();
  }, [editor, project, isDirty, isProjectBusy, bookRevision, scheduleAutosave]);

  useEffect(() => clearAutosaveTimer, [clearAutosaveTimer]);

  const waitForSaves = useCallback(() => saveQueueRef.current, []);

  return { clearAutosaveTimer, replaceDocument, saveCurrentProject, waitForSaves };
};

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
    if (!isDirty && !hasPendingProjectChanges()) {
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
  }, [isProjectBusy, saveCurrentProject]);

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
  }, []);

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
  }, [editor, isProjectBusy, saveCurrentProject]);

  return {
    handleNewProject,
    handleOpenProject,
    handleSaveProject,
    handleContinueLastProject,
    handleForgetLastProject,
    buildBook,
  };
};

export const useBeforeUnload = (isDirty: boolean): void => {
  const isDirtyRef = useRef(isDirty);

  isDirtyRef.current = isDirty;

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirtyRef.current || hasPendingProjectChanges()) {
        event.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
};

export const useSaveShortcut = (handleSaveProject: () => Promise<void>): void => {
  useEffect(() => {
    const handleSaveShortcut = (event: KeyboardEvent) => {
      const isModifier = event.ctrlKey || event.metaKey;
      const isS = event.code === 'KeyS';
      const isSaveShortcut = isModifier && isS;

      if (!isSaveShortcut) {
        return;
      }

      event.preventDefault();

      void handleSaveProject();
    };

    window.addEventListener('keydown', handleSaveShortcut);

    return () => {
      window.removeEventListener('keydown', handleSaveShortcut);
    };
  }, [handleSaveProject]);
};
