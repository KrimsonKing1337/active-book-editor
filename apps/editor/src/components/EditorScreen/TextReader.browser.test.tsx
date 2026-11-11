import type { JSONContent } from '@tiptap/core';

import { Editor } from '@tiptap/core';
import { EditorContent } from '@tiptap/react';
import { cleanup, render } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  expect,
  test,
  vi,
} from 'vitest';

import { compileBookDocument } from '@active-book/book-builder/bookPreparation';
import { createBookRuntime } from '@active-book/book-builder/components/custom/runtime';

import { renderNode } from '@root/apps/book-runtime/src/utils/renderNode';
import { createProject } from '@root/tests/editor-effects/project';
import { textHtml } from '@root/tests/fixtures/text-content';

import { createLocalProject, openLocalProject } from '@project/projectService';
import { InvalidProjectError } from '@project/errors';

import { createEmptyDocument, editorExtensions } from './utils';

import '@active-book/common/styles';
import '@active-book/core/styles/styles.scss';

let editor: Editor;

beforeEach(() => {
  editor = new Editor({ extensions: editorExtensions, content: createEmptyDocument() });
  render(<EditorContent editor={editor} />);
});

afterEach(() => {
  cleanup();
  editor.destroy();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test('saves and reopens actual project JSON, compiles it and renders the same text in the reader', async () => {
  editor.commands.setContent(textHtml);

  const project = await createProject({ empty: true });

  try {
    const document = editor.getJSON();

    await createLocalProject({
      type: 'book',
      pages: [{ id: 'text-page', document }],
      visualEffects: [],
    });

    const opened = await openLocalProject();
    const saved = opened.document;
    const built = compileBookDocument(saved);

    expect(saved.pages[0].document).toEqual(document);
    expect(built.pages[0].document.content).toEqual(document.content);
    cleanup();

    const runtime = createBookRuntime('reader');
    const { container } = render(
      <div>
        {(built.pages[0].document.content ?? []).map((node, index) => renderNode({
          node,
          key: index,
          customComponents: {},
          bookRuntime: runtime,
          path: `pages[0].document.content[${index}]`,
        }))}
      </div>,
    );

    expect(container.textContent).toContain('Первый заголовок');
    expect(container.textContent).toContain('Второй заголовок');
    for (const tag of ['strong', 'em', 's', 'u']) {
      expect(container.querySelector(tag)?.textContent).toBe('Форматирование');
    }
    expect(container.querySelector('br')).not.toBeNull();
    expect(container.querySelector('code')?.textContent).toBe('code');

    const link = container.querySelector('a');

    expect(link).toHaveAttribute('href', 'https://example.com/note');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link?.relList.contains('nofollow')).toBe(true);
    expect(link?.relList.contains('noopener')).toBe(true);
    expect(link?.relList.contains('noreferrer')).toBe(true);
  } finally {
    await project.dispose();
  }
});

test('reader diagnoses unknown nodes and marks with their nested source paths', () => {
  const runtime = createBookRuntime('reader');
  const renderUnknown = (node: JSONContent) => renderNode({
    node,
    key: 0,
    customComponents: {},
    bookRuntime: runtime,
    path: 'pages[0].document.content[0]',
  });

  expect(() => renderUnknown({ type: 'unknown', content: [{ type: 'text', text: 'keep me' }] }))
    .toThrow('pages[0].document.content[0]: unknown node "unknown"');
  expect(() => renderUnknown({
    type: 'paragraph',
    content: [{
      type: 'text',
      text: 'keep me',
      marks: [{ type: 'unknownMark' }],
    }],
  })).toThrow('pages[0].document.content[0].content[0].marks[0]: unknown mark "unknownMark"');
});

test('rejects unknown marks when opening a project before TipTap can discard them', async () => {
  const project = await createProject({ empty: true });

  try {
    const handle = await project.directory.getFileHandle('book.json', { create: true });
    const writable = await handle.createWritable();

    await writable.write(JSON.stringify({
      type: 'book',
      visualEffects: [],
      pages: [{
        id: 'unknown-mark',
        document: {
          type: 'doc',
          content: [{
            type: 'paragraph',
            content: [{
              type: 'text',
              text: 'Keep me',
              marks: [{ type: 'missingAction' }],
            }],
          }],
        },
      }],
    }));
    await writable.close();

    await expect(openLocalProject()).rejects.toBeInstanceOf(InvalidProjectError);
    await expect(openLocalProject()).rejects.toThrow(
      'pages[0].document.content[0].content[0].marks[0]: unknown mark "missingAction"',
    );
  } finally {
    await project.dispose();
  }
});
