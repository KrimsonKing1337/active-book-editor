import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import { pageVisualEffects } from '@active-book/book-builder/visualEffects';

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

  await expect.element(page.getByRole('button', {
    name: 'Открыть проект',
    exact: true,
  })).toBeEnabled();
  await page.getByRole('button', {
    name: 'Открыть проект',
    exact: true,
  }).click();
  await expect.element(page.getByText('Тестовая книга эффектов', { exact: true })).toBeVisible();
  const effectsTrigger = page.getByRole('button', {
    name: 'Эффекты страницы',
    exact: true,
  }).query();

  expect(effectsTrigger?.closest('[data-story-region="story"]')).toBeNull();
  expect(document.querySelector('[data-story-region="story"] #Toolbar')).not.toBeNull();
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

  expect(withBackground.background?.[1].depth).toEqual({
    plane: 'background',
    order: 1,
  });

  await addEffect('Frame');
  await configureShadow();
  await page.getByRole('combobox', { name: 'Область размещения эффекта' }).selectOptions('narrativeFrame');
  const composed = await project.save();

  expect(composed.background).toEqual(withBackground.background);
  expect(composed.frame?.[0].options.shadow).toMatchObject({
    thickness: 70,
    style: {
      color: '#e08020ff',
      opacity: '0.75',
    },
  });

  expect(composed.frame?.[0].depth).toEqual({
    plane: 'belowNarrative',
    order: 2,
  });

  return composed;
};

const checkComposition = async (backgroundColor = 'rgb(32, 64, 96)') => {
  const effects = await project.readEffects();
  const backgroundSelector = `[data-effect-id="${effects.background?.[1].id}"]`;
  const frameSelector = `[data-effect-id="${effects.frame?.[0].id}"]`;

  await expect.poll(() => document.querySelector(backgroundSelector)).not.toBeNull();
  await expect.poll(() => document.querySelector(frameSelector)).not.toBeNull();
  const background = document.querySelector<HTMLElement>(backgroundSelector);
  const frame = document.querySelector<HTMLElement>(frameSelector);

  await expect.element(background).toHaveStyle({
    backgroundColor,
    opacity: '0.6',
    filter: 'brightness(1.2)',
  });

  const shadow = frame?.querySelector<HTMLElement>('[class*="FrameShadow-module__FrameShadow"]') ?? null;

  if (!shadow) {
    throw new Error('Элемент рамочной тени не найден');
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
  const backgroundSection = [...document.querySelectorAll('summary')].find((element) => element.textContent === 'Фон');
  await page.elementLocator(backgroundSection!).click();
  await setColor('#305070ff');
  const composed = await project.save();

  expect(composed.frame).toEqual(originalComposition.frame);
  expect(composed.background?.[0]).toEqual(originalComposition.background?.[0]);
  await checkComposition('rgb(48, 80, 112)');
  const storyShell = document.querySelector<HTMLElement>('#story-shell');

  await expect.element(storyShell).toMatchScreenshot('effects-composition');
  cleanup();
  render(<EditorScreen />);

  await expect.element(page.getByText('Тестовая книга эффектов', { exact: true })).toBeVisible();
  expect(project.pickDirectory).toHaveBeenCalledTimes(1);
  expect(await project.readEffects()).toEqual(composed);
  await checkComposition('rgb(48, 80, 112)');
  await expect.element(document.querySelector<HTMLElement>('#story-shell')).toMatchScreenshot('effects-composition');
}, 60_000);

test('deletes only the selected effect and supports undo and redo through the editor', async () => {
  const composed = await addComposition();
  const deletedFrameSelector = `[data-effect-id="${composed.frame?.[0].id}"]`;

  await selectEffect('Тестовая тень');
  await page.getByRole('button', {
    name: 'Удалить эффект',
    exact: true,
  }).click();
  const deleted = await project.save();

  expect(window.confirm).toHaveBeenCalledWith('Удалить эффект «Тестовая тень»?');
  expect(deleted.frame).toEqual([]);
  expect(deleted.background).toEqual(composed.background);
  expect(document.querySelector<HTMLElement>(deletedFrameSelector)).toBeNull();

  await historyShortcut('undo');
  const undone = await project.save();

  expect(undone).toEqual(composed);
  await checkComposition();
  await historyShortcut('redo');
  const redone = await project.save();

  expect(redone).toEqual(deleted);
  expect(document.querySelector<HTMLElement>(deletedFrameSelector)).toBeNull();
}, 60_000);

test('visual region controls persist canonical geometry and selection clears on back, close and delete', async () => {
  await addEffect('Frame');
  const regionControl = page.getByRole('combobox', { name: 'Область размещения эффекта' });
  await expect.element(regionControl).toHaveValue('storyViewportFrame');
  const outline = () => document.querySelector<HTMLElement>('[data-visual-selection]');
  await expect.poll(outline).not.toBeNull();
  const id = outline()!.dataset.visualSelection!;
  const renderer = document.querySelector(`[data-effect-id="${id}"]`);
  const visibility = () => document.querySelector<HTMLElement>(`[data-visual-surface="${id}"]`);
  const region = (name: string) => document.querySelector<HTMLElement>(`[data-story-region="${name}"]`);
  await expect.poll(() => visibility()?.getBoundingClientRect().toJSON())
    .toEqual(region('storyViewportFrame')?.getBoundingClientRect().toJSON());
  await expect.poll(() => outline()?.getBoundingClientRect().toJSON())
    .toEqual(visibility()?.getBoundingClientRect().toJSON());

  await regionControl.selectOptions('narrativeFrame');
  await expect.poll(() => visibility()?.getBoundingClientRect().toJSON())
    .toEqual(region('narrativeFrame')?.getBoundingClientRect().toJSON());
  expect(document.querySelector(`[data-effect-id="${id}"]`)).not.toBe(renderer);
  await expect.poll(() => outline()?.getBoundingClientRect().toJSON())
    .toEqual(visibility()?.getBoundingClientRect().toJSON());
  await page.getByRole('textbox', {
    name: 'Название эффекта',
    exact: true,
  }).fill('Область нарратива');
  await expect.element(regionControl).toHaveValue('narrativeFrame');
  await page.getByRole('button', {
    name: '← Назад',
    exact: true,
  }).click();
  await expect.poll(outline).toBeNull();
  await page.getByRole('button', { name: /Область нарратива/ }).click();
  await expect.poll(outline).not.toBeNull();
  await page.getByRole('dialog', { name: 'Эффекты страницы' }).getByRole('button', {
    name: 'Закрыть',
    exact: true,
  }).click();
  await expect.poll(outline).toBeNull();
  const saved = await project.save();
  expect(saved.frame?.[0].placement?.region).toBe('narrativeFrame');
  const savedDocument = await project.readDocument();
  const authored = pageVisualEffects(savedDocument.pages[0].document).find((cur) => cur.effect.id === id);
  expect(authored?.effect.placement.region).toBe('narrativeFrame');
  expect(authored?.effect.params).not.toHaveProperty('displayRegion');
  await selectEffect('Область нарратива');
  await expect.poll(outline).not.toBeNull();
  await page.getByRole('button', {
    name: 'Удалить эффект',
    exact: true,
  }).click();
  await expect.poll(outline).toBeNull();
});


test('shared placement controls save transforms, layer and mixed units while focused', async () => {
  await addEffect('Background');
  const region = page.getByRole('combobox', { name: 'Область размещения эффекта' });
  expect(region.query()?.querySelectorAll('option').length).toBe(9);
  await region.selectOptions('narrativeViewport');
  await page.getByRole('combobox', {
    name: 'Якорь поверхности',
    exact: true,
  }).selectOptions('bottom-right');
  await page.getByRole('combobox', {
    name: 'Слой эффекта',
    exact: true,
  }).selectOptions('aboveStoryControls');
  await page.getByRole('combobox', {
    name: 'Единица смещения X',
    exact: true,
  }).selectOptions('%');
  await page.getByRole('spinbutton', {
    name: 'Смещение X',
    exact: true,
  }).fill('-5');
  await page.getByRole('spinbutton', {
    name: 'Масштаб поверхности',
    exact: true,
  }).fill('0.8');
  await page.getByRole('spinbutton', {
    name: 'Поворот поверхности',
    exact: true,
  }).fill('15');
  await userEvent.keyboard('{Control>}s{/Control}');
  await expect.poll(async () => (await project.readEffects()).background?.at(-1)?.placement?.rotate).toBe(15);
  const saved = await project.readEffects();
  const effect = saved.background?.at(-1);
  expect(effect?.placement).toMatchObject({
    region: 'narrativeViewport',
    anchor: 'bottom-right',
    offset: {
      x: {
        value: -5,
        unit: '%',
      },
      y: {
        value: 0,
        unit: 'px',
      },
    },
    scale: 0.8,
    rotate: 15,
  });
  expect(effect?.depth?.plane).toBe('aboveStoryControls');
  const content = document.querySelector<HTMLElement>(`[data-visual-content="${effect?.id}"]`)!;
  expect(getComputedStyle(content).scale).toBe('0.8');
  expect(getComputedStyle(content).rotate).toBe('15deg');
  await page.getByRole('button', {
    name: 'Заполнить область',
    exact: true,
  }).click();
  const reset = await project.save();
  expect(reset.background?.at(-1)?.placement).toEqual({ region: 'narrativeViewport' });
});

test('Toolbar region masks survive duplication, save and reopen and can be removed independently', async () => {
  await addEffect('Background');
  await page.getByRole('textbox', {
    name: 'Название эффекта',
    exact: true, 
  }).fill('Панель и рамка');
  await page.getByRole('combobox', { name: 'Область размещения эффекта' }).selectOptions('toolbarFrame');
  await expect.element(page.getByRole('checkbox', {
    name: 'Ограничить сторонами рамки',
    exact: true, 
  })).toBeChecked();
  await page.getByRole('spinbutton', {
    name: 'Толщина рамочной маски',
    exact: true, 
  }).fill('18');
  await page.getByRole('checkbox', {
    name: 'Снизу',
    exact: true, 
  }).click();
  await page.getByRole('combobox', {
    name: 'Слой эффекта',
    exact: true, 
  }).selectOptions('aboveStoryControls');
  await page.getByRole('button', {
    name: 'Дублировать',
    exact: true, 
  }).click();
  const saved = await project.save();
  const effects = saved.background?.filter((effect) => effect.slug.startsWith('Панель и рамка'));
  expect(effects).toHaveLength(2);
  expect(effects?.[0].id).not.toBe(effects?.[1].id);
  for (const effect of effects ?? []) {
    expect(effect.placement?.region).toBe('toolbarFrame');
    expect(effect.depth?.plane).toBe('aboveStoryControls');
    expect(effect.visibility).toEqual({
      sides: ['top', 'right', 'left'],
      frameWidth: {
        value: 18,
        unit: 'px', 
      }, 
    });
  }
  await page.getByRole('button', {
    name: 'Эффекты страницы',
    exact: true, 
  }).click();
  await page.getByRole('searchbox', { name: 'Поиск эффектов' }).fill('Панель и рамка');
  await page.getByRole('button', { name: /Панель и рамка/ }).first().click();
  await expect.element(page.getByRole('spinbutton', {
    name: 'Толщина рамочной маски',
    exact: true, 
  })).toHaveValue(18);
  await page.getByRole('checkbox', {
    name: 'Ограничить сторонами рамки',
    exact: true, 
  }).click();
  const unmasked = await project.save();
  expect(unmasked.background?.find((effect) => effect.id === effects?.[0].id)?.placement?.region).toBe('toolbarFrame');
  expect(unmasked.background?.find((effect) => effect.id === effects?.[0].id)?.visibility?.sides).toBeUndefined();
  expect(unmasked.background?.find((effect) => effect.id === effects?.[1].id)?.visibility?.sides).toHaveLength(3);
});
