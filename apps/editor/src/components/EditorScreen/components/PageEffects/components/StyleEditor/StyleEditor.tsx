import type { CSSProperties, KeyboardEvent } from 'react';

import type { FilterOperation } from '@active-book/book-builder/effects';

import type { BackgroundPreviewLayer } from '../../PageEffectsContext';

import { usePageEffects } from '../../PageEffectsContext';

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
  additionalColorProperty?: 'color' | 'backgroundColor';
  colorLabel?: string;
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
  additionalColorProperty,
  colorLabel,
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
  const { effects } = usePageEffects();

  const rawZIndex = Number(currentStyle.zIndex ?? defaultZIndex);
  const zIndex = Number.isFinite(rawZIndex) ? rawZIndex : 0;

  const layerZIndexes: number[] = [];

  for (const effectCur of effects) {
    if (controller && effectCur.type === 'side') {
      const items = [...(effectCur.options.shadows ?? []), ...(effectCur.options.texts ?? [])];

      for (const item of items) {
        const value = Number(item.style?.zIndex);

        if (item.style?.zIndex !== undefined && Number.isFinite(value)) {
          layerZIndexes.push(value);
        }
      }
    } else if (!controller && effectCur.type === 'background') {
      const options = effectCur.options;
      const styles = [
        options.style,
        options.shadow?.style,
        ...(options.images ?? []).map((item) => item.style),
        ...(options.videos ?? []).map((item) => item.style),
      ];

      for (const style of styles) {
        const value = Number(style?.zIndex);

        if (style?.zIndex !== undefined && Number.isFinite(value)) {
          layerZIndexes.push(value);
        }
      }
    }
  }

  const minimumZIndex = Math.min(zIndex, ...layerZIndexes);
  const maximumZIndex = Math.max(zIndex, ...layerZIndexes);

  const sameIndexCount = layerZIndexes.filter((index) => index === zIndex).length;
  const currentLayerIsRegistered = currentStyle.zIndex !== undefined;
  const otherLayersAtSameIndex = sameIndexCount > (currentLayerIsRegistered ? 1 : 0);

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

  const colorProperties = additionalColorProperty
    ? [colorProperty, additionalColorProperty]
    : [colorProperty];
  const isMedia = isMediaOverride ?? (layer === 'image' || layer === 'video');

  return (
    <div className={styles.StyleEditor} onKeyDown={handleInputEnter}>
      {colorProperties.map((property) => {
        const value = String(currentStyle[property] ?? '');

        let label = property === 'color' ? 'Цвет текста (color)' : 'Цвет фона (background-color)';

        if (property === colorProperty && colorLabel) {
          label = colorLabel;
        }

        return (
          <ColorSettings
            key={property}
            label={label}
            color={value}
            onColorChange={(nextColor) => setProperty(property, nextColor)}
            onCommit={commitStyle}
          />
        );
      })}

      <LayerSettings
        zIndex={zIndex}
        minimumZIndex={minimumZIndex}
        maximumZIndex={maximumZIndex}
        otherLayersAtSameIndex={otherLayersAtSameIndex}
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
