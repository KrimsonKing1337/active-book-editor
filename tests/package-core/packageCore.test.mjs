import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

test('packing core preserves the local directory dependency and exposes rebuilt modules', (context) => {
  const parent = mkdtempSync(join(tmpdir(), 'active book core-'));
  context.after(() => rmSync(parent, { recursive: true, force: true }));
  const root = join(parent, 'active-book-editor');
  const core = join(parent, 'active-book-core');
  mkdirSync(join(root, 'scripts'), { recursive: true });
  mkdirSync(join(root, 'apps/runtime'), { recursive: true });
  mkdirSync(core);

  const npmCli = process.env.npm_execpath;
  assert.ok(npmCli, 'Run through npm run test:scripts');
  const corePackage = {
    name: '@active-book/core',
    version: '1.0.0',
    exports: { './components': './lib/components.js' },
    files: ['lib'],
    scripts: {
      build: 'node build.cjs',
      packaging: 'node pack.cjs',
      make: 'node -e "process.exit(99)"',
    },
  };
  writeFileSync(join(core, 'package.json'), JSON.stringify(corePackage));
  writeFileSync(join(core, 'value.txt'), 'fresh core');
  writeFileSync(join(core, 'build.cjs'), `
    const fs = require('node:fs');
    fs.mkdirSync('lib', { recursive: true });
    const value = fs.readFileSync('value.txt', 'utf8');
    fs.writeFileSync('lib/components.js', 'module.exports = ' + JSON.stringify(value) + ';');
  `);
  writeFileSync(join(core, 'pack.cjs'), `
    const fs = require('node:fs');
    const { execFileSync } = require('node:child_process');
    fs.mkdirSync('tgz', { recursive: true });
    execFileSync(process.execPath, [process.env.npm_execpath, 'pack', '--pack-destination', 'tgz'], {
      stdio: 'inherit',
    });
  `);
  writeFileSync(join(root, 'package.json'), JSON.stringify({
    name: 'editor-root',
    private: true,
    workspaces: ['apps/*'],
    dependencies: { '@active-book/core': 'file:../active-book-core' },
    scripts: { 'core:package': 'node scripts/packageCore.mjs' },
  }));
  writeFileSync(join(root, 'apps/runtime/package.json'), JSON.stringify({
    name: 'fixture-runtime',
    version: '1.0.0',
    dependencies: { '@active-book/core': '*' },
  }));
  writeFileSync(
    join(root, 'scripts/packageCore.mjs'),
    readFileSync(fileURLToPath(new URL('../../scripts/packageCore.mjs', import.meta.url))),
  );

  const options = {
    cwd: root,
    env: {
      ...process.env,
      npm_config_cache: join(parent, 'cache'),
      npm_config_offline: 'true',
    },
    encoding: 'utf8',
    stdio: 'pipe',
  };
  const npm = (args) => execFileSync(process.execPath, [npmCli, ...args], options);
  npm(['install']);
  const manifest = readFileSync(join(root, 'package.json'), 'utf8');
  const lock = readFileSync(join(root, 'package-lock.json'), 'utf8');
  const version = readFileSync(join(core, 'package.json'), 'utf8');
  const linked = JSON.parse(lock).packages['node_modules/@active-book/core'];
  assert.equal(linked.link, true);
  assert.equal(realpathSync(join(root, 'node_modules/@active-book/core')), realpathSync(core));

  const consume = () => execFileSync(process.execPath, [
    '-e',
    'console.log(require(\'@active-book/core/components\'))',
  ], { cwd: join(root, 'apps/runtime'), encoding: 'utf8' }).trim();
  npm(['run', 'core:package']);
  assert.equal(consume(), 'fresh core');
  assert(existsSync(join(core, 'tgz/active-book-core-1.0.0.tgz')));

  writeFileSync(join(core, 'value.txt'), 'rebuilt core');
  npm(['run', 'core:package']);
  assert.equal(consume(), 'rebuilt core');
  assert.equal(readFileSync(join(root, 'package.json'), 'utf8'), manifest);
  assert.equal(readFileSync(join(root, 'package-lock.json'), 'utf8'), lock);
  assert.equal(readFileSync(join(core, 'package.json'), 'utf8'), version);
});
