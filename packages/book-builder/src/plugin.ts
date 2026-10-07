import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { pipeline } from 'node:stream/promises';

import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

import { buildBook } from './build.js';

type ActiveBookBuildPluginParams = {
  repoRoot: string;
};

const BUILD_ROOT_NAME = '.active-book-build';

const sendJson = (
  res: ServerResponse,
  statusCode: number,
  payload: unknown,
): void => {
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json');

  const body = JSON.stringify(payload);

  res.end(body);
};

const sendError = (
  res: ServerResponse,
  statusCode: number,
  message: string,
): void => {
  sendJson(res, statusCode, {
    ok: false,
    error: message,
  });
};

const getQuery = (req: IncomingMessage): URLSearchParams => {
  const url = new URL(req.url ?? '/', 'http://localhost');

  return url.searchParams;
};

const getSessionRoot = (
  repoRoot: string,
  sessionId: string,
): string => {
  const isValidSessionId = /^[0-9a-f-]{36}$/i.test(sessionId);

  if (!isValidSessionId) {
    throw new Error('Invalid build session');
  }

  return path.join(repoRoot, BUILD_ROOT_NAME, sessionId);
};

const getProjectFilePath = (
  sessionRoot: string,
  relativePath: string,
): string => {
  const normalizedPath = relativePath.replaceAll('\\', '/');
  const safePath = path.posix.normalize(normalizedPath);

  const isBookJson = safePath === 'book.json';
  const isAsset = safePath.startsWith('assets/');

  if (!isBookJson && !isAsset) {
    throw new Error('Invalid project file path');
  }

  if (safePath.startsWith('../') || path.posix.isAbsolute(safePath)) {
    throw new Error('Invalid project file path');
  }

  return path.join(sessionRoot, ...safePath.split('/'));
};

const createBuildSession = async (
  repoRoot: string,
): Promise<string> => {
  const sessionId = randomUUID();
  const sessionRoot = getSessionRoot(repoRoot, sessionId);

  await fsPromises.mkdir(sessionRoot, { recursive: true });

  return sessionId;
};

const removeBuildSession = async (
  repoRoot: string,
  sessionId: string,
): Promise<void> => {
  const sessionRoot = getSessionRoot(repoRoot, sessionId);

  await fsPromises.rm(sessionRoot, {
    recursive: true,
    force: true,
  });
};

const uploadProjectFile = async (
  req: IncomingMessage,
  repoRoot: string,
): Promise<void> => {
  const query = getQuery(req);
  const sessionId = query.get('sessionId');
  const filePath = query.get('path');

  if (!sessionId || !filePath) {
    throw new Error('Missing build file parameters');
  }

  const sessionRoot = getSessionRoot(repoRoot, sessionId);
  const targetPath = getProjectFilePath(sessionRoot, filePath);

  await fsPromises.mkdir(path.dirname(targetPath), {
    recursive: true,
  });

  const writeStream = fs.createWriteStream(targetPath);

  await pipeline(req, writeStream);
};

const completeBuildSession = async (
  repoRoot: string,
  sessionId: string,
): Promise<string> => {
  const sessionRoot = getSessionRoot(repoRoot, sessionId);
  const bookJsonPath = path.join(sessionRoot, 'book.json');

  await fsPromises.access(bookJsonPath);

  return buildBook({
    projectRoot: sessionRoot,
    repoRoot,
  });
};

const handleSessionRequest = async (
  req: IncomingMessage,
  res: ServerResponse,
  repoRoot: string,
): Promise<void> => {
  if (req.method === 'POST') {
    const sessionId = await createBuildSession(repoRoot);

    sendJson(res, 200, {
      ok: true,
      sessionId,
    });

    return;
  }

  if (req.method === 'DELETE') {
    const sessionId = getQuery(req).get('sessionId');

    if (!sessionId) {
      sendError(res, 400, 'Missing sessionId');

      return;
    }

    await removeBuildSession(repoRoot, sessionId);
    sendJson(res, 200, { ok: true });

    return;
  }

  sendError(res, 405, 'Method Not Allowed');
};

const handleFileRequest = async (
  req: IncomingMessage,
  res: ServerResponse,
  repoRoot: string,
): Promise<void> => {
  if (req.method !== 'PUT') {
    sendError(res, 405, 'Method Not Allowed');

    return;
  }

  await uploadProjectFile(req, repoRoot);
  sendJson(res, 200, { ok: true });
};

const handleCompleteRequest = async (
  req: IncomingMessage,
  res: ServerResponse,
  repoRoot: string,
): Promise<void> => {
  if (req.method !== 'POST') {
    sendError(res, 405, 'Method Not Allowed');

    return;
  }

  const sessionId = getQuery(req).get('sessionId');

  if (!sessionId) {
    sendError(res, 400, 'Missing sessionId');

    return;
  }

  try {
    const outDir = await completeBuildSession(repoRoot, sessionId);

    sendJson(res, 200, {
      ok: true,
      outDir,
    });
  } finally {
    await removeBuildSession(repoRoot, sessionId);
  }
};

const withErrorHandling = (
  handler: (
    req: IncomingMessage,
    res: ServerResponse,
  ) => Promise<void>,
) => {
  return async (
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error('[book-builder]', error);

      const message = error instanceof Error
        ? error.stack ?? error.message
        : String(error);

      sendError(res, 500, message);
    }
  };
};

export function activeBookBuildPlugin({
  repoRoot,
}: ActiveBookBuildPluginParams): Plugin {
  return {
    name: 'active-book-build-endpoint',

    configureServer(server) {
      server.middlewares.use(
        '/__active-book/build/session',
        withErrorHandling((req, res) => {
          return handleSessionRequest(req, res, repoRoot);
        }),
      );

      server.middlewares.use(
        '/__active-book/build/file',
        withErrorHandling((req, res) => {
          return handleFileRequest(req, res, repoRoot);
        }),
      );

      server.middlewares.use(
        '/__active-book/build/complete',
        withErrorHandling((req, res) => {
          return handleCompleteRequest(req, res, repoRoot);
        }),
      );
    },
  };
}
