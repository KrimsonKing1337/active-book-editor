import type { ReactNode } from 'react';

import styles from '../../EffectsModal.module.scss';

type PanelBodyProps = {
  content: ReactNode;
  notice: string;
  isLoading: boolean;
};

export const PanelBody = ({ content, notice, isLoading }: PanelBodyProps) => {
  return (
    <div className={styles.PanelBody}>
      <div className={styles.Content} inert={isLoading}>
        {content}
      </div>

      <p className={styles.Notice} inert={isLoading}>
        {notice}
      </p>
    </div>
  );
};
