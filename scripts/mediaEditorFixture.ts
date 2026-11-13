import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { TestContext } from 'node:test';

import type { Page } from 'playwright';
import { chromium } from 'playwright';
import { createServer } from 'vite';

import { isBookDocument } from '../packages/book-builder/src/book/book';

import { repoRoot } from './mediaBrowserFixture';

export const openMediaAuthor = async (context: TestContext) => {
  const server = await createServer({
    root: path.join(repoRoot, 'apps/editor'),
    configFile: path.join(repoRoot, 'apps/editor/vite.config.ts'),
    configLoader: 'runner',
    server: { host: '127.0.0.1', port: 0 },
  });
  context.after(() => server.close());
  await server.listen();
  const address = server.httpServer?.address();
  assert(address && typeof address !== 'string');
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  context.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('dialog', (dialog) => dialog.accept());
  context.after(() => assert.deepEqual(errors, []));
  await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204 }));
  const image = [...await readFile(path.join(repoRoot, 'tests/fixtures/media-book/assets/portrait.svg'))];
  const movie = [...await readFile(path.join(repoRoot, 'tests/fixtures/multipage-book/assets/movie.webm'))];
  await page.addInitScript(`(() => {
    const imageBytes = ${JSON.stringify(image)};
    const movieBytes = ${JSON.stringify(movie)};
    const ready = (async () => {
      const root = await navigator.storage.getDirectory();
      const project = await root.getDirectoryHandle('media-authoring', {create: true});
      const source = await project.getDirectoryHandle('imports', {create: true});
      const files = [['a #?%.svg', imageBytes], ['movie.webm', movieBytes]];
      for (const [name, bytes] of files) {
        const handle = await source.getFileHandle(name, {create: true});
        const writer = await handle.createWritable();
        await writer.write(new Uint8Array(bytes));
        await writer.close();
      }
      return { project, source };
    })();
    const selected = {image: false, video: false};
    Object.defineProperty(window, 'showDirectoryPicker', {
      configurable: true,
      value: async () => (await ready).project,
    });
    Object.defineProperty(window, 'showOpenFilePicker', {configurable: true, value: async (options) => {
      const isVideo = Object.keys(options.types[0].accept).some((type) => type.startsWith('video/'));
      let kind = 'image';
      let name = 'a #?%.svg';
      if (isVideo) {
        kind = 'video';
        name = 'movie.webm';
      }
      const {project, source} = await ready;
      let directory = source;
      if (selected[kind]) directory = await project.getDirectoryHandle('assets');
      selected[kind] = true;
      return [await directory.getFileHandle(name)];
    }});
  })()`);
  await page.goto(`http://127.0.0.1:${address.port}`);
  await page.getByRole('button', { name: 'Новый проект', exact: true }).click();
  await saveMediaAuthor(page);

  return page;
};

export const readMediaAuthor = async (page: Page) => {
  const raw = await page.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    const project = await root.getDirectoryHandle('media-authoring');
    const handle = await project.getFileHandle('book.json');

    return (await handle.getFile()).text();
  });
  const book: unknown = JSON.parse(raw);
  assert(isBookDocument(book));

  return book;
};

export const saveMediaAuthor = async (page: Page) => {
  await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
  await page.getByText('Сохранено', { exact: true }).and(page.locator('[aria-hidden="false"]')).waitFor();

  return readMediaAuthor(page);
};

export const selectEditorMedia = async (page: Page, kind: 'image' | 'video') => {
  let tag = 'img';

  if (kind === 'video') {
    tag = 'video';
  }

  const element = page.locator(`[data-editor-media="${kind}"] ${tag}`).last();
  await element.waitFor();
  await element.click();
  await page.getByRole('group', { name: 'Настройки медиа', exact: true }).waitFor();
};
