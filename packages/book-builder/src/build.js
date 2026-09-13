import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import react from '@vitejs/plugin-react';
import { build } from 'vite';

import { coreScssModulesPlugin } from './coreScssModulesPlugin.js';

const renderSource = (bookDocument) => `
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App, Counter, H1, H2, P, PageWrapper } from 'activeBook-core/components';
import 'activeBook-core/styles/styles.scss';

const bookDocument = ${JSON.stringify(bookDocument, null, 2)};
const config = { id: 'built-book', authorComments: 0, pages: 0, defaultTheme: 'light' };

function renderText(node) {
  let result = node.text ?? '';

  for (const mark of node.marks ?? []) {
    if (mark.type === 'bold') result = React.createElement('strong', null, result);
    if (mark.type === 'italic') result = React.createElement('em', null, result);
    if (mark.type === 'strike') result = React.createElement('s', null, result);
    if (mark.type === 'code') result = React.createElement('code', null, result);
  }

  return result;
}

function renderNode(node, key) {
  if (node.type === 'text') return React.createElement(React.Fragment, { key }, renderText(node));
  const children = (node.content ?? []).map((child, index) => renderNode(child, index));

  if (node.type === 'heading') {
    return node.attrs?.level === 1
      ? React.createElement(H1, { key }, children)
      : React.createElement(H2, { key }, children);
  }

  if (node.type === 'paragraph') return React.createElement(P, { key }, children);
  if (node.type === 'coreComponent' && node.attrs?.name === 'Counter') return React.createElement(Counter, { key });
  return React.createElement(React.Fragment, { key }, children);
}

function BookPage() {
  return React.createElement(
    PageWrapper,
    null,
    ...(bookDocument.content ?? []).map((node, index) => renderNode(node, index)),
  );
}

ReactDOM.createRoot(globalThis.document.getElementById('root')).render(
  React.createElement(
    App,
    { config, tableOfContents: [], rangeEffects: [] },
    React.createElement(BookPage),
  ),
);
`;

export async function buildBook({ document, repoRoot, outDir = path.join(repoRoot, 'dist-book') }) {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'active-book-'));
  const coreSourceRoot = path.resolve(repoRoot, 'node_modules/activeBook-core/lib/src');

  try {
    await fs.mkdir(path.join(tempRoot, 'src'), { recursive: true });
    await fs.writeFile(
      path.join(tempRoot, 'index.html'),
      '<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Active Book</title></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>',
    );
    await fs.writeFile(path.join(tempRoot, 'src/main.jsx'), renderSource(document));

    await build({
      root: tempRoot,
      plugins: [
        coreScssModulesPlugin({ repoRoot }),
        react(),
      ],
      resolve: {
        alias: {
          'activeBook-core': coreSourceRoot,
          react: path.resolve(repoRoot, 'node_modules/react'),
          'react-dom': path.resolve(repoRoot, 'node_modules/react-dom'),
        },
      },
      css: {
        preprocessorOptions: {
          scss: {
            loadPaths: [coreSourceRoot, path.resolve(repoRoot, 'node_modules')],
          },
        },
      },
      build: {
        outDir,
        emptyOutDir: true,
      },
    });
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }

  return outDir;
}
