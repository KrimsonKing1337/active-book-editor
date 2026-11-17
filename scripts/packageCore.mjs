import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const editorRoot = fileURLToPath(new URL('../', import.meta.url));
const coreRoot = resolve(editorRoot, '../active-book-core');

try {
  for (const script of ['build', 'packaging']) {
    execFileSync(process.execPath, [
      process.env.npm_execpath,
      'run',
      script,
    ], {
      cwd: coreRoot,
      stdio: 'inherit',
    });
  }

  console.log('Core built and packed; the editor keeps its local directory dependency');
} catch (error) {
  console.error(error.message);

  process.exitCode = 1;
}
