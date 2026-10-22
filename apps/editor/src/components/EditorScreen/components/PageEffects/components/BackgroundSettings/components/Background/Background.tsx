import type { CSSProperties } from 'react';

import { StyleEditor } from '../../../StyleEditor';

import styles from '../../BackgroundSettings.module.scss';

type BackgroundProps = {
  style: CSSProperties;
  onChange: (style: CSSProperties) => void;
};

export const Background = ({ style, onChange }: BackgroundProps) => {
  return (
    <details className={styles.Section}>
      <summary>Фон</summary>

      <StyleEditor value={style} onChange={onChange} />
    </details>
  );
};
