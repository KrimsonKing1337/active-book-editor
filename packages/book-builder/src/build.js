import fs from 'node:fs/promises';
import path from 'node:path';

import react from '@vitejs/plugin-react';
import { build } from 'vite';
import svgr from 'vite-plugin-svgr';

export async function buildBook({ document, repoRoot, outDir = path.join(repoRoot, 'dist-book') }) {
  const tempRoot = path.resolve(repoRoot, '.active-book-temp');
  const runtimeRoot = path.resolve(repoRoot, 'apps/book-runtime');
  const coreRoot = path.resolve(repoRoot, 'node_modules/activeBook-core');

  try {
    await fs.rm(tempRoot, { recursive: true, force: true });
    await fs.cp(runtimeRoot, tempRoot, { recursive: true });
    await fs.writeFile(
      path.join(tempRoot, 'src/book.json'),
      JSON.stringify(document, null, 2),
    );

    await build({
      root: tempRoot,
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
          assets: path.resolve(repoRoot, 'node_modules/activeBook-core/assets'),
          styles: path.resolve(repoRoot, 'node_modules/activeBook-core/styles'),
        },
      },
      build: {
        outDir,
        emptyOutDir: true,
      },
    });
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }

  return outDir;
}
