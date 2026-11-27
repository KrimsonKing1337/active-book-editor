import fs from 'node:fs/promises';
import path from 'node:path';

import { build } from 'vite';

import { createViteConfig } from './vite.config';
import { compileBookDocument } from '../bookPreparation';
import { contentAssetPaths } from '../bookPreparation/contentAssets';

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

type PackageJsonDependencies = {
  dependencies?: Record<string, string>
};

type PrepareRuntimeParams = {
  projectRoot: string;
  runtimeRoot: string;
  tempRoot: string;
};

const prepareRuntime = async ({
  projectRoot,
  runtimeRoot,
  tempRoot,
}: PrepareRuntimeParams): Promise<void> => {
  await fs.cp(runtimeRoot, tempRoot, { recursive: true });

  const bookJsonSource = path.join(projectRoot, 'book.json');
  const bookJsonTarget = path.join(tempRoot, 'book.json');

  const bookJsonContent = await fs.readFile(bookJsonSource, 'utf8');
  const projectDocument: unknown = JSON.parse(bookJsonContent);
  const assets = new Set<string>();
  const builtDocument = compileBookDocument(projectDocument, assets);

  for (const contentAsset of contentAssetPaths(builtDocument)) {
    assets.add(contentAsset);
  }

  for (const assetPathCur of assets) {
    try {
      const file = await fs.stat(path.join(projectRoot, assetPathCur));

      if (!file.isFile()) {
        throw new Error('expected a file');
      }
    } catch (cause) {
      throw new Error(`Медиафайл отсутствует или недоступен: ${assetPathCur}`, { cause });
    }
  }

  const buildDocumentJsonString = JSON.stringify(builtDocument, null, 2);
  await fs.writeFile(bookJsonTarget, `${buildDocumentJsonString}\n`);

  let dependencies: Record<string, string> = {};

  try {
    const packageRaw = await fs.readFile(path.join(projectRoot, 'package.json'), 'utf8');
    const packageJson = JSON.parse(packageRaw) as PackageJsonDependencies;

    dependencies = packageJson.dependencies ?? {};
  } catch (error) {
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') {
      throw error;
    }
  }

  const dependenciesJsonString = JSON.stringify({ dependencies }, null, 2);
  await fs.writeFile(path.join(tempRoot, 'custom-components.json'),`${dependenciesJsonString}\n`);

  const dependenciesSource = path.join(projectRoot, 'dependencies');

  if (Object.keys(dependencies).length > 0 && !await getPathExists(dependenciesSource)) {
    throw new Error('Книга с кастомными компонентами должна содержать папку dependencies/');
  }

  if (await getPathExists(dependenciesSource)) {
    const dependenciesTarget = path.join(tempRoot, 'public', 'dependencies');

    await fs.mkdir(path.dirname(dependenciesTarget), { recursive: true });
    await fs.cp(dependenciesSource, dependenciesTarget, { recursive: true });
  }

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
    await fs.rm(tempRoot, {
      recursive: true,
      force: true,
    });

    await prepareRuntime({
      projectRoot,
      runtimeRoot,
      tempRoot,
    });

    const viteConfig = {
      root: tempRoot,
      repoRoot,
      outDir: outDirSafe,
    };

    await build(createViteConfig(viteConfig));
  } finally {
    await fs.rm(tempRoot, {
      recursive: true,
      force: true,
    });
  }

  return outDirSafe;
}
