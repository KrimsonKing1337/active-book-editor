import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const editorRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const coreRoot = resolve(editorRoot, '..', 'activeBook-react-core-next');
const corePackagePath = resolve(coreRoot, 'package.json');
const editorPackagePath = resolve(editorRoot, 'package.json');

const run = (command, args, cwd) => {
  const executable = process.platform === 'win32' ? `${command}.cmd` : command;
  const result = spawnSync(executable, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`);
  }
};

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

const main = () => {
  if (!existsSync(corePackagePath)) {
    throw new Error('Expected sibling repository ../activeBook-react-core-next');
  }

  const editorPackage = readJson(editorPackagePath);
  const previousArchive = editorPackage.dependencies['activeBook-core']?.replace(/^file:/, '');

  run('npm', ['run', 'make'], coreRoot);

  let corePackage = readJson(corePackagePath);
  const archivePath = (version) => {
    return `../activeBook-react-core-next/tgz/${corePackage.name}-${version}.tgz`;
  };

  let nextArchive = archivePath(corePackage.version);

  // A fresh version prevents npm from continuing to reuse an older local tarball.
  if (nextArchive === previousArchive) {
    run('npm', ['run', 'up'], coreRoot);
    run('npm', ['run', 'packaging'], coreRoot);
    corePackage = readJson(corePackagePath);
    nextArchive = archivePath(corePackage.version);
  }

  if (!existsSync(resolve(editorRoot, nextArchive))) {
    throw new Error(`Core archive was not generated: ${nextArchive}`);
  }

  editorPackage.dependencies['activeBook-core'] = `file:${nextArchive}`;
  writeFileSync(editorPackagePath, `${JSON.stringify(editorPackage, null, 2)}\n`);

  run('npm', ['install', '--no-audit', '--no-fund'], editorRoot);

  console.log(`Installed activeBook-core from ${nextArchive}`);
};

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
