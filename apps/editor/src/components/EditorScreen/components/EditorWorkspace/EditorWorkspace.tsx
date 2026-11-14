import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { EditorContent, useEditor } from '@tiptap/react';

import classNames from 'classnames';

import { compileVisualEffects, missingVisualDefinitions } from '@active-book/book-builder/visualEffects';

import { useBookLibraries } from '@project/hooks';
import { ProjectAssetsProvider } from '@project/assets';

import { CustomComponentsContext } from '@project/customComponentRegistry';

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

import { AudioInstances } from '../PageEffects/components/AudioInstances';

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

  const { isNodeSelectionActive, handleCanvasKeyDown } = useCanvasInteraction(editor);

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
  }, [
    pages.book,
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

  return (
    <ProjectAssetsProvider project={project}>
      <CustomComponentsContext value={libraries.registry}>
        <PageEffectsProvider
          editor={editor}
          pageId={pageScope}
          ownerPageId={pages.activePage.id}
          onStylesFlusher={registerStylesFlusher}
        >
          <div className={editorScreenClassNames}>
            <Header
              projectStatus={{
                projectName,
                projectMessage,
                isDirty,
                showSavedStatus,
              }}
              projectControls={{
                disabled: buttonIsDisabled,
                isProjectBusy,
                onNewProject: handleNewProject,
                onOpenProject: handleOpenProject,
                onSaveProject: handleSaveProject,
              }}
              viewControls={{
                showStructure,
                showNarrative,
                showBackgrounds,
                showFrameEffects,
                structureButtonIsDisabled,
                onToggleStructure: toggleStructure,
                onToggleNarrative: () => setShowNarrative((visible) => !visible),
                onToggleBackgrounds: () => setShowBackgrounds((visible) => !visible),
                onToggleFrameEffects: () => setShowFrameEffects((visible) => !visible),
              }}
              insertControls={{
                mediaTools: mediaInsert,
                disabled: buttonIsDisabled,
                onInsertTextBlock: handleInsertTextBlock,
                onInsertCarousel: () => editor?.commands.insertCarousel(),
              }}
              libraryControls={{
                definitions: customComponentDefinitions,
                disabled: buttonIsDisabled,
                onImport: handleImportCustomComponents,
                onInsertComponent: handleInsertCustomComponent,
              }}
              build={{
                state: buildState,
                disabled: buttonIsDisabled,
                onBuild: buildBook,
              }}
            />

            <ContentError editor={editor} />

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
                book={pages.book}
                pageId={pages.activePage.id}
                session={pages.session}
                definitions={libraries.definitions}
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
    </ProjectAssetsProvider>
  );
};
