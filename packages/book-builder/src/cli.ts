import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildBook } from './build';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const repoRoot = path.resolve(__dirname, '../../..');

const projectRoot = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : path.join(repoRoot, 'example-book');

const outDir = await buildBook({
  projectRoot,
  repoRoot,
});

console.log(`Active Book built to ${outDir}`);
