import { cleanup, render } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  expect,
  test,
  vi,
} from 'vitest';
import { page, userEvent } from 'vitest/browser';

import { createProject } from '@root/tests/editor-effects/project';

import { EditorScreen } from '../../../EditorScreen';

import { headerButtonNames, workspaceEditor } from './utils';

import '@active-book/common/styles';
import '@active-book/core/styles/styles.scss';
import '@styles/styles.scss';

let project: Awaited<ReturnType<typeof createProject>>;

beforeEach(async () => {
  await page.viewport(1280, 900);
  project = await createProject({ empty: true });
  render(<EditorScreen />);
  await expect.element(page.getByRole('button', { name: 'Сохранить', exact: true })).toBeEnabled();
});

afterEach(async () => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  await project.dispose();
});

test('Header insertion uses the keyboard selection and returns focus without replacing editor or page', async () => {
  await page.getByRole('button', { name: 'Добавить страницу', exact: true }).click();
  const activePage = page.getByRole('button', { name: 'Страница 2', exact: true });

  await expect.element(activePage).toHaveAttribute('aria-current', 'page');
  const editor = workspaceEditor();
  const root = editor.view.dom;
  const pageId = root.closest('[data-editor-page-id]')?.getAttribute('data-editor-page-id');
  const textbox = page.getByRole('textbox', { name: 'Текст страницы', exact: true });

  await textbox.fill('left selected right');
  await expect.poll(() => editor.getText()).toBe('left selected right');
  await textbox.click();
  await expect.poll(() => editor.isFocused).toBe(true);
  await userEvent.keyboard('{Control>}{Home}{/Control}{ArrowRight>5/}{Shift>}{ArrowRight>8/}{/Shift}');
  const { from, to } = editor.state.selection;

  expect(editor.state.doc.textBetween(from, to)).toBe('selected');
  await page.getByRole('button', { name: 'Добавить заголовок 1', exact: true }).click();
  await expect.poll(() => editor.isFocused).toBe(true);
  expect(editor.getJSON().content).toMatchObject([
    { type: 'paragraph', content: [{ type: 'text', text: 'left ' }] },
    { type: 'heading', attrs: { level: 1 } },
    { type: 'paragraph', content: [{ type: 'text', text: ' right' }] },
  ]);
  const insertedSelection = editor.state.selection.toJSON();

  await userEvent.keyboard('{Escape}');
  await expect.poll(() => editor.isFocused).toBe(false);
  expect(editor.state.selection.toJSON()).toEqual(insertedSelection);
  await page.getByRole('button', { name: 'Добавить параграф', exact: true }).click();
  await expect.poll(() => editor.isFocused).toBe(true);
  expect(workspaceEditor()).toBe(editor);
  expect(editor.view.dom).toBe(root);
  expect(root.closest('[data-editor-page-id]')?.getAttribute('data-editor-page-id')).toBe(pageId);
  expect(pageId).toBeTruthy();
  await expect.element(activePage).toHaveAttribute('aria-current', 'page');
  expect(editor.isDestroyed).toBe(false);
});

test('Header keeps accessible button order and wraps the same controls at wide and narrow widths', async () => {
  const editor = workspaceEditor();
  const header = page.getByRole('banner').element();
  const first = page.getByRole('button', { name: 'Новый проект', exact: true }).element();
  const actions = first.parentElement;

  if (!actions) {
    throw new Error('Expected Header actions');
  }

  const heights: number[] = [];

  for (const width of [1280, 480]) {
    await page.viewport(width, 900);
    const buttons = [...header.querySelectorAll('button')];

    expect(buttons.map((button) => button.textContent?.trim())).toEqual(headerButtonNames);
    expect(getComputedStyle(actions).display).toBe('flex');
    expect(getComputedStyle(actions).flexWrap).toBe('wrap');
    const bounds = buttons.map((button) => button.getBoundingClientRect());
    const headerBounds = header.getBoundingClientRect();

    for (const [index, button] of buttons.entries()) {
      await expect.element(page.elementLocator(button)).toHaveAccessibleName(headerButtonNames[index]);
      expect(bounds[index].width).toBeGreaterThan(0);
      expect(bounds[index].height).toBeGreaterThan(0);
      expect(bounds[index].left).toBeGreaterThanOrEqual(headerBounds.left);
      expect(bounds[index].right).toBeLessThanOrEqual(headerBounds.right + 1);

      if (index > 0) {
        expect(bounds[index].top).toBeGreaterThanOrEqual(bounds[index - 1].top - 1);

        if (Math.abs(bounds[index].top - bounds[index - 1].top) < 1) {
          expect(bounds[index].left).toBeGreaterThanOrEqual(bounds[index - 1].right);
        }
      }
    }

    expect(bounds.at(-1)!.top).toBeGreaterThan(bounds[0].top);
    heights.push(header.getBoundingClientRect().height);
    expect(workspaceEditor()).toBe(editor);
  }

  expect(heights[1]).toBeGreaterThan(heights[0]);
});
