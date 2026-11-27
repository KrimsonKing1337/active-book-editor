import { expect, vi } from 'vitest';
import { page } from 'vitest/browser';

import type { JSONContent } from '@tiptap/core';

import type { BookDocument } from '@active-book/book-builder/book';

import { visualToDraft, pageVisualEffects } from '@active-book/book-builder/visualEffects';
import { normalizeSpecializedEffects } from '@active-book/book-builder/effects/utils';

import { clearLastProjectHandle } from '@project/storage';

import { groupPageEffects } from '@components/EditorScreen/components/PageEffects/context/utils';

import book from '../fixtures/effects-book/book.json?raw';
import herb from '../fixtures/effects-book/assets/herb.svg?raw';

export const savedPageEffects = (document: JSONContent) => {
  const specialized = normalizeSpecializedEffects(document.attrs?.pageEffects);
  const effects = [
    ...(specialized.vibration ?? []),
    ...(specialized.flashlight ?? []),
    ...pageVisualEffects(document).map(visualToDraft),
  ];

  return groupPageEffects({ effects, previous: {} });
};

type WriteFileAttrs = {
  dir: FileSystemDirectoryHandle;
  name: string;
  content: string;
};

const writeFile = async ({
  dir,
  name,
  content,
}: WriteFileAttrs) => {
  const fileHandle = await dir.getFileHandle(name, { create: true });
  const writableStream = await fileHandle.createWritable();

  await writableStream.write(content);
  await writableStream.close();
};

export const createProject = async ({ empty = false } = {}) => {
  await clearLastProjectHandle();
  localStorage.clear();

  const projectRootName = `effects-${crypto.randomUUID()}`;
  const storageRoot = await navigator.storage.getDirectory();

  const projectRoot = await storageRoot.getDirectoryHandle(projectRootName, { create: true });
  // Keep the visible name stable without sharing files between test projects.
  const projectDirectory = await projectRoot.getDirectoryHandle('effects-book', { create: true });
  const assetsDirectory = await projectDirectory.getDirectoryHandle('assets', { create: true });

  if (!empty) {
    await writeFile({
      dir: projectDirectory,
      name: 'book.json',
      content: book,
    });
  }

  await writeFile({
    dir: projectDirectory,
    name: 'package.json',
    content: '{"private":true,"dependencies":{}}',
  });

  await writeFile({
    dir: assetsDirectory,
    name: 'herb.svg',
    content: herb,
  });

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

    return savedPageEffects(document.pages[0].document);
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
    await storageRoot.removeEntry(projectRootName, { recursive: true });
  };

  return {
    name: projectDirectory.name,
    directory: projectDirectory,
    pickDirectory,
    readDocument,
    readEffects,
    save,
    dispose,
  };
};
