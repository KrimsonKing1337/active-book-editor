import type { FrameSide, VisualVisibility } from '@active-book/types';

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

type FrameMaskSettingsProps = {
  visibility: VisualVisibility;
  onChange: (visibility: VisualVisibility) => void;
};

export const FrameMaskSettings = ({ visibility, onChange }: FrameMaskSettingsProps) => {
  const isEnabled = visibility.sides !== undefined;
  const frameWidth = visibility.frameWidth ?? defaultFrameWidth;
  const isPerSideWidth = !('value' in frameWidth);
  const uniformWidth = 'value' in frameWidth ? frameWidth : frameWidth.top;
  const sideWidths = 'value' in frameWidth ? {
    top: frameWidth,
    right: frameWidth,
    bottom: frameWidth,
    left: frameWidth,
  } : frameWidth;

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
    const nextWidth = perSide ? {
      top: { ...uniformWidth },
      right: { ...uniformWidth },
      bottom: { ...uniformWidth },
      left: { ...uniformWidth },
    } : { ...uniformWidth };

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
    updateVisibility({
      frameWidth: {
        ...sideWidths,
        [side]: {
          ...sideWidths[side],
          value,
        },
      },
    });
  };

  const handleSideWidthUnitChange = (side: FrameSide, unit: 'px' | '%') => {
    updateVisibility({
      frameWidth: {
        ...sideWidths,
        [side]: {
          ...sideWidths[side],
          unit,
        },
      },
    });
  };

  return (
    <fieldset className={styles.Settings}>
      <legend>
        Маска сторон
      </legend>

      <Checkbox checked={isEnabled} onChange={(event) => handleEnabledChange(event.target.checked)}>
        Ограничить сторонами рамки
      </Checkbox>

      {isEnabled && (
        <>
          <div className={styles.Grid}>
            {frameSides.map((side) => (
              <Checkbox
                key={side}
                checked={visibility.sides?.includes(side) ?? false}
                onChange={(event) => updateVisibility({
                  sides: event.target.checked
                    ? [...(visibility.sides ?? []), side] : visibility.sides?.filter((cur) => cur !== side),
                })}
              >
                {sideLabels[side]}
              </Checkbox>
            ))}
          </div>

          <Checkbox checked={isPerSideWidth} onChange={(event) => handleWidthModeChange(event.target.checked)}>
            Раздельная толщина сторон
          </Checkbox>

          {isPerSideWidth ? (
            <div className={styles.Grid}>
              {frameSides.map((side) => (
                <div key={side} className={styles.Field}>
                  <PlacementNumber
                    label={`Толщина: ${sideLabels[side].toLowerCase()}`}
                    value={sideWidths[side].value}
                    min={0}
                    onChange={(value) => handleSideWidthChange(side, value)}
                  />

                  <Select
                    aria-label={`Единица толщины: ${sideLabels[side].toLowerCase()}`}
                    value={sideWidths[side].unit}
                    onChange={(event) => handleSideWidthUnitChange(side, event.target.value as 'px' | '%')}
                  >
                    <option value="px">
                      px
                    </option>

                    <option value="%">
                      %
                    </option>
                  </Select>
                </div>
              ))}
            </div>
          ) : (
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
                onChange={(event) => updateVisibility({
                  frameWidth: {
                    ...uniformWidth,
                    unit: event.target.value as 'px' | '%',
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
          )}
        </>
      )}
    </fieldset>
  );
};
