import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const editorRoot = fileURLToPath(new URL('../', import.meta.url));
const coreRoot = resolve(editorRoot, '../active-book-core');

try {
  execFileSync(process.execPath, [process.env.npm_execpath, 'run', 'make'], { cwd: coreRoot, stdio: 'inherit' });
  const { name, version } = JSON.parse(readFileSync(resolve(coreRoot, 'package.json'), 'utf8'));
  const filename = `${name.replace(/^@/, '').replace('/', '-')}-${version}.tgz`;
  const archive = resolve(coreRoot, 'tgz', filename);
  execFileSync(process.execPath, [process.env.npm_execpath, 'install', archive, '--save'], {
    cwd: editorRoot,
    stdio: 'inherit',
  });
  console.log(`Installed ${name} from ${archive}`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
