import type { CSSProperties } from 'react';

import { StyleEditor } from '../../../StyleEditor';

import styles from '../../BackgroundSettings.module.scss';

type BackgroundProps = {
  style: CSSProperties;
  onChange: (style: CSSProperties) => void;
  onBlurPreview: (blur: number | null) => void;
};

export const Background = ({ style, onChange, onBlurPreview }: BackgroundProps) => {
  return (
    <details className={styles.Section}>
      <summary>Фон</summary>

      <StyleEditor value={style} onChange={onChange} onBlurPreview={onBlurPreview} />
    </details>
  );
};
