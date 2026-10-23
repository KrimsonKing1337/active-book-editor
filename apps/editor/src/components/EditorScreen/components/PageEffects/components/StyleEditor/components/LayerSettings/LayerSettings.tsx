import { type ChangeEvent } from 'react';

import { removeLeadingZeros } from '../../utils';

import styles from '../../StyleEditor.module.scss';

type LayerSettingsProps = {
  zIndex: number;
  onChange: (value: number) => void;
  onCommit: () => void;
};

export const LayerSettings = ({ zIndex, onChange, onCommit }: LayerSettingsProps) => {
  const updateIndex = (value: number) => {
    if (Number.isFinite(value)) {
      onChange(value);
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const normalized = removeLeadingZeros(event.target.value);

    event.target.value = normalized;
    updateIndex(Number(normalized));
  };

  const changeByStep = (step: number) => {
    updateIndex(zIndex + step);
    onCommit();
  };

  return (
    <label className={styles.Field}>
      <span>z-index</span>

      <div className={styles.LayerControls}>
        <button type="button" onClick={() => changeByStep(-1)} aria-label="На слой назад">
          −
        </button>

        <input
          type="number"
          step={1}
          value={zIndex}
          onChange={handleInputChange}
          onBlur={onCommit}
        />

        <button type="button" onClick={() => changeByStep(1)} aria-label="На слой вперёд">
          +
        </button>
      </div>
    </label>
  );
};
