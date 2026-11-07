import type { ChangeEvent } from 'react';

import type { FrameSide } from 'activeBook-core/hooks/effects/frame/@types';

import { Checkbox } from '../../../EffectControls';
import { frameSides } from '../../constants';

import styles from '../../FrameSettings.module.scss';

type FrameSideCheckboxesProps = {
  selectedSides: FrameSide[];
  onChange: (side: FrameSide, isEnabled: boolean) => void;
};

export const FrameSideCheckboxes = ({ selectedSides, onChange }: FrameSideCheckboxesProps) => {
  const checkboxes = frameSides.map((sideCur) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      onChange(sideCur.value, e.target.checked);
    };

    const checked = selectedSides.includes(sideCur.value);

    return (
      <Checkbox
        key={sideCur.value}
        checked={checked}
        onChange={handleChange}
      >
        {sideCur.label}
      </Checkbox>
    );
  });

  return (
    <div className={styles.Sides}>
      {checkboxes}
    </div>
  );
};
