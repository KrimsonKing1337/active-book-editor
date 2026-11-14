import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import {
  copyFile,
  mkdtemp,
  mkdir,
  readFile,
  rm,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { TestContext } from 'node:test';
import { fileURLToPath } from 'node:url';

import type { Page } from 'playwright';
import { chromium } from 'playwright';

export const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

export const prepareMediaProject = async (context: TestContext) => {
  const root = await mkdtemp(path.join(tmpdir(), 'active-book-media-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'assets'));
  await copyFile(path.join(repoRoot, 'tests/fixtures/media-book/book.json'), path.join(root, 'book.json'));
  await copyFile(
    path.join(repoRoot, 'tests/fixtures/media-book/assets/portrait.svg'),
    path.join(root, 'assets/a #?%.svg'),
  );
  await copyFile(
    path.join(repoRoot, 'tests/fixtures/multipage-book/assets/movie.webm'),
    path.join(root, 'assets/movie.webm'),
  );

  for (const name of [
    'wide.svg',
    'small.svg',
    'portrait.webm',
  ]) {
    await copyFile(path.join(repoRoot, 'tests/fixtures/media-book/assets', name), path.join(root, 'assets', name));
  }

  return root;
};

const mimeTypes: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.webm': 'video/webm',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

export const serveMediaBook = async (context: TestContext, directory: string) => {
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const name = decodeURIComponent(url.pathname).replace(/^\//u, '') || 'index.html';

    try {
      const bytes = await readFile(path.join(directory, name));
      response.writeHead(200, { 'Content-Type': mimeTypes[path.extname(name)] ?? 'application/octet-stream' });
      response.end(bytes);
    } catch {
      response.writeHead(404);
      response.end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  context.after(() => new Promise<void>((resolve) => server.close(() => resolve())));
  const address = server.address();
  assert(address && typeof address !== 'string');

  return `http://127.0.0.1:${address.port}`;
};

export const openMediaReader = async (context: TestContext, origin: string) => {
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  context.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  const errors: string[] = [];
  const missingResources: string[] = [];
  page.on('response', (response) => {
    if (response.status() >= 400) {
      missingResources.push(response.url());
    }
  });
  context.after(() => assert.deepEqual(missingResources, []));
  page.on('pageerror', (error) => errors.push(error.message));
  context.after(() => assert.deepEqual(errors, []));
  await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204 }));
  await page.addInitScript(() => {
    localStorage.setItem('built-book', JSON.stringify({ config: {
      theme: 'dark',
      themes: {},
      welcomeTour: false,
      vibration: true,
      flashlight: true,
      authorComments: false,
      fontSize: 100,
      lineHeight: 100,
    } }));
  });
  await page.goto(origin);
  await page.getByRole('button', { name: 'Начать читать', exact: true }).click();

  return page;
};

export const readVideo = async (page: Page, selector: string) => {
  return page.locator(selector).evaluate((element) => {
    if (!(element instanceof HTMLVideoElement)) {
      throw new Error('Expected video');
    }

    return {
      paused: element.paused,
      time: element.currentTime,
      controls: element.controls,
    };
  });
};
