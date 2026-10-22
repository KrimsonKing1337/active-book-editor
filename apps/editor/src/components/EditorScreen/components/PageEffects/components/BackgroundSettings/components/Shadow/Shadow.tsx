import type { CSSProperties } from 'react';

import type { BackgroundOptions } from '../../../../@types';

import { StyleEditor } from '../../../StyleEditor';

import styles from '../../BackgroundSettings.module.scss';

type BackgroundShadow = NonNullable<BackgroundOptions['shadow']>;

export type ShadowProps = {
  shadow: BackgroundShadow;
  onChange: (shadow: BackgroundShadow) => void;
};

export const Shadow = ({ shadow, onChange }: ShadowProps) => {
  const handleShowChange = (show: boolean) => {
    onChange({ ...shadow, show });
  };

  const handleStyleChange = (style: CSSProperties) => {
    onChange({ ...shadow, style });
  };

  return (
      <section className={styles.Section}>
        <h3>
          Затемнение и фильтры
        </h3>

        <label>
          <input
            type="checkbox"
            checked={shadow.show ?? false}
            onChange={(e) => handleShowChange(e.target.checked)}
          />
          Показывать слой
        </label>

        <StyleEditor
          value={shadow.style ?? {}}
          onChange={(val) => handleStyleChange(val)}
        />
      </section>
  );
};
