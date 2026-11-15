import type { ComponentProps } from 'react';

import {
  StrictMode,
  useEffect,
  useState,
} from 'react';

import { render } from '@testing-library/react';
import { vi } from 'vitest';
import { page } from 'vitest/browser';

import { IntegerInput } from '../IntegerInput';

type Options = Partial<Pick<ComponentProps<typeof IntegerInput>,
  'value' | 'min' | 'max' | 'maxDigits' | 'disabled' | 'readOnly'
>>;

export const mountInput = (options: Options = {}) => {
  const change = vi.fn<(value: number) => void>();
  const blur = vi.fn();

  const Fixture = ({ options }: {
    options: Options
  }) => {
    const { value = 30, ...props } = options;
    const [confirmed, setConfirmed] = useState(value);

    useEffect(() => setConfirmed(value), [value]);

    const handleChange = (next: number) => {
      change(next);
      setConfirmed(next);
    };

    return (
      <>
        <IntegerInput
          {...props}
          aria-label="Число"
          value={confirmed}
          onValueChange={handleChange}
          onBlur={blur}
        />

        <output data-testid="confirmed">{confirmed}</output>
        <input aria-label="Источник буфера" defaultValue="127" />
        <button type="button">Завершить ввод</button>
      </>
    );
  };
  const view = render(<StrictMode><Fixture options={options} /></StrictMode>);
  const update = (overrides: Options) => {
    view.rerender(<StrictMode><Fixture options={{ ...options, ...overrides }} /></StrictMode>);
  };

  return {
    field: page.getByRole('textbox', { name: 'Число' }),
    model: page.getByTestId('confirmed'),
    finish: page.getByRole('button', { name: 'Завершить ввод' }),
    change,
    blur,
    update,
  };
};
