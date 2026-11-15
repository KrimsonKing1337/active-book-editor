import type { FormEvent, MouseEvent } from 'react';

import { render, screen } from '@testing-library/react';
import {
  expect,
  test,
  vi,
} from 'vitest';
import { page } from 'vitest/browser';

import { Button } from './Button';

test('receives a trusted Chromium click without submitting its parent form', async () => {
  const handleClick = vi.fn((e: MouseEvent<HTMLButtonElement>) => e.nativeEvent.isTrusted);
  const handleSubmit = vi.fn((e: FormEvent<HTMLFormElement>) => e.preventDefault());

  render(
    <form onSubmit={handleSubmit}>
      <Button onClick={handleClick}>
        Собрать книгу
      </Button>
    </form>,
  );

  const button = screen.getByRole('button', { name: 'Собрать книгу' });

  expect(navigator.userAgent).toMatch(/(?:HeadlessChrome|Chrome)\//);
  expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(38);
  await page.getByRole('button', { name: 'Собрать книгу' }).click();
  expect(handleClick).toHaveBeenCalledTimes(1);
  expect(handleClick).toHaveReturnedWith(true);
  expect(handleSubmit).not.toHaveBeenCalled();
});
