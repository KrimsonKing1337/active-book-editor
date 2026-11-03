import classNames from 'classnames';

import type { BrowserComponentDefinition } from '@active-book/book-builder/components/custom/browser';

import type { BuildState, TextComponentName } from '../../@types';

import styles from './Header.module.scss';

type HeaderProps = {
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
  onInsertTextComponent: (name: TextComponentName) => void;
  onBuildBook: () => Promise<void>;
  onImportCustomComponents: () => void;
};

export const Header = ({
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
  onInsertTextComponent,
  onBuildBook,
  onImportCustomComponents,
}: HeaderProps) => {
  const savedStatusClassNames = classNames({
    [styles.SavedStatus]: true,
    [styles.isVisible]: showSavedStatus,
  });

  const buttonBuildLabel = buildState === 'building' ? 'Сборка...' : 'Собрать книгу';
  const structureButtonLabel = showStructure ? 'Скрыть структуру' : 'Показать структуру';
  const dirtyStatusLabel = isDirty ? ' *' : '';
  const projectBusyStatusLabel = isProjectBusy ? 'Подождите...' : 'Сохранить';

  const narrativeControlButtonLabel = showNarrative ? 'Скрыть нарратив' : 'Показать нарратив';
  const backgroundControlButtonLabel = showBackgrounds ? 'Скрыть фон' : 'Показать фон';
  const frameEffectsButtonLabel = showFrameEffects ? 'Скрыть рамочные эффекты' : 'Показать рамочные эффекты';

  return (
    <header className={styles.Header}>
      <div className={styles.ProjectTitle}>
        <div className={styles.TitleLine}>
          <strong>
            {projectName}
            {dirtyStatusLabel}
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
          {projectBusyStatusLabel}
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

        <button type="button" aria-pressed={showNarrative} onClick={onToggleNarrative}>
          {narrativeControlButtonLabel}
        </button>

        <button type="button" aria-pressed={showBackgrounds} onClick={onToggleBackgrounds}>
          {backgroundControlButtonLabel}
        </button>

        <button type="button" aria-pressed={showFrameEffects} onClick={onToggleFrameEffects}>
          {frameEffectsButtonLabel}
        </button>

        <button type="button" disabled={buttonIsDisabled} onClick={() => void onImportCustomComponents()}>
          Импортировать .tgz
        </button>

        {customComponentDefinitions.map((componentCur) => {
          const {
            id,
            description,
            packageName,
            name,
            title,
          } = componentCur;

          return (
            <button
              key={id}
              type="button"
              disabled={buttonIsDisabled}
              title={description}
              onClick={() => onInsertCustomComponent(packageName, name)}
            >
              Добавить {title}
            </button>
          );
        })}

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
