import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';

import {
  openMediaReader,
  repoRoot,
  serveMediaBook,
} from '../media/mediaBrowserFixture';
import {
  openMediaAuthor,
  readMediaAuthor,
  saveMediaAuthor,
} from '../media/mediaEditorFixture';

for (const name of [
  'Library.tgz',
  'Library.TGZ',
  'Library.TgZ',
]) {
  test(`imports, reopens, uploads and runs the exact archive ${name}`, async (context) => {
    const editor = await openMediaAuthor(context);
    const archive = await readFile(path.join(repoRoot, 'tests/fixtures/multipage-book/dependencies/fixture-parts.tgz'));

    await editor.evaluate(async ({ name, bytes }) => {
      const root = await navigator.storage.getDirectory();
      const project = await root.getDirectoryHandle('media-authoring');
      const imports = await project.getDirectoryHandle('imports');
      const handle = await imports.getFileHandle(name, { create: true });
      const writable = await handle.createWritable();

      await writable.write(new Uint8Array(bytes));
      await writable.close();
      Object.defineProperty(window, 'showOpenFilePicker', {
        async value() {
          return [handle];
        },
      });
    }, { name, bytes: [...archive] });
    await editor.getByRole('button', { name: 'Импортировать .tgz', exact: true }).click();
    await editor.getByRole('button', { name: 'Продолжить импорт', exact: true }).click();
    const insert = editor.getByRole('button', { name: 'Добавить Тестовая вставка', exact: true });

    await insert.waitFor();
    await insert.click();
    await editor.getByTestId('custom-badge').waitFor();
    const saved = await saveMediaAuthor(editor);
    const specifier = `file:./dependencies/${name}`;
    const dependencyPath = await editor.evaluate(async () => {
      const root = await navigator.storage.getDirectory();
      const project = await root.getDirectoryHandle('media-authoring');
      const handle = await project.getFileHandle('package.json');
      const description: unknown = JSON.parse(await (await handle.getFile()).text());

      if (typeof description !== 'object' || description === null || !('dependencies' in description)) {
        throw new Error('Missing project dependencies');
      }

      const dependencies = description.dependencies;

      if (typeof dependencies !== 'object' || dependencies === null || !('fixture-parts' in dependencies)) {
        throw new Error('Missing fixture-parts dependency');
      }

      return dependencies['fixture-parts'];
    });

    assert.equal(dependencyPath, specifier);
    await editor.reload();
    await editor.getByRole('button', { name: 'Открыть проект', exact: true }).click();
    await editor.getByTestId('custom-badge').waitFor();
    assert.deepEqual(await readMediaAuthor(editor), saved);
    await insert.waitFor();
    const uploads: {
      path: string | null;
      status: number
    }[] = [];

    editor.on('response', (response) => {
      const url = new URL(response.url());

      if (url.pathname === '/__active-book/build/file') {
        uploads.push({ path: url.searchParams.get('path'), status: response.status() });
      }
    });
    const uploaded = editor.waitForResponse((response) => {
      const url = new URL(response.url());

      return url.pathname === '/__active-book/build/file' && url.searchParams.get('path') === `dependencies/${name}`;
    });

    await editor.getByRole('button', { name: 'Собрать книгу', exact: true }).click();
    const response = await uploaded;
    const result = await response.text();

    assert.equal(response.status(), 200, result);
    await editor.getByText('Готово: результат в dist-book/', { exact: true }).waitFor();
    assert(uploads.some((upload) => upload.path === `dependencies/${name}` && upload.status === 200));
    assert(uploads.every((upload) => upload.status === 200));
    assert.deepEqual(await readFile(path.join(repoRoot, 'dist-book/dependencies', name)), archive);
    const origin = await serveMediaBook(context, path.join(repoRoot, 'dist-book'));
    const reader = await openMediaReader(context, origin);
    const badge = reader.getByTestId('custom-badge');

    await badge.waitFor();
    await badge.click();
    assert.equal(await badge.textContent(), 'Кастомная вставка: 1');
  });
}
