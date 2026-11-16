import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { Plugin } from 'vite';

/** AppContent requests this public URL in both the editor and exported reader. */
export const coreWasm = (): Plugin => {
  const filename = 'vendors/dotlottie-player.wasm';
  const location = import.meta.resolve('@active-book/core/vendors/dotlottie-player.wasm');
  const source = readFileSync(fileURLToPath(location));

  return {
    name: 'active-book-core-wasm',
    configureServer(server) {
      server.middlewares.use(`/${filename}`, (_request, response) => {
        response.setHeader('Content-Type', 'application/wasm');
        response.end(source);
      });
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: filename,
        source,
      });
    },
  };
};
