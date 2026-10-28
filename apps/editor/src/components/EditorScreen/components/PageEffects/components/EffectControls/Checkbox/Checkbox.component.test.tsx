import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';

import { Checkbox } from './Checkbox';

test('toggles the labelled checkbox through user interaction', async () => {
  const handleChange = vi.fn();
  const user = userEvent.setup();

  render(
    <Checkbox onChange={handleChange}>
      Включить эффект
    </Checkbox>,
  );

  const checkbox = screen.getByRole('checkbox', { name: 'Включить эффект' });

  expect(checkbox).not.toBeChecked();
  await user.click(checkbox);
  expect(checkbox).toBeChecked();
  expect(handleChange).toHaveBeenCalledTimes(1);
});
