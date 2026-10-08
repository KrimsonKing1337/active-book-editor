import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import type { Editor, JSONContent } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import classNames from 'classnames';

import { App, PageWrapper } from 'activeBook-core/components';
import type { Config } from 'activeBook-core/@types';

import { buildProject } from '@build/buildProject';

import type {
  BookProject,
  PendingLocalProject,
} from '@project/@types';

import {
  ExistingProjectError,
  FileSystemAccessUnsupportedError,
  InvalidProjectError,
} from '@project/errors';

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

import { CoreComponentNode } from '@components';

// импортируем именно так, чтобы избежать цикличного импорта
import { PNode, H1Node, H2Node } from '@components/EditableComponentNode';

import styles from './EditorScreen.module.scss';

const activeBookBlockNodes = [
  CoreComponentNode,

  PNode,
  H1Node,
  H2Node,
];

// Чтобы явно указать, что дефолтный текстовый узел - это P, пишем его первым.
// И тогда при нажатии на Enter вставится именно он
export const ActiveBookDocument = Document.extend({
  content: '(activeBookP | activeBookBlock)+',
});

const config: Config = {
  id: 'editor-preview',
  authorComments: 0,
  pages: 0,
  defaultTheme: 'dark',
  disableThemes: false,
};

const createEmptyDocument = (): JSONContent => ({
  type: 'doc',
  content: [
    {
      type: 'activeBookP',
    },
  ],
});

const getProjectErrorMessage = (error: unknown): string => {
  if (error instanceof FileSystemAccessUnsupportedError) {
    return 'Этот браузер не поддерживает выбор локальных папок для проектов';
  }

  if (error instanceof ExistingProjectError) {
    return 'В выбранной папке уже есть book.json. ' +
      'Откройте этот проект через «Открыть проект», чтобы не перезаписать его';
  }

  if (error instanceof InvalidProjectError) {
    return error.message;
  }

  return 'Не удалось выполнить операцию с проектом. Подробности — в консоли';
};

const AUTO_SAVE_DELAY = 1500;

export type BuildState = 'idle' | 'building' | 'success' | 'error';

export const EditorScreen = () => {
  const [buildState, setBuildState] = useState<BuildState>('idle');
  const [project, setProject] = useState<BookProject | null>(null);
  const [pendingRestore, setPendingRestore] = useState<PendingLocalProject | null>(null);

  const [isDirty, setIsDirty] = useState(false);
  const [isProjectBusy, setIsProjectBusy] = useState(true);
  const [showStructure, setShowStructure] = useState(false);
  const [showSavedStatus, setShowSavedStatus] = useState(false);

  const [projectMessage, setProjectMessage] = useState('Проверяем последний открытый проект...');

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

  const editor = useEditor({
    content: createEmptyDocument(),
    editable: false,
    extensions: [
      StarterKit.configure({
        document: false,
        paragraph: false,
        heading: false,
        blockquote: false,
        codeBlock: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        horizontalRule: false,
        trailingNode: false,
        hardBreak: {
          keepMarks: true,
        },
      }),

      ActiveBookDocument,
      ...activeBookBlockNodes,
    ],

    editorProps: {
      attributes: {
        spellcheck: 'true',
        lang: 'ru',
      },
    },

    onUpdate: ({ editor: currentEditor }) => {
      documentRevisionRef.current += 1;

      setIsDirty(true);
      setShowSavedStatus(false);

      if (projectRef.current) {
        scheduleAutosave(currentEditor);
      }
    },
  });

  const replaceDocument = useCallback(
    (document: JSONContent) => {
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
    },
    [clearAutosaveTimer, editor],
  );

  useEffect(() => {
    projectRef.current = project;

    clearAutosaveTimer();
  }, [clearAutosaveTimer, project]);

  useEffect(() => {
    isProjectBusyRef.current = isProjectBusy;
  }, [isProjectBusy]);

  useEffect(() => {
    return () => {
      clearAutosaveTimer();
    };
  }, [clearAutosaveTimer]);

  useEffect(() => {
    if (!editor || !project || !isDirty || isProjectBusy) {
      return;
    }

    scheduleAutosave(editor);
  }, [editor, isDirty, isProjectBusy, project, scheduleAutosave]);

  const confirmDiscardChanges = useCallback((): boolean => {
    if (!isDirty) {
      return true;
    }

    return window.confirm('Есть несохранённые изменения. Продолжить и потерять их?');
  }, [isDirty]);

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

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
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
  }, [clearAutosaveTimer, confirmDiscardChanges, editor, replaceDocument]);

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
      replaceDocument(openedProject.document);
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
  }, [clearAutosaveTimer, confirmDiscardChanges, editor, replaceDocument]);

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
  }, [clearAutosaveTimer, editor, project, scheduleAutosave]);

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
      replaceDocument(openedProject.document);
      setProjectMessage(`Открыт проект: ${openedProject.project.name}`);
    } catch (error) {
      console.error('[project] Continue failed.', error);

      setProjectMessage(getProjectErrorMessage(error));
    } finally {
      setIsProjectBusy(false);
    }
  }, [
    clearAutosaveTimer,
    editor,
    pendingRestore,
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

  const insertEditorContent = (contentToInsert: JSONContent) => {
    if (!editor) {
      return;
    }

    const editorChain = editor.chain();
    const focusedEditorChain = editorChain.focus();
    const contentEditorChain = focusedEditorChain.insertContent(contentToInsert);

    contentEditorChain.run();
  };

  const insertComponent = (name: string) => {
    const componentContent: JSONContent = {
      type: 'coreComponent',
      attrs: {
        name,
      },
    };

    insertEditorContent(componentContent);
  };

  const insertTextComponent = (name: 'P' | 'H1' | 'H2') => {
    const typeMap = {
      P: 'activeBookP',
      H1: 'activeBookH1',
      H2: 'activeBookH2',
    } as const;

    const nodeType = typeMap[name];

    const textContent: JSONContent = {
      type: nodeType,
    };

    insertEditorContent(textContent);
  };

  const toggleStructure = () => {
    setShowStructure((structureIsVisible) => !structureIsVisible);
  };

  const buildBook = async () => {
    if (buttonIsDisabled) {
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
  };

  const projectName = project?.name ?? 'Без названия';
  const buttonIsDisabled = !editor || isProjectBusy;
  const buttonBuildLabel = buildState === 'building' ? 'Сборка...' : 'Собрать книгу';

  const structureButtonLabel = showStructure ? 'Скрыть структуру' : 'Показать структуру';

  const savedStatusClassNames = classNames(styles.SavedStatus, {
    [styles.isVisible]: showSavedStatus,
  });

  const editorScreenClassNames = classNames({
    [styles.EditorScreen]: true,
    [styles.isStructureVisible]: showStructure,
  });

  let buildStateLabel = '';

  if (buildState === 'success') {
    buildStateLabel = 'Готово: результат в dist-book/';
  } else if (buildState === 'error') {
    buildStateLabel = 'Сборка завершилась с ошибкой. Смотри консоль dev-сервера';
  }

  return (
    <div className={editorScreenClassNames}>
      <header className={styles.Toolbar}>
        <div className={styles.ProjectTitle}>
          <div className={styles.TitleLine}>
            <strong>
              {projectName}
              {isDirty ? ' *' : ''}
            </strong>

            <span className={savedStatusClassNames} aria-hidden={!showSavedStatus}>
              Сохранено
            </span>
          </div>

          <span>
            {projectMessage}
          </span>
        </div>

        <div className={styles.Actions}>
          <button
            type="button"
            disabled={buttonIsDisabled}
            onClick={() => void handleNewProject()}
          >
            Новый проект
          </button>

          <button
            type="button"
            disabled={buttonIsDisabled}
            onClick={() => void handleOpenProject()}
          >
            Открыть проект
          </button>

          <button
            type="button"
            disabled={buttonIsDisabled}
            onClick={() => void handleSaveProject()}
          >
            {isProjectBusy ? 'Подождите...' : 'Сохранить'}
          </button>

          <span className={styles.Separator} />

          <button
            type="button"
            disabled={!editor}
            aria-pressed={showStructure}
            onClick={toggleStructure}
          >
            {structureButtonLabel}
          </button>

          <button
            className={styles.Button}
            type="button"
            disabled={buttonIsDisabled}
            onClick={() => insertComponent('Counter')}
          >
            Добавить Counter
          </button>

          <button
            type="button"
            disabled={buttonIsDisabled}
            onClick={() => insertTextComponent('P')}
          >
            Добавить параграф
          </button>

          <button
            type="button"
            disabled={buttonIsDisabled}
            onClick={() => insertTextComponent('H1')}
          >
            Добавить заголовок 1
          </button>

          <button
            type="button"
            disabled={buttonIsDisabled}
            onClick={() => insertTextComponent('H2')}
          >
            Добавить заголовок 2
          </button>

          <button
            type="button"
            disabled={buttonIsDisabled || buildState === 'building'}
            onClick={buildBook}
          >
            {buttonBuildLabel}
          </button>
        </div>
      </header>

      {pendingRestore && (
        <div className={styles.RestoreBanner}>
          <span>
            Продолжить работу с последним проектом «{pendingRestore.name}»?
          </span>

          <button
            type="button"
            disabled={isProjectBusy}
            onClick={() => void handleContinueLastProject()}
          >
            Открыть последний проект
          </button>

          <button
            type="button"
            disabled={isProjectBusy}
            onClick={() => void handleForgetLastProject()}
          >
            Не открывать
          </button>
        </div>
      )}

      <div className={styles.BuildStatus} data-state={buildState}>
        {buildStateLabel}
      </div>

      <main className={styles.Canvas}>
        <App config={config} tableOfContents={[]} rangeEffects={[]}>
          <PageWrapper>
            <EditorContent editor={editor} />
          </PageWrapper>
        </App>
      </main>
    </div>
  );
};
