import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

test('real npm reinstalls a rebuilt archive without changing its version', (t) => {
  const parent = mkdtempSync(join(tmpdir(), 'active book core-'));
  t.after(() => rmSync(parent, { recursive: true, force: true }));
  const root = join(parent, 'active-book-editor');
  const core = join(parent, 'active-book-core');
  mkdirSync(root);
  mkdirSync(core);
  const corePackage = { name: '@active-book/core', version: '1.0.0' };
  writeFileSync(join(root, 'package.json'), JSON.stringify({
    name: 'editor-root',
    private: true,
    workspaces: ['apps/*'],
    dependencies: { '@active-book/core': 'file:../active-book-core/tgz/active-book-core-1.0.0.tgz' },
  }));
  const npmCli = process.env.npm_execpath;
  assert.ok(npmCli, 'Run through npm run test:scripts');
  mkdirSync(join(root, 'scripts'));
  writeFileSync(
    join(root, 'scripts/packageCore.mjs'),
    readFileSync(fileURLToPath(new URL('../../scripts/packageCore.mjs', import.meta.url))),
  );
  const editorPackage = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  editorPackage.scripts = { 'core:package': 'node scripts/packageCore.mjs' };
  writeFileSync(join(root, 'package.json'), JSON.stringify(editorPackage));
  mkdirSync(join(root, 'apps/runtime'), { recursive: true });
  writeFileSync(join(root, 'apps/runtime/package.json'), JSON.stringify({
    name: 'fixture-runtime',
    version: '1.0.0',
    dependencies: { '@active-book/core': '*' },
  }));
  corePackage.exports = { './components': './lib/components.js' };
  corePackage.files = ['lib'];
  corePackage.scripts = {
    build: 'node build.cjs',
    packaging: 'node pack.cjs',
    make: 'node -e "process.exit(99)"',
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
  const env = {
    ...process.env,
    npm_config_cache: join(root, '.npm-cache'),
    npm_config_offline: 'true',
  };
  execFileSync(process.execPath, [
    npmCli,
    'run',
    'core:package',
  ], {
    cwd: root,
    env,
    stdio: 'pipe',
  });
  const saved = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  assert.equal(saved.dependencies['@active-book/core'], 'file:../active-book-core/tgz/active-book-core-1.0.0.tgz');
  const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));
  assert.equal(lock.packages['node_modules/@active-book/core'].version, '1.0.0');
  assert.ok(lock.packages['node_modules/@active-book/core'].integrity.startsWith('sha512-'));
  assert.equal(lock.packages['apps/runtime'].dependencies['@active-book/core'], '*');
  const runtimeRequire = createRequire(join(root, 'apps/runtime/package.json'));
  assert.equal(runtimeRequire('@active-book/core/components'), 'fresh core');
  const versionBefore = readFileSync(join(core, 'package.json'), 'utf8');
  const firstIntegrity = lock.packages['node_modules/@active-book/core'].integrity;

  writeFileSync(join(core, 'value.txt'), 'rebuilt core');
  execFileSync(process.execPath, [
    npmCli,
    'run',
    'core:package',
  ], {
    cwd: root,
    env,
    stdio: 'pipe',
  });

  assert.equal(readFileSync(join(core, 'package.json'), 'utf8'), versionBefore);
  const updatedLock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));
  assert.equal(updatedLock.packages['node_modules/@active-book/core'].version, '1.0.0');
  assert.notEqual(updatedLock.packages['node_modules/@active-book/core'].integrity, firstIntegrity);
  const consumed = execFileSync(process.execPath, [
    '-e',
    'console.log(require(\'@active-book/core/components\'))',
  ], { cwd: join(root, 'apps/runtime'), encoding: 'utf8' });
  assert.equal(consumed.trim(), 'rebuilt core');
});
