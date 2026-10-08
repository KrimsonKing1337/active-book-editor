import fs from 'node:fs/promises';

import path from 'node:path';

import { randomUUID } from 'node:crypto';

import { buildBook } from './build.js';

const BUILD_ROOT_NAME = '.active-book-build';

const BUILD_SESSION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getIsValidSessionId = (sessionId: string): boolean => {
  return BUILD_SESSION_ID_PATTERN.test(sessionId);
};

const getSessionRoot = (
  repoRoot: string,
  sessionId: string,
): string => {
  const isValidSessionId = getIsValidSessionId(sessionId);

  if (!isValidSessionId) {
    throw new Error('Invalid build session');
  }

  return path.join(repoRoot, BUILD_ROOT_NAME, sessionId);
};

export const createBuildSession = async (repoRoot: string): Promise<string> => {
  const sessionId = randomUUID();
  const sessionRoot = getSessionRoot(repoRoot, sessionId);

  await fs.mkdir(sessionRoot, { recursive: true });

  return sessionId;
};

export const removeBuildSession = async (
  repoRoot: string,
  sessionId: string,
): Promise<void> => {
  const sessionRoot = getSessionRoot(repoRoot, sessionId);

  await fs.rm(sessionRoot, {
    recursive: true,
    force: true,
  });
};

export const getBuildSessionFilePath = (
  repoRoot: string,
  sessionId: string,
  relativePath: string,
): string => {
  const sessionRoot = getSessionRoot(repoRoot, sessionId);
  const normalizedPath = relativePath.replaceAll('\\', '/');
  const safePath = path.posix.normalize(normalizedPath);

  const isBookJson = safePath === 'book.json';

  const isAsset = safePath.startsWith('assets/');

  const isOutsideProject = safePath.startsWith('../') || path.posix.isAbsolute(safePath);

  if (isOutsideProject || (!isBookJson && !isAsset)) {
    throw new Error('Invalid project file path');
  }

  return path.join(sessionRoot, ...safePath.split('/'));
};

export const completeBuildSession = async (
  repoRoot: string,
  sessionId: string,
): Promise<string> => {
  const sessionRoot = getSessionRoot(repoRoot, sessionId);
  const bookJsonPath = path.join(sessionRoot, 'book.json');

  await fs.access(bookJsonPath);

  return buildBook({
    projectRoot: sessionRoot,
    repoRoot,
  });
};
