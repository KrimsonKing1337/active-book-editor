import type { CSSProperties, KeyboardEvent } from 'react';

import type { FilterOperation } from '@active-book/book-builder/effects';

import type { BackgroundPreviewLayer } from '../../PageEffectsContext';

import { useStyleEditor } from './hooks';

import { useBackgroundStyle } from '../BackgroundSettings/BackgroundStyleContext';

import { AdvancedStyles, ColorSettings, FilterSettings, LayerSettings } from './components';

import styles from './StyleEditor.module.scss';

export type StyleEditorProps = {
  value: CSSProperties;
  layer: BackgroundPreviewLayer;
  styleFilters?: FilterOperation[];
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
  styleFilters,
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

  const { commitFilters } = useBackgroundStyle();

  const rawZIndex = Number(currentStyle.zIndex ?? defaultZIndex);
  const zIndex = Number.isFinite(rawZIndex) ? rawZIndex : 0;

  const handleColorChange = (val: string) => {
    setProperty('backgroundColor', val);
  };

  const handleLayerChange = (val: number) => {
    setProperty('zIndex', val);
  };

  const handleApplyFilters = (operations: FilterOperation[]) => {
    commitStyle();

    const mediaIdSafe = mediaId ?? null;

    commitFilters(layer, mediaIdSafe, operations);
  };

  const backgroundColor = String(currentStyle.backgroundColor ?? '');
  const isMedia = layer === 'image' || layer === 'video';

  return (
    <div className={styles.StyleEditor} onKeyDown={handleInputEnter}>
      <ColorSettings
        color={backgroundColor}
        onColorChange={handleColorChange}
        onCommit={commitStyle}
      />

      <LayerSettings
        zIndex={zIndex}
        onChange={handleLayerChange}
        onCommit={commitStyle}
      />

      <FilterSettings
        operations={styleFilters}
        onApply={handleApplyFilters}
      />

      <AdvancedStyles
        style={currentStyle}
        isMedia={isMedia}
        onPreview={previewStyle}
        onCommit={commitStyle}
      />
    </div>
  );
};
