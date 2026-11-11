import type { KeyboardEvent } from 'react';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { EditorContent, useEditor } from '@tiptap/react';

import classNames from 'classnames';


import { compileVisualEffects, missingVisualDefinitions } from '@active-book/book-builder/visualEffects';

import { useBookLibraries } from '@project/useBookLibraries';

import { importBrowserLibrary } from '@project/customComponents';

import { CustomComponentsContext } from '@project/customComponentRegistry';

import type { BookProject, PendingLocalProject } from '@project/@types';

import { VisualBookPreview, Pages } from '../components';

import { useBookPages } from '../book/useBookPages';

import type { BuildState, TextBlock } from '../@types';

import {
  useAutosave,
  useBeforeUnload,
  useProjectActions,
  useProjectRestore,
  useSaveShortcut,
} from '../hooks';

import {
  CustomComponentsWarningModal,
  Header,
  PageEffects,
  PageEffectsProvider,
  RestoreBanner,
} from '../components';

import { AudioInstances } from '../components/PageEffects/components/AudioInstances';

import {
  editorConfig,
  editorExtensions,
  createEmptyDocument,
  getBuildStateLabel,
  insertCustomComponent,
  insertTextBlock,
} from '../utils';

import styles from '../EditorScreen.module.scss';

import {
  SHOW_STRUCTURE_STORAGE_KEY,
  HIDE_CUSTOM_COMPONENTS_WARNING_STORAGE_KEY,
  SHOW_NARRATIVE_STORAGE_KEY,
  SHOW_BACKGROUNDS_STORAGE_KEY,
  SHOW_FRAME_EFFECTS_STORAGE_KEY,
} from '../constants';

export const EditorWorkspace = () => {
  const [buildState, setBuildState] = useState<BuildState>('idle');
  const [project, setProject] = useState<BookProject | null>(null);
  const [pendingRestore, setPendingRestore] = useState<PendingLocalProject | null>(null);
  const [librariesRevision, setLibrariesRevision] = useState(0);
  const [isImportWarningOpen, setIsImportWarningOpen] = useState(false);

  const [isDirty, setIsDirty] = useState(false);
  const [isProjectBusy, setIsProjectBusy] = useState(true);
  const [showSavedStatus, setShowSavedStatus] = useState(false);
  const [isNodeSelectionActive, setIsNodeSelectionActive] = useState(false);
  const [projectMessage, setProjectMessage] = useState('Проверяем последний открытый проект...');

  const [showStructure, setShowStructure] = useState(() => {
    return localStorage.getItem(SHOW_STRUCTURE_STORAGE_KEY) === 'true';
  });

  const [showNarrative, setShowNarrative] = useState(() => {
    return localStorage.getItem(SHOW_NARRATIVE_STORAGE_KEY) !== 'false';
  });

  const [showBackgrounds, setShowBackgrounds] = useState(() => {
    return localStorage.getItem(SHOW_BACKGROUNDS_STORAGE_KEY) !== 'false';
  });

  const [showFrameEffects, setShowFrameEffects] = useState(() => {
    return localStorage.getItem(SHOW_FRAME_EFFECTS_STORAGE_KEY) !== 'false';
  });

  const editor = useEditor({
    content: createEmptyDocument(),
    editable: false,
    extensions: editorExtensions,
    editorProps: {
      attributes: {
        spellcheck: 'true',
        lang: 'ru',
        role: 'textbox',
        'aria-label': 'Текст страницы',
      },
    },
  });

  useEffect(() => {
    localStorage.setItem(SHOW_NARRATIVE_STORAGE_KEY, String(showNarrative));
  }, [showNarrative]);

  useEffect(() => {
    localStorage.setItem(SHOW_BACKGROUNDS_STORAGE_KEY, String(showBackgrounds));
  }, [showBackgrounds]);

  useEffect(() => {
    localStorage.setItem(SHOW_FRAME_EFFECTS_STORAGE_KEY, String(showFrameEffects));
  }, [showFrameEffects]);

  const flushStylesRef = useRef<() => boolean>(() => true);

  const flushStyles = useCallback(() => {
    return flushStylesRef.current();
  }, []);

  const registerStylesFlusher = useCallback((flush: (() => boolean) | null) => {
    flushStylesRef.current = flush ?? (() => true);
  }, []);

  const pages = useBookPages({
    editor,
    flushStyles,
  });

  const pageScope = `${pages.session}:${pages.activePage.id}`;

  const previewConfig = {
    ...editorConfig,
    pages: pages.book.pages.length,
  };

  const autosave = useAutosave({
    editor,
    bookRevision: pages.revision,
    getBookSnapshot: pages.getSnapshot,
    getBookRevision: pages.getRevision,
    replaceBook: pages.replaceBook,
    project,
    isDirty,
    isProjectBusy,
    setProject,
    setPendingRestore,
    setIsDirty,
    setShowSavedStatus,
    setProjectMessage,
  });

  const {
    clearAutosaveTimer,
    replaceDocument,
    saveCurrentProject,
    waitForSaves,
  } = autosave;

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
    waitForSaves,
    setProject,
    setPendingRestore,
    setIsProjectBusy,
    setProjectMessage,
    setBuildState,
  });

  useBeforeUnload(isDirty);
  useSaveShortcut(handleSaveProject);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const handleCanvasInteraction = (event: Event) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (editor.view.dom.contains(target)) {
        setIsNodeSelectionActive(true);

        return;
      }

      if (target instanceof Element && target.closest('[data-active-book-effects-ui]')) {
        return;
      }

      setIsNodeSelectionActive(false);
    };

    document.addEventListener('pointerdown', handleCanvasInteraction, true);
    document.addEventListener('focusin', handleCanvasInteraction, true);

    return () => {
      document.removeEventListener('pointerdown', handleCanvasInteraction, true);
      document.removeEventListener('focusin', handleCanvasInteraction, true);
    };
  }, [editor]);

  useEffect(() => {
    localStorage.setItem(SHOW_STRUCTURE_STORAGE_KEY, String(showStructure));
  }, [showStructure]);

  const libraries = useBookLibraries({
    project,
    session: pages.session,
    revision: librariesRevision,
    onError: setProjectMessage,
  });

  const customComponentDefinitions = libraries.registry.definitions;

  useEffect(() => {
    if (libraries.isLoading) {
      return;
    }

    const compiledVisualEffects = compileVisualEffects(pages.book);
    const missing = missingVisualDefinitions(compiledVisualEffects, libraries.definitions);

    if (missing.length) {
      setProjectMessage(`Не загружены определения эффектов: ${missing.join(', ')}`);
    }
  }, [pages.book, libraries.definitions, libraries.isLoading]);


  const projectName = project?.name ?? 'Без названия';
  const buttonIsDisabled = !editor || isProjectBusy;
  const structureButtonIsDisabled = !editor;
  const buildStateLabel = getBuildStateLabel(buildState);

  const editorScreenClassNames = classNames({
    [styles.EditorScreen]: true,
    [styles.isStructureVisible]: showStructure,
    [styles.isNarrativeHidden]: !showNarrative,
    [styles.isNodeSelectionActive]: isNodeSelectionActive,
  });

  const toggleStructure = () => {
    setShowStructure((structureIsVisible) => !structureIsVisible);
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

        const errorMessage = error instanceof Error
          ? error.message
          : 'Ошибка импорта TGZ';

        setProjectMessage(errorMessage);
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
    insertCustomComponent(editor, { packageName, name });
  };

  const handleInsertTextBlock = (block: TextBlock) => {
    insertTextBlock(editor, block);
  };

  const handleCanvasKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape' || !editor) {
      return;
    }

    const target = event.target;

    if (!(target instanceof Node) || !editor.view.dom.contains(target)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const focusedElement = document.activeElement;

    if (focusedElement instanceof HTMLElement && editor.view.dom.contains(focusedElement)) {
      focusedElement.blur();
    }

    editor.commands.blur();
    setIsNodeSelectionActive(false);
  };

  const pageEffects = (
    <PageEffects key={pageScope} project={project} onSaveProject={saveCurrentProject} />
  );

  return (
    <CustomComponentsContext value={libraries.registry}>
      <PageEffectsProvider
        editor={editor}
        pageId={pageScope}
        ownerPageId={pages.activePage.id}
        onStylesFlusher={registerStylesFlusher}
      >
        <div className={editorScreenClassNames}>
          <Header
            projectName={projectName}
            projectMessage={projectMessage}
            isDirty={isDirty}
            isProjectBusy={isProjectBusy}
            showSavedStatus={showSavedStatus}
            showStructure={showStructure}
            showNarrative={showNarrative}
            showBackgrounds={showBackgrounds}
            showFrameEffects={showFrameEffects}
            buildState={buildState}
            buttonIsDisabled={buttonIsDisabled}
            structureButtonIsDisabled={structureButtonIsDisabled}

            onNewProject={handleNewProject}
            onOpenProject={handleOpenProject}
            onSaveProject={handleSaveProject}
            onToggleStructure={toggleStructure}
            onToggleNarrative={() => setShowNarrative((visible) => !visible)}
            onToggleBackgrounds={() => setShowBackgrounds((visible) => !visible)}
            onToggleFrameEffects={() => setShowFrameEffects((visible) => !visible)}
            onInsertCustomComponent={handleInsertCustomComponent}
            customComponentDefinitions={customComponentDefinitions}
            onInsertTextBlock={handleInsertTextBlock}
            onBuildBook={buildBook}
            onImportCustomComponents={handleImportCustomComponents}
          />

          <Pages
            pages={pages.book.pages}
            activeId={pages.activePage.id}
            disabled={buttonIsDisabled}
            onSelect={pages.selectPage}
            onAdd={pages.addPage}
            onDelete={pages.deletePage}
            onMove={pages.movePage}
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

          <main className={styles.Canvas} onKeyDownCapture={handleCanvasKeyDown}>
            <VisualBookPreview
              book={pages.book}
              pageId={pages.activePage.id}
              session={pages.session}
              definitions={libraries.definitions}
              project={project}
              showBackgrounds={showBackgrounds}
              showFrameEffects={showFrameEffects}
              config={previewConfig}
              editorTools={pageEffects}
            >
              <AudioInstances key={`audio:${pageScope}`} project={project} page={pages.activePosition} />

              <div data-editor-page-id={pages.activePage.id}>
                <EditorContent editor={editor} />
              </div>
            </VisualBookPreview>
          </main>
        </div>
      </PageEffectsProvider>
    </CustomComponentsContext>
  );
};
