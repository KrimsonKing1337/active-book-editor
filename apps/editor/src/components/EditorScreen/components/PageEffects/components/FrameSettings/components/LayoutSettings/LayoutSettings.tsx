import type { ChangeEvent } from 'react';

import type { FrameElementLayout } from 'activeBook-core/hooks/effects/frame/@types';

import { Select, Checkbox } from '../../../EffectControls';
import { CssLengthInput } from '../../../CssLengthInput';

import { positions } from '../../constants';

import styles from '../../FrameSettings.module.scss';

export type ItemLayout = Pick<FrameElementLayout, 'position' | 'offsetX' | 'offsetY' | 'hidden'>;

type LayoutSettingsProps = {
  item: ItemLayout;
  hidden: boolean;
  onChange: (changes: Partial<ItemLayout>) => void;
  onHiddenChange: (hidden: boolean) => void;
};

export const LayoutSettings = ({
  item,
  hidden,
  onChange,
  onHiddenChange,
}: LayoutSettingsProps) => {
  const handlePositionChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange({ position: e.target.value as ItemLayout['position'] });
  };

  const handleOffsetXChange = (val: string) => {
    onChange({ offsetX: val });
  };

  const handleOffsetYChange = (val: string) => {
    onChange({ offsetY: val });
  };

  const handleHiddenChange = (e: ChangeEvent<HTMLInputElement>) => {
    onHiddenChange(e.target.checked);
  };

  const itemPosition = item.position ?? 'top-left';
  const itemOffsetX = item.offsetX ?? '0px';
  const itemOffsetY = item.offsetY ?? '0px';

  return (
    <>
      <div className={styles.Layout}>
        <label className={styles.Field}>
          <span>
            Точка привязки
          </span>

          <Select value={itemPosition} onChange={handlePositionChange}>
            {positions.map((positionCur) => {
              const { value, label } = positionCur;

              return (
                <option key={value} value={value}>
                  {label}
                </option>
              );
            })}
          </Select>
        </label>

        <div className={styles.Field}>
          <span>
            Смещение X
          </span>

          <CssLengthInput
            label="Смещение X"
            value={itemOffsetX}
            onChange={handleOffsetXChange}
          />
        </div>

        <div className={styles.Field}>
          <span>
            Смещение Y
          </span>

          <CssLengthInput
            label="Смещение Y"
            value={itemOffsetY}
            onChange={handleOffsetYChange}
          />
        </div>
      </div>

      <div className={styles.Controls}>
        <Checkbox checked={hidden} onChange={handleHiddenChange}>
          Скрыть элемент
        </Checkbox>
      </div>
    </>
  );
};
