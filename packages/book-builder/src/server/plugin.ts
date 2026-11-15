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
} from './buildSession';

type BuildPluginParams = {
  repoRoot: string;
};

type BuildRequestParams = {
  req: IncomingMessage;
  res: ServerResponse;
  repoRoot: string;
};

const sendJson = ({
  res,
  statusCode,
  payload,
}: {
  res: ServerResponse;
  statusCode: number;
  payload: unknown;
}): void => {
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json');

  const body = JSON.stringify(payload);

  res.end(body);
};

const sendError = ({
  res,
  statusCode,
  message,
}: {
  res: ServerResponse;
  statusCode: number;
  message: string;
}): void => {
  sendJson({
    res,
    statusCode,
    payload: {
      ok: false,
      error: message,
    },
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

  const targetPath = getBuildSessionFilePath({
    repoRoot,
    sessionId,
    relativePath: filePath,
  });

  await fsPromises.mkdir(path.dirname(targetPath), {
    recursive: true,
  });

  const writeStream = fs.createWriteStream(targetPath);

  await pipeline(req, writeStream);
};

const handleSessionRequest = async ({
  req,
  res,
  repoRoot,
}: BuildRequestParams): Promise<void> => {
  if (req.method === 'POST') {
    const sessionId = await createBuildSession(repoRoot);

    sendJson({
      res,
      statusCode: 200,
      payload: {
        ok: true,
        sessionId,
      },
    });

    return;
  }

  if (req.method === 'DELETE') {
    const sessionId = getQuery(req).get('sessionId');

    if (!sessionId) {
      sendError({
        res,
        statusCode: 400,
        message: 'Missing sessionId',
      });

      return;
    }

    await removeBuildSession(repoRoot, sessionId);
    sendJson({
      res,
      statusCode: 200,
      payload: { ok: true },
    });

    return;
  }

  sendError({
    res,
    statusCode: 405,
    message: 'Method Not Allowed',
  });
};

const handleFileRequest = async ({
  req,
  res,
  repoRoot,
}: BuildRequestParams): Promise<void> => {
  if (req.method !== 'PUT') {
    sendError({
      res,
      statusCode: 405,
      message: 'Method Not Allowed',
    });

    return;
  }

  await uploadProjectFile(req, repoRoot);

  sendJson({
    res,
    statusCode: 200,
    payload: { ok: true },
  });
};

const handleCompleteRequest = async ({
  req,
  res,
  repoRoot,
}: BuildRequestParams): Promise<void> => {
  if (req.method !== 'POST') {
    sendError({
      res,
      statusCode: 405,
      message: 'Method Not Allowed',
    });

    return;
  }

  const sessionId = getQuery(req).get('sessionId');

  if (!sessionId) {
    sendError({
      res,
      statusCode: 400,
      message: 'Missing sessionId',
    });

    return;
  }

  let outDir: string;

  try {
    outDir = await completeBuildSession(repoRoot, sessionId);
  } finally {
    await removeBuildSession(repoRoot, sessionId);
  }

  sendJson({
    res,
    statusCode: 200,
    payload: {
      ok: true,
      outDir,
    },
  });
};

const withErrorHandling = (
  handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>,
) => {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error('[book-builder]', error);

      const message = error instanceof Error
        ? error.stack ?? error.message
        : String(error);

      sendError({
        res,
        statusCode: 500,
        message,
      });
    }
  };
};

export function bookBuildPlugin({ repoRoot }: BuildPluginParams): Plugin {
  return {
    name: 'active-book-build-endpoint',

    configureServer(server) {
      server.middlewares.use(
        '/__active-book/build/session',
        withErrorHandling((req, res) => {
          return handleSessionRequest({
            req,
            res,
            repoRoot,
          });
        }),
      );

      server.middlewares.use(
        '/__active-book/build/file',
        withErrorHandling((req, res) => {
          return handleFileRequest({
            req,
            res,
            repoRoot,
          });
        }),
      );

      server.middlewares.use(
        '/__active-book/build/complete',
        withErrorHandling((req, res) => {
          return handleCompleteRequest({
            req,
            res,
            repoRoot,
          });
        }),
      );
    },
  };
}
