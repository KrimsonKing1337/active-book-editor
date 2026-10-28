import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';

import { Button } from './Button';

test('blocks clicks while disabled and forwards clicks after enabling', async () => {
  const handleClick = vi.fn();
  const user = userEvent.setup();
  const { rerender } = render(
    <Button disabled onClick={handleClick}>
      Собрать книгу
    </Button>,
  );

  const button = screen.getByRole('button', { name: 'Собрать книгу' });

  expect(button).toBeDisabled();
  await user.click(button);
  expect(handleClick).not.toHaveBeenCalled();

  rerender(
    <Button onClick={handleClick}>
      Собрать книгу
    </Button>,
  );

  expect(button).toBeEnabled();
  await user.click(button);
  expect(handleClick).toHaveBeenCalledTimes(1);
});
