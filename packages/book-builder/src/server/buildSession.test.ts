import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  afterAll,
  beforeAll,
  expect,
  test,
} from 'vitest';

import {
  createBuildSession,
  getBuildSessionFilePath,
  removeBuildSession,
} from './buildSession';
import { BUILD_ROOT_NAME } from './constants';

let repoRoot: string;
let sessionId: string;

beforeAll(async () => {
  repoRoot = await mkdtemp(path.join(tmpdir(), 'active-book-paths-'));
  sessionId = await createBuildSession(repoRoot);
});

afterAll(async () => {
  try {
    await removeBuildSession(repoRoot, sessionId);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test.each([
  'dependencies/Library.tgz',
  'dependencies/Library.TGZ',
  'dependencies/Library.TgZ',
  'dependencies\\Library.TGZ',
  'dependencies/nested/Library.TGZ',
  'book.json',
  'package.json',
  'assets/image.TGZ',
])('preserves the exact filename and existing allowed areas: %s', (relativePath) => {
  const target = getBuildSessionFilePath(repoRoot, sessionId, relativePath);
  const expected = path.join(repoRoot, BUILD_ROOT_NAME, sessionId, relativePath.replaceAll('\\', '/'));

  expect(target).toBe(expected);
});

test.each([
  'dependencies/Library.zip',
  'dependencies/Library.tar',
  'dependencies/Library.tar.gz',
  'dependencies/Library.tgz.exe',
  'dependencies/Library.tgz\n',
  '../dependencies/Library.TGZ',
  'dependencies/../Library.TGZ',
  'assets/../dependencies/Library.TGZ',
  'dependencies\\..\\Library.TGZ',
  '/dependencies/Library.TGZ',
  'C:\\dependencies\\Library.TGZ',
  '\\\\host\\dependencies\\Library.TGZ',
  'Dependencies/Library.TGZ',
  'dependencies-extra/Library.TGZ',
  'other/Library.TGZ',
  'Library.TGZ',
])('rejects unsupported extensions and forbidden paths: %s', (relativePath) => {
  expect(() => getBuildSessionFilePath(repoRoot, sessionId, relativePath)).toThrow('Invalid project file path');
});
