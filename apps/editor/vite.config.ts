import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';

import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';

import { bookBuildPlugin } from '@active-book/book-builder/server/plugin';
import { optimizeSvg } from '@active-book/book-builder/build/svg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const repoRoot = path.resolve(__dirname, '../..');
const coreRoot = path.resolve(repoRoot, 'node_modules/@active-book/core');

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      tsconfigPaths({
        projectDiscovery: 'lazy',
      }),

      react(),

      svgr({
        include: '**/*.svg',
        svgrOptions: {
          plugins: [optimizeSvg, '@svgr/plugin-jsx'],
        },
      }),

      bookBuildPlugin({ repoRoot }),
    ],
    define: {
      'process.env.mode': JSON.stringify(mode),
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
      dedupe: ['react', 'react-dom'],
    },
  };
});
