import fs from 'node:fs/promises';
import path from 'node:path';

import { build } from 'vite';

import { createViteConfig } from './vite.config.js';

type BuildBookParams = {
  document: unknown;
  repoRoot: string;
  outDir?: string;
};

export async function buildBook({
  document,
  repoRoot,
  outDir,
}: BuildBookParams): Promise<string> {
  const tempRoot = path.resolve(repoRoot, '.active-book-temp');
  const runtimeRoot = path.resolve(repoRoot, 'apps/book-runtime');

  const outDirSafe = outDir ?? path.join(repoRoot, 'dist-book');

  try {
    await fs.rm(tempRoot, { recursive: true, force: true });
    await fs.cp(runtimeRoot, tempRoot, { recursive: true });

    const bookJsonPath = path.join(tempRoot, 'book.json');
    const documentAsString = JSON.stringify(document, null, 2);

    await fs.writeFile(bookJsonPath, documentAsString);

    const viteConfig = {
      root: tempRoot,
      repoRoot,
      outDir: outDirSafe,
    };

    await build(createViteConfig(viteConfig));
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }

  return outDirSafe;
}
