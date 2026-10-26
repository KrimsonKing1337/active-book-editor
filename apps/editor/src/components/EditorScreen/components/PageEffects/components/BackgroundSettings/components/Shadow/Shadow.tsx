import type { BackgroundOptions } from '@components/EditorScreen/components/PageEffects/@types';

import { StyleEditor } from '../../../StyleEditor';
import { createDefaultShadowFilters } from '../../../../utils';

import { DEFAULT_SHADOW_STYLE } from '../../constants';

import { Checkbox } from '../../../EffectControls';

import styles from '../../BackgroundSettings.module.scss';

type BackgroundShadow = NonNullable<BackgroundOptions['shadow']>;

export type ShadowProps = {
  shadow: BackgroundShadow;
  onChange: (shadow: BackgroundShadow) => void;
};

export const Shadow = ({ shadow, onChange }: ShadowProps) => {
  const { show, style } = shadow;

  const handleShowChange = (show: boolean) => {
    const hasNoStyles = !style || Object.keys(style).length === 0;
    const nextStyle = hasNoStyles ? DEFAULT_SHADOW_STYLE : style;
    const styleFilters = shadow.styleFilters ?? createDefaultShadowFilters();

    onChange({
      ...shadow,
      show,
      style: nextStyle,
      styleFilters,
    });
  };

  return (
    <details className={styles.Section}>
      <summary>
        Затемнение и фильтры
      </summary>

      <Checkbox checked={show ?? false} onChange={(e) => handleShowChange(e.target.checked)}>
        Показывать слой
      </Checkbox>

      <StyleEditor
        defaultZIndex={2}
        value={style ?? {}}
        styleFilters={shadow.styleFilters}
        layer="shadow"
      />
    </details>
  );
};
