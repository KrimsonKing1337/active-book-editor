import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';

import { describe, it } from 'vitest';

import { inspectBrowserArchive } from './browser';

const makeArchive = (files: Record<string, string>): Blob => {
  const parts: Uint8Array[] = [];

  for (const [filename, text] of Object.entries(files)) {
    const content = new TextEncoder().encode(text);
    const header = new Uint8Array(512);
    const name = new TextEncoder().encode(filename);
    const octalSize = content.length.toString(8).padStart(11, '0') + '\0';

    header.set(name);
    header.set(new TextEncoder().encode(octalSize), 124);
    header[156] = 48;

    parts.push(header, content);

    const remainder = content.length % 512;

    if (remainder) {
      parts.push(new Uint8Array(512 - remainder));
    }
  }

  parts.push(new Uint8Array(1024));

  const total = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const tar = new Uint8Array(total);
  let offset = 0;

  for (const part of parts) {
    tar.set(part, offset);
    offset += part.byteLength;
  }

  return new Blob([new Uint8Array(gzipSync(tar))], { type: 'application/gzip' });
};

const packageJson = {
  name: 'active-book-custom-test',
  version: '0.0.6',
  activeBook: './active-book.json',
};

const manifest = {
  schemaVersion: 1,
  components: {
    Counter: {
      title: 'Счётчик',
      entry: './dist/index.js',
      export: 'Counter',
      styles: ['./dist/style.css'],
    },
  },
};

describe('Browser TGZ component inspection', () => {
  it('reads a ready-made JavaScript module and CSS without installing npm packages', async () => {
    const archive = makeArchive({
      'package/package.json': JSON.stringify(packageJson),
      'package/active-book.json': JSON.stringify(manifest),
      'package/dist/index.js': 'export const Counter = () => null;',
      'package/dist/style.css': '.Counter { color: red; }',
    });

    const result = await inspectBrowserArchive(archive);

    assert.equal(result.packageName, 'active-book-custom-test');
    assert.deepEqual(Object.keys(result.manifest.components), ['Counter']);
    assert.ok(result.files.has('package/dist/index.js'));
    assert.ok(result.files.has('package/dist/style.css'));
  });

  it('rejects archives missing the declared CSS asset', async () => {
    const archive = makeArchive({
      'package/package.json': JSON.stringify(packageJson),
      'package/active-book.json': JSON.stringify(manifest),
      'package/dist/index.js': 'export const Counter = () => null;',
    });

    await assert.rejects(() => inspectBrowserArchive(archive), /style\.css/);
  });
});
