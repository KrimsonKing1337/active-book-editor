import fs from 'node:fs/promises';
import path from 'node:path';

import { build } from 'vite';

import { createViteConfig } from './vite.config';
import { compileBookDocument } from './compileBookDocument';

type BuildBookParams = {
  projectRoot: string;
  repoRoot: string;
  outDir?: string;
};

const getPathExists = async (targetPath: string): Promise<boolean> => {
  try {
    await fs.access(targetPath);

    return true;
  } catch {
    return false;
  }
};

const prepareRuntime = async (
  projectRoot: string,
  runtimeRoot: string,
  tempRoot: string,
): Promise<void> => {
  await fs.cp(runtimeRoot, tempRoot, { recursive: true });

  const bookJsonSource = path.join(projectRoot, 'book.json');
  const bookJsonTarget = path.join(tempRoot, 'book.json');

  const bookJsonContent = await fs.readFile(bookJsonSource, 'utf8');
  const projectDocument: unknown = JSON.parse(bookJsonContent);
  const builtDocument = compileBookDocument(projectDocument);

  await fs.writeFile(bookJsonTarget, `${JSON.stringify(builtDocument, null, 2)}\n`);

  const assetsSource = path.join(projectRoot, 'assets');
  const hasAssets = await getPathExists(assetsSource);

  if (!hasAssets) {
    return;
  }

  const assetsTarget = path.join(tempRoot, 'public', 'assets');

  await fs.mkdir(path.dirname(assetsTarget), { recursive: true });
  await fs.cp(assetsSource, assetsTarget, { recursive: true });
};

export async function buildBook({
  projectRoot,
  repoRoot,
  outDir,
}: BuildBookParams): Promise<string> {
  const tempRoot = path.resolve(repoRoot, 'apps/.active-book-temp');
  const runtimeRoot = path.resolve(repoRoot, 'apps/book-runtime');
  const outDirSafe = outDir ?? path.join(repoRoot, 'dist-book');

  try {
    await fs.rm(tempRoot, { recursive: true, force: true });

    await prepareRuntime(projectRoot, runtimeRoot, tempRoot);

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
