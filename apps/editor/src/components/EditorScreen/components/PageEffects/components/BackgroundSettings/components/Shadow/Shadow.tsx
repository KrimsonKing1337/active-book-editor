import type { CSSProperties } from 'react';

import type { BackgroundOptions } from '@components/EditorScreen/components/PageEffects/@types';

import { StyleEditor } from '../../../StyleEditor';

import styles from '../../BackgroundSettings.module.scss';

type BackgroundShadow = NonNullable<BackgroundOptions['shadow']>;

export type ShadowProps = {
  shadow: BackgroundShadow;
  onChange: (shadow: BackgroundShadow) => void;
  onStylePreview: (style: CSSProperties) => void;
  onStyleCommit: () => boolean;
};

export const Shadow = ({ shadow, onChange, onStylePreview, onStyleCommit }: ShadowProps) => {
  const { show, style } = shadow;

  const handleShowChange = (show: boolean) => {
    const hasNoStyles = !style || Object.keys(style).length === 0;
    const nextStyle = hasNoStyles ? { zIndex: 2, backdropFilter: 'blur(10px)' } : style;

    onChange({
      ...shadow,
      show,
      style: nextStyle,
    });
  };

  const handleStyleChange = (style: CSSProperties) => {
    onChange({
      ...shadow,
      style,
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
        onChange={(val) => handleStyleChange(val)}
        onStylePreview={onStylePreview} onStyleCommit={onStyleCommit}
      />
    </details>
  );
};
