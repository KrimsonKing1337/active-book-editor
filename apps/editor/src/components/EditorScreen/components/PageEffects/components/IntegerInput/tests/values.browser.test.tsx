import { cleanup } from '@testing-library/react';
import {
  afterEach,
  expect,
  test,
} from 'vitest';
import { userEvent } from 'vitest/browser';

import { mountInput } from './fixture';

afterEach(cleanup);

test.each([0, 10])('keeps empty text local and commits min %i on blur', async (min) => {
  const {
    field,
    model,
    change,
    blur,
    finish,
  } = mountInput({ min });

  await field.click();
  await userEvent.keyboard('{Control>}a{/Control}{Delete}');
  await expect.element(field).toHaveValue('');
  await expect.element(model).toHaveTextContent('30');
  expect(change).not.toHaveBeenCalled();
  await finish.click();
  await expect.element(field).toHaveValue(String(min));
  await expect.element(model).toHaveTextContent(String(min));
  expect(change.mock.calls).toEqual([[min]]);
  expect(change).toHaveBeenCalledBefore(blur);
  await field.click();
  await finish.click();
  expect(change).toHaveBeenCalledTimes(1);
  expect(blur).toHaveBeenCalledTimes(2);
});

test('defers bounds normalization until blur while publishing valid prefixes immediately', async () => {
  const {
    field,
    model,
    finish,
    change,
  } = mountInput({ min: 10, max: 150 });

  await field.click();
  await userEvent.keyboard('{Control>}a{/Control}1');
  await expect.element(field).toHaveValue('1');
  await expect.element(model).toHaveTextContent('30');
  expect(change).not.toHaveBeenCalled();
  await userEvent.keyboard('2');
  await expect.element(field).toHaveValue('12');
  await expect.element(model).toHaveTextContent('12');
  await userEvent.keyboard('{Control>}a{/Control}2');
  await finish.click();
  await expect.element(field).toHaveValue('10');
  await field.click();
  await userEvent.keyboard('{Control>}a{/Control}200');
  await expect.element(field).toHaveValue('200');
  await expect.element(model).toHaveTextContent('20');
  await finish.click();
  await expect.element(field).toHaveValue('150');
  await expect.element(model).toHaveTextContent('150');
});

test('removes leading zeros before applying the digit limit', async () => {
  const {
    field,
    model,
    finish,
  } = mountInput({ max: 999 });

  await field.click();
  await userEvent.keyboard('{Control>}a{/Control}0045');
  await expect.element(field).toHaveValue('45');
  await expect.element(model).toHaveTextContent('45');
  await finish.click();
  await expect.element(field).toHaveValue('45');
});

test('honors external values during empty or partial editing and after blur', async () => {
  const {
    field,
    model,
    finish,
    update,
    change,
  } = mountInput({ min: 10 });

  await field.click();
  await userEvent.keyboard('{Control>}a{/Control}{Backspace}');
  update({ value: 81 });
  await expect.element(field).toHaveFocus();
  await expect.element(field).toHaveValue('81');
  await userEvent.keyboard('{Control>}a{/Control}1');
  update({ value: 62 });
  await expect.element(field).toHaveValue('62');
  await finish.click();
  update({ value: 43 });
  await expect.element(field).toHaveValue('43');
  await expect.element(model).toHaveTextContent('43');
  expect(change).not.toHaveBeenCalled();
});

test.each([
  { min: 0, max: 999 },
  { min: 0, max: 10000 },
  { min: 0, max: 999999 },
  { min: 1, max: 999 },
  { min: 1, max: 99999 },
])('accepts the full real consumer range $min…$max', async ({ min, max }) => {
  const {
    field,
    model,
    finish,
  } = mountInput({ min, max });

  await field.click();
  await userEvent.keyboard(`{Control>}a{/Control}${max}`);
  await expect.element(field).toHaveValue(String(max));
  await expect.element(model).toHaveTextContent(String(max));
  await finish.click();
  await expect.element(field).toHaveValue(String(max));
});

test('forwards disabled and readOnly HTML states', async () => {
  const {
    field,
    change,
    update,
  } = mountInput({ readOnly: true });

  await field.click();
  await userEvent.keyboard('{Control>}a{/Control}45');
  await expect.element(field).toHaveValue('30');
  expect(change).not.toHaveBeenCalled();
  update({ disabled: true });
  await expect.element(field).toBeDisabled();
});
