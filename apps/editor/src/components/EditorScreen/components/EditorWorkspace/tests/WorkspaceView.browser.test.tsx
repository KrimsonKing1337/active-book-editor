import { cleanup, render } from '@testing-library/react';
import {
  afterEach,
  expect,
  test,
  vi,
} from 'vitest';
import { page } from 'vitest/browser';

import { createProject } from '@root/tests/editor-effects/project';
import { addEffect } from '@root/tests/editor-effects/controls';

import { EditorScreen } from '../../../EditorScreen';
import {
  SHOW_STRUCTURE_STORAGE_KEY,
  SHOW_NARRATIVE_STORAGE_KEY,
  SHOW_BACKGROUNDS_STORAGE_KEY,
  SHOW_FRAME_EFFECTS_STORAGE_KEY,
} from '../../../constants';

import styles from '../../../EditorScreen.module.scss';

import { workspaceEditor } from './utils';

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

test('persists view toggles and restores visibility after remount without replacing editor', async () => {
  await page.viewport(1280, 900);
  project = await createProject();
  render(<EditorScreen />);
  await expect.element(page.getByRole('button', { name: 'Открыть проект', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Открыть проект', exact: true }).click();
  await expect.element(page.getByText('Тестовая книга эффектов', { exact: true })).toBeVisible();
  await addEffect('Frame');
  const effects = await project.save();
  const frameId = effects.frame?.[0]?.id;

  expect(frameId).toBeTruthy();
  const editor = workspaceEditor();
  const controls = [
    {
      name: 'Показать структуру',
      key: SHOW_STRUCTURE_STORAGE_KEY,
      initial: 'false',
      saved: 'true',
    },
    {
      name: 'Скрыть нарратив',
      key: SHOW_NARRATIVE_STORAGE_KEY,
      initial: 'true',
      saved: 'false',
    },
    {
      name: 'Скрыть фон',
      key: SHOW_BACKGROUNDS_STORAGE_KEY,
      initial: 'true',
      saved: 'false',
    },
    {
      name: 'Скрыть рамочные эффекты',
      key: SHOW_FRAME_EFFECTS_STORAGE_KEY,
      initial: 'true',
      saved: 'false',
    },
  ];

  for (const control of controls) {
    const button = page.getByRole('button', { name: control.name, exact: true });

    await expect.element(button).toHaveAttribute('aria-pressed', control.initial);
    expect(localStorage.getItem(control.key)).toBe(control.initial);
    await button.click();
    expect(localStorage.getItem(control.key)).toBe(control.saved);
  }

  expect(workspaceEditor()).toBe(editor);
  const checkVisibility = async () => {
    const root = document.querySelector(`.${styles.EditorScreen}`);

    expect(root).toHaveClass(styles.isStructureVisible);
    expect(root).toHaveClass(styles.isNarrativeHidden);
    const narrative = page.elementLocator(document.querySelector('#narrative')!);

    await expect.element(narrative).toHaveStyle({ visibility: 'hidden' });
    await expect.poll(() => {
      return document.querySelector<HTMLElement>('[data-visual-surface="fixture-image"]')?.style.visibility;
    }).toBe('hidden');
    await expect.poll(() => {
      return document.querySelector<HTMLElement>(`[data-visual-surface="${frameId}"]`)?.style.visibility;
    }).toBe('hidden');
  };

  await checkVisibility();
  cleanup();
  render(<EditorScreen />);
  await expect.element(page.getByRole('button', { name: 'Скрыть структуру' })).toHaveAttribute('aria-pressed', 'true');

  for (const name of [
    'Показать нарратив',
    'Показать фон',
    'Показать рамочные эффекты',
  ]) {
    await expect.element(page.getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'false');
  }

  await checkVisibility();
});
