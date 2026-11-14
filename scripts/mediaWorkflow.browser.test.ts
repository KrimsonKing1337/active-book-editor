import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';

import { assertContentDocument } from '../packages/book-builder/src/content';

import {
  openMediaReader,
  readVideo,
  repoRoot,
  serveMediaBook,
} from './mediaBrowserFixture';
import {
  openMediaAuthor,
  readMediaAuthor,
  saveMediaAuthor,
  selectEditorMedia,
} from './mediaEditorFixture';

test('author imports, saves, reopens and builds page/slide media for the production reader', async (context) => {
  const editor = await openMediaAuthor(context);
  await editor.getByRole('button', { name: 'Добавить изображение', exact: true }).click();
  await selectEditorMedia(editor, 'image');
  await editor.getByLabel('Альтернативное описание').fill('Author portrait');
  await editor.getByLabel('Ширина', { exact: true }).fill('70');
  await editor.getByLabel('Высота (пиксели)').fill('180');
  await editor.getByLabel('Размещение в заданной области').selectOption('cover');
  await editor.locator('.tiptap > p').last().click();
  await editor.getByRole('button', { name: 'Добавить карусель', exact: true }).click();
  await editor.getByRole('button', { name: 'Слайд 1', exact: true }).click();
  await editor.locator('[data-type="carouselSlide"]:not([hidden]) p').click();
  await editor.getByRole('button', { name: 'Добавить изображение', exact: true }).click();
  await selectEditorMedia(editor, 'image');
  await editor.getByLabel('Альтернативное описание').fill('Slide portrait');
  await editor.getByLabel('Высота (пиксели)').fill('180');
  await editor.getByRole('button', { name: 'Слайд 2', exact: true }).click();
  await editor.getByRole('button', { name: 'Добавить видео', exact: true }).click();
  await selectEditorMedia(editor, 'video');
  await editor.getByLabel('Автовоспроизведение').check();
  await editor.getByLabel('Повторять').check();
  await editor.getByLabel('Высота (пиксели)').fill('180');
  await editor.getByLabel('Постер (путь в assets/)').fill('assets/a #?%.svg');
  await editor.getByLabel('Высота (пиксели)').click();
  assert.equal(await editor.locator('[data-editor-media="video"] video').evaluate((element) => {
    return element instanceof HTMLVideoElement && element.paused && !element.autoplay;
  }), true);
  await editor.getByRole('button', { name: 'Добавить страницу', exact: true }).click();
  await editor.getByRole('button', { name: 'Добавить видео', exact: true }).click();
  await selectEditorMedia(editor, 'video');
  await editor.getByLabel('Высота (пиксели)').fill('180');
  const authored = await saveMediaAuthor(editor);
  assert.equal(authored.pages.length, 2);
  authored.pages.forEach((page) => assertContentDocument(page.document));
  assert(!JSON.stringify(authored).includes('blob:'));
  const assets = await editor.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    const project = await root.getDirectoryHandle('media-authoring');
    const directory = await project.getDirectoryHandle('assets');
    const names: string[] = [];

    for await (const entry of directory.values()) {
      names.push(entry.name);
    }

    return names.sort();
  });
  assert.deepEqual(assets, ['a #?%.svg', 'movie.webm']);
  await editor.getByRole('button', { name: 'Страница 1', exact: true }).click();
  await editor.getByRole('img', { name: 'Author portrait', exact: true }).waitFor();
  await editor.getByRole('button', { name: 'Открыть проект', exact: true }).click();
  await editor.getByRole('img', { name: 'Author portrait', exact: true }).waitFor();
  assert.deepEqual(await readMediaAuthor(editor), authored);
  await editor.getByRole('button', { name: 'Собрать книгу', exact: true }).click();
  await editor.getByText('Готово: результат в dist-book/', { exact: true }).waitFor();
  const origin = await serveMediaBook(context, path.join(repoRoot, 'dist-book'));
  const reader = await openMediaReader(context, origin);
  const image = reader.getByRole('img', { name: 'Author portrait', exact: true });
  await image.waitFor();
  await reader.waitForFunction(() => {
    return document.querySelector<HTMLImageElement>('img[alt="Author portrait"]')?.naturalWidth === 120;
  });
  assert.equal(await image.evaluate((element) => {
    return element instanceof HTMLImageElement && element.complete && element.naturalWidth === 120;
  }), true);
  assert.equal(await image.evaluate((element) => getComputedStyle(element).objectFit), 'cover');
  const carousel = reader.getByRole('region', { name: 'Карусель' });
  const managed = '[data-book-carousel] video';
  assert.equal((await readVideo(reader, managed)).paused, true);
  await carousel.getByRole('button', { name: 'Следующий слайд' }).click();
  await carousel.getByText('2 из 2', { exact: true }).waitFor();
  await reader.waitForFunction(() => {
    return (document.querySelector<HTMLVideoElement>('[data-book-carousel] video')?.currentTime ?? 0) > 0.3;
  });
  await reader.locator(managed).focus();
  await reader.keyboard.press('Space');
  await reader.waitForFunction(() => document.querySelector<HTMLVideoElement>('[data-book-carousel] video')?.paused);
  const paused = await readVideo(reader, managed);
  await carousel.getByRole('button', { name: 'Предыдущий слайд' }).click();
  await carousel.getByRole('button', { name: 'Следующий слайд' }).click();
  await reader.setViewportSize({ width: 390, height: 780 });
  assert.equal((await readVideo(reader, managed)).paused, true);
  assert(Math.abs((await readVideo(reader, managed)).time - paused.time) < 0.1);
  assert.equal(await reader.locator('#story-shell').getAttribute('data-page-id'), authored.pages[0].id);
});
