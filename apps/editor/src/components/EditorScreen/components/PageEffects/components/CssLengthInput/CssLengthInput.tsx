import type { ChangeEvent } from 'react';

import { useEffect, useState } from 'react';

import { InputMask, unformat } from '@react-input/mask';

type CssLengthInputProps = {
  value: string;
  onChange: (value: string) => void;
  allowNegative?: boolean;
  max?: number;
};

const units = ['px', '%', 'rem', 'em', 'vw', 'vh'] as const;
type Unit = typeof units[number];

const maskOptions = {
  mask: 'nnnnnnnn',
  replacement: { n: /[0-9.-]/ },
};

const getParts = (value: string): { amount: string; unit: Unit } => {
  const match = value.match(/^(-?(?:\d+(?:\.\d{1,2})?|\.\d{1,2}))(px|%|rem|em|vw|vh)$/);

  if (!match) {
    return { amount: '0', unit: 'px' };
  }

  return { amount: match[1], unit: match[2] as Unit };
};

export const CssLengthInput = ({
  value,
  onChange,
  allowNegative = true,
  max = 9999,
}: CssLengthInputProps) => {
  const parts = getParts(value);
  const [draft, setDraft] = useState(parts.amount);

  useEffect(() => {
    setDraft(parts.amount);
  }, [value]);

  const min = allowNegative ? -max : 0;

  const handleAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = unformat(event.target.value, maskOptions);

    if (next === '' || next === '-' || next === '.' || next === '-.') {
      setDraft(next);

      return;
    }

    const isNumber = /^-?(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(next);

    if (!isNumber) {
      return;
    }

    if (next.endsWith('.')) {
      setDraft(next);

      return;
    }

    const number = Number(next);

    if (!Number.isFinite(number)) {
      return;
    }

    const bounded = Math.min(max, Math.max(min, number));
    const nextValue = String(bounded);

    setDraft(nextValue);
    onChange(`${nextValue}${parts.unit}`);
  };

  const handleBlur = () => {
    setDraft(parts.amount);
  };

  const handleUnitChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange(`${parts.amount}${event.target.value}`);
  };

  return (
    <span style={{ display: 'flex', gap: 6, minWidth: 0 }}>
      <InputMask
        aria-label="Числовое значение"
        mask={maskOptions.mask}
        replacement={maskOptions.replacement}
        showMask
        value={draft}
        inputMode="decimal"
        onChange={handleAmountChange}
        onBlur={handleBlur}
        style={{ flex: 1, minWidth: 0 }}
      />

      <select aria-label="Единица измерения" value={parts.unit} onChange={handleUnitChange}>
        {units.map((unit) => {
          return <option value={unit} key={unit}>{unit}</option>;
        })}
      </select>
    </span>
  );
};
