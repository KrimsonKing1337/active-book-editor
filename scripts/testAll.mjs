import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const npmCli = process.env.npm_execpath;

// Browser/runtime workflows can share build artifacts; run those suites in separate batches.
const batches = [
  ['test:unit', 'test:component'],
  ['test:browser', 'test:scripts'],
  ['test:runtime'],
  ['test:media:runtime'],
  ['test:media:workflow'],
  ['test:tgz:workflow'],
];

const runTest = (name) => {
  const startedAt = performance.now();

  console.log(`[test:all] Starting ${name}`);

  return new Promise((resolve) => {
    const child = spawn(process.execPath, [npmCli, 'run', name], {
      cwd: repoRoot,
      stdio: 'inherit',
    });

    let launchError = null;

    child.on('error', (error) => {
      launchError = error;
    });

    child.on('close', (code, signal) => {
      const durationSeconds = (performance.now() - startedAt) / 1000;

      resolve({
        name,
        passed: code === 0 && launchError === null,
        code,
        signal,
        launchError,
        durationSeconds,
      });
    });
  });
};

if (!npmCli) {
  throw new Error('Run this script using npm run test:all');
}

const startedAt = performance.now();
const results = [];

for (const [index, batch] of batches.entries()) {
  console.log(`\n[test:all] Batch ${index + 1}/${batches.length}: ${batch.join(', ')}\n`);

  const batchResults = await Promise.all(batch.map(runTest));

  results.push(...batchResults);
}

console.log('\n=== Test summary ===');

for (const result of results) {
  const status = result.passed ? 'PASS' : 'FAIL';
  let details = '';

  if (result.launchError) {
    details = ` (${result.launchError.message})`;
  } else if (!result.passed) {
    details = ` (exit: ${result.code ?? result.signal})`;
  }

  console.log(`${status}  ${result.name.padEnd(22)} ${result.durationSeconds.toFixed(1)}s${details}`);
}

const failures = results.filter((result) => !result.passed);
const durationSeconds = (performance.now() - startedAt) / 1000;

console.log(`\n${results.length - failures.length}/${results.length} suites passed in ${durationSeconds.toFixed(1)}s`);

if (failures.length > 0) {
  process.exitCode = 1;
}
