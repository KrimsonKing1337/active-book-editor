import { useEffect, useState } from 'react';

import { EditorContent, useEditor } from '@tiptap/react';

import classNames from 'classnames';

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

import { Header, PageEffects, RestoreBanner } from './components';

import styles from './EditorScreen.module.scss';

import {
  editorConfig,
  editorExtensions,
  createEmptyDocument,
  getBuildStateLabel,
  insertComponent,
  insertTextComponent,
} from './utils';

const SHOW_STRUCTURE_STORAGE_KEY = 'activeBook-editor:showStructure';

export const EditorScreen = () => {
  const [buildState, setBuildState] = useState<BuildState>('idle');
  const [project, setProject] = useState<BookProject | null>(null);
  const [pendingRestore, setPendingRestore] = useState<PendingLocalProject | null>(null);

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
        onInsertTextComponent={handleInsertTextComponent}
        onBuildBook={buildBook}
      />

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
        <PageEffects />

        <App
          config={editorConfig}
          appMode="editor"
          tableOfContents={[]}
          rangeEffects={[]}
        >
          <PageWrapper>
            <EditorContent editor={editor} />
          </PageWrapper>
        </App>
      </main>
    </div>
  );
};
