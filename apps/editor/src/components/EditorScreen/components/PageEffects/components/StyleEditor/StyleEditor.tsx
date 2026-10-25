import type { CSSProperties, KeyboardEvent } from 'react';

import type { FilterOperation } from '@active-book/book-builder/effects';

import type { BackgroundPreviewLayer } from '../../PageEffectsContext';

import type { StyleEditorController } from './hooks';

import { useStyleEditor } from './hooks';

import { useOptionalBackgroundStyle } from '../BackgroundSettings/BackgroundStyleContext';

import { AdvancedStyles, ColorSettings, FilterSettings, LayerSettings } from './components';

import styles from './StyleEditor.module.scss';

export type StyleEditorProps = {
  value: CSSProperties;
  layer: BackgroundPreviewLayer;
  styleFilters?: FilterOperation[];
  mediaId?: string;
  defaultZIndex?: number;
  colorProperty?: 'color' | 'backgroundColor';
  controller?: StyleEditorController;
  isMediaOverride?: boolean;
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
  colorProperty = 'backgroundColor',
  controller,
  isMediaOverride,
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
    controller,
  });

  const backgroundStyle = useOptionalBackgroundStyle();

  const rawZIndex = Number(currentStyle.zIndex ?? defaultZIndex);
  const zIndex = Number.isFinite(rawZIndex) ? rawZIndex : 0;

  const handleColorChange = (val: string) => {
    setProperty(colorProperty, val);
  };

  const handleLayerChange = (val: number) => {
    setProperty('zIndex', val);
  };

  const handleApplyFilters = (operations: FilterOperation[]) => {
    commitStyle();

    const normalizedMediaId = mediaId ?? null;

    if (controller) {
      controller.commitFilters(operations);
    } else {
      backgroundStyle?.commitFilters(layer, normalizedMediaId, operations);
    }
  };

  const color = String(currentStyle[colorProperty] ?? '');
  const isMedia = isMediaOverride ?? (layer === 'image' || layer === 'video');

  return (
    <div className={styles.StyleEditor} onKeyDown={handleInputEnter}>
      <ColorSettings
        color={color}
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
