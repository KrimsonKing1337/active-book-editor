import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { compileBookDocument } from '../packages/book-builder/src/bookPreparation/compileBookDocument';
import type { BookDocument } from '../packages/book-builder/src/book';

import { chromium } from 'playwright';
import { createServer as createViteServer } from 'vite';


const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const projectRoot = path.join(repoRoot, 'tests/fixtures/multipage-book');
const outDir = path.join(repoRoot, 'dist-book');

const mimeTypes: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.webm': 'video/webm', '.tgz': 'application/gzip', '.wav': 'audio/wav', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
};

test('production book reads all three positional routes with page-owned effects and custom components', async (context) => {
  const editorServer = await createViteServer({
    configFile: path.join(repoRoot, 'apps/editor/vite.config.ts'),
    configLoader: 'runner',
    root: path.join(repoRoot, 'apps/editor'),
    server: { host: '127.0.0.1', port: 0 },
  });
  context.after(() => editorServer.close());
  await editorServer.listen();
  const editorAddress = editorServer.httpServer?.address();
  assert(editorAddress && typeof editorAddress !== 'string');
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  context.after(() => browser.close());
  const editor = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  editor.on('dialog', (dialog) => dialog.accept());
  const files = await Promise.all(['book.json', 'package.json', 'assets/tone.wav', 'assets/movie.webm', 'assets/range-pattern.svg', 'dependencies/fixture-parts.tgz']
    .map(async (filename) => ({ filename, bytes: [...await readFile(path.join(projectRoot, filename))] })));
  // A source string avoids tsx's function-name helpers leaking into serialized browser callbacks.
  await editor.addInitScript(`(() => {
    const files = ${JSON.stringify(files)};
    const prepared = (async () => {
      const storage = await navigator.storage.getDirectory();
      const directory = await storage.getDirectoryHandle('built-editor-book', { create: true });
      let seeded = false;
      try { await directory.getFileHandle('book.json'); seeded = true; } catch {}
      for (const fileCur of seeded ? [] : files) {
        const segments = fileCur.filename.split('/');
        let parent = directory;
        for (const segmentCur of segments.slice(0, -1)) {
          parent = await parent.getDirectoryHandle(segmentCur, { create: true });
        }
        const handle = await parent.getFileHandle(segments.at(-1), { create: true });
        const writable = await handle.createWritable();
        await writable.write(new Uint8Array(fileCur.bytes));
        await writable.close();
      }
      return directory;
    })();
    Object.defineProperty(window, 'showDirectoryPicker', { value: () => prepared, configurable: true });
  })();`);
  const editorErrors: string[] = [];
  editor.on('pageerror', (error) => editorErrors.push(error.message));
  await editor.goto(`http://127.0.0.1:${editorAddress.port}/`);
  await editor.getByRole('button', { name: 'Открыть проект', exact: true }).click();
  try {
    await editor.getByText('Альфа: первая страница', { exact: true }).waitFor();
  } catch (error) {
    console.error(await editor.locator('body').innerText(), editorErrors);
    throw error;
  }

  const readSaved = async (): Promise<BookDocument> => editor.evaluate(`(async () => {
    const storage = await navigator.storage.getDirectory();
    const directory = await storage.getDirectoryHandle('built-editor-book');
    const handle = await directory.getFileHandle('book.json');
    for (let attempt = 0; attempt < 20; attempt += 1) {
      try { return JSON.parse(await (await handle.getFile()).text()); }
      catch (error) {
        if (error.name !== 'NotReadableError') throw error;
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
    }
    throw new Error('Could not read saved book after pending writes');
  })()`);
  const save = async () => {
    await editor.getByRole('button', { name: 'Сохранить', exact: true }).click();
    // The status stays in layout at opacity 0; wait for the completed-save state.
    await editor.getByText('Сохранено', { exact: true }).and(editor.locator('[aria-hidden="false"]')).waitFor();
    return readSaved();
  };
  const initial = await readSaved();
  const originalIds = initial.pages.flatMap((cur) => cur.document.attrs?.visualEffects.map((visual: { effect: { id: string } }) => visual.effect.id) ?? []);
  await editor.getByTestId('native-visual').waitFor();
  const native = await editor.getByTestId('native-visual').elementHandle();
  const image = await editor.locator('[data-effect-id="range-image"] img').elementHandle();
  const video = await editor.locator('[data-effect-id="range-video"] video').elementHandle();
  assert(native && image && video);
  await editor.waitForFunction(() => (document.querySelector<HTMLVideoElement>('[data-effect-id="range-video"] video')?.currentTime ?? 0) > 0.2);
  await editor.getByRole('button', { name: 'Скрыть фон', exact: true }).click();
  assert(await video.evaluate((element) => element === document.querySelector('[data-effect-id="range-video"] video') && element instanceof HTMLVideoElement && !element.paused));
  assert.equal(await editor.locator('[data-visual-surface="range-video"]').evaluate((element) => getComputedStyle(element).visibility), 'hidden');
  await editor.getByRole('button', { name: 'Показать фон', exact: true }).click();
  await editor.evaluate(() => window.dispatchEvent(new Event('increment-native')));
  await editor.getByTestId('native-visual').filter({ hasText: '1' }).waitFor();
  await editor.getByRole('button', { name: 'Страница 3', exact: true }).click();
  assert(await native.evaluate((element) => element === document.querySelector('[data-testid="native-visual"]')));
  assert(await image.evaluate((element) => element === document.querySelector('[data-effect-id="range-image"] img')));
  assert(await video.evaluate((element) => element === document.querySelector('[data-effect-id="range-video"] video')));
  await editor.getByRole('button', { name: 'Страница 2', exact: true }).click();
  assert.equal(await native.evaluate((element) => element.isConnected), false);
  await editor.getByRole('button', { name: 'Страница 1', exact: true }).click();
  await editor.getByTestId('native-visual').filter({ hasText: '0' }).waitFor();
  for (const category of ['Background', 'Frame']) {
    await editor.getByRole('button', { name: 'Эффекты страницы', exact: true }).click();
    await editor.getByRole('button', { name: new RegExp(`Категория ${category} `) }).click();
    await editor.getByRole('button', { name: category === 'Background' ? 'Добавить фон' : 'Добавить рамочную тень', exact: true }).click();
    await editor.getByRole('textbox', { name: 'Название эффекта', exact: true }).fill(`Создано в редакторе ${category}`);
    const regionControl = editor.getByRole('combobox', { name: 'Область размещения эффекта' });
    assert.equal(await regionControl.inputValue(), 'storyViewport');
    await editor.locator('[data-visual-selection]').waitFor();
    if (category === 'Frame') {
      await regionControl.selectOption('narrativeFrame');
      const thickness = editor.getByRole('textbox', { name: 'Толщина тени (px)', exact: true });
      await thickness.click();
      await editor.keyboard.press('Control+A');
      await editor.keyboard.press('Backspace');
      await thickness.pressSequentially('45', { delay: 30 });
    }
    await editor.getByRole('dialog', { name: 'Эффекты страницы' }).getByRole('button', { name: 'Закрыть', exact: true }).click();
    await editor.locator('[data-visual-selection]').waitFor({ state: 'detached' });
  }
  const authored = await save();
  assert.equal(authored.pages[0].document.attrs?.visualEffects.length, 4);
  assert.equal(authored.pages[0].document.attrs?.pageEffects.background, undefined);
  assert.equal(authored.pages[0].document.attrs?.pageEffects.frame, undefined);
  const newFrame = authored.pages[0].document.attrs?.visualEffects.find((cur: { slug: string }) => cur.slug === 'Создано в редакторе Frame');
  assert.equal(newFrame.effect.params.shadow.thickness, 45);
  assert.equal(newFrame.effect.placement.coordinates, 'narrativeFrame');
  assert.equal(newFrame.effect.visibility.region, 'narrativeFrame');
  const frameElement = await editor.locator(`[data-effect-id="${newFrame.effect.id}"]`).elementHandle();
  assert(frameElement);
  await editor.getByRole('button', { name: 'Добавить страницу', exact: true }).click();
  await editor.getByRole('button', { name: 'Удалить страницу 4', exact: true }).click();
  const afterDelete = await save();
  assert.deepEqual(afterDelete.visualEffects, initial.visualEffects);
  await editor.reload();
  await editor.getByText('Альфа: первая страница', { exact: true }).waitFor();
  const reopened = await readSaved();
  assert.deepEqual(reopened, afterDelete);
  const allIds = reopened.pages.flatMap((cur) => cur.document.attrs?.visualEffects.map((visual: { effect: { id: string } }) => visual.effect.id) ?? []);
  assert(originalIds.every((id: string) => allIds.includes(id)));
  await editor.getByRole('textbox', { name: 'Текст страницы', exact: true }).click();
  await editor.keyboard.press('Control+Home');
  await editor.keyboard.type('Из редактора. ');
  await editor.getByRole('button', { name: 'Переместить страницу 3 вверх', exact: true }).click();
  const finalSaved = await save();
  const compiled = compileBookDocument(finalSaved);
  await editor.getByRole('button', { name: 'Собрать книгу', exact: true }).click();
  await editor.getByText('Готово: результат в dist-book/', { exact: true }).waitFor({ timeout: 60000 });
  assert.deepEqual(editorErrors, []);

  assert.deepEqual(compiled.visualEffects.map((cur) => cur.effect.id).sort(), [
    ...finalSaved.visualEffects.map((cur) => cur.effect.id),
    ...finalSaved.pages.flatMap((cur) => cur.document.attrs?.visualEffects.map((visual: { effect: { id: string } }) => visual.effect.id) ?? []),
  ].sort());
  assert(compiled.pages.every((cur) => !cur.document.attrs?.visualEffects && !cur.document.attrs?.pageEffects.background && !cur.document.attrs?.pageEffects.frame));

  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
    const filename = pathname === '/' ? '/index.html' : pathname;
    try {
      const data = await readFile(path.join(outDir, filename));
      response.writeHead(200, { 'content-type': mimeTypes[path.extname(filename)] ?? 'application/octet-stream' });
      response.end(data);
    } catch {
      response.writeHead(404);
      response.end();
    }
  });
  context.after(() => new Promise<void>((resolve) => server.close(() => resolve())));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert(address && typeof address !== 'string');
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${address.port}/`);
  await page.getByRole('button', { name: 'Начать читать', exact: true }).waitFor();
  assert.equal(await page.locator('[data-page-id]').count(), 0, 'page 0 is a technical audio screen');
  const book = await page.locator('[data-story-region="story"]').elementHandle();
  assert(book);
  await page.getByRole('button', { name: 'Начать читать', exact: true }).click();
  await page.getByText('Из редактора. Альфа: первая страница', { exact: true }).waitFor();
  await page.getByText('1 из 3', { exact: true }).waitFor();
  await page.getByTestId('native-visual').waitFor();
  const nativeParams = JSON.parse(await page.getByTestId('native-visual').getAttribute('data-params') ?? '{}');
  assert.deepEqual(nativeParams, compiled.visualEffects.find((cur) => cur.effect.id === 'range-native')?.effect.params);
  assert.equal(await page.locator(`[data-effect-id="${newFrame.effect.id}"]`).count(), 1);
  assert.equal(await page.locator('[data-effect-id="range-image"] img').evaluate((element) => getComputedStyle(element).filter), 'brightness(1.2)');

  await page.waitForFunction(() => document.querySelector('[data-testid="custom-badge"]')
    ?.getAttribute('data-audio-alpha') === 'true');
  await page.getByTestId('custom-badge').click();
  assert.equal(await page.getByTestId('custom-badge').textContent(), 'Кастомная вставка: 1');

  for (const [number, id, title] of [
    [1, 'alpha', 'Из редактора. Альфа: первая страница'],
    [2, 'gamma', 'Гамма: третья страница'],
    [3, 'beta', 'Бета: вторая страница'],
  ] as const) {
    if (number > 1) await page.keyboard.press('ArrowRight');
    await page.getByText(title, { exact: true }).waitFor();
    await page.getByText(`${number} из 3`, { exact: true }).waitFor();
    assert.equal(await page.locator('#page-wrapper').getAttribute('data-page-id'), `stable-${id}`);
    await page.locator(`[data-effect-id="bg-${id}"]`).waitFor({ state: 'attached' });
    await page.locator(`[data-effect-id="frame-${id}"]`).waitFor({ state: 'attached' });
    await page.waitForFunction((id) => {
      const badge = document.querySelector('[data-testid="custom-badge"]');
      return badge?.getAttribute('data-audio-alpha') === String(id === 'alpha')
        && badge?.getAttribute('data-audio-beta') === String(id === 'beta');
    }, id);
    if (id === 'gamma') await page.getByTestId('custom-effect').waitFor({ state: 'attached' });
    if (number > 1) {
      assert.equal(await page.locator('[data-effect-id="bg-alpha"]').count(), 0);
      assert.equal(await page.getByTestId('custom-badge').textContent(), 'Кастомная вставка: 0');
    }
    assert.equal(await book.evaluate((element) => element === document.querySelector('[data-story-region="story"]')), true);
  }
  await page.keyboard.press('ArrowRight');
  await page.getByText('3 из 3', { exact: true }).waitFor();
  await page.keyboard.press('ArrowLeft');
  await page.getByText('Гамма: третья страница', { exact: true }).waitFor();
  await page.keyboard.press('ArrowLeft');
  await page.getByText('Из редактора. Альфа: первая страница', { exact: true }).waitFor();
  assert.equal(await page.getByTestId('custom-badge').textContent(), 'Кастомная вставка: 0');
  assert.deepEqual(errors, []);
});
