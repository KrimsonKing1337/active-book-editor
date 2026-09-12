import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildBook } from './build.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const sourcePath = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : path.join(repoRoot, 'example-book/book.json');

const raw = await fs.readFile(sourcePath, 'utf8');
const document = JSON.parse(raw);

const outDir = await buildBook({ document, repoRoot });
console.log(`Active Book built to ${outDir}`);
