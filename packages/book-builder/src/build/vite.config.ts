import path from 'node:path';

import type { InlineConfig } from 'vite';

import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

import { optimizeSvg } from './svg';
import { coreWasm } from './coreWasm';

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
  const coreRoot = path.resolve(repoRoot, 'node_modules/@active-book/core');

  return {
    root,

    plugins: [
      react(),

      svgr({
        include: '**/*.svg',
        svgrOptions: {
          plugins: [optimizeSvg, '@svgr/plugin-jsx'],
        },
      }),
      coreWasm(),
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
      tsconfigPaths: true,
      dedupe: ['react', 'react-dom'],
    },

    build: {
      outDir,
      assetsDir: 'app',
      emptyOutDir: true,
      rolldownOptions: {
        output: {
          assetFileNames: ({ names }) => {
            const [name = ''] = names;
            const isFont = /\.(eot|otf|ttf|woff2?)$/i.test(name);

            return isFont
              ? 'app/fonts/[name]-[hash][extname]'
              : 'app/[name]-[hash][extname]';
          },
        },
      },
    },
  };
};
