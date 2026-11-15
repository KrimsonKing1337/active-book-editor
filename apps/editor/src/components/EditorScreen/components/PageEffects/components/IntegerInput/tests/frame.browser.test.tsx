import { cleanup, render } from '@testing-library/react';
import {
  afterEach,
  expect,
  test,
  vi,
} from 'vitest';
import { page, userEvent } from 'vitest/browser';

import { createProject } from '@root/tests/editor-effects/project';
import { addEffect, selectEffect } from '@root/tests/editor-effects/controls';

import { EditorScreen } from '@components/EditorScreen';

import '@active-book/common/styles';
import '@active-book/core/styles/styles.scss';
import '@styles/styles.scss';

let project: Awaited<ReturnType<typeof createProject>>;

afterEach(async () => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  await project.dispose();
});

test('saves keyboard-entered frame thickness 45 and restores it in reopened settings and project', async () => {
  await page.viewport(1280, 900);
  project = await createProject({ empty: true });
  render(<EditorScreen />);
  const save = page.getByRole('button', { name: 'Сохранить', exact: true });

  await expect.element(save).toBeEnabled();
  await save.click();
  await expect.element(save).toBeEnabled();
  await addEffect('Frame');
  await page.getByRole('textbox', { name: 'Название эффекта', exact: true }).fill('Числовая рамка');
  const thickness = page.getByRole('textbox', { name: 'Толщина тени (px)', exact: true });

  await thickness.click();
  await userEvent.keyboard('{Control>}a{/Control}{Backspace}45');
  await expect.element(thickness).toHaveValue('45');
  await project.save();
  const effects = await project.readEffects();

  expect(effects.frame?.[0]?.options.shadow?.thickness).toBe(45);
  await selectEffect('Числовая рамка');
  await expect.element(thickness).toHaveValue('45');
  await page.getByRole('dialog', { name: 'Эффекты страницы' }).getByRole('button', {
    name: 'Закрыть',
    exact: true,
  }).click();
  await page.getByRole('button', { name: 'Открыть проект', exact: true }).click();
  await selectEffect('Числовая рамка');
  await expect.element(thickness).toHaveValue('45');
});
