import {
  type Dispatch,
  type SetStateAction,

  useCallback,
  useEffect,
  useRef,
} from 'react';

import type { Editor, JSONContent } from '@tiptap/core';

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

import { useAsyncEffect } from '@hooks/useAsyncEffect';

import type { BuildState } from './@types';

import { AUTO_SAVE_DELAY, createEmptyDocument, getProjectErrorMessage } from './utils';

type StateSetter<T> = Dispatch<SetStateAction<T>>;

type UseAutosaveParams = {
  editor: Editor | null;
  project: BookProject | null;
  isDirty: boolean;
  isProjectBusy: boolean;
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
  setProject,
  setPendingRestore,
  setIsDirty,
  setShowSavedStatus,
  setProjectMessage,
}: UseAutosaveParams) => {
  const autosaveTimerRef = useRef<number | null>(null);
  const autosaveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const documentRevisionRef = useRef(0);
  const projectRef = useRef<BookProject | null>(null);
  const isProjectBusyRef = useRef(true);

  const clearAutosaveTimer = useCallback(() => {
    if (autosaveTimerRef.current === null) {
      return;
    }

    window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = null;
  }, []);

  const saveProjectAutomatically = useCallback(async (
    projectToSave: BookProject,
    document: JSONContent,
    documentRevision: number,
  ) => {
    try {
      await saveProject(projectToSave, document);
    } catch (error) {
      console.error('[project] Autosave failed.', error);

      if (projectRef.current === projectToSave) {
        setProjectMessage(getProjectErrorMessage(error));
      }

      return;
    }

    const projectIsCurrent = projectRef.current === projectToSave;
    const documentIsUnchanged = documentRevision === documentRevisionRef.current;

    if (!projectIsCurrent || !documentIsUnchanged) {
      return;
    }

    setIsDirty(false);
    setShowSavedStatus(true);
    setProjectMessage('Локальный проект');
  }, []);

  const scheduleAutosave = useCallback((currentEditor: Editor) => {
    clearAutosaveTimer();

    autosaveTimerRef.current = window.setTimeout(() => {
      autosaveTimerRef.current = null;

      const currentProject = projectRef.current;

      if (!currentProject || isProjectBusyRef.current) {
        return;
      }

      const documentRevision = documentRevisionRef.current;
      const document = currentEditor.getJSON();

      autosaveQueueRef.current = autosaveQueueRef.current.then(() => {
        return saveProjectAutomatically(currentProject, document, documentRevision);
      });
    }, AUTO_SAVE_DELAY);
  }, [clearAutosaveTimer, saveProjectAutomatically]);

  const replaceDocument = useCallback((document: JSONContent) => {
    if (!editor) {
      return;
    }

    clearAutosaveTimer();
    documentRevisionRef.current += 1;

    editor.commands.setContent(document, {
      emitUpdate: false,
    });

    setIsDirty(false);
    setShowSavedStatus(false);
  }, [editor, clearAutosaveTimer]);

  const saveCurrentProject = useCallback(async (): Promise<BookProject | null> => {
    if (!editor) {
      return null;
    }

    clearAutosaveTimer();

    await autosaveQueueRef.current;

    const documentRevision = documentRevisionRef.current;
    const document = editor.getJSON();
    const projectIsNew = !project;

    let nextProject = project;

    if (nextProject) {
      await saveProject(nextProject, document);
    } else {
      nextProject = await createLocalProject(document);
    }

    projectRef.current = nextProject;

    setProject(nextProject);
    setPendingRestore(null);

    if (projectIsNew) {
      setProjectMessage('Локальный проект');
    }

    const documentIsUnchanged = documentRevision === documentRevisionRef.current;

    if (documentIsUnchanged) {
      setIsDirty(false);
      setShowSavedStatus(true);
    } else {
      setIsDirty(true);
      setShowSavedStatus(false);

      scheduleAutosave(editor);
    }

    return nextProject;
  }, [
    editor,
    project,
    clearAutosaveTimer,
    scheduleAutosave,
  ]);

  useEffect(() => {
    projectRef.current = project;

    clearAutosaveTimer();
  }, [project, clearAutosaveTimer]);

  useEffect(() => {
    isProjectBusyRef.current = isProjectBusy;
  }, [isProjectBusy]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const handleEditorUpdate = () => {
      documentRevisionRef.current += 1;

      setIsDirty(true);
      setShowSavedStatus(false);

      if (projectRef.current) {
        scheduleAutosave(editor);
      }
    };

    editor.on('update', handleEditorUpdate);

    return () => {
      editor.off('update', handleEditorUpdate);
    };
  }, [editor, scheduleAutosave]);

  useEffect(() => {
    const dontAutosave = !editor
      || !project
      || !isDirty
      || isProjectBusy;

    if (dontAutosave) {
      return;
    }

    scheduleAutosave(editor);
  }, [
    editor,
    project,
    isDirty,
    isProjectBusy,
    scheduleAutosave,
  ]);

  useEffect(() => {
    return () => {
      clearAutosaveTimer();
    };
  }, [clearAutosaveTimer]);

  return {
    clearAutosaveTimer,
    replaceDocument,
    saveCurrentProject,
  };
};

type UseProjectRestoreParams = {
  editor: Editor | null;
  replaceDocument: (document: JSONContent) => void;
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
        setProject(result.openedProject.project);
        replaceDocument(result.openedProject.document);
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
  replaceDocument: (document: JSONContent) => void;
  saveCurrentProject: () => Promise<BookProject | null>;
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
  setProject,
  setPendingRestore,
  setIsProjectBusy,
  setProjectMessage,
  setBuildState,
}: UseProjectActionsParams) => {
  const confirmDiscardChanges = useCallback(() => {
    if (!isDirty) {
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
      await clearCurrentProject();

      setProject(null);
      setPendingRestore(null);

      replaceDocument(createEmptyDocument());
      setProjectMessage('Новый несохранённый проект');
    } finally {
      setIsProjectBusy(false);
    }
  }, [
    editor,
    clearAutosaveTimer,
    replaceDocument,
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
      const openedProject = await openLocalProject();

      setProject(openedProject.project);
      setPendingRestore(null);
      setProjectMessage(`Открыт проект: ${openedProject.project.name}`);

      replaceDocument(openedProject.document);
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
      const openedProject = await continueLastProject(pendingRestore);

      if (!openedProject) {
        setProjectMessage(`Нет разрешения на открытие «${pendingRestore.name}»`);

        return;
      }

      setProject(openedProject.project);
      setPendingRestore(null);
      setProjectMessage(`Открыт проект: ${openedProject.project.name}`);

      replaceDocument(openedProject.document);
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
  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);
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
