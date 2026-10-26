import type { ChangeEvent } from 'react';

import { InputMask, unformat } from '@react-input/mask';
import classNames from 'classnames';

import { Button } from '../../../EffectControls';

import controlStyles from '../../../EffectControls/EffectControls.module.scss';
import inputStyles from '../../../EffectControls/TextInput/TextInput.module.scss';

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
  const maskOptions = {
    mask: 'sssss',
    replacement: { s: /[0-9-]/ },
  };

  const inputClassNames = classNames(controlStyles.Control, inputStyles.Input);

  const updateIndex = (value: number) => {
    if (!Number.isFinite(value)) {
      return;
    }

    const normalized = Math.max(-9999, Math.min(9999, value));

    onChange(normalized);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = unformat(e.target.value, maskOptions);

    if (!/^-?\d{1,4}$/.test(raw)) {
      return;
    }

    updateIndex(Number(raw));
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
        <Button
          type="button"
          onClick={handleMoveToBack}
          aria-label="На самый нижний слой"
          title="На самый нижний слой"
          disabled={!canMoveToBack}
        >
          ⇤
        </Button>

        <Button type="button" aria-label="На слой назад" onClick={handleStepBack}>
          −
        </Button>

        <InputMask
          className={inputClassNames}
          mask={maskOptions.mask}
          replacement={maskOptions.replacement}
          showMask
          inputMode="numeric"
          value={String(zIndex)}
          onChange={handleInputChange}
          onBlur={onCommit}
        />

        <Button type="button" aria-label="На слой вперёд" onClick={handleStepForward}>
          +
        </Button>

        <Button
          type="button"
          aria-label="На самый верхний слой"
          title="На самый верхний слой"
          disabled={!canMoveToFront}
          onClick={handleMoveToFront}
        >
          ⇥
        </Button>
      </div>
    </label>
  );
};
