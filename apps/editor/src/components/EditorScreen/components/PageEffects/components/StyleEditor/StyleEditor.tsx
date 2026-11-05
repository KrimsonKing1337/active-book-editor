import type { CSSProperties, KeyboardEvent } from 'react';

import classNames from 'classnames';

import type { FilterOperation } from '@active-book/book-builder/effects';

import { type BackgroundPreviewLayer } from '../../context';


import { useOptionalBackgroundStyle } from '../BackgroundSettings/BackgroundStyleContext';

import { type StyleEditorController, useStyleEditor } from './hooks';

import { AdvancedStyles, ColorSettings, FilterSettings } from './components';

import styles from './StyleEditor.module.scss';

type ColorProperty = 'color' | 'backgroundColor';

export type StyleEditorProps = {
  value: CSSProperties;
  layer: BackgroundPreviewLayer;
  styleFilters?: FilterOperation[];
  mediaId?: string;
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
