import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { compileBookDocument } from '../packages/book-builder/src/bookPreparation/compileBookDocument';
import type { BookDocument } from '@active-book/book-builder/book';

import { chromium } from 'playwright';
import { createServer as createViteServer } from 'vite';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const projectRoot = path.join(repoRoot, 'tests/fixtures/multipage-book');
const outDir = path.join(repoRoot, 'dist-book');

const mimeTypes: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.webm': 'video/webm', '.tgz': 'application/gzip', '.wav': 'audio/wav', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
};

test('production book selects stable page IDs in a persistent viewport with page-owned effects and custom components', async (context) => {
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
  // The test project has no favicon asset; keep resource errors meaningful.
  await editor.route('**/favicon.ico', (route) => route.fulfill({ status: 204 }));
  editor.on('dialog', (dialog) => dialog.accept());
  const files = await Promise.all(['book.json', 'package.json', 'assets/tone.wav', 'assets/movie.webm', 'assets/range-pattern.svg', 'assets/img/poster-default.png', 'dependencies/fixture-parts.tgz']
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
  editor.on('console', (message) => {
    if (message.type() === 'error') editorErrors.push(message.text());
  });
  await editor.goto(`http://127.0.0.1:${editorAddress.port}/`);
  await editor.getByRole('button', { name: 'Открыть проект', exact: true }).click();
  try {
    await editor.getByText('Альфа: первая страница', { exact: true }).waitFor();
  } catch (error) {
    console.error(await editor.locator('body').innerText(), editorErrors);
    throw error;
  }

  assert.match(await editor.locator('body').evaluate((element) => getComputedStyle(element).fontFamily), /Inter/);
  assert.match(await editor.locator('[data-book-application]').evaluate((element) => getComputedStyle(element).fontFamily), /Roboto/);
  assert.notEqual(await editor.locator('body').evaluate((element) => getComputedStyle(element).userSelect), 'none');

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
  const editorViewport = await editor.locator('[data-story-region="storyViewport"]').elementHandle();
  const editorNarrative = await editor.locator('#narrative').elementHandle();
  const editorToolbar = await editor.locator('#Toolbar').elementHandle();
  assert(editorViewport && editorNarrative && editorToolbar);
  const editorUrl = editor.url();
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
  assert(await editorViewport.evaluate((element) => element === document.querySelector('[data-story-region="storyViewport"]')));
  assert(await editorNarrative.evaluate((element) => element === document.querySelector('#narrative')));
  assert(await editorToolbar.evaluate((element) => element === document.querySelector('#Toolbar')));
  assert.equal(editor.url(), editorUrl);
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
    assert.equal(await regionControl.inputValue(), category === 'Frame' ? 'storyViewportFrame' : 'storyViewport');
    await editor.locator('[data-visual-selection]').waitFor();
    if (category === 'Frame') {
      await regionControl.selectOption('toolbarFrame');
      const maskSettings = editor.getByRole('group', {
        name: 'Маска сторон',
        exact: true,
      });
      await maskSettings.getByRole('checkbox', {
        name: 'Ограничить сторонами рамки',
        exact: true,
      }).check();
      await maskSettings.getByRole('spinbutton', {
        name: 'Толщина рамочной маски',
        exact: true,
      }).fill('8');
      await maskSettings.getByRole('checkbox', {
        name: 'Раздельная толщина сторон',
        exact: true,
      }).check();
      await maskSettings.getByRole('spinbutton', {
        name: 'Толщина: справа',
        exact: true,
      }).fill('16');
      await maskSettings.getByRole('spinbutton', {
        name: 'Толщина: снизу',
        exact: true,
      }).fill('11');
      await maskSettings.getByRole('spinbutton', {
        name: 'Толщина: слева',
        exact: true,
      }).fill('4');
      await maskSettings.getByRole('combobox', {
        name: 'Единица толщины: слева',
        exact: true,
      }).selectOption('%');
      await maskSettings.getByRole('checkbox', {
        name: 'Снизу',
        exact: true,
      }).uncheck();
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
  assert.equal(newFrame.effect.placement.region, 'toolbarFrame');
  assert.deepEqual(newFrame.effect.visibility, {
    sides: ['top', 'right', 'left'],
    frameWidth: {
      top: {
        value: 8,
        unit: 'px',
      },
      right: {
        value: 16,
        unit: 'px',
      },
      bottom: {
        value: 11,
        unit: 'px',
      },
      left: {
        value: 4,
        unit: '%',
      },
    },
  });
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
  await editor.keyboard.press('Control+End');
  await editor.getByRole('button', { name: 'Добавить карусель', exact: true }).click();
  await editor.getByRole('button', { name: 'Слайд 1', exact: true }).click();
  await editor.keyboard.type('Первый слайд из редактора');
  await editor.getByRole('button', { name: 'Слайд 2', exact: true }).click();
  await editor.keyboard.type('Второй слайд из редактора');
  const withCarousel = await save();
  const savedCarousel = withCarousel.pages[0].document.content?.find((node) => node.type === 'carousel');
  assert(savedCarousel);
  assert.equal(savedCarousel.content?.length, 2);
  await editor.getByRole('button', { name: 'Слайд 1', exact: true }).click();
  assert.deepEqual(await readSaved(), withCarousel, 'slide selection does not dirty or save the document');
  await editor.reload();
  await editor.getByText('Первый слайд из редактора', { exact: true }).waitFor();
  assert.deepEqual(await readSaved(), withCarousel);
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
    if (pathname === '/favicon.ico') {
      response.writeHead(204);
      response.end();
      return;
    }
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
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`${message.text()} (${message.location().url})`);
  });
  await page.goto(`http://127.0.0.1:${address.port}/`);
  await page.getByRole('button', { name: 'Начать читать', exact: true }).waitFor();
  const baseStyles = await page.evaluate(() => ({
    sizes: ['html', 'body', '#root'].map((selector) => {
      const bounds = document.querySelector(selector)!.getBoundingClientRect();
      return [bounds.width, bounds.height];
    }),
    overflow: getComputedStyle(document.body).overflow,
    margin: getComputedStyle(document.body).margin,
    selection: getComputedStyle(document.body).userSelect,
    font: getComputedStyle(document.querySelector('[data-book-application]')!).fontFamily,
    background: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
  }));
  assert.deepEqual(baseStyles.sizes, [[1100, 800], [1100, 800], [1100, 800]]);
  assert.equal(baseStyles.overflow, 'hidden');
  assert.equal(baseStyles.margin, '0px');
  assert.equal(baseStyles.selection, 'none');
  assert.match(baseStyles.font, /Roboto/);
  assert.notEqual(baseStyles.background, '');
  await page.evaluate(() => {
    const input = document.createElement('input');
    const editable = document.createElement('div');
    editable.contentEditable = 'true';
    document.body.append(input, editable);
    if ([input, editable].some((element) => getComputedStyle(element).userSelect !== 'text')) {
      throw new Error('Runtime must preserve editable text selection');
    }
    input.remove();
    editable.remove();
  });
  assert.equal(await page.locator('[data-page-id]').count(), 0, 'page 0 is a technical audio screen');
  const book = await page.locator('[data-story-region="story"]').elementHandle();
  assert(book);
  const viewport = await page.locator('[data-story-region="storyViewport"]').elementHandle();
  const narrative = await page.locator('#narrative').elementHandle();
  const toolbar = await page.locator('#Toolbar').elementHandle();
  assert(viewport && narrative && toolbar);
  const readerUrl = page.url();
  await page.getByRole('button', { name: 'Начать читать', exact: true }).click();
  await page.getByText('Из редактора. Альфа: первая страница', { exact: true }).waitFor();
  const carousel = page.getByRole('region', { name: 'Карусель', exact: true });
  await carousel.getByText('1 из 2', { exact: true }).waitFor();
  await carousel.getByRole('button', { name: 'Следующий слайд', exact: true }).click();
  await carousel.getByText('2 из 2', { exact: true }).waitFor();
  assert.equal(await page.locator('#story-shell').getAttribute('data-page-id'), 'stable-alpha');
  await carousel.focus();
  await page.keyboard.press('ArrowLeft');
  await carousel.getByText('1 из 2', { exact: true }).waitFor();
  await carousel.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => {
    const slide = document.querySelector('[data-carousel-slide]');
    const viewport = slide?.parentElement?.parentElement;
    return slide && viewport && Math.abs(slide.getBoundingClientRect().x - viewport.getBoundingClientRect().x) < 1;
  });
  const slideBounds = await carousel.locator('[data-carousel-slide]').first().boundingBox();
  assert(slideBounds);
  await page.mouse.move(slideBounds.x + slideBounds.width * 0.8, slideBounds.y + 20);
  await page.mouse.down();
  await page.mouse.move(slideBounds.x + slideBounds.width * 0.2, slideBounds.y + 20, { steps: 12 });
  await page.mouse.up();
  await carousel.getByText('2 из 2', { exact: true }).waitFor();
  assert.equal(await page.locator('#story-shell').getAttribute('data-page-id'), 'stable-alpha');
  await carousel.evaluate((element) => { if (element instanceof HTMLElement) element.blur(); });
  await page.getByText('1 из 3', { exact: true }).waitFor();
  const textLink = page.getByRole('link', { name: 'Форматированная ссылка', exact: true });

  assert.equal(await textLink.getAttribute('href'), 'https://example.com/note');
  assert.equal(await textLink.getAttribute('target'), '_blank');
  assert.match(await textLink.getAttribute('rel') ?? '', /noopener/);
  assert.match(await textLink.getAttribute('rel') ?? '', /noreferrer/);

  const formattedParagraph = page.locator('[data-active-book-node="paragraph"]').filter({ has: textLink });

  for (const tag of ['strong', 'em', 's', 'u']) {
    assert.equal(await formattedParagraph.locator(tag).textContent(), 'Форматированная ссылка');
  }

  assert.equal(await page.locator('code').filter({ hasText: 'reader-code' }).count(), 1);
  assert.equal(await page.getByText('Заголовок первого уровня', { exact: true })
    .evaluate((element) => getComputedStyle(element).fontWeight), '700');
  assert.equal(await page.getByText('Заголовок второго уровня', { exact: true })
    .evaluate((element) => getComputedStyle(element).fontStyle), 'italic');
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
    assert.equal(await page.locator('#story-shell').getAttribute('data-page-id'), `stable-${id}`);
    await page.locator(`[data-effect-id="bg-${id}"]`).waitFor({ state: 'attached' });
    await page.locator(`[data-effect-id="frame-${id}"]`).waitFor({ state: 'attached' });
    await page.waitForFunction((id) => {
      const badge = document.querySelector('[data-testid="custom-badge"]');
      return badge?.getAttribute('data-audio-alpha') === String(id === 'alpha')
        && badge?.getAttribute('data-audio-beta') === String(id === 'beta');
    }, id);
    if (id === 'gamma') await page.getByTestId('custom-effect').waitFor({ state: 'attached' });
    if (id === 'alpha') {
      const surface = page.locator(`[data-visual-surface="${newFrame.effect.id}"]`);
      await surface.waitFor();
      assert.equal(await surface.evaluate((node) => node.parentElement?.dataset.visualHost), 'toolbarFrame');
      assert.deepEqual(await surface.boundingBox(), await page.locator('[data-story-region="toolbarFrame"]').boundingBox());
      const mask = await surface.evaluate((node) => getComputedStyle(node).maskImage);
      assert(mask.includes('8px') && mask.includes('16px') && mask.includes('4%'), mask);
      assert(!mask.includes('11px'), 'the disabled bottom side does not contribute a gradient');
    }
    if (number > 1) {
      assert.equal(await page.locator('[data-effect-id="bg-alpha"]').count(), 0);
      assert.equal(await page.getByTestId('custom-badge').textContent(), 'Кастомная вставка: 0');
    }
    assert.equal(await book.evaluate((element) => element === document.querySelector('[data-story-region="story"]')), true);
    assert(await viewport.evaluate((element) => element === document.querySelector('[data-story-region="storyViewport"]')));
    assert(await narrative.evaluate((element) => element === document.querySelector('#narrative')));
    assert(await toolbar.evaluate((element) => element === document.querySelector('#Toolbar')));
    assert.equal(page.url(), readerUrl);
  }
  await page.keyboard.press('ArrowRight');
  await page.getByText('3 из 3', { exact: true }).waitFor();
  await page.keyboard.press('ArrowLeft');
  await page.getByText('Гамма: третья страница', { exact: true }).waitFor();
  await page.keyboard.press('ArrowLeft');
  await page.getByText('Из редактора. Альфа: первая страница', { exact: true }).waitFor();
  await carousel.getByText('1 из 2', { exact: true }).waitFor();
  assert.equal(await page.getByTestId('custom-badge').textContent(), 'Кастомная вставка: 0');

  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  context.after(() => mobileContext.close());
  const mobile = await mobileContext.newPage();
  mobile.on('pageerror', (error) => errors.push(error.message));
  mobile.on('console', (message) => {
    if (message.type() === 'error') errors.push(`${message.text()} (${message.location().url})`);
  });
  await mobile.goto(`http://127.0.0.1:${address.port}/`);
  await mobile.getByRole('button', { name: 'Начать читать', exact: true }).click();
  const mobileCarousel = mobile.getByRole('region', { name: 'Карусель', exact: true });
  await mobileCarousel.getByRole('button', { name: 'Следующий слайд' }).waitFor();
  await mobileCarousel.scrollIntoViewIfNeeded();
  const mobileBounds = await mobileCarousel.locator('[data-carousel-slide]').first().boundingBox();
  assert(mobileBounds);
  assert(mobileBounds.width <= 390, 'slide adapts to the mobile viewport');
  const touch = await mobileContext.newCDPSession(mobile);
  const y = mobileBounds.y + 15;
  const startX = mobileBounds.x + mobileBounds.width * 0.8;
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: startX, y }] });
  for (let step = 1; step <= 8; step += 1) {
    const x = startX - mobileBounds.width * 0.6 * step / 8;
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
  }
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await mobileCarousel.getByText('2 из 2', { exact: true }).waitFor();
  assert.equal(await mobile.locator('#story-shell').getAttribute('data-page-id'), 'stable-alpha');
  await touch.detach();
  assert.deepEqual(errors, []);
});
