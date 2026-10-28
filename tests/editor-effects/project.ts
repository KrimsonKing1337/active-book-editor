import type { JSONContent } from '@tiptap/core';

import { expect, vi } from 'vitest';
import { page } from 'vitest/browser';

import { normalizePageEffects } from '@active-book/book-builder/effects/utils';

import { clearLastProjectHandle } from '../../apps/editor/src/project/recentProjectStore';

import book from '../fixtures/effects-book/book.json?raw';
import herb from '../fixtures/effects-book/assets/herb.svg?raw';

const writeFile = async (directory: FileSystemDirectoryHandle, name: string, content: string) => {
  const handle = await directory.getFileHandle(name, { create: true });
  const stream = await handle.createWritable();

  await stream.write(content);
  await stream.close();
};

export const createProject = async () => {
  await clearLastProjectHandle();
  localStorage.clear();

  const root = await navigator.storage.getDirectory();
  const name = `effects-${crypto.randomUUID()}`;
  const directory = await root.getDirectoryHandle(name, { create: true });
  const assets = await directory.getDirectoryHandle('assets', { create: true });

  await writeFile(directory, 'book.json', book);
  await writeFile(directory, 'package.json', '{"private":true,"dependencies":{}}');
  await writeFile(assets, 'herb.svg', herb);

  // Only the OS folder picker/confirmation are replaced. Storage and IndexedDB are real.
  const pickDirectory = vi.fn(async () => directory);

  vi.stubGlobal('showDirectoryPicker', pickDirectory);
  vi.spyOn(window, 'confirm').mockReturnValue(true);

  const readDocument = async (): Promise<JSONContent> => {
    const handle = await directory.getFileHandle('book.json');
    const file = await handle.getFile();

    return JSON.parse(await file.text());
  };

  const readEffects = async () => {
    const document = await readDocument();

    return normalizePageEffects(document.attrs?.pageEffects);
  };

  const save = async () => {
    const dialog = page.getByRole('dialog', { name: 'Эффекты страницы' });

    if (dialog.query()) {
      await dialog.getByRole('button', { name: 'Закрыть', exact: true }).click();
      await expect.element(page.getByRole('dialog', { name: 'Эффекты страницы' })).not.toBeInTheDocument();
    }

    await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
    await expect.element(page.getByRole('button', { name: 'Сохранить', exact: true })).toBeEnabled();
    await expect.element(page.getByText('Сохранено', { exact: true })).toBeVisible();

    return readEffects();
  };

  const dispose = async () => {
    await clearLastProjectHandle();
    await root.removeEntry(name, { recursive: true });
  };

  return { name, directory, pickDirectory, readDocument, readEffects, save, dispose };
};
