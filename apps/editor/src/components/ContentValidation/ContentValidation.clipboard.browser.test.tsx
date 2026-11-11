import { Editor } from '@tiptap/core';
import { EditorContent } from '@tiptap/react';
import { closeHistory } from '@tiptap/pm/history';
import { cleanup, render } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  expect,
  test,
  vi,
} from 'vitest';

import { paragraphStart, rangeDocument } from '@root/tests/fixtures/carousel-ranges';

import { editorExtensions } from '../EditorScreen/utils';

let editor: Editor;
const errors = vi.fn();

beforeEach(() => {
  editor = new Editor({
    extensions: editorExtensions,
    content: rangeDocument,
    onContentError: errors,
  });
  render(<EditorContent editor={editor} />);
  const position = paragraphStart(editor.state.doc, 'Alpha') + 6;

  editor.commands.insertContentAt(position, [
    { type: 'paragraph', content: [{ type: 'text', text: 'Extra' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Tail' }] },
  ]);
  editor.view.dispatch(closeHistory(editor.state.tr));
});

afterEach(() => {
  cleanup();
  editor.destroy();
  vi.restoreAllMocks();
  errors.mockClear();
});

const copyBlocks = () => {
  const from = paragraphStart(editor.state.doc, 'Alpha');
  const to = paragraphStart(editor.state.doc, 'Extra') + 5;

  editor.commands.setTextSelection({ from, to });
  const clip = editor.view.serializeForClipboard(editor.state.selection.content());
  const dataTransfer = new DataTransfer();

  dataTransfer.setData('text/html', clip.dom.innerHTML);
  dataTransfer.setData('text/plain', clip.text);

  return { clip, dataTransfer };
};

test('pastes multiple copied slide blocks using the real ProseMirror open-slice HTML', () => {
  const before = editor.getJSON();
  const { dataTransfer } = copyBlocks();
  const position = editor.state.doc.child(0).nodeSize;

  editor.commands.selectCarouselSlide(position, 1);
  editor.view.dom.dispatchEvent(new ClipboardEvent('paste', {
    clipboardData: dataTransfer,
    bubbles: true,
    cancelable: true,
  }));
  expect(errors).not.toHaveBeenCalled();
  expect(editor.state.doc.child(1).child(0).textContent).toBe('AlphaExtraTail');
  expect(editor.state.doc.child(1).child(1).textContent).toBe('AlphaExtraBravo');
  const changed = editor.getJSON();

  editor.commands.undo();
  expect(editor.getJSON()).toEqual(before);
  editor.commands.redo();
  expect(editor.getJSON()).toEqual(changed);
});

test('moves multiple slide blocks using the real ProseMirror drag slice and HTML', () => {
  const before = editor.getJSON();
  const { clip, dataTransfer } = copyBlocks();
  const position = paragraphStart(editor.state.doc, 'Tail') + 4;
  const bounds = editor.view.coordsAtPos(position);

  editor.view.dragging = { slice: clip.slice, move: true };
  editor.view.dom.dispatchEvent(new DragEvent('drop', {
    dataTransfer,
    clientX: bounds.left + 1,
    clientY: (bounds.top + bounds.bottom) / 2,
    bubbles: true,
    cancelable: true,
  }));
  expect(errors).not.toHaveBeenCalled();
  expect(editor.state.doc.child(1).child(0).textContent).toBe('TailAlphaExtra');
  const changed = editor.getJSON();

  editor.commands.undo();
  expect(editor.getJSON()).toEqual(before);
  editor.commands.redo();
  expect(editor.getJSON()).toEqual(changed);
});

test.each(['carousel', 'segment'])('rejects %s hidden in a forged open-slide clipboard context', (type) => {
  const before = editor.getJSON();
  const clipboardData = new DataTransfer();
  const html = '<section data-type="carouselSlide" data-pm-slice="2 2 []">'
    + `<section data-type="${type}"><section data-type="carouselSlide"><p>Forbidden</p>`
    + '</section></section></section>';

  clipboardData.setData('text/html', html);
  editor.commands.setTextSelection(1);
  editor.view.dom.dispatchEvent(new ClipboardEvent('paste', {
    clipboardData,
    bubbles: true,
    cancelable: true,
  }));
  expect(editor.getJSON()).toEqual(before);
  expect(errors).toHaveBeenCalledOnce();
});

test('does not accept open-slide clipboard metadata as document HTML in insertContentAt', () => {
  const before = editor.getJSON();
  const { clip } = copyBlocks();

  expect(editor.commands.insertContentAt(1, clip.dom.innerHTML)).toBe(false);
  expect(editor.getJSON()).toEqual(before);
});
