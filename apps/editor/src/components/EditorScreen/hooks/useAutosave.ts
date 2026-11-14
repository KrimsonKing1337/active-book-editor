import {
  useCallback,
  useEffect,
  useRef,
} from 'react';

import type { Editor } from '@tiptap/core';

import type { BookDocument } from '@active-book/book-builder/book';

import type { BookProject, PendingLocalProject } from '@project/@types';

import { createLocalProject, saveProject } from '@project/projectService';
import { markProjectStylesSaved } from '@project/pendingOperations';

import { AUTO_SAVE_DELAY, getProjectErrorMessage } from '../utils';

import type { StateSetter } from './types';

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
  }, [
    getBookRevision,
    setIsDirty,
    setShowSavedStatus,
    setProjectMessage,
  ]);

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

        if (session === sessionRef.current && target === projectRef.current) {
          markSaved(revision);
        }
      });

      saveQueueRef.current = job.catch((error: unknown) => {
        console.error('[project] Autosave failed.', error);

        if (session === sessionRef.current) {
          setProjectMessage(getProjectErrorMessage(error));
        }
      });
    }, AUTO_SAVE_DELAY);
  }, [
    clearAutosaveTimer,
    getBookSnapshot,
    getBookRevision,
    markSaved,
    setProjectMessage,
  ]);

  const replaceDocument = useCallback((book: BookDocument) => {
    clearAutosaveTimer();

    sessionRef.current += 1;

    replaceBook(book);

    // replaceBook increments the revision synchronously; this new book is already saved.
    savedRevisionRef.current = getBookRevision();

    setIsDirty(false);
    setShowSavedStatus(false);
  }, [
    clearAutosaveTimer,
    replaceBook,
    getBookRevision,
    setIsDirty,
    setShowSavedStatus,
  ]);

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
  }, [
    editor,
    clearAutosaveTimer,
    getBookSnapshot,
    getBookRevision,
    markSaved,
    scheduleAutosave,
    setProject,
    setPendingRestore,
    setIsDirty,
    setShowSavedStatus,
  ]);

  useEffect(() => {
    projectRef.current = project;

    clearAutosaveTimer();
  }, [project, clearAutosaveTimer]);

  useEffect(() => {
    busyRef.current = isProjectBusy;
  }, [isProjectBusy]);

  useEffect(() => {
    if (bookRevision !== savedRevisionRef.current) {
      setIsDirty(true);
      setShowSavedStatus(false);
    }
  }, [
    bookRevision,
    setIsDirty,
    setShowSavedStatus,
  ]);

  useEffect(() => {
    if (editor && project && isDirty && !isProjectBusy) {
      scheduleAutosave();
    }
  }, [
    editor,
    project,
    isDirty,
    isProjectBusy,
    bookRevision,
    scheduleAutosave,
  ]);

  useEffect(() => {
    return clearAutosaveTimer;
  }, [clearAutosaveTimer]);

  const waitForSaves = useCallback(() => {
    return saveQueueRef.current;
  }, []);

  return {
    clearAutosaveTimer,
    replaceDocument,
    saveCurrentProject,
    waitForSaves,
  };
};
