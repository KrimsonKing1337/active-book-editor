import assert from 'node:assert/strict';
import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';

import { buildBook } from '../../packages/book-builder/src/build/build';

import {
  openMediaReader,
  prepareMediaProject,
  readVideo,
  repoRoot,
  serveMediaBook,
} from './mediaBrowserFixture';

test('built media keeps assets, layout and video activity across reader resize', async (context) => {
  const projectRoot = await prepareMediaProject(context);
  const outDir = path.join(projectRoot, 'dist');
  await buildBook({
    projectRoot,
    repoRoot,
    outDir,
  });
  assert((await readFile(path.join(outDir, 'assets/a #?%.svg'))).length > 0);
  const origin = await serveMediaBook(context, outDir);
  const page = await openMediaReader(context, origin);
  await page.getByRole('heading', { name: 'Built media', exact: true }).waitFor();
  const portrait = page.getByRole('img', { name: 'Portrait', exact: true });
  assert(await portrait.evaluate((image) => image instanceof HTMLImageElement && image.naturalWidth === 120));
  assert.equal(await portrait.evaluate((image) => getComputedStyle(image).objectFit), 'cover');
  const initial = await portrait.boundingBox();
  assert(initial);
  assert(Math.abs(initial.height - 180) < 1);
  const wide = await page.getByRole('img', { name: 'Wide image', exact: true }).boundingBox();
  const small = await page.getByRole('img', { name: 'Small image', exact: true }).boundingBox();
  assert(wide && small);
  assert(Math.abs(wide.width / wide.height - 6) < 0.05);
  assert.equal(small.width, 32);
  assert.equal(small.height, 32);
  const ordinary = 'video[data-book-media]:not([data-book-carousel] video)';
  assert.match(await page.locator(ordinary).getAttribute('poster') ?? '', /a%20%23%3F%25.svg/u);
  const managed = '[data-book-carousel] video';
  await page.waitForFunction(() => {
    return document.querySelector<HTMLVideoElement>('video[data-video-managed="false"]')?.paused === false;
  });
  assert.equal((await readVideo(page, managed)).paused, true);
  const carousel = page.getByRole('region', { name: 'Карусель' });
  const identity = await page.locator(managed).elementHandle();
  await carousel.getByRole('button', { name: 'Следующий слайд' }).click();
  await carousel.getByText('2 из 3', { exact: true }).waitFor();
  await page.waitForFunction(() => {
    return (document.querySelector<HTMLVideoElement>('[data-book-carousel] video')?.currentTime ?? 0) > 0.4;
  });
  const video = page.locator(managed);
  await video.focus();
  await page.keyboard.press('Space');
  await page.waitForFunction(() => document.querySelector<HTMLVideoElement>('[data-book-carousel] video')?.paused);
  assert(await video.evaluate((element) => {
    return element instanceof HTMLVideoElement && element.videoHeight > element.videoWidth;
  }));
  const paused = await readVideo(page, managed);
  assert(paused.controls && paused.time > 0);
  await carousel.getByRole('button', { name: 'Предыдущий слайд' }).click();
  await carousel.getByText('1 из 3', { exact: true }).waitFor();
  assert(Math.abs((await readVideo(page, managed)).time - paused.time) < 0.1);
  await carousel.getByRole('button', { name: 'Следующий слайд' }).click();
  await carousel.getByText('2 из 3', { exact: true }).waitFor();
  assert.equal((await readVideo(page, managed)).paused, true);
  await page.setViewportSize({ width: 390, height: 780 });
  await carousel.getByText('2 из 3', { exact: true }).waitFor();
  assert(Math.abs((await readVideo(page, managed)).time - paused.time) < 0.1);
  assert(await identity?.evaluate((element) => element === document.querySelector('[data-book-carousel] video')));
  assert.equal(await page.locator('#story-shell').getAttribute('data-page-id'), 'media-page');
  const bounds = await portrait.boundingBox();
  assert(bounds && bounds.width < initial.width);
  assert.equal(await page.evaluate(() => {
    const narrative = document.querySelector('#narrative');

    return narrative && narrative.scrollWidth <= narrative.clientWidth;
  }), true);
  assert.equal((await readVideo(page, ordinary)).paused, false);
});

test('build rejects missing media rather than producing a broken reader', async (context) => {
  const projectRoot = await prepareMediaProject(context);
  await rm(path.join(projectRoot, 'assets/movie.webm'));
  await assert.rejects(buildBook({
    projectRoot,
    repoRoot,
    outDir: path.join(projectRoot, 'dist'),
  }), /movie.webm/u);
});
