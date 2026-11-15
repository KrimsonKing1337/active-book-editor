import { render } from '@testing-library/react';
import {
  expect,
  test,
  vi,
} from 'vitest';
import { page } from 'vitest/browser';

import { Checkbox } from './Checkbox';

test('toggles the checkbox using native browser input', async () => {
  const handleChange = vi.fn();

  render(
    <Checkbox onChange={handleChange}>
      Включить эффект
    </Checkbox>,
  );

  const checkbox = page.getByRole('checkbox', { name: 'Включить эффект' });

  await expect.element(checkbox).not.toBeChecked();
  await checkbox.click();
  await expect.element(checkbox).toBeChecked();
  expect(handleChange).toHaveBeenCalledTimes(1);
});
