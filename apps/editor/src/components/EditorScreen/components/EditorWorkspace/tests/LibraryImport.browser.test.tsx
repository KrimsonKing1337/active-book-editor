import { cleanup, render } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  expect,
  test,
  vi,
} from 'vitest';
import { page } from 'vitest/browser';

import archiveUrl from '@root/tests/fixtures/multipage-book/dependencies/fixture-parts.tgz?url';
import { createProject } from '@root/tests/editor-effects/project';

import { LocalProjectStorage } from '@project/storage';

import { EditorScreen } from '../../../EditorScreen';
import { HIDE_CUSTOM_COMPONENTS_WARNING_STORAGE_KEY } from '../../../constants';

import '@active-book/common/styles';
import '@active-book/core/styles/styles.scss';
import '@styles/styles.scss';

let project: Awaited<ReturnType<typeof createProject>>;
let archive: FileSystemFileHandle;

beforeEach(async () => {
  await page.viewport(1280, 900);
  project = await createProject({ empty: true });
  const directory = await project.directory.getDirectoryHandle('imports', { create: true });

  archive = await directory.getFileHandle('fixture-parts.tgz', { create: true });
  const writable = await archive.createWritable();

  await writable.write(await (await fetch(archiveUrl)).blob());
  await writable.close();
  render(<EditorScreen />);
  await expect.element(page.getByRole('button', { name: 'Импортировать .tgz' })).toBeEnabled();
});

afterEach(async () => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  await project.dispose();
});

test('keeps warning preference and releases busy on cancelled picker', async () => {
  const picker = vi.fn(async () => {
    expect((await project.readDocument()).type).toBe('book');
    throw new DOMException('Picker cancelled', 'AbortError');
  });
  vi.stubGlobal('showOpenFilePicker', picker);
  const error = vi.spyOn(console, 'error');
  const trigger = page.getByRole('button', { name: 'Импортировать .tgz' });
  const warning = page.getByRole('dialog', { name: 'Импорт сторонней библиотеки' });

  await trigger.click();
  await expect.element(warning).toBeVisible();
  await warning.getByRole('button', { name: 'Отмена', exact: true }).click();
  expect(picker).not.toHaveBeenCalled();
  expect(project.pickDirectory).not.toHaveBeenCalled();
  await trigger.click();
  await warning.getByRole('checkbox', { name: 'Больше не показывать' }).click();
  await warning.getByRole('button', { name: 'Продолжить импорт' }).click();
  await expect.poll(() => picker.mock.calls.length).toBe(1);
  await expect.element(trigger).toBeEnabled();
  expect(localStorage.getItem(HIDE_CUSTOM_COMPONENTS_WARNING_STORAGE_KEY)).toBe('true');
  await trigger.click();
  await expect.poll(() => picker.mock.calls.length).toBe(2);
  await expect.element(trigger).toBeEnabled();
  await expect.element(warning).not.toBeInTheDocument();
  expect(project.pickDirectory).toHaveBeenCalledTimes(1);
  expect(error).not.toHaveBeenCalled();
});

test('retains a real TGZ registry until replacement is confirmed, then reloads and releases old URLs', async () => {
  vi.stubGlobal('showOpenFilePicker', vi.fn(async () => {
    expect((await project.readDocument()).type).toBe('book');

    return [archive];
  }));
  const reads = vi.spyOn(LocalProjectStorage.prototype, 'getDependencyFile');
  const create = vi.spyOn(URL, 'createObjectURL');
  const revoke = vi.spyOn(URL, 'revokeObjectURL');
  const trigger = page.getByRole('button', { name: 'Импортировать .tgz' });
  const proceed = page.getByRole('button', { name: 'Продолжить импорт' });

  await trigger.click();
  await proceed.click();
  const insert = page.getByRole('button', { name: 'Добавить Тестовая вставка', exact: true });

  await expect.element(insert).toBeEnabled();
  const readCount = reads.mock.calls.length;

  expect(readCount).toBeGreaterThan(0);
  const metadata = await project.directory.getFileHandle('package.json');
  const savedPackage = await (await metadata.getFile()).text();

  expect(JSON.parse(savedPackage).dependencies['fixture-parts']).toBe('file:./dependencies/fixture-parts.tgz');
  await insert.click();
  const badge = page.getByTestId('custom-badge');

  await expect.element(badge).toBeInTheDocument();
  const element = badge.element();
  const urls = create.mock.results.map((entry) => entry.value);

  expect(urls.length).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Показать структуру' }).click();
  await page.getByRole('button', { name: 'Скрыть фон', exact: true }).click();
  expect(badge.element()).toBe(element);
  expect(reads).toHaveBeenCalledTimes(readCount);
  vi.mocked(window.confirm).mockReturnValueOnce(false);
  await trigger.click();
  await proceed.click();
  await expect.element(trigger).toBeEnabled();
  expect(window.confirm).toHaveBeenCalledTimes(1);
  expect(await (await metadata.getFile()).text()).toBe(savedPackage);
  expect(reads).toHaveBeenCalledTimes(readCount);
  expect(badge.element()).toBe(element);

  for (const url of urls) {
    expect(revoke.mock.calls.flat()).not.toContain(url);
  }

  vi.mocked(window.confirm).mockReturnValueOnce(true);
  await trigger.click();
  await proceed.click();
  await expect.poll(async () => {
    const description = JSON.parse(await (await metadata.getFile()).text());

    return description.dependencies['fixture-parts'];
  }).toBe('file:./dependencies/fixture-parts-1.tgz');
  await expect.poll(() => reads.mock.calls.length).toBe(readCount + 1);
  await expect.element(insert).toBeEnabled();
  await expect.element(badge).toBeInTheDocument();
  expect(window.confirm).toHaveBeenCalledTimes(2);

  for (const url of urls) {
    expect(revoke.mock.calls.flat()).toContain(url);
  }
});
