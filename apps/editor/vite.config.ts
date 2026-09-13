import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { activeBookBuildPlugin } from '../../packages/book-builder/src/plugin.js';
import { coreScssModulesPlugin } from '../../packages/book-builder/src/coreScssModulesPlugin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const coreSourceRoot = path.resolve(repoRoot, 'node_modules/activeBook-core/lib/src');

export default defineConfig({
  plugins: [
    coreScssModulesPlugin({ repoRoot }),
    react(),
    activeBookBuildPlugin({ repoRoot }),
  ],
  resolve: {
    alias: {
      'activeBook-core': coreSourceRoot,
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: [coreSourceRoot, path.resolve(repoRoot, 'node_modules')],
      },
    },
  },
});
