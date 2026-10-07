import fs from 'node:fs';

import fsPromises from 'node:fs/promises';

import path from 'node:path';

import type {
  IncomingMessage,
  ServerResponse,
} from 'node:http';

import { pipeline } from 'node:stream/promises';

import type { Plugin } from 'vite';

import {
  completeBuildSession,
  createBuildSession,
  getBuildSessionFilePath,
  removeBuildSession,
} from './buildSession.js';

type ActiveBookBuildPluginParams = {
  repoRoot: string;
};

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

  const targetPath = getBuildSessionFilePath(
    repoRoot,
    sessionId,
    filePath,
  );

  await fsPromises.mkdir(path.dirname(targetPath), {
    recursive: true,
  });

  const writeStream = fs.createWriteStream(targetPath);

  await pipeline(req, writeStream);
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
