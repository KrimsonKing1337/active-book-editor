import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';

import { createProject } from '@root/tests/editor-effects/project';
import {
  addEffect,
  configureBackground,
  configureShadow,
  historyShortcut,
  selectEffect,
  setColor,
} from '@root/tests/editor-effects/controls';

import { EditorScreen } from './EditorScreen';

import 'reset-css/reset.css';
import 'activeBook-core/styles/styles.scss';
import '../../styles.scss';

let project: Awaited<ReturnType<typeof createProject>>;

beforeEach(async () => {
  await page.viewport(1280, 900);
  project = await createProject();
  render(<EditorScreen />);

  await expect.element(page.getByRole('button', { name: 'Открыть проект', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Открыть проект', exact: true }).click();
  await expect.element(page.getByText('Тестовая книга эффектов', { exact: true })).toBeVisible();
});

afterEach(async () => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  await project?.dispose();
});

const addComposition = async () => {
  const original = await project.readEffects();

  await addEffect('Background');
  await configureBackground();
  const withBackground = await project.save();

  expect(withBackground.background?.[0]).toEqual(original.background?.[0]);
  expect(withBackground.background?.[1].options).toMatchObject({
    style: {
      backgroundColor: '#204060ff',
      zIndex: 1,
      opacity: '0.6',
    },
    styleFilters: [
      {
        property: 'filter',
        function: 'brightness',
        value: '120%',
      },
    ],
  });

  await addEffect('Side');
  await configureShadow();
  const composed = await project.save();

  expect(composed.background).toEqual(withBackground.background);
  expect(composed.side?.[0].options.shadow).toMatchObject({
    thickness: 70,
    style: {
      color: '#e08020ff',
      zIndex: 2,
      opacity: '0.75',
    },
  });

  return composed;
};

const checkComposition = async (backgroundColor = 'rgb(32, 64, 96)') => {
  const effects = await project.readEffects();
  const backgroundSelector = `[data-effect-id="${effects.background?.[1].id}"]`;
  const sideSelector = `[data-effect-id="${effects.side?.[0].id}"]`;

  await expect.poll(() => document.querySelector(backgroundSelector)).not.toBeNull();
  await expect.poll(() => document.querySelector(sideSelector)).not.toBeNull();
  const background = document.querySelector<HTMLElement>(backgroundSelector);
  const side = document.querySelector<HTMLElement>(sideSelector);

  await expect.element(background).toHaveStyle({
    backgroundColor,
    opacity: '0.6',
    zIndex: '1',
    filter: 'brightness(1.2)',
  });
  await expect.element(side).toHaveStyle({ zIndex: '2' });
  const shadow = side?.querySelector<HTMLElement>('[class*="SideShadow-module__SideShadow"]') ?? null;

  if (!shadow) {
    throw new Error('Элемент боковой тени не найден');
  }

  await expect.element(shadow).toHaveStyle({
    color: 'rgb(224, 128, 32)',
    opacity: '0.75',
  });
  expect(getComputedStyle(shadow).boxShadow).toContain('70px');

  const getFixtureImage = () => {
    return document.querySelector<HTMLImageElement>('[data-effect-id="fixture-image"] img');
  };

  await expect.poll(() => getFixtureImage()?.naturalWidth).toBeGreaterThan(0);

  const fixtureImage = getFixtureImage();

  await expect.element(fixtureImage).toHaveStyle({ opacity: '0.4' });
};

test('edits independent effects and restores their data and rendered composition', async () => {
  const originalComposition = await addComposition();

  await selectEffect('Тестовый фон');
  await page.getByText('Фон', { exact: true }).click();
  await setColor('#305070ff');
  const composed = await project.save();

  expect(composed.side).toEqual(originalComposition.side);
  expect(composed.background?.[0]).toEqual(originalComposition.background?.[0]);
  await checkComposition('rgb(48, 80, 112)');
  const pageWrapper = document.querySelector<HTMLElement>('#page-wrapper');

  await expect.element(pageWrapper).toMatchScreenshot('effects-composition');
  cleanup();
  render(<EditorScreen />);

  await expect.element(page.getByText('Тестовая книга эффектов', { exact: true })).toBeVisible();
  expect(project.pickDirectory).toHaveBeenCalledTimes(1);
  expect(await project.readEffects()).toEqual(composed);
  await checkComposition('rgb(48, 80, 112)');
  await expect.element(document.querySelector<HTMLElement>('#page-wrapper')).toMatchScreenshot('effects-composition');
}, 60_000);

test('deletes only the selected effect and supports undo and redo through the editor', async () => {
  const composed = await addComposition();
  const deletedSideSelector = `[data-effect-id="${composed.side?.[0].id}"]`;

  await selectEffect('Тестовая тень');
  await page.getByRole('button', { name: 'Удалить эффект', exact: true }).click();
  const deleted = await project.save();

  expect(window.confirm).toHaveBeenCalledWith('Удалить эффект «Тестовая тень»?');
  expect(deleted.side).toEqual([]);
  expect(deleted.background).toEqual(composed.background);
  expect(document.querySelector<HTMLElement>(deletedSideSelector)).toBeNull();

  await historyShortcut(false);
  const undone = await project.save();

  expect(undone).toEqual(composed);
  await checkComposition();
  await historyShortcut(true);
  const redone = await project.save();

  expect(redone).toEqual(deleted);
  expect(document.querySelector<HTMLElement>(deletedSideSelector)).toBeNull();
}, 60_000);
