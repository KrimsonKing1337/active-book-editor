import type { ChangeEvent, ReactNode } from 'react';

import type { FrameSide, VisualVisibility, VisualFrameWidth } from '@active-book/types';

import { Checkbox, Select } from '../../../EffectControls';
import { PlacementNumber } from '../PlacementNumber';

import styles from '../../VisualRegionSettings.module.scss';

const frameSides: readonly FrameSide[] = ['top', 'right', 'bottom', 'left'];

const sideLabels: Record<FrameSide, string> = {
  top: 'Сверху',
  right: 'Справа',
  bottom: 'Снизу',
  left: 'Слева',
};

const defaultFrameWidth = { value: 12, unit: 'px' } as const;

type Unit = 'px' | '%';

type FrameMaskSettingsProps = {
  visibility: VisualVisibility;
  onChange: (visibility: VisualVisibility) => void;
};

export const FrameMaskSettings = ({ visibility, onChange }: FrameMaskSettingsProps) => {
  const isEnabled = visibility.sides !== undefined;
  const frameWidth = visibility.frameWidth ?? defaultFrameWidth;

  const isPerSideWidth = !('value' in frameWidth);
  const uniformWidth = 'value' in frameWidth ? frameWidth : frameWidth.top;

  let sideWidths: Record<FrameSide, typeof uniformWidth> = {
    top: uniformWidth,
    right: uniformWidth,
    bottom: uniformWidth,
    left: uniformWidth,
  };

  if (!('value' in frameWidth)) {
    sideWidths = frameWidth;
  }

  const updateVisibility = (patch: Partial<VisualVisibility>) => {
    onChange({ ...visibility, ...patch });
  };

  const handleEnabledChange = (enabled: boolean) => {
    const nextVisibility = { ...visibility };

    if (enabled) {
      nextVisibility.sides = [...frameSides];
    } else {
      delete nextVisibility.sides;
    }

    onChange(nextVisibility);
  };

  const handleWidthModeChange = (perSide: boolean) => {
    let nextWidth: VisualFrameWidth = { ...uniformWidth };

    if (perSide) {
      nextWidth = {
        top: { ...uniformWidth },
        right: { ...uniformWidth },
        bottom: { ...uniformWidth },
        left: { ...uniformWidth },
      };
    }

    updateVisibility({ frameWidth: nextWidth });
  };

  const handleUniformWidthChange = (value: number) => {
    updateVisibility({
      frameWidth: {
        ...uniformWidth,
        value,
      },
    });
  };

  const handleSideWidthChange = (side: FrameSide, value: number) => {
    const frameWidthSide = {
      ...sideWidths[side],
      value,
    };

    const frameWidth = {
      ...sideWidths,
      [side]: frameWidthSide,
    };

    updateVisibility({ frameWidth });
  };

  const handleSideWidthUnitChange = (side: FrameSide, unit: Unit) => {
    const frameWidthSide = {
      ...sideWidths[side],
      unit,
    };

    const frameWidth = {
      ...sideWidths,
      [side]: frameWidthSide,
    };

    updateVisibility({ frameWidth });
  };

  let widthControls: ReactNode;

  if (isPerSideWidth) {
    widthControls = (
      <div className={styles.Grid}>
        {frameSides.map((sideCur) => {
          const sideLabel = sideLabels[sideCur].toLowerCase();

          const placementNumberLabel = `Толщина: ${sideLabel}`;
          const selectAriaLabel = `Единица толщины: ${sideLabel}`;

          const { value, unit } = sideWidths[sideCur];

          return (
            <div key={sideCur} className={styles.Field}>
              <PlacementNumber
                label={placementNumberLabel}
                value={value}
                min={0}
                onChange={(val) => handleSideWidthChange(sideCur, val)}
              />

              <Select
                aria-label={selectAriaLabel}
                value={unit}
                onChange={(e) => handleSideWidthUnitChange(sideCur, e.target.value as Unit)}
              >
                <option value="px">
                  px
                </option>

                <option value="%">
                  %
                </option>
              </Select>
            </div>
          );
        })}
      </div>
    );
  } else {
    widthControls = (
      <>
        <PlacementNumber
          label="Толщина рамочной маски"
          value={uniformWidth.value}
          min={0}
          onChange={handleUniformWidthChange}
        />

        <Select
          aria-label="Единица толщины маски"
          value={uniformWidth.unit}
          onChange={(e) => updateVisibility({
            frameWidth: {
              ...uniformWidth,
              unit: e.target.value as Unit,
            },
          })}
        >
          <option value="px">
            px
          </option>

          <option value="%">
            %
          </option>
        </Select>
      </>
    );
  }

  return (
    <fieldset className={styles.Settings}>
      <legend>
        Маска сторон
      </legend>

      <Checkbox
        checked={isEnabled}
        onChange={(e) => handleEnabledChange(e.target.checked)}
      >
        Ограничить сторонами рамки
      </Checkbox>

      {isEnabled && (
        <>
          <div className={styles.Grid}>
            {frameSides.map((sideCur) => {
              const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
                const selectedSides = visibility.sides ?? [];

                const nextSides = selectedSides.filter((selectedSideCur) => {
                  return selectedSideCur !== sideCur;
                });

                if (e.target.checked) {
                  nextSides.push(sideCur);
                }

                updateVisibility({ sides: nextSides });
              };

              const sideIsVisible = visibility.sides?.includes(sideCur);
              const checkBoxChecked = sideIsVisible ?? false;

              return (
                <Checkbox
                  key={sideCur}
                  checked={checkBoxChecked}
                  onChange={handleChange}
                >
                  {sideLabels[sideCur]}
                </Checkbox>
              );
            })}
          </div>

          <Checkbox
            checked={isPerSideWidth}
            onChange={(e) => handleWidthModeChange(e.target.checked)}
          >
            Раздельная толщина сторон
          </Checkbox>

          {widthControls}
        </>
      )}
    </fieldset>
  );
};
