import classNames from 'classnames';

import type { BuildState, TextComponentName } from '../../@types';

import styles from './Header.module.scss';

type HeaderProps = {
  projectName: string;
  projectMessage: string;
  isDirty: boolean;
  isProjectBusy: boolean;
  showSavedStatus: boolean;
  showStructure: boolean;
  buildState: BuildState;
  buttonIsDisabled: boolean;
  structureButtonIsDisabled: boolean;
  onNewProject: () => Promise<void>;
  onOpenProject: () => Promise<void>;
  onSaveProject: () => Promise<void>;
  onToggleStructure: () => void;
  onInsertComponent: (name: string) => void;
  onInsertTextComponent: (name: TextComponentName) => void;
  onBuildBook: () => Promise<void>;
};

export const Header = ({
  projectName,
  projectMessage,
  isDirty,
  isProjectBusy,
  showSavedStatus,
  showStructure,
  buildState,
  buttonIsDisabled,
  structureButtonIsDisabled,
  onNewProject,
  onOpenProject,
  onSaveProject,
  onToggleStructure,
  onInsertComponent,
  onInsertTextComponent,
  onBuildBook,
}: HeaderProps) => {
  const buttonBuildLabel = buildState === 'building' ? 'Сборка...' : 'Собрать книгу';
  const structureButtonLabel = showStructure ? 'Скрыть структуру' : 'Показать структуру';

  const savedStatusClassNames = classNames({
    [styles.SavedStatus]: true,
    [styles.isVisible]: showSavedStatus,
  });

  return (
    <header className={styles.Header}>
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
        <button type="button" disabled={buttonIsDisabled} onClick={() => void onNewProject()}>
          Новый проект
        </button>

        <button type="button" disabled={buttonIsDisabled} onClick={() => void onOpenProject()}>
          Открыть проект
        </button>

        <button type="button" disabled={buttonIsDisabled} onClick={() => void onSaveProject()}>
          {isProjectBusy ? 'Подождите...' : 'Сохранить'}
        </button>

        <span className={styles.Separator} />

        <button
          type="button"
          disabled={structureButtonIsDisabled}
          aria-pressed={showStructure}
          onClick={onToggleStructure}
        >
          {structureButtonLabel}
        </button>

        <button
          className={styles.Button}
          type="button"
          disabled={buttonIsDisabled}
          onClick={() => onInsertComponent('Counter')}
        >
          Добавить Counter
        </button>

        <button type="button" disabled={buttonIsDisabled} onClick={() => onInsertTextComponent('P')}>
          Добавить параграф
        </button>

        <button type="button" disabled={buttonIsDisabled} onClick={() => onInsertTextComponent('H1')}>
          Добавить заголовок 1
        </button>

        <button type="button" disabled={buttonIsDisabled} onClick={() => onInsertTextComponent('H2')}>
          Добавить заголовок 2
        </button>

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
