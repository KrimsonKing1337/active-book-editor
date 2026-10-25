import type { ChangeEvent, FocusEvent, InputHTMLAttributes } from 'react';

import { useEffect, useState } from 'react';

import { InputMask, unformat } from '@react-input/mask';

type IntegerInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type' | 'inputMode' | 'maxLength' | 'min' | 'max' | 'step'
> & {
  value: number;
  min?: number;
  max?: number;
  maxDigits?: number;
  onValueChange: (value: number) => void;
};

const replacement = { d: /[0-9]/ };

export const IntegerInput = ({
  value,
  min = 0,
  max = 999999,
  maxDigits,
  onValueChange,
  onBlur,
  ...props
}: IntegerInputProps) => {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const digits = maxDigits ?? String(max).length;
  const mask = 'd'.repeat(digits);
  const maskOptions = { mask, replacement };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = unformat(event.target.value, maskOptions);

    if (!raw) {
      setDraft(String(min));
      onValueChange(min);

      return;
    }

    const number = Math.min(max, Math.max(min, Number(raw)));

    setDraft(String(number));
    onValueChange(number);
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    if (draft === '') {
      setDraft(String(value));
    }

    onBlur?.(event);
  };

  return (
    <InputMask
      {...props}
      mask={mask}
      replacement={replacement}
      showMask
      inputMode="numeric"
      value={draft}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
};
