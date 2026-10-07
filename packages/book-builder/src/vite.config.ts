import path from 'node:path';

import type { InlineConfig } from 'vite';

import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

import { createProjectAliases } from '../../../vite.aliases.js';

type CreateViteConfigParams = {
  root: string;
  repoRoot: string;
  outDir: string;
};

export const createViteConfig = ({
  root,
  repoRoot,
  outDir,
}: CreateViteConfigParams): InlineConfig => {
  const coreRoot = path.resolve(repoRoot, 'node_modules/activeBook-core');

  return {
    root,

    plugins: [
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
    ],

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
        ...createProjectAliases(repoRoot),
        assets: path.resolve(repoRoot, 'node_modules/activeBook-core/assets'),
        styles: path.resolve(repoRoot, 'node_modules/activeBook-core/styles'),
      },
    },

    build: {
      outDir,
      emptyOutDir: true,
    },
  };
};
