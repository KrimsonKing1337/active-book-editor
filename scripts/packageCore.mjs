import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { delimiter, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const editorRoot = fileURLToPath(new URL('../', import.meta.url));

function runNpm(args, cwd) {
  // npm run supplies npm_execpath on Windows, Linux and macOS. Direct node
  // invocation can also find npm's JS entry point without spawning a shell.
  let npmCli = process.env.npm_execpath;
  if (!npmCli) {
    for (const directory of (process.env.PATH ?? '').split(delimiter)) {
      const bundledCli = join(directory, 'node_modules/npm/bin/npm-cli.js');
      const executable = join(directory, 'npm');
      if (existsSync(bundledCli)) {
        npmCli = bundledCli;
        break;
      }
      if (process.platform !== 'win32' && existsSync(executable)) {
        npmCli = realpathSync(executable);
        break;
      }
    }
  }
  if (!npmCli) {
    throw new Error('npm CLI not found; run npm run core:package');
  }
  const result = spawnSync(process.execPath, [npmCli, ...args], {
    cwd,
    stdio: 'inherit',
    shell: false,
  });
  if (result.error || result.status !== 0) {
    throw new Error(`npm ${args.join(' ')} in ${cwd}: ${result.error?.message ?? result.signal ?? `exit ${result.status}`}`);
  }
}

function readPackage(directory) {
  const path = join(directory, 'package.json');
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot read ${path}: ${error.message}`);
  }
}

export function packageCore({ root = editorRoot, npm = runNpm } = {}) {
  const coreRoot = resolve(root, '../active-book-core');
  const editorPackage = readPackage(root);
  const corePackage = readPackage(coreRoot);
  if (corePackage.name !== '@active-book/core' || !corePackage.scripts?.make) {
    throw new Error(`Expected @active-book/core with a make script in ${coreRoot}`);
  }
  // The root owns the archive; active-book-runtime consumes the hoisted package
  // through '*'. Installing at the root preserves this workspace arrangement.
  if (!editorPackage.dependencies?.['@active-book/core']?.startsWith('file:')) {
    throw new Error('Expected the editor root to own the @active-book/core file: dependency');
  }

  npm(['run', 'make'], coreRoot);

  const builtPackage = readPackage(coreRoot);
  const archiveName = `${builtPackage.name.replace(/^@/, '').replace('/', '-')}-${builtPackage.version}.tgz`;
  const archivePath = join(coreRoot, 'tgz', archiveName);
  if (!existsSync(archivePath) || !statSync(archivePath).isFile()) {
    throw new Error(`Core build did not produce ${archivePath}`);
  }

  // make already increments the version. Save the new archive and its integrity
  // through npm: --no-save would leave manifests pointing at the removed archive.
  npm(['install', archivePath, '--save', '--package-lock=true', '--no-audit', '--no-fund'], root);
  console.log(`Installed @active-book/core from ${archivePath}`);

  return archivePath;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    packageCore();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
