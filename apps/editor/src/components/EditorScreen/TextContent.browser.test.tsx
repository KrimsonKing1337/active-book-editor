import { Editor } from '@tiptap/core';
import { closeHistory } from '@tiptap/pm/history';
import { EditorContent } from '@tiptap/react';

import { cleanup, render } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  expect,
  test,
  vi,
} from 'vitest';
import { page } from 'vitest/browser';

import { textHtml } from '@root/tests/fixtures/text-content';

import { createEmptyDocument, editorExtensions } from './utils';

import '@active-book/common/styles';
import '@active-book/core/styles/styles.scss';

let editor: Editor;

const pasteHtml = (html: string): void => {
  const clipboardData = new DataTransfer();

  clipboardData.setData('text/html', html);
  editor.view.dom.dispatchEvent(new ClipboardEvent('paste', {
    clipboardData,
    bubbles: true,
    cancelable: true,
  }));
};

beforeEach(() => {
  editor = new Editor({
    extensions: editorExtensions,
    content: createEmptyDocument(),
    editorProps: { attributes: { role: 'textbox', 'aria-label': 'Тестовый текст' } },
  });

  render(<EditorContent editor={editor} />);
});

afterEach(() => {
  cleanup();
  editor.destroy();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test('uses standard paragraph and heading commands with levels 1 and 2 and undo/redo', async () => {
  editor.commands.insertContent('Текст');
  editor.view.dispatch(closeHistory(editor.state.tr));
  expect(editor.getJSON().content?.[0].type).toBe('paragraph');

  editor.commands.toggleHeading({ level: 1 });
  expect(editor.getJSON().content?.[0]).toMatchObject({ type: 'heading', attrs: { level: 1 } });
  expect(editor.getHTML()).toBe('<h1>Текст</h1>');

  editor.commands.undo();
  expect(editor.getHTML()).toBe('<p>Текст</p>');
  editor.commands.redo();
  expect(editor.getHTML()).toBe('<h1>Текст</h1>');

  editor.commands.toggleHeading({ level: 2 });
  expect(editor.getHTML()).toBe('<h2>Текст</h2>');
  await expect.poll(() => {
    return editor.view.dom.querySelector('[data-active-book-node="heading 2"]')?.textContent;
  }).toBe('Текст');
  editor.commands.setParagraph();
  expect(editor.getHTML()).toBe('<p>Текст</p>');
});

test('round-trips standard HTML, all marks and hard breaks without losing block types', () => {
  pasteHtml(textHtml);

  const original = editor.getJSON();

  expect(original.content?.map((node) => node.type)).toEqual(['heading', 'heading', 'paragraph']);
  expect(original.content?.[0].attrs?.level).toBe(1);
  expect(original.content?.[1].attrs?.level).toBe(2);
  expect(original.content?.[2].content?.[0].marks?.map((mark) => mark.type))
    .toEqual(expect.arrayContaining(['bold', 'italic', 'strike', 'underline']));
  expect(editor.getHTML()).toContain('<br>');
  expect(editor.getHTML()).toContain('<code>code</code>');
  expect(editor.getHTML()).toContain('href="https://example.com/note"');

  const html = editor.getHTML();

  editor.commands.setContent(html);
  expect(editor.getJSON()).toEqual(original);
});

test('copies through the ProseMirror clipboard handler, pastes headings and marks, and undoes the paste', () => {
  editor.commands.setContent(textHtml);
  editor.commands.selectAll();

  const expected = editor.getJSON();
  const clipboardData = new DataTransfer();
  const copy = new ClipboardEvent('copy', {
    clipboardData,
    bubbles: true,
    cancelable: true,
  });

  editor.view.dom.dispatchEvent(copy);
  expect(copy.defaultPrevented).toBe(true);
  expect(clipboardData.getData('text/html')).toContain('<h1');
  expect(clipboardData.getData('text/html')).toContain('<h2');
  expect(clipboardData.getData('text/html')).toContain('href="https://example.com/note"');

  editor.commands.clearContent();
  editor.view.dispatch(closeHistory(editor.state.tr));
  editor.view.dom.dispatchEvent(new ClipboardEvent('paste', {
    clipboardData,
    bubbles: true,
    cancelable: true,
  }));

  expect(editor.getJSON()).toEqual(expected);
  editor.commands.undo();
  expect(editor.getJSON().content).toEqual([{ type: 'paragraph' }]);
  editor.commands.redo();
  expect(editor.getJSON()).toEqual(expected);
});

test('keeps standard code exclusion rules and supports formatting undo/redo', () => {
  editor.commands.setContent('<p>Текст</p>');
  editor.commands.setTextSelection({ from: 1, to: 6 });
  editor.view.dispatch(closeHistory(editor.state.tr));
  editor.commands.toggleBold();
  expect(editor.getHTML()).toBe('<p><strong>Текст</strong></p>');
  editor.commands.undo();
  expect(editor.getHTML()).toBe('<p>Текст</p>');
  editor.commands.redo();
  expect(editor.getHTML()).toBe('<p><strong>Текст</strong></p>');
  editor.commands.toggleCode();
  expect(editor.getHTML()).toBe('<p><code>Текст</code></p>');
});

test('does not navigate on a normal editor link click', async () => {
  editor.commands.setContent('<p><a href="https://example.com/">Ссылка</a></p>');

  const before = window.location.href;
  const open = vi.spyOn(window, 'open');

  await page.getByRole('link', { name: 'Ссылка', exact: true }).click();
  expect(window.location.href).toBe(before);
  expect(open).not.toHaveBeenCalled();
});
