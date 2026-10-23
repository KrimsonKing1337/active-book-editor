import type { BackgroundOptions } from '@components/EditorScreen/components/PageEffects/@types';

import { StyleEditor } from '../../../StyleEditor';
import { getBlurFilter } from '../../../StyleEditor/utils';

import styles from '../../BackgroundSettings.module.scss';

type BackgroundShadow = NonNullable<BackgroundOptions['shadow']>;

export type ShadowProps = {
  shadow: BackgroundShadow;
  onChange: (shadow: BackgroundShadow) => void;
};

const defaultShadowStyle = {
  zIndex: 2,
  backdropFilter: getBlurFilter(10),
};

export const Shadow = ({ shadow, onChange }: ShadowProps) => {
  const { show, style } = shadow;

  const handleShowChange = (show: boolean) => {
    const hasNoStyles = !style || Object.keys(style).length === 0;
    const nextStyle = hasNoStyles ? defaultShadowStyle : style;

    onChange({
      ...shadow,
      show,
      style: nextStyle,
    });
  };

  return (
    <details className={styles.Section}>
      <summary>
        Затемнение и фильтры
      </summary>

      <label>
        <input
          type="checkbox"
          checked={show ?? false}
          onChange={(e) => handleShowChange(e.target.checked)}
        />
          Показывать слой
      </label>

      <StyleEditor
        defaultZIndex={2}
        value={style ?? {}}
        layer="shadow"
      />
    </details>
  );
};
