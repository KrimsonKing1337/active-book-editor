import type {
  ChangeEvent,
  FocusEvent,
  InputHTMLAttributes,
} from 'react';
import { useEffect, useState } from 'react';

import classNames from 'classnames';

import sharedStyles from '../EffectControls/EffectControls.module.scss';
import inputStyles from '../EffectControls/TextInput/TextInput.module.scss';

type ExcludedInputProps =
  | 'value'
  | 'onChange'
  | 'type'
  | 'inputMode'
  | 'maxLength'
  | 'min'
  | 'max'
  | 'step';

type IntegerInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, ExcludedInputProps> & {
  value: number;
  min?: number;
  max?: number;
  maxDigits?: number;
  onValueChange: (value: number) => void;
};

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

  const inputClassNames = classNames(sharedStyles.Control, inputStyles.Input, props.className);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const entered = input.value;
    const filtered = entered.replace(/\D/g, '');
    const canonical = filtered.replace(/^0+(?=\d)/, '');
    const raw = canonical.slice(0, digits);

    if (raw !== entered) {
      const caret = input.selectionStart ?? entered.length;
      const prefix = entered.slice(0, caret).replace(/\D/g, '');
      const removedZeros = filtered.length - canonical.length;
      const nextCaret = Math.max(0, Math.min(prefix.length - removedZeros, raw.length));

      input.value = raw;
      input.setSelectionRange(nextCaret, nextCaret);
    }

    setDraft(raw);

    if (!raw) {
      return;
    }

    const number = Number(raw);

    if (number >= min && number <= max && number !== value) {
      onValueChange(number);
    }
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    let number = min;

    if (draft !== '') {
      number = Math.min(max, Math.max(min, Number(draft)));
    }

    setDraft(String(number));

    if (number !== value) {
      onValueChange(number);
    }

    onBlur?.(event);
  };

  return (
    <input
      {...props}
      className={inputClassNames}
      type="text"
      inputMode="numeric"
      value={draft}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
};
