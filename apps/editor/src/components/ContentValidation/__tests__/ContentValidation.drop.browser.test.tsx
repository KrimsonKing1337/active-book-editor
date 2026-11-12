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

import {
  carouselHtml,
  crossSlideRanges,
  paragraphStart,
  rangeDocument,
} from '@root/tests/fixtures/carousel-ranges';

import { editorExtensions } from '../../EditorScreen/utils';

let editor: Editor;
const errors = vi.fn();

const drop = (position: number, html: string) => {
  const bounds = editor.view.coordsAtPos(position);
  const dataTransfer = new DataTransfer();

  dataTransfer.setData('text/html', html);
  dataTransfer.setData('text/plain', 'Dropped text');
  editor.view.dom.dispatchEvent(new DragEvent('drop', {
    dataTransfer,
    clientX: bounds.left + 1,
    clientY: (bounds.top + bounds.bottom) / 2,
    bubbles: true,
    cancelable: true,
  }));
};

beforeEach(() => {
  editor = new Editor({
    extensions: editorExtensions,
    content: rangeDocument,
    onContentError: errors,
  });
  render(<EditorContent editor={editor} />);
});

afterEach(() => {
  cleanup();
  editor.destroy();
  vi.restoreAllMocks();
  errors.mockClear();
});

test.each([0, 1, 2])('rejects an internal move deleting cross-boundary source range %i', (index) => {
  const before = editor.getJSON();
  const range = crossSlideRanges(editor.state.doc)[index];

  editor.commands.setTextSelection(range);
  editor.view.dragging = { slice: editor.state.selection.content(), move: true };
  drop(paragraphStart(editor.state.doc, 'After') + 1, '<p>Moved</p>');
  expect(editor.getJSON()).toEqual(before);
  expect(errors).toHaveBeenCalledOnce();
  expect(errors.mock.calls[0][0].error.message).toContain('границ');
  expect(editor.commands.undo()).toBe(false);
  expect(editor.commands.redo()).toBe(false);
});

test.each([
  { name: 'carousel', html: carouselHtml },
  { name: 'segment', html: '<section data-type="segment"><p>Segment</p></section>' },
])('rejects an external $name drop inside a slide without lifting it', ({ html }) => {
  const before = editor.getJSON();

  editor.commands.setTextSelection(1);
  drop(paragraphStart(editor.state.doc, 'Alpha') + 1, html);
  expect(editor.getJSON()).toEqual(before);
  expect(errors).toHaveBeenCalledOnce();
  expect(editor.commands.undo()).toBe(false);
});

test('rejects a drop between slides before dropPoint can find a different insertion parent', () => {
  const before = editor.getJSON();
  const position = editor.state.doc.child(0).nodeSize + 1;

  vi.spyOn(editor.view, 'posAtCoords').mockReturnValue({ pos: position, inside: position - 1 });
  drop(1, '<p>Moved</p>');
  expect(editor.getJSON()).toEqual(before);
  expect(errors).toHaveBeenCalledOnce();
});

test('allows external multi-block drops at the pointer despite a cross-boundary selection', () => {
  const before = editor.getJSON();

  editor.commands.setTextSelection(crossSlideRanges(editor.state.doc)[0]);
  drop(paragraphStart(editor.state.doc, 'Alpha') + 1, '<p>Dropped first</p><p><strong>Body</strong></p>');
  expect(editor.state.doc.child(1).child(0).child(0).textContent).toBe('ADropped first');
  expect(editor.state.doc.child(1).child(0).child(1).textContent).toBe('Bodylpha');
  expect(editor.getHTML()).toContain('<strong>Body</strong>');
  expect(editor.state.doc.child(1).child(1).textContent).toBe('Bravo');
  expect(editor.state.doc.firstChild?.textContent).toBe('Before');
  expect(editor.state.doc.lastChild?.textContent).toBe('After');
  const changed = editor.getJSON();

  expect(editor.commands.undo()).toBe(true);
  expect(editor.getJSON()).toEqual(before);
  expect(editor.commands.redo()).toBe(true);
  expect(editor.getJSON()).toEqual(changed);
  expect(errors).not.toHaveBeenCalled();
});

test('moves text within a slide and preserves the source through undo/redo', () => {
  const before = editor.getJSON();
  const alpha = paragraphStart(editor.state.doc, 'Alpha');

  editor.commands.setTextSelection({ from: alpha, to: alpha + 2 });
  editor.view.dragging = { slice: editor.state.selection.content(), move: true };
  drop(alpha + 5, '');
  expect(editor.state.doc.child(1).child(0).textContent).toBe('phaAl');
  const changed = editor.getJSON();

  expect(editor.commands.undo()).toBe(true);
  expect(editor.getJSON()).toEqual(before);
  expect(editor.commands.redo()).toBe(true);
  expect(editor.getJSON()).toEqual(changed);
  expect(errors).not.toHaveBeenCalled();
});

test('inserts external plain text at the drop pointer without deleting the selected cross-boundary range', () => {
  const before = editor.getJSON();

  editor.commands.setTextSelection(crossSlideRanges(editor.state.doc)[1]);
  drop(paragraphStart(editor.state.doc, 'Bravo') + 1, '');
  expect(editor.state.doc.child(1).child(1).textContent).toBe('BDropped textravo');
  expect(editor.state.doc.child(1).child(0).textContent).toBe('Alpha');
  expect(editor.state.doc.lastChild?.textContent).toBe('After');
  expect(editor.commands.undo()).toBe(true);
  expect(editor.getJSON()).toEqual(before);
  expect(editor.commands.redo()).toBe(true);
  expect(errors).not.toHaveBeenCalled();
});

test('keeps a dragged whole carousel closed and rejects moving it inside its slide', () => {
  const before = editor.getJSON();
  const position = editor.state.doc.child(0).nodeSize;

  editor.commands.setNodeSelection(position);
  editor.view.dragging = { slice: editor.state.selection.content(), move: true };
  drop(paragraphStart(editor.state.doc, 'Alpha') + 1, '');
  expect(editor.getJSON()).toEqual(before);
  expect(errors).toHaveBeenCalledOnce();
  expect(editor.commands.undo()).toBe(false);
});

test('drops a carousel at the root without replacing an unrelated cross-boundary selection', () => {
  const before = editor.getJSON();
  const position = editor.state.doc.child(0).nodeSize;

  editor.commands.setTextSelection(crossSlideRanges(editor.state.doc)[0]);
  vi.spyOn(editor.view, 'posAtCoords').mockReturnValue({ pos: position, inside: -1 });
  drop(1, carouselHtml);
  expect(editor.state.doc.childCount).toBe(4);
  expect(editor.state.doc.child(1).textContent).toBe('New carousel');
  expect(editor.state.doc.child(2).textContent).toBe('AlphaBravo');
  const changed = editor.getJSON();

  expect(editor.commands.undo()).toBe(true);
  expect(editor.getJSON()).toEqual(before);
  expect(editor.commands.redo()).toBe(true);
  expect(editor.getJSON()).toEqual(changed);
  expect(errors).not.toHaveBeenCalled();
});
