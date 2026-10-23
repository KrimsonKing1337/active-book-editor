import type { CSSProperties, KeyboardEvent } from 'react';

import type { BackgroundPreviewLayer } from '../../PageEffectsContext';

import { useStyleEditor } from './hooks';
import { getBlurFilter } from './utils';

import { AdvancedStyles, BlurSettings, ColorSettings, LayerSettings } from './components';

import styles from './StyleEditor.module.scss';

export type StyleEditorProps = {
  value: CSSProperties;
  layer: BackgroundPreviewLayer;
  mediaId?: string;
  defaultZIndex?: number;
};

const handleInputEnter = (e: KeyboardEvent<HTMLDivElement>) => {
  if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
    e.target.blur();
  }
};

export const StyleEditor = ({
  value,
  layer,
  mediaId,
  defaultZIndex = 0,
}: StyleEditorProps) => {
  const {
    currentStyle,
    setProperty,
    previewStyle,
    commitStyle,
  } = useStyleEditor({
    value,
    layer,
    mediaId,
  });

  const rawZIndex = Number(currentStyle.zIndex ?? defaultZIndex);
  const zIndex = Number.isFinite(rawZIndex) ? rawZIndex : 0;

  const handleBlurChange = (blur: number, updateLocal = true) => {
    if (Number.isFinite(blur) && blur >= 0) {
      const blurFilterValue = getBlurFilter(blur);

      setProperty('backdropFilter', blurFilterValue, updateLocal);
    }
  };

  const handleColorChange = (val: string) => {
    setProperty('backgroundColor', val);
  };

  const handleLayerChange = (val: number) => {
    setProperty('zIndex', val);
  };

  const backgroundColor = String(currentStyle.backgroundColor ?? '');

  return (
    <div className={styles.StyleEditor} onKeyDown={handleInputEnter}>
      <ColorSettings
        color={backgroundColor}
        onColorChange={handleColorChange}
        onCommit={commitStyle}
      />

      <BlurSettings
        filter={currentStyle.backdropFilter}
        onChange={handleBlurChange}
        onCommit={commitStyle}
      />

      <LayerSettings
        zIndex={zIndex}
        onChange={handleLayerChange}
        onCommit={commitStyle}
      />

      <AdvancedStyles
        style={currentStyle}
        onPreview={previewStyle}
        onCommit={commitStyle}
      />
    </div>
  );
};
