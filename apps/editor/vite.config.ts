import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';

import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';

import { activeBookBuildPlugin } from '@active-book/book-builder/plugin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const repoRoot = path.resolve(__dirname, '../..');
const coreRoot = path.resolve(repoRoot, 'node_modules/activeBook-core');

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
          plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
          svgoConfig: {
            plugins: [
              {
                name: 'preset-default',
                params: {
                  overrides: {
                    removeViewBox: false,
                  },
                },
              },
              'prefixIds',
            ],
          },
        },
      }),

      activeBookBuildPlugin({ repoRoot }),
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
      alias: {
        assets: path.resolve(repoRoot, 'node_modules/activeBook-core/assets'),
        styles: path.resolve(repoRoot, 'node_modules/activeBook-core/styles'),
      },
    },
  };
});
