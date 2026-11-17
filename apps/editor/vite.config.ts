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
      // Browser tests import core dynamically; prepare its dependencies before the first test to avoid reloads.
      include: [
        '@active-book/core > @fortawesome/free-solid-svg-icons',
        '@active-book/core > @fortawesome/react-fontawesome',
        '@active-book/core > @lottiefiles/dotlottie-react',
        '@active-book/core > @radix-ui/react-dialog',
        '@active-book/core > @reduxjs/toolkit',
        '@active-book/core > embla-carousel-react',
        '@active-book/core > hammerjs',
        '@active-book/core > howler',
        '@active-book/core > lodash-es',
        '@active-book/core > nanoid',
        '@active-book/core > react-range',
        '@active-book/core > react-redux',
        '@active-book/core > react-style-stringify',
        '@active-book/core > react-toastify',
        '@active-book/core > redux-saga',
        '@active-book/core > redux-saga/effects',
      ],
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
