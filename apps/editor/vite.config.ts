import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';

import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

import { bookBuildPlugin } from '@active-book/book-builder/server/plugin';
import { optimizeSvg } from '@active-book/book-builder/build/svg';
import { coreWasm } from '@active-book/book-builder/build/coreWasm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const repoRoot = path.resolve(__dirname, '../..');
const coreRoot = path.dirname(fileURLToPath(import.meta.resolve('@active-book/core/package.json')));

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      react(),

      svgr({
        include: '**/*.svg',
        svgrOptions: {
          plugins: [optimizeSvg, '@svgr/plugin-jsx'],
        },
      }),

      bookBuildPlugin({ repoRoot }),
      coreWasm(),
    ],
    define: {
      'process.env.mode': JSON.stringify(mode),
    },
    // Keep linked core subpaths in one ESM graph so their React contexts stay shared.
    optimizeDeps: {
      exclude: ['@active-book/core'],
    },
    server: {
      fs: {
        allow: [repoRoot, path.join(coreRoot, 'lib/src')],
      },
    },
    css: {
      modules: {
        generateScopedName: '[name]__[local]__[hash:base64:5]',
      },
      preprocessorOptions: {
        scss: {
          loadPaths: [coreRoot, path.resolve(repoRoot, 'node_modules')],
        },
      },
    },
    resolve: {
      tsconfigPaths: true,
      dedupe: ['react', 'react-dom'],
    },
  };
});
