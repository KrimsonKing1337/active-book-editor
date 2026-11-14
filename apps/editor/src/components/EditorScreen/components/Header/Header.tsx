import type { BuildState } from '../../@types';

import type {
  ProjectStatusProps,
  ProjectControlsProps,
  ViewControlsProps,
  InsertControlsProps,
  LibraryControlsProps,
} from './components';

import {
  ProjectStatus,
  ProjectControls,
  ViewControls,
  InsertControls,
  LibraryControls,
} from './components';

import styles from './Header.module.scss';

export type HeaderProps = {
  projectStatus: ProjectStatusProps;
  projectControls: ProjectControlsProps;
  viewControls: ViewControlsProps;
  insertControls: InsertControlsProps;
  libraryControls: LibraryControlsProps;
  build: {
    state: BuildState;
    disabled: boolean;
    onBuild: () => Promise<void>;
  };
};

export const Header = ({
  projectStatus,
  projectControls,
  viewControls,
  insertControls,
  libraryControls,
  build,
}: HeaderProps) => {
  const {
    state: buildState,
    disabled: buildIsDisabled,
    onBuild,
  } = build;
  let buttonBuildLabel = 'Собрать книгу';

  if (buildState === 'building') {
    buttonBuildLabel = 'Сборка...';
  }

  return (
    <header className={styles.Header}>
      <ProjectStatus {...projectStatus} />

      <div className={styles.Actions}>
        <ProjectControls {...projectControls} />
        <span className={styles.Separator} />
        <ViewControls {...viewControls} />
        <LibraryControls {...libraryControls} />
        <InsertControls {...insertControls} />

        <button
          type="button"
          disabled={buildIsDisabled || buildState === 'building'}
          onClick={() => void onBuild()}
        >
          {buttonBuildLabel}
        </button>
      </div>
    </header>
  );
};
