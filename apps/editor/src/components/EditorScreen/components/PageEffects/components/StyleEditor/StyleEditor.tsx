import type { CSSProperties, KeyboardEvent } from 'react';

import classNames from 'classnames';

import type { FilterOperation } from '@active-book/book-builder/effects';

import { type BackgroundPreviewLayer, usePageEffects } from '../../PageEffectsContext';


import { useOptionalBackgroundStyle } from '../BackgroundSettings/BackgroundStyleContext';

import { type StyleEditorController, useStyleEditor } from './hooks';

import { AdvancedStyles, ColorSettings, FilterSettings, LayerSettings } from './components';

import styles from './StyleEditor.module.scss';

type ColorProperty = 'color' | 'backgroundColor';

export type StyleEditorProps = {
  value: CSSProperties;
  layer: BackgroundPreviewLayer;
  styleFilters?: FilterOperation[];
  mediaId?: string;
  defaultZIndex?: number;
  colorProperty?: ColorProperty;
  additionalColorProperty?: ColorProperty;
  colorLabel?: string;
  colorDisabledReason?: string;
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
  colorDisabledReason,
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
      const layerStyles = [
        effectCur.options.shadow?.style,
        effectCur.options.text?.style,
        effectCur.options.style,
      ];

      for (const styleCur of layerStyles) {
        const value = Number(styleCur?.zIndex);

        if (styleCur?.zIndex !== undefined && Number.isFinite(value)) {
          layerZIndexes.push(value);
        }
      }
    } else if (!controller && effectCur.type === 'background') {
      const options = effectCur.options;

      const layerStyles = [
        options.style,
        options.shadow?.style,
        options.image?.style,
        options.video?.style,
      ];

      for (const styleCur of layerStyles) {
        const value = Number(styleCur?.zIndex);

        if (styleCur?.zIndex !== undefined && Number.isFinite(value)) {
          layerZIndexes.push(value);
        }
      }
    }
  }

  const minimumZIndex = Math.min(zIndex, ...layerZIndexes);
  const maximumZIndex = Math.max(zIndex, ...layerZIndexes);

  const sameIndexes = layerZIndexes.filter((indexCur) => indexCur === zIndex);

  const currentLayerIsRegistered = currentStyle.zIndex !== undefined;
  const digit = currentLayerIsRegistered ? 1 : 0;

  const otherLayersAtSameIndex = sameIndexes.length > digit;

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

  const colorProperties = [colorProperty];

  if (additionalColorProperty) {
    colorProperties.push(additionalColorProperty);
  }

  const isMediaLayer = layer === 'image' || layer === 'video';
  const isMedia = isMediaOverride ?? isMediaLayer;

  const colorFieldsetClassNames = classNames(styles.Colors, {
    [styles.DisabledColors]: Boolean(colorDisabledReason),
  });

  return (
    <div className={styles.StyleEditor} onKeyDown={handleInputEnter}>
      {colorDisabledReason && (
        <p className={styles.ColorNotice} role="note">
          {colorDisabledReason}
        </p>
      )}

      {colorProperties.map((propertyCur) => {
        const value = String(currentStyle[propertyCur] ?? '');

        let label = propertyCur === 'color' ? 'Цвет текста (color)' : 'Цвет фона (background-color)';

        if (propertyCur === colorProperty && colorLabel) {
          label = colorLabel;
        }

        const handleColorChange = (val: string) => {
          if (!colorDisabledReason) {
            setProperty(propertyCur, val);
          }
        };

        return (
          <fieldset
            key={propertyCur}
            className={colorFieldsetClassNames}
            disabled={Boolean(colorDisabledReason)}
          >
            <ColorSettings
              label={label}
              color={value}
              onColorChange={handleColorChange}
              onCommit={commitStyle}
            />
          </fieldset>
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
