import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

import type { AudioEffect } from '@active-book/types';

import { buildBook } from '../../packages/book-builder/src/build/build';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const mime: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.wav': 'audio/wav' };

type SoundTrace = {
  voices: { id: number; loop: boolean; busy: string | null; stopped: boolean }[];
};

declare global {
  interface Window {
    soundTrace: SoundTrace;
  }
}

test('a real built book shares audio assets and preserves the range voice through navigation', { timeout: 90_000 }, async (context) => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'active-book-audio-'));
  context.after(() => rm(workspace, { recursive: true, force: true }));
  const projectRoot = path.join(workspace, 'project');
  const outDir = path.join(workspace, 'dist');
  const filename = 'гром #?%.wav';
  const source = `assets/${filename}`;
  await mkdir(path.join(projectRoot, 'assets'), { recursive: true });

  const audioEffects: AudioEffect[] = [
    {
      id: 'range',
      src: source,
      lifetime: { type: 'range', range: [{ from: 1, to: 2 }, { from: 1, to: 1 }] },
      playOnLoad: true,
      loop: true,
      stopBy: 2500,
      fadeOut: true,
    },
    {
      id: 'page-sound',
      src: source,
      lifetime: { type: 'page', page: 'middle' },
      playOnLoad: true,
    },
  ];
  const book = {
    type: 'book',
    visualEffects: [],
    audioEffects,
    pages: ['opening', 'middle', 'ending'].map((id) => ({
      id,
      document: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: `Story ${id}` }] }],
      },
    })),
  };

  await writeFile(path.join(projectRoot, 'book.json'), JSON.stringify(book));
  const buildOptions = { projectRoot, repoRoot, outDir };
  await assert.rejects(() => buildBook(buildOptions), /Медиафайл отсутствует.*гром/);
  await copyFile(path.join(repoRoot, 'tests/fixtures/multipage-book/assets/tone.wav'), path.join(projectRoot, source));
  await buildBook(buildOptions);
  const builtAssets = await readdir(path.join(outDir, 'assets'));
  assert.equal(builtAssets.filter((asset) => asset.endsWith('.wav') && asset === filename).length, 1);

  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    let file = 'index.html';
    if (url.pathname !== '/') {
      file = decodeURIComponent(url.pathname.slice(1));
    }

    try {
      const data = await readFile(path.join(outDir, file));
      const contentType = mime[path.extname(file)] ?? 'application/octet-stream';
      response.writeHead(200, { 'content-type': contentType });
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
  const origin = `http://127.0.0.1:${address.port}`;

  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  context.after(() => browser.close());
  const page = await browser.newPage();
  context.after(() => page.close());
  await page.addInitScript(`(() => {
    const voices = [];
    const observed = new WeakMap();
    const { start, stop } = AudioBufferSourceNode.prototype;
    AudioBufferSourceNode.prototype.start = function (...args) {
      const story = document.querySelector('[data-story-content]');
      if (this.buffer?.duration > 0.08 && document.querySelector('[data-page-id]')) {
        const voice = { id: voices.length, loop: this.loop, busy: story?.getAttribute('aria-busy'), stopped: false };
        voices.push(voice);
        observed.set(this, voice);
        this.addEventListener('ended', () => { voice.stopped = true; }, { once: true });
      }
      return start.apply(this, args);
    };
    AudioBufferSourceNode.prototype.stop = function (...args) {
      const voice = observed.get(this);
      if (voice) voice.stopped = true;
      return stop.apply(this, args);
    };
    window.soundTrace = { voices };
  })();`);

  let release!: () => void;
  let requestAudio!: (url: string) => void;
  const requested = new Promise<string>((resolve) => { requestAudio = resolve; });
  const gate = new Promise<void>((resolve) => { release = resolve; });
  context.after(() => release());
  await page.route('**/*.wav', async (route) => {
    requestAudio(route.request().url());
    await gate;
    await route.continue();
  });

  await page.goto(`${origin}/?page=middle`, { waitUntil: 'domcontentloaded' });
  const expectedUrl = `${origin}/assets/${encodeURIComponent(filename)}`;
  assert.equal(await requested, expectedUrl);
  const story = page.locator('[data-story-content]');
  await story.and(page.locator('[aria-busy="true"]')).waitFor({ state: 'attached' });
  assert.equal(await page.getByText('Story middle').isVisible(), false);
  assert.deepEqual(await page.evaluate(() => window.soundTrace.voices), []);

  release();
  await page.getByText('Story middle').waitFor();
  await page.locator('#narrative').click();
  await page.waitForFunction(() => window.soundTrace.voices.length === 2);
  const voices = await page.evaluate(() => window.soundTrace.voices);
  assert.equal(voices.every(({ busy }) => busy === 'false'), true);
  const range = voices.find(({ loop }) => loop);
  assert(range && voices.some(({ loop }) => !loop));

  await page.keyboard.press('ArrowLeft');
  await page.getByText('Story opening').waitFor();
  const continuing = await page.evaluate((id) => window.soundTrace.voices[id], range.id);
  assert.equal(continuing.stopped, false);

  await page.keyboard.press('ArrowRight');
  await page.getByText('Story middle').waitFor();
  await page.keyboard.press('ArrowRight');
  await page.getByText('Story ending').waitFor();
  await page.keyboard.press('ArrowLeft');
  await page.getByText('Story middle').waitFor();
  const returned = await page.evaluate(() => window.soundTrace.voices.filter(({ loop }) => loop));
  assert.deepEqual(returned, [range]);

  await page.waitForFunction((id) => window.soundTrace.voices[id].stopped, range.id);
  assert.equal(await page.evaluate(() => window.soundTrace.voices.filter(({ loop }) => loop).length), 1);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })));
  assert.equal(await story.count(), 0);
  assert(await page.evaluate(() => window.soundTrace.voices.every(({ stopped }) => stopped)));

  await page.goto(origin);
  await page.getByRole('button', { name: 'Начать читать' }).click();
  await page.getByText('Story opening').waitFor();
  await page.waitForFunction(() => window.soundTrace.voices.some(({ loop }) => loop));
});
