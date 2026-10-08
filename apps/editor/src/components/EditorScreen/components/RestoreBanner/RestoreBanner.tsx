import type { PendingLocalProject } from '@project/@types';

import styles from './RestoreBanner.module.scss';

type RestoreBannerProps = {
  pendingRestore: PendingLocalProject;
  isProjectBusy: boolean;
  onContinueLastProject: () => Promise<void>;
  onForgetLastProject: () => Promise<void>;
};

export const RestoreBanner = ({
  pendingRestore,
  isProjectBusy,
  onContinueLastProject,
  onForgetLastProject,
}: RestoreBannerProps) => {
  return (
    <div className={styles.RestoreBanner}>
      <span>
        Продолжить работу с последним проектом «{pendingRestore.name}»?
      </span>

      <button type="button" disabled={isProjectBusy} onClick={() => void onContinueLastProject()}>
        Открыть последний проект
      </button>

      <button type="button" disabled={isProjectBusy} onClick={() => void onForgetLastProject()}>
        Не открывать
      </button>
    </div>
  );
};
