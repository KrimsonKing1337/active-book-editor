import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { EditorContent, useEditor } from '@tiptap/react';

import classNames from 'classnames';

import { compileVisualEffects, missingVisualDefinitions } from '@active-book/book-builder/visualEffects';

import { ProjectAssetsProvider } from '@project/assets';
import { CustomComponentsContext, useBookLibraries } from '@project/libraries';

import type { BookProject, PendingLocalProject } from '@project/@types';

import { ContentError } from '@components/ContentError';
import { MediaInsert } from '@components/MediaInsert';

import { Pages } from '../Pages';
import { VisualBookPreview } from '../VisualBookPreview';

import { useBookPages } from '../../book/useBookPages';

import type { BuildState, TextBlock } from '../../@types';

import {
  useAutosave,
  useBeforeUnload,
  useProjectActions,
  useProjectRestore,
  useSaveShortcut,
} from '../../hooks';

import { CustomComponentsWarningModal } from '../CustomComponentsWarningModal';
import { Header } from '../Header';
import { PageEffects, PageEffectsProvider } from '../PageEffects';
import { RestoreBanner } from '../RestoreBanner';
import { AudioInstances } from '../PageEffects/components';

import {
  editorConfig,
  editorExtensions,
  createEmptyDocument,
  getBuildStateLabel,
  insertCustomComponent,
  insertTextBlock,
} from '../../utils';

import { useCanvasInteraction, useLibraryImport } from './hooks';

import styles from '../../EditorScreen.module.scss';

import {
  SHOW_STRUCTURE_STORAGE_KEY,
  SHOW_NARRATIVE_STORAGE_KEY,
  SHOW_BACKGROUNDS_STORAGE_KEY,
  SHOW_FRAME_EFFECTS_STORAGE_KEY,
} from '../../constants';

export const EditorWorkspace = () => {
  const [buildState, setBuildState] = useState<BuildState>('idle');
  const [project, setProject] = useState<BookProject | null>(null);
  const [pendingRestore, setPendingRestore] = useState<PendingLocalProject | null>(null);

  const [isDirty, setIsDirty] = useState(false);
  const [isProjectBusy, setIsProjectBusy] = useState(true);
  const [showSavedStatus, setShowSavedStatus] = useState(false);
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
    // ContentError displays rejected input; TipTap's default handler would throw.
    onContentError: () => {},
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

  const {
    activePage,
    activePosition,
    addPage,
    book,
    deletePage,
    getRevision,
    getSnapshot,
    movePage,
    pageAudio,
    replaceBook,
    revision,
    selectPage,
    session,
  } = useBookPages({
    editor,
    flushStyles,
    onError: setProjectMessage,
  });

  const pageScope = `${session}:${activePage.id}`;

  const previewConfig = {
    ...editorConfig,
    pages: book.pages.length,
  };

  const autosave = useAutosave({
    editor,
    bookRevision: revision,
    getBookSnapshot: getSnapshot,
    getBookRevision: getRevision,
    replaceBook,
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

  const {
    librariesRevision,
    isImportWarningOpen,
    handleImportCustomComponents,
    handleConfirmCustomComponentsImport,
    closeImportWarning,
  } = useLibraryImport({
    isProjectBusy,
    saveCurrentProject,
    setIsProjectBusy,
    setProjectMessage,
  });

  const {
    isNodeSelectionActive,
    handleCanvasKeyDown,
  } = useCanvasInteraction(editor);

  useEffect(() => {
    localStorage.setItem(SHOW_STRUCTURE_STORAGE_KEY, String(showStructure));
  }, [showStructure]);

  const libraries = useBookLibraries({
    project,
    session,
    revision: librariesRevision,
    onError: setProjectMessage,
  });

  const customComponentDefinitions = libraries.registry.definitions;

  useEffect(() => {
    if (libraries.isLoading) {
      return;
    }

    const compiledVisualEffects = compileVisualEffects(book);
    const missing = missingVisualDefinitions(compiledVisualEffects, libraries.definitions);

    if (missing.length) {
      setProjectMessage(`Не загружены определения эффектов: ${missing.join(', ')}`);
    }
  }, [
    book,
    libraries.definitions,
    libraries.isLoading,
  ]);

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

  const handleInsertCustomComponent = (packageName: string, name: string) => {
    insertCustomComponent(editor, { packageName, name });
  };

  const handleInsertTextBlock = (block: TextBlock) => {
    insertTextBlock(editor, block);
  };

  const pageEffects = (
    <PageEffects key={pageScope} project={project} onSaveProject={saveCurrentProject} />
  );

  const mediaInsert = (
    <MediaInsert
      editor={editor}
      project={project}
      scope={pageScope}
      disabled={buttonIsDisabled}
    />
  );

  const headerProjectStatus = {
    projectName,
    projectMessage,
    isDirty,
    showSavedStatus,
  };

  const headerProjectControls = {
    disabled: buttonIsDisabled,
    isProjectBusy,
    onNewProject: handleNewProject,
    onOpenProject: handleOpenProject,
    onSaveProject: handleSaveProject,
  };

  const headerViewControls = {
    showStructure,
    showNarrative,
    showBackgrounds,
    showFrameEffects,
    structureButtonIsDisabled,
    onToggleStructure: toggleStructure,
    onToggleNarrative: () => setShowNarrative((visible) => !visible),
    onToggleBackgrounds: () => setShowBackgrounds((visible) => !visible),
    onToggleFrameEffects: () => setShowFrameEffects((visible) => !visible),
  };

  const headerInsertControls = {
    mediaTools: mediaInsert,
    disabled: buttonIsDisabled,
    onInsertTextBlock: handleInsertTextBlock,
    onInsertCarousel: () => editor?.commands.insertCarousel(),
  };

  const headerLibraryControls = {
    definitions: customComponentDefinitions,
    disabled: buttonIsDisabled,
    onImport: handleImportCustomComponents,
    onInsertComponent: handleInsertCustomComponent,
  };

  const headerBuild = {
    state: buildState,
    disabled: buttonIsDisabled,
    onBuild: buildBook,
  };

  return (
    <ProjectAssetsProvider project={project}>
      <CustomComponentsContext value={libraries.registry}>
        <PageEffectsProvider
          editor={editor}
          pageId={pageScope}
          ownerPageId={activePage.id}
          pageAudio={pageAudio}
          onStylesFlusher={registerStylesFlusher}
        >
          <div className={editorScreenClassNames}>
            <Header
              projectStatus={headerProjectStatus}
              projectControls={headerProjectControls}
              viewControls={headerViewControls}
              insertControls={headerInsertControls}
              libraryControls={headerLibraryControls}
              build={headerBuild}
            />

            <ContentError editor={editor} />

            <Pages
              pages={book.pages}
              activeId={activePage.id}
              disabled={buttonIsDisabled}
              onSelect={selectPage}
              onAdd={addPage}
              onDelete={deletePage}
              onMove={movePage}
            />

            {isImportWarningOpen && (
              <CustomComponentsWarningModal
                onClose={closeImportWarning}
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
                book={book}
                pageId={activePage.id}
                session={session}
                definitions={libraries.definitions}
                showBackgrounds={showBackgrounds}
                showFrameEffects={showFrameEffects}
                config={previewConfig}
                editorTools={pageEffects}
              >
                <AudioInstances key={`audio:${pageScope}`} project={project} page={activePosition} />

                <div data-editor-page-id={activePage.id}>
                  <EditorContent editor={editor} />
                </div>
              </VisualBookPreview>
            </main>
          </div>
        </PageEffectsProvider>
      </CustomComponentsContext>
    </ProjectAssetsProvider>
  );
};
