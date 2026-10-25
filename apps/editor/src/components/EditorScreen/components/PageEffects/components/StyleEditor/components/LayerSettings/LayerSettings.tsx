import type { ChangeEvent } from 'react';

import { removeLeadingZeros } from '../../utils';

import styles from '../../StyleEditor.module.scss';

type LayerSettingsProps = {
  zIndex: number;
  minimumZIndex?: number;
  maximumZIndex?: number;
  otherLayersAtSameIndex?: boolean;
  onChange: (value: number) => void;
  onCommit: () => void;
};

export const LayerSettings = ({
  zIndex,
  minimumZIndex = zIndex,
  maximumZIndex = zIndex,
  otherLayersAtSameIndex = false,
  onChange,
  onCommit,
}: LayerSettingsProps) => {
  const updateIndex = (value: number) => {
    if (Number.isFinite(value)) {
      onChange(value);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const normalized = removeLeadingZeros(e.target.value);

    e.target.value = normalized;

    updateIndex(Number(normalized));
  };

  const handleStepChange = (step: number) => {
    updateIndex(zIndex + step);

    onCommit();
  };

  const handleStepBack = () => {
    handleStepChange(-1);
  };

  const handleStepForward = () => {
    handleStepChange(1);
  };

  const canMoveToBack = zIndex > minimumZIndex || otherLayersAtSameIndex;
  const canMoveToFront = zIndex < maximumZIndex || otherLayersAtSameIndex;

  const handleMoveToBack = () => {
    if (canMoveToBack) {
      updateIndex(minimumZIndex - 1);
      onCommit();
    }
  };

  const handleMoveToFront = () => {
    if (canMoveToFront) {
      updateIndex(maximumZIndex + 1);
      onCommit();
    }
  };

  return (
    <label className={styles.Field}>
      <span>
        z-index
      </span>

      <div className={styles.LayerControls}>
        <button
          type="button"
          onClick={handleMoveToBack}
          aria-label="На самый нижний слой"
          title="На самый нижний слой"
          disabled={!canMoveToBack}
        >
          ⇤
        </button>

        <button type="button" onClick={handleStepBack} aria-label="На слой назад">
          −
        </button>

        <input
          type="number"
          step={1}
          value={zIndex}
          onChange={handleInputChange}
          onBlur={onCommit}
        />

        <button type="button" onClick={handleStepForward} aria-label="На слой вперёд">
          +
        </button>

        <button
          type="button"
          onClick={handleMoveToFront}
          aria-label="На самый верхний слой"
          title="На самый верхний слой"
          disabled={!canMoveToFront}
        >
          ⇥
        </button>
      </div>
    </label>
  );
};
