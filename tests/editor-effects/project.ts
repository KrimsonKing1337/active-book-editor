import { expect, vi } from 'vitest';
import { page } from 'vitest/browser';

import type { BookDocument } from '@active-book/book-builder/book';

import { normalizePageEffects } from '@active-book/book-builder/effects/utils';

import { clearLastProjectHandle } from '../../apps/editor/src/project/recentProjectStore';

import book from '../fixtures/effects-book/book.json?raw';
import herb from '../fixtures/effects-book/assets/herb.svg?raw';

const writeFile = async (directory: FileSystemDirectoryHandle, name: string, content: string) => {
  const fileHandle = await directory.getFileHandle(name, { create: true });
  const writableStream = await fileHandle.createWritable();

  await writableStream.write(content);
  await writableStream.close();
};

export const createProject = async ({ empty = false } = {}) => {
  await clearLastProjectHandle();
  localStorage.clear();

  const storageRoot = await navigator.storage.getDirectory();
  const projectName = `effects-${crypto.randomUUID()}`;
  const projectDirectory = await storageRoot.getDirectoryHandle(projectName, { create: true });
  const assetsDirectory = await projectDirectory.getDirectoryHandle('assets', { create: true });

  if (!empty) {
    await writeFile(projectDirectory, 'book.json', book);
  }

  await writeFile(projectDirectory, 'package.json', '{"private":true,"dependencies":{}}');
  await writeFile(assetsDirectory, 'herb.svg', herb);

  // Only the OS folder picker/confirmation are replaced. Storage and IndexedDB are real.
  const pickDirectory = vi.fn(async () => projectDirectory);

  vi.stubGlobal('showDirectoryPicker', pickDirectory);
  vi.spyOn(window, 'confirm').mockReturnValue(true);

  const readDocument = async (): Promise<BookDocument> => {
    const fileHandle = await projectDirectory.getFileHandle('book.json');
    const file = await fileHandle.getFile();

    return JSON.parse(await file.text());
  };

  const readEffects = async () => {
    const document = await readDocument();

    return normalizePageEffects(document.pages[0].document.attrs?.pageEffects);
  };

  const save = async () => {
    const dialog = page.getByRole('dialog', { name: 'Эффекты страницы' });

    if (dialog.query()) {
      await dialog.getByRole('button', { name: 'Закрыть', exact: true }).click();
      await expect.element(page.getByRole('dialog', { name: 'Эффекты страницы' })).not.toBeInTheDocument();
    }

    const saveButton = page.getByRole('button', { name: 'Сохранить', exact: true });

    await saveButton.click();
    await expect.element(saveButton).toBeEnabled();
    await expect.element(page.getByText('Сохранено', { exact: true })).toBeVisible();

    return readEffects();
  };

  const dispose = async () => {
    await clearLastProjectHandle();
    await storageRoot.removeEntry(projectName, { recursive: true });
  };

  return {
    name: projectName,
    directory: projectDirectory,
    pickDirectory,
    readDocument,
    readEffects,
    save,
    dispose,
  };
};
