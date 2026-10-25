import type { ChangeEvent } from 'react';

import { useEffect, useState } from 'react';

import { InputMask, unformat } from '@react-input/mask';

import styles from '../EffectControls/EffectControls.module.scss';
import layoutStyles from './CssLengthInput.module.scss';

type CssLengthInputProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  allowNegative?: boolean;
  max?: number;
};

const units = ['px', '%', 'rem', 'em', 'vw', 'vh'] as const;
type Unit = typeof units[number];

const replacement = {
  n: /[0-9.-]/,
};

const maskOptions = {
  mask: 'nnnnnnnn',
  replacement,
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
  onChange,
  allowNegative = true,
  max = 9999,
}: CssLengthInputProps) => {
  const { amount, unit } = getParts(value);
  const minimum = allowNegative ? -max : 0;
  const [draft, setDraft] = useState(amount);

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
        className={`${styles.Input} ${layoutStyles.Value}`}
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
        className={`${styles.Select} ${layoutStyles.Unit}`}
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
