import { useEffect, useState } from 'react';

import { EditorContent, useEditor } from '@tiptap/react';

import classNames from 'classnames';

import { useCustomComponents, replaceCustomLibraries } from '@project/customComponentRegistry';
import { importBrowserLibrary, loadProjectLibraries } from '@project/customComponents';

import { App, PageWrapper } from 'activeBook-core/components';

import type { BookProject, PendingLocalProject } from '@project/@types';

import type { BuildState, TextComponentName } from './@types';

import {
  useAutosave,
  useBeforeUnload,
  useProjectActions,
  useProjectRestore,
  useSaveShortcut,
} from './hooks';

import { CustomComponentsWarningModal, Header, PageEffects, RestoreBanner } from './components';

import styles from './EditorScreen.module.scss';

import {
  editorConfig,
  editorExtensions,
  createEmptyDocument,
  getBuildStateLabel,
  insertComponent,
  insertCustomComponent,
  insertTextComponent,
} from './utils';

const SHOW_STRUCTURE_STORAGE_KEY = 'activeBook-editor:showStructure';
const HIDE_CUSTOM_COMPONENTS_WARNING_STORAGE_KEY = 'activeBook-editor:hideCustomComponentsImportWarning';

export const EditorScreen = () => {
  const [buildState, setBuildState] = useState<BuildState>('idle');
  const [project, setProject] = useState<BookProject | null>(null);
  const [pendingRestore, setPendingRestore] = useState<PendingLocalProject | null>(null);
  const [librariesRevision, setLibrariesRevision] = useState(0);
  const [isImportWarningOpen, setIsImportWarningOpen] = useState(false);
  const { definitions: customComponentDefinitions } = useCustomComponents();

  const [isDirty, setIsDirty] = useState(false);
  const [isProjectBusy, setIsProjectBusy] = useState(true);
  const [showStructure, setShowStructure] = useState(() => {
    return localStorage.getItem(SHOW_STRUCTURE_STORAGE_KEY) === 'true';
  });
  const [showSavedStatus, setShowSavedStatus] = useState(false);

  const [projectMessage, setProjectMessage] = useState('Проверяем последний открытый проект...');

  const editor = useEditor({
    content: createEmptyDocument(),
    editable: false,
    extensions: editorExtensions,
    editorProps: {
      attributes: {
        spellcheck: 'true',
        lang: 'ru',
      },
    },
  });

  const autosave = useAutosave({
    editor,
    project,
    isDirty,
    isProjectBusy,
    setProject,
    setPendingRestore,
    setIsDirty,
    setShowSavedStatus,
    setProjectMessage,
  });

  const { clearAutosaveTimer, replaceDocument, saveCurrentProject } = autosave;

  useProjectRestore({
    editor,
    replaceDocument,
    setProject,
    setPendingRestore,
    setIsProjectBusy,
    setProjectMessage,
  });

  const {
    handleNewProject,
    handleOpenProject,
    handleSaveProject,
    handleContinueLastProject,
    handleForgetLastProject,
    buildBook,
  } = useProjectActions({
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
  });

  useBeforeUnload(isDirty);
  useSaveShortcut(handleSaveProject);

  useEffect(() => {
    localStorage.setItem(SHOW_STRUCTURE_STORAGE_KEY, String(showStructure));
  }, [showStructure]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const libraries = project ? await loadProjectLibraries(project.storage) : [];

        if (cancelled) {
          libraries.forEach((library) => library.dispose());

          return;
        }

        replaceCustomLibraries(libraries);
      } catch (error) {
        if (!cancelled) {
          console.error('[custom-components] Load failed.', error);
          setProjectMessage(error instanceof Error ? error.message : 'Ошибка загрузки библиотек');
          replaceCustomLibraries([]);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [project, librariesRevision]);

  const projectName = project?.name ?? 'Без названия';
  const buttonIsDisabled = !editor || isProjectBusy;
  const structureButtonIsDisabled = !editor;
  const buildStateLabel = getBuildStateLabel(buildState);

  const editorScreenClassNames = classNames({
    [styles.EditorScreen]: true,
    [styles.isStructureVisible]: showStructure,
  });

  const toggleStructure = () => {
    setShowStructure((structureIsVisible) => !structureIsVisible);
  };

  const handleInsertComponent = (name: string) => {
    insertComponent(editor, name);
  };

  const importCustomComponents = async () => {
    if (isProjectBusy) {
      return;
    }

    setIsProjectBusy(true);

    try {
      const savedProject = await saveCurrentProject();

      if (!savedProject) {
        return;
      }

      const message = await importBrowserLibrary(savedProject.storage);

      if (message) {
        setLibrariesRevision((revision) => revision + 1);
        setProjectMessage(`Подключена библиотека ${message}`);
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error('[custom-components] Import failed.', error);
        setProjectMessage(error instanceof Error ? error.message : 'Ошибка импорта TGZ');
      }
    } finally {
      setIsProjectBusy(false);
    }
  };

  const handleImportCustomComponents = () => {
    if (isProjectBusy) {
      return;
    }

    if (localStorage.getItem(HIDE_CUSTOM_COMPONENTS_WARNING_STORAGE_KEY) === 'true') {
      void importCustomComponents();

      return;
    }

    setIsImportWarningOpen(true);
  };

  const handleConfirmCustomComponentsImport = (doNotShowAgain: boolean) => {
    if (doNotShowAgain) {
      localStorage.setItem(HIDE_CUSTOM_COMPONENTS_WARNING_STORAGE_KEY, 'true');
    }

    setIsImportWarningOpen(false);
    void importCustomComponents();
  };

  const handleInsertCustomComponent = (packageName: string, name: string) => {
    insertCustomComponent(editor, packageName, name);
  };

  const handleInsertTextComponent = (name: TextComponentName) => {
    insertTextComponent(editor, name);
  };

  return (
    <div className={editorScreenClassNames}>
      <Header
        projectName={projectName}
        projectMessage={projectMessage}
        isDirty={isDirty}
        isProjectBusy={isProjectBusy}
        showSavedStatus={showSavedStatus}
        showStructure={showStructure}
        buildState={buildState}
        buttonIsDisabled={buttonIsDisabled}
        structureButtonIsDisabled={structureButtonIsDisabled}

        onNewProject={handleNewProject}
        onOpenProject={handleOpenProject}
        onSaveProject={handleSaveProject}
        onToggleStructure={toggleStructure}
        onInsertComponent={handleInsertComponent}
        onInsertCustomComponent={handleInsertCustomComponent}
        customComponentDefinitions={customComponentDefinitions}
        onInsertTextComponent={handleInsertTextComponent}
        onBuildBook={buildBook}
        onImportCustomComponents={handleImportCustomComponents}
      />

      {isImportWarningOpen && (
        <CustomComponentsWarningModal
          onClose={() => setIsImportWarningOpen(false)}
          onConfirm={handleConfirmCustomComponentsImport}
        />
      )}

      {pendingRestore && (
        <RestoreBanner
          pendingRestore={pendingRestore}
          isProjectBusy={isProjectBusy}
          onContinueLastProject={handleContinueLastProject}
          onForgetLastProject={handleForgetLastProject}
        />
      )}

      <div className={styles.BuildStatus} data-state={buildState}>
        {buildStateLabel}
      </div>

      <main className={styles.Canvas}>
        <App
          config={editorConfig}
          appMode="editor"
          tableOfContents={[]}
          rangeEffects={[]}
        >
          <PageEffects editor={editor} project={project} />

          <PageWrapper>
            <EditorContent editor={editor} />
          </PageWrapper>
        </App>
      </main>
    </div>
  );
};
