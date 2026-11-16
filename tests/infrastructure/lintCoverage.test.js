import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';

const root = new URL('../../', import.meta.url);
const eslint = new ESLint({ cwd: fileURLToPath(root) });
const { scripts } = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));

test('standard lint commands cover JS and TS once, including tools, configs and tests', async () => {
  assert.equal(scripts['lint:js:check'], 'eslint "**/*.{js,jsx,mjs,cjs}"');
  assert.equal(scripts['lint:ts:check'], 'eslint "**/*.{ts,tsx,mts,cts}"');
  assert.equal(scripts['lint:css:check'], 'stylelint "{apps,packages,tests}/**/*.scss"');

  const paths = [
    'scripts/packageCore.mjs',
    'scripts/testAll.mjs',
    'eslint.config.js',
    '.stylelintrc.js',
    'vitest.config.ts',
    'apps/editor/vite.config.ts',
    'apps/editor/src/components/EditorScreen/EditorScreen.tsx',
    'packages/book-builder/src/build/build.ts',
    'tests/book-runtime/bookRuntime.browser.test.ts',
    'tests/fixtures/multipage-book/library/package/index.js',
    'tests/package-core/packageCore.test.mjs',
    'tests/eslint/eslint.test.js',
  ];
  const results = await eslint.lintFiles(paths);

  assert.equal(results.length, paths.length);

  for (const resultCur of results) {
    assert.equal(resultCur.fatalErrorCount, 0, JSON.stringify(resultCur.messages));
    assert(!resultCur.messages.some((message) => /ignored/.test(message.message)));
  }
});

test('new JS, MJS and CJS tools are checked without a TypeScript project', async () => {
  for (const extensionCur of [
    'js',
    'mjs',
    'cjs',
  ]) {
    const filePath = `scripts/new-tool.${extensionCur}`;
    const config = await eslint.calculateConfigForFile(filePath);
    const [result] = await eslint.lintText('process.stdout.write(missingToolValue);\n', { filePath });

    assert.equal(config.languageOptions.parserOptions.project, null);
    assert.equal(result.fatalErrorCount, 0);
    assert(result.messages.some((message) => message.ruleId === 'no-undef'));
    assert(!result.messages.some((message) => message.message.includes('\'process\'')));
  }
});

test('browser code, imported Vitest APIs and Node tooling have distinct globals', async () => {
  const browser = await eslint.calculateConfigForFile('apps/editor/src/main.tsx');
  const custom = await eslint.calculateConfigForFile('packages/book-builder/src/components/custom/browser.ts');
  const fixture = await eslint.calculateConfigForFile('tests/fixtures/multipage-book/library/package/index.js');
  const tool = await eslint.calculateConfigForFile('scripts/packageCore.mjs');
  const harness = await eslint.calculateConfigForFile('tests/media/mediaBrowserFixture.ts');

  for (const configCur of [
    browser,
    custom,
    fixture,
  ]) {
    assert.equal(configCur.languageOptions.globals.process, undefined);
    assert.equal(configCur.languageOptions.globals.expect, undefined);
    assert.notEqual(configCur.languageOptions.globals.window, undefined);
  }

  assert.equal(tool.languageOptions.globals.window, undefined);
  assert.notEqual(tool.languageOptions.globals.process, undefined);
  assert.notEqual(harness.languageOptions.globals.process, undefined);
  assert.notEqual(harness.languageOptions.globals.window, undefined);
});

test('dependencies and generated workspaces stay outside lint coverage', async () => {
  for (const pathCur of [
    'node_modules/example/index.js',
    'apps/editor/node_modules/example/index.js',
    'dist-book/generated.js',
    'apps/.active-book-temp/generated.ts',
    '.active-book-build/generated.js',
    'coverage/report.js',
  ]) {
    assert.equal(await eslint.isPathIgnored(pathCur), true, pathCur);
  }
});
