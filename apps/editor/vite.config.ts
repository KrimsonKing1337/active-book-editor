import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { activeBookBuildPlugin } from '../../packages/book-builder/src/plugin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

export default defineConfig({
  plugins: [
    react(),
    activeBookBuildPlugin({ repoRoot }),
  ],
  resolve: {
    alias: {
      'activeBook-core': path.resolve(repoRoot, 'node_modules/activeBook-core'),
    },
  },
});
