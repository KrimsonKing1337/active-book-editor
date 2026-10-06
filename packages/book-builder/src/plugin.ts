import type { Plugin } from 'vite';

import { buildBook } from './build.ts';

type ActiveBookBuildPluginParams = {
  repoRoot: string;
};

type BuildPayload = {
  document?: unknown;
};

export function activeBookBuildPlugin({
  repoRoot,
}: ActiveBookBuildPluginParams): Plugin {
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

          const payload = JSON.parse(
            Buffer.concat(chunks).toString('utf8'),
          ) as BuildPayload;

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
          res.end(JSON.stringify({ ok: true, outDir }));
        } catch (error) {
          console.error('[book-builder]', error);
          res.statusCode = 500;
          res.end(
            error instanceof Error
              ? error.stack ?? error.message
              : String(error),
          );
        }
      });
    },
  };
}
