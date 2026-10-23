import type { CSSProperties } from 'react';

import { StyleEditor } from '../../../StyleEditor';

import styles from '../../BackgroundSettings.module.scss';

type BackgroundProps = {
  style: CSSProperties;
};

export const Background = ({ style }: BackgroundProps) => {
  return (
    <details className={styles.Section}>
      <summary>Фон</summary>

      <StyleEditor layer="background" value={style} />
    </details>
  );
};
