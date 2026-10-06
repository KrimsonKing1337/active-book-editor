import fs from 'node:fs/promises';
import path from 'node:path';

import { build } from 'vite';

import { createViteConfig } from './vite.config.ts';

type BuildBookParams = {
  document: unknown;
  repoRoot: string;
  outDir?: string;
};

export async function buildBook({
  document,
  repoRoot,
  outDir = path.join(repoRoot, 'dist-book'),
}: BuildBookParams): Promise<string> {
  const tempRoot = path.resolve(repoRoot, '.active-book-temp');
  const runtimeRoot = path.resolve(repoRoot, 'apps/book-runtime');

  try {
    await fs.rm(tempRoot, { recursive: true, force: true });
    await fs.cp(runtimeRoot, tempRoot, { recursive: true });
    await fs.writeFile(
      path.join(tempRoot, 'book.json'),
      JSON.stringify(document, null, 2),
    );

    await build(createViteConfig({
      root: tempRoot,
      repoRoot,
      outDir,
    }));
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }

  return outDir;
}
