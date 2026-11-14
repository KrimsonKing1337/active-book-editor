import classNames from 'classnames';

import styles from '../Header.module.scss';

type ProjectStatusProps = {
  projectName: string;
  projectMessage: string;
  isDirty: boolean;
  showSavedStatus: boolean;
};

export const ProjectStatus = ({
  projectName,
  projectMessage,
  isDirty,
  showSavedStatus,
}: ProjectStatusProps) => {
  const savedStatusClassNames = classNames({
    [styles.SavedStatus]: true,
    [styles.isVisible]: showSavedStatus,
  });

  let dirtyStatusLabel = '';

  if (isDirty) {
    dirtyStatusLabel = ' *';
  }

  return (
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
  );
};
