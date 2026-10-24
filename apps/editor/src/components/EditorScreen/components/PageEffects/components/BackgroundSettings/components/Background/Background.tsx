import type { CSSProperties } from 'react';

import type { FilterOperation } from '@active-book/book-builder/effects';

import { StyleEditor } from '../../../StyleEditor';

import styles from '../../BackgroundSettings.module.scss';

type BackgroundProps = {
  style: CSSProperties;
  styleFilters?: FilterOperation[];
};

export const Background = ({ style, styleFilters }: BackgroundProps) => {
  return (
    <details className={styles.Section}>
      <summary>
        Фон
      </summary>

      <StyleEditor layer="background" value={style} styleFilters={styleFilters} />
    </details>
  );
};
