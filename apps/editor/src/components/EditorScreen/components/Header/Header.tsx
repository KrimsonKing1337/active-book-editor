import type { ReactNode } from 'react';

import type { BrowserComponentDefinition } from '@active-book/book-builder/components/custom/browser';

import type { BuildState, TextBlock } from '../../@types';

import {
  ProjectStatus,
  ProjectControls,
  ViewControls,
  InsertControls,
  LibraryControls,
} from './components';

import styles from './Header.module.scss';

type HeaderProps = {
  mediaTools: ReactNode;
  projectName: string;
  projectMessage: string;
  isDirty: boolean;
  isProjectBusy: boolean;
  showSavedStatus: boolean;
  showStructure: boolean;
  showNarrative: boolean;
  showBackgrounds: boolean;
  showFrameEffects: boolean;
  buildState: BuildState;
  buttonIsDisabled: boolean;
  structureButtonIsDisabled: boolean;

  onNewProject: () => Promise<void>;
  onOpenProject: () => Promise<void>;
  onSaveProject: () => Promise<void>;
  onToggleStructure: () => void;
  onToggleNarrative: () => void;
  onToggleBackgrounds: () => void;
  onToggleFrameEffects: () => void;
  onInsertCustomComponent: (packageName: string, name: string) => void;
  customComponentDefinitions: BrowserComponentDefinition[];
  onInsertTextBlock: (block: TextBlock) => void;
  onInsertCarousel: () => void;
  onBuildBook: () => Promise<void>;
  onImportCustomComponents: () => void;
};

export const Header = ({
  mediaTools,
  projectName,
  projectMessage,
  isDirty,
  isProjectBusy,
  showSavedStatus,
  showStructure,
  showNarrative,
  showBackgrounds,
  showFrameEffects,
  buildState,
  buttonIsDisabled,
  structureButtonIsDisabled,
  onNewProject,
  onOpenProject,
  onSaveProject,
  onToggleStructure,
  onToggleNarrative,
  onToggleBackgrounds,
  onToggleFrameEffects,
  onInsertCustomComponent,
  customComponentDefinitions,
  onInsertTextBlock,
  onInsertCarousel,
  onBuildBook,
  onImportCustomComponents,
}: HeaderProps) => {
  let buttonBuildLabel = 'Собрать книгу';

  if (buildState === 'building') {
    buttonBuildLabel = 'Сборка...';
  }

  return (
    <header className={styles.Header}>
      <ProjectStatus
        projectName={projectName}
        projectMessage={projectMessage}
        isDirty={isDirty}
        showSavedStatus={showSavedStatus}
      />

      <div className={styles.Actions}>
        <ProjectControls
          disabled={buttonIsDisabled}
          isProjectBusy={isProjectBusy}

          onNewProject={onNewProject}
          onOpenProject={onOpenProject}
          onSaveProject={onSaveProject}
        />

        <span className={styles.Separator} />

        <ViewControls
          showStructure={showStructure}
          showNarrative={showNarrative}
          showBackgrounds={showBackgrounds}
          showFrameEffects={showFrameEffects}
          structureButtonIsDisabled={structureButtonIsDisabled}

          onToggleStructure={onToggleStructure}
          onToggleNarrative={onToggleNarrative}
          onToggleBackgrounds={onToggleBackgrounds}
          onToggleFrameEffects={onToggleFrameEffects}
        />

        <LibraryControls
          definitions={customComponentDefinitions}
          disabled={buttonIsDisabled}
          onImport={onImportCustomComponents}
          onInsertComponent={onInsertCustomComponent}
        />

        <InsertControls
          mediaTools={mediaTools}
          disabled={buttonIsDisabled}
          onInsertTextBlock={onInsertTextBlock}
          onInsertCarousel={onInsertCarousel}
        />

        <button
          type="button"
          disabled={buttonIsDisabled || buildState === 'building'}
          onClick={() => void onBuildBook()}
        >
          {buttonBuildLabel}
        </button>
      </div>
    </header>
  );
};
