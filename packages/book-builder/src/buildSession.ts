import fs from 'node:fs/promises';

import path from 'node:path';

import { randomUUID } from 'node:crypto';

import { buildBook } from './build';

const BUILD_ROOT_NAME = '.active-book-build';

const activeBuildSessions = new Set<string>();

const getSessionRoot = (
  repoRoot: string,
  sessionId: string,
): string => {
  return path.join(repoRoot, BUILD_ROOT_NAME, sessionId);
};

const getActiveSessionRoot = (
  repoRoot: string,
  sessionId: string,
): string => {
  const sessionIsActive = activeBuildSessions.has(sessionId);

  if (!sessionIsActive) {
    throw new Error('Unknown build session');
  }

  return getSessionRoot(repoRoot, sessionId);
};

export const createBuildSession = async (repoRoot: string): Promise<string> => {
  const sessionId = randomUUID();
  const sessionRoot = getSessionRoot(repoRoot, sessionId);

  await fs.mkdir(sessionRoot, { recursive: true });

  activeBuildSessions.add(sessionId);

  return sessionId;
};

export const removeBuildSession = async (
  repoRoot: string,
  sessionId: string,
): Promise<void> => {
  const sessionRoot = getActiveSessionRoot(repoRoot, sessionId);

  try {
    await fs.rm(sessionRoot, {
      recursive: true,
      force: true,
    });
  } finally {
    activeBuildSessions.delete(sessionId);
  }
};

export const getBuildSessionFilePath = (
  repoRoot: string,
  sessionId: string,
  relativePath: string,
): string => {
  const sessionRoot = getActiveSessionRoot(repoRoot, sessionId);
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
  const sessionRoot = getActiveSessionRoot(repoRoot, sessionId);
  const bookJsonPath = path.join(sessionRoot, 'book.json');

  await fs.access(bookJsonPath);

  return buildBook({
    projectRoot: sessionRoot,
    repoRoot,
  });
};
