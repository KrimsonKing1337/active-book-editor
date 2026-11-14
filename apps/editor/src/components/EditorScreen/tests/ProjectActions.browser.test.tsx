import { StrictMode } from 'react';

import { cleanup, render } from '@testing-library/react';
import {
  afterEach,
  expect,
  test,
  vi,
} from 'vitest';
import { page } from 'vitest/browser';

import { createProject } from '@root/tests/editor-effects/project';

import { LocalProjectStorage } from '@project/storage';

import { EditorScreen } from '../EditorScreen';

import { workspaceEditor } from '../components/EditorWorkspace/tests/utils';

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

test('recovers saving after a storage failure and preserves the book on cancelled project picker', async () => {
  project = await createProject({ empty: true });
  render(
    <StrictMode>
      <EditorScreen />
    </StrictMode>,
  );
  const save = page.getByRole('button', { name: 'Сохранить', exact: true });

  await expect.element(save).toBeEnabled();
  await save.click();
  await expect.element(save).toBeEnabled();
  const editor = workspaceEditor();

  editor.commands.insertContent('Сохраняемая история');
  const failure = new DOMException('Disk write failed', 'NotAllowedError');
  const write = vi.spyOn(LocalProjectStorage.prototype, 'writeBook').mockRejectedValueOnce(failure);
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});

  await save.click();
  await expect.element(save).toBeEnabled();
  await expect.element(page.getByText(
    'Не удалось выполнить операцию с проектом. Подробности — в консоли',
    { exact: true },
  )).toBeVisible();
  expect(error).toHaveBeenCalledExactlyOnceWith('[project] Save failed.', failure);
  const unload = new Event('beforeunload', { cancelable: true });

  window.dispatchEvent(unload);
  expect(unload.defaultPrevented).toBe(true);
  await save.click();
  await expect.element(save).toBeEnabled();
  await expect.element(page.getByText('Сохранено', { exact: true })).toBeVisible();
  expect(write).toHaveBeenCalledTimes(2);
  const saved = await project.readDocument();

  expect(JSON.stringify(saved)).toContain('Сохраняемая история');
  project.pickDirectory.mockRejectedValueOnce(new DOMException('Picker cancelled', 'AbortError'));
  await page.getByRole('button', { name: 'Открыть проект', exact: true }).click();
  await expect.element(save).toBeEnabled();
  expect(project.pickDirectory).toHaveBeenCalledTimes(2);
  expect(workspaceEditor()).toBe(editor);
  expect(editor.getText()).toContain('Сохраняемая история');
  expect(await project.readDocument()).toEqual(saved);
  expect(error).toHaveBeenCalledTimes(1);
});
