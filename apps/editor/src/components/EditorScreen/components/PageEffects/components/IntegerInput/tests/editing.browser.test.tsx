import { cleanup } from '@testing-library/react';
import {
  afterEach,
  expect,
  test,
} from 'vitest';
import { page, userEvent } from 'vitest/browser';

import { mountInput } from './fixture';

afterEach(cleanup);

test('keeps an empty draft without publishing zero, then commits real keyboard input', async () => {
  const {
    field,
    model,
    change,
    finish,
  } = mountInput();

  await field.click();
  await userEvent.keyboard('{Control>}a{/Control}{Backspace}');
  const cleared = field.element();

  expect(cleared).toHaveValue('');
  expect(change).not.toHaveBeenCalled();
  await userEvent.keyboard('45');
  await expect.element(field).toHaveValue('45');
  await expect.element(model).toHaveTextContent('45');
  expect(change.mock.calls).toEqual([[4], [45]]);
  await finish.click();
  await expect.element(field).toHaveValue('45');
});

test.each(['Backspace', 'Delete'])('replaces a selection and accepts zero after %s', async (key) => {
  const {
    field,
    model,
    finish,
  } = mountInput();

  await field.click();
  await userEvent.keyboard('{Control>}a{/Control}12');
  await expect.element(field).toHaveValue('12');
  await userEvent.keyboard(`{Control>}a{/Control}{${key}}0`);
  await expect.element(field).toHaveValue('0');
  await expect.element(model).toHaveTextContent('0');
  await finish.click();
  await expect.element(field).toHaveValue('0');
});

test('inserts and deletes in the middle while the parent echoes each valid number', async () => {
  const { field, model } = mountInput({ value: 1234, max: 99999 });

  await field.click();
  await userEvent.keyboard('{Home}{ArrowRight}{ArrowRight}9');
  await expect.element(field).toHaveValue('12934');
  const input = field.element();

  if (!(input instanceof HTMLInputElement)) {
    throw new Error('Expected a native text input');
  }

  expect(input.selectionStart).toBe(3);
  await userEvent.keyboard('{Backspace}');
  await expect.element(field).toHaveValue('1234');
  expect(input.selectionStart).toBe(2);
  await expect.element(model).toHaveTextContent('1234');
  await userEvent.keyboard('x5');
  await expect.element(field).toHaveValue('12534');
  expect(input.selectionStart).toBe(3);
  await userEvent.keyboard('{Home}0');
  await expect.element(field).toHaveValue('12534');
  expect(input.selectionStart).toBe(0);
});

test('pastes numbers and applies the digit limit without moving a valid caret', async () => {
  const {
    field,
    model,
    finish,
  } = mountInput({ maxDigits: 3 });
  const source = page.getByRole('textbox', { name: 'Источник буфера' });

  await source.click();
  await userEvent.keyboard('{Control>}a{/Control}');
  await userEvent.copy();
  await field.click();
  await userEvent.keyboard('{Control>}a{/Control}');
  await userEvent.paste();
  await expect.element(field).toHaveValue('127');
  await expect.element(model).toHaveTextContent('127');
  await userEvent.keyboard('9');
  await expect.element(field).toHaveValue('127');
  await source.fill('00012x345');
  await source.click();
  await userEvent.keyboard('{Control>}a{/Control}');
  await userEvent.copy();
  await field.click();
  await userEvent.keyboard('{Control>}a{/Control}');
  await userEvent.paste();
  await expect.element(field).toHaveValue('123');
  await finish.click();
  await expect.element(model).toHaveTextContent('123');
});

test.each([0, 30])('keeps every digit immediately after clearing at %i ms per key', async (delay) => {
  const {
    field,
    model,
    finish,
  } = mountInput();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    await field.click();

    if (delay === 0) {
      await userEvent.keyboard('{Control>}a{/Control}{Backspace}45');
    } else {
      await userEvent.keyboard('{Control>}a{/Control}{Backspace}');
      await userEvent.keyboard('4');
      await new Promise((resolve) => setTimeout(resolve, delay));
      await userEvent.keyboard('5');
    }

    await expect.element(field).toHaveValue('45');
    await expect.element(model).toHaveTextContent('45');
    await finish.click();
    await expect.element(field).toHaveValue('45');
  }
});
