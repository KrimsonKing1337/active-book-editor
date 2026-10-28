import type { Locator } from 'vitest/browser';

import { expect } from 'vitest';
import { page, userEvent } from 'vitest/browser';

const fillMaskedInput = async (input: Locator, value: string) => {
  await input.click();
  await userEvent.keyboard('{Control>}a{/Control}{Backspace}');
  // The mask updates its selection on the next frame, like a human typing.
  for (const characterCur of value) {
    await userEvent.keyboard(characterCur);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
};

export const openEffects = async () => {
  await page.getByRole('button', { name: 'Эффекты страницы' }).click();
};

export const addEffect = async (category: 'Background' | 'Side') => {
  await openEffects();
  await page.getByRole('button', { name: new RegExp(`Категория ${category} `) }).click();
  const effectLabel = category === 'Background' ? 'Добавить фон' : 'Добавить боковую тень';

  await page.getByRole('button', { name: effectLabel, exact: true }).click();
};

export const selectEffect = async (name: string) => {
  await openEffects();
  await page.getByRole('searchbox', { name: 'Поиск эффектов' }).fill(name);
  await page.getByRole('button', { name: new RegExp(name) }).click();
};

export const setColor = async (value: string) => {
  await fillMaskedInput(page.getByRole('textbox', { name: 'HEX', exact: true }), value.replace('#', ''));
  const manualColorControls = page.getByRole('group', { name: 'Ручной ввод' });

  await manualColorControls.getByRole('button', { name: 'Применить', exact: true }).click();
};

export const addOpacity = async (value: string) => {
  await page.getByText('Дополнительные эффекты', { exact: true }).click();
  await page.getByRole('button', { name: '+ Добавить свойство', exact: true }).click();
  await page.getByRole('combobox', { name: 'CSS-свойство' }).click();
  await page.getByRole('option', { name: 'opacity', exact: true }).click();
  await fillMaskedInput(page.getByRole('textbox', { name: 'opacity', exact: true }), value);
  await page.getByRole('button', { name: 'Применить свойства', exact: true }).click();
};

export const addFilter = async () => {
  await page.getByText('Фильтры', { exact: true }).click();
  await page.getByRole('button', { name: '+ Добавить фильтр', exact: true }).click();
  await page.getByRole('combobox', { name: 'CSS-свойство' }).click();
  await page.getByRole('option', { name: 'filter', exact: true }).click();
  await page.getByRole('combobox', { name: 'Функция', exact: true }).click();
  await page.getByRole('option', { name: 'brightness', exact: true }).click();
  const brightnessInput = page.getByRole('textbox', { name: 'Значение brightness', exact: true });

  await fillMaskedInput(brightnessInput, '80');
  await page.getByRole('button', { name: 'Применить фильтры', exact: true }).click();
  const backgroundEffect = document.querySelector<HTMLElement>(
    '#background-effects [data-effect-id]:not([data-effect-id="fixture-image"])',
  );

  await expect.element(backgroundEffect).toHaveStyle({ filter: 'brightness(0.8)' });
  await fillMaskedInput(brightnessInput, '120');
  await page.getByRole('button', { name: 'Применить фильтры', exact: true }).click();
  await page.getByText('Фильтры', { exact: true }).click();
};

export const configureBackground = async () => {
  await page.getByRole('textbox', { name: 'Название эффекта', exact: true }).fill('Тестовый фон');
  await page.getByText('Фон', { exact: true }).click();
  await setColor('#204060ff');
  await page.getByRole('button', { name: 'На слой вперёд', exact: true }).click();
  await addFilter();
  await addOpacity('0.6');
};

export const configureShadow = async () => {
  await page.getByRole('textbox', { name: 'Название эффекта', exact: true }).fill('Тестовая тень');
  await fillMaskedInput(page.getByRole('textbox', { name: 'Толщина тени (px)', exact: true }), '70');
  await page.getByText('Стили тени', { exact: true }).click();
  await setColor('#e08020ff');
  await page.getByRole('button', { name: 'На слой вперёд', exact: true }).click();
  await addOpacity('0.75');
};

export const historyShortcut = async (shouldRedo: boolean) => {
  const editorElement = document.querySelector('.tiptap');

  expect(editorElement).not.toBeNull();

  if (!editorElement) {
    throw new Error('Элемент редактора TipTap не найден');
  }

  await page.elementLocator(editorElement).click();

  const keyboardShortcut = shouldRedo
    ? '{Control>}{Shift>}z{/Shift}{/Control}'
    : '{Control>}z{/Control}';

  await userEvent.keyboard(keyboardShortcut);
};
