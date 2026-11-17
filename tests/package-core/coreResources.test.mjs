import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { createServer } from 'vite';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

test('the editor serves linked core assets and WASM through its real Vite configuration', async (context) => {
  const server = await createServer({
    configFile: path.join(repoRoot, 'apps/editor/vite.config.ts'),
    configLoader: 'runner',
    root: path.join(repoRoot, 'apps/editor'),
    server: { host: '127.0.0.1', port: 0 },
  });
  context.after(() => server.close());
  await server.listen();
  const address = server.httpServer?.address();
  assert(address && typeof address !== 'string');
  const origin = `http://127.0.0.1:${address.port}`;
  const resources = [
    'assets/fonts/Roboto/RobotoRegular/RobotoRegular.woff',
    'assets/img/toolbar/i-arrow-right.svg',
    'assets/img/poster-default.png',
  ];

  for (const resourceCur of resources) {
    const filename = fileURLToPath(import.meta.resolve(`@active-book/core/${resourceCur}`));
    const requestPath = encodeURI(`/@fs/${filename.replaceAll(path.sep, '/')}`);
    const response = await fetch(`${origin}${requestPath}`);

    assert.equal(response.status, 200, resourceCur);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), await readFile(filename), resourceCur);
  }

  const wasm = await fetch(`${origin}/vendors/dotlottie-player.wasm`);
  const wasmFile = fileURLToPath(import.meta.resolve('@active-book/core/vendors/dotlottie-player.wasm'));

  assert.equal(wasm.status, 200);
  assert.match(wasm.headers.get('content-type'), /application\/wasm/);
  assert.deepEqual(Buffer.from(await wasm.arrayBuffer()), await readFile(wasmFile));
});
