import { type CSSProperties, type KeyboardEvent } from 'react';

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

const handleInputEnter = (event: KeyboardEvent<HTMLDivElement>) => {
  if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
    event.target.blur();
  }
};

export const StyleEditor = ({ value, layer, mediaId, defaultZIndex = 0 }: StyleEditorProps) => {
  const { currentStyle, setProperty, previewStyle, commitStyle } = useStyleEditor({ value, layer, mediaId });

  const rawZIndex = Number(currentStyle.zIndex ?? defaultZIndex);
  const zIndex = Number.isFinite(rawZIndex) ? rawZIndex : 0;

  const changeBlur = (blur: number, updateLocal = true) => {
    if (Number.isFinite(blur) && blur >= 0) {
      setProperty('backdropFilter', getBlurFilter(blur), updateLocal);
    }
  };

  return (
    <div className={styles.StyleEditor} onKeyDown={handleInputEnter}>
      <ColorSettings
        color={String(currentStyle.backgroundColor ?? '')}
        onColorChange={(color) => setProperty('backgroundColor', color)}
        onCommit={commitStyle}
      />

      <BlurSettings
        filter={currentStyle.backdropFilter}
        onChange={changeBlur}
        onCommit={commitStyle}
      />

      <LayerSettings
        zIndex={zIndex}
        onChange={(index) => setProperty('zIndex', index)}
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
