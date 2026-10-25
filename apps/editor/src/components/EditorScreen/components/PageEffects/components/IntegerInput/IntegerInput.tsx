import type { InputHTMLAttributes } from 'react';

import { InputMask } from '@react-input/mask';

type IntegerInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'inputMode' | 'maxLength'> & {
  maxDigits?: number;
};

export const IntegerInput = ({ maxDigits = 12, ...props }: IntegerInputProps) => {
  return (
    <InputMask
      {...props}
      mask={'d'.repeat(maxDigits)}
      replacement={{ d: /[0-9]/ }}
      inputMode="numeric"
    />
  );
};
