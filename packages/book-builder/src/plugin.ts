import type { Plugin } from 'vite';

import { buildBook } from './build.js';

type ActiveBookBuildPluginParams = {
  repoRoot: string;
};

type BuildPayload = {
  document?: unknown;
};

export function activeBookBuildPlugin({ repoRoot }: ActiveBookBuildPluginParams): Plugin {
  return {
    name: 'active-book-build-endpoint',

    configureServer(server) {
      server.middlewares.use('/__active-book/build', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;

          res.end('Method Not Allowed');

          return;
        }

        try {
          const chunks: Buffer[] = [];

          for await (const chunk of req) {
            chunks.push(Buffer.from(chunk));
          }

          const chunksAsString = Buffer.concat(chunks).toString('utf8');

          const payload = JSON.parse(chunksAsString) as BuildPayload;

          if (!payload.document) {
            res.statusCode = 400;

            res.end('Missing document');

            return;
          }

          const outDir = await buildBook({
            document: payload.document,
            repoRoot,
          });

          res.setHeader('content-type', 'application/json');

          const resMessage = {
            ok: true,
            outDir,
          };

          const resMessageJson = JSON.stringify(resMessage);

          res.end(resMessageJson);
        } catch (error) {
          console.error('[book-builder]', error);

          res.statusCode = 500;

          const errorMessage = error instanceof Error
              ? error.stack ?? error.message
              : String(error);

          res.end(errorMessage);
        }
      });
    },
  };
}
