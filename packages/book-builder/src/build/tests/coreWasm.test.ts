import assert from 'node:assert/strict';
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { onTestFinished, test } from 'vitest';
import { build, createServer } from 'vite';

import { coreWasm } from '../coreWasm';

test('serves and emits the installed core WASM at the reader public URL', async () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'core-wasm-'));
  onTestFinished(() => rmSync(directory, { recursive: true, force: true }));
  writeFileSync(path.join(directory, 'index.html'), '<!doctype html><title>Core asset consumer</title>');

  const server = await createServer({
    root: directory,
    configFile: false,
    logLevel: 'silent',
    plugins: [coreWasm()],
    server: { host: '127.0.0.1', port: 0 },
  });
  onTestFinished(() => server.close());
  await server.listen();

  const address = server.httpServer?.address();
  assert(address && typeof address !== 'string');
  const response = await fetch(`http://127.0.0.1:${address.port}/vendors/dotlottie-player.wasm`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Type'), 'application/wasm');

  const location = import.meta.resolve('@active-book/core/vendors/dotlottie-player.wasm');
  const expected = readFileSync(fileURLToPath(location));
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), expected);

  await build({
    root: directory,
    configFile: false,
    logLevel: 'silent',
    plugins: [coreWasm()],
  });

  assert.deepEqual(readFileSync(path.join(directory, 'dist/vendors/dotlottie-player.wasm')), expected);
});
