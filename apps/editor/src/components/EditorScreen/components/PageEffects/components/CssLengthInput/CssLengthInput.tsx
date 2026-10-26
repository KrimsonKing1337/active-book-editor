import { type ChangeEvent, useEffect, useState } from 'react';

import { InputMask, unformat } from '@react-input/mask';
import classNames from 'classnames';

import sharedStyles from '../EffectControls/EffectControls.module.scss';
import layoutStyles from './CssLengthInput.module.scss';

import type { Unit } from './constants';
import { units, maskOptions } from './constants';

type CssLengthInputProps = {
  label?: string;
  value: string;
  allowNegative?: boolean;
  max?: number;
  onChange: (value: string) => void;
};

const getParts = (value: string): { amount: string; unit: Unit } => {
  const match = value.match(/^(-?(?:\d+(?:\.\d{1,2})?|\.\d{1,2}))(px|%|rem|em|vw|vh)$/);

  if (!match) {
    return {
      amount: '0',
      unit: 'px',
    };
  }

  return {
    amount: match[1],
    unit: match[2] as Unit,
  };
};

export const CssLengthInput = ({
  label = 'Числовое значение',
  value,
  allowNegative = true,
  max = 9999,
  onChange,
}: CssLengthInputProps) => {
  const { amount, unit } = getParts(value);
  const [draft, setDraft] = useState(amount);

  const minimum = allowNegative ? -max : 0;

  useEffect(() => {
    setDraft(amount);
  }, [amount]);

  const handleAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = unformat(event.target.value, maskOptions);
    const isPartial = raw === '' || raw === '-' || raw === '.' || raw === '-.';

    if (raw === '') {
      setDraft('0');

      onChange(`0${unit}`);

      return;
    }

    if (isPartial) {
      setDraft(raw);

      return;
    }

    const validNumber = /^-?(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(raw);

    if (!validNumber) {
      return;
    }

    if (raw.endsWith('.')) {
      setDraft(raw);

      return;
    }

    const parsed = Number(raw);

    if (!Number.isFinite(parsed)) {
      return;
    }

    const normalized = Math.min(max, Math.max(minimum, parsed));
    const nextAmount = String(normalized);

    setDraft(nextAmount);

    onChange(`${nextAmount}${unit}`);
  };

  const handleUnitChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange(`${amount}${event.target.value}`);
  };

  const handleBlur = () => {
    const partial = draft === '-' || draft === '.' || draft === '-.';

    if (partial) {
      onChange(`0${unit}`);
    }

    setDraft(partial ? '0' : amount);
  };

  return (
    <span className={layoutStyles.Container}>
      <InputMask
        aria-label={label}
        className={classNames(sharedStyles.Control, layoutStyles.Value)}
        mask={maskOptions.mask}
        replacement={maskOptions.replacement}
        showMask
        value={draft}
        inputMode="decimal"
        onChange={handleAmountChange}
        onBlur={handleBlur}
      />

      <select
        aria-label={`${label}: единица измерения`}
        className={classNames(sharedStyles.Control, layoutStyles.Unit)}
        value={unit}
        onChange={handleUnitChange}
      >
        {units.map((unitCur) => {
          return (
            <option value={unitCur} key={unitCur}>
              {unitCur}
            </option>
          );
        })}
      </select>
    </span>
  );
};
