import type { CSSProperties } from 'react';

import { StyleEditor } from '../../../StyleEditor';

import styles from '../../BackgroundSettings.module.scss';

type BackgroundProps = {
  style: CSSProperties;
  onChange: (style: CSSProperties) => void;
  onStylePreview: (style: CSSProperties) => void;
  onStyleCommit: () => boolean;
};

export const Background = ({ style, onChange, onStylePreview, onStyleCommit }: BackgroundProps) => {
  return (
    <details className={styles.Section}>
      <summary>Фон</summary>

      <StyleEditor value={style} onChange={onChange} onStylePreview={onStylePreview} onStyleCommit={onStyleCommit} />
    </details>
  );
};
