import { Editor } from '@tiptap/core';
import { EditorContent } from '@tiptap/react';
import { closeHistory } from '@tiptap/pm/history';
import { Transform } from '@tiptap/pm/transform';
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
  carouselJson,
  crossSlideRanges,
  paragraphStart,
  rangeDocument,
} from '@root/tests/fixtures/carousel-ranges';

import { editorExtensions } from '../../EditorScreen/utils';

let editor: Editor;
const errors = vi.fn();

const paste = (input: { html?: string; text?: string }): boolean => {
  const clipboardData = new DataTransfer();

  clipboardData.setData('text/html', input.html ?? '');
  clipboardData.setData('text/plain', input.text ?? '');

  return editor.view.dom.dispatchEvent(new ClipboardEvent('paste', {
    clipboardData,
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

const inputs = [
  { name: 'text', content: 'Replacement' },
  { name: 'blocks', content: '<h2>Replacement</h2><p>Body</p>' },
  { name: 'HTML carousel', content: carouselHtml },
  { name: 'JSON carousel', content: carouselJson },
  { name: 'JSON segment', content: { type: 'segment', content: [{ type: 'paragraph' }] } },
];

for (const rangeIndex of [0, 1, 2]) {
  test.each(inputs)(`rejects $name for cross-boundary command range ${rangeIndex}`, ({ content }) => {
    const initial = editor.getJSON();
    const after = paragraphStart(editor.state.doc, 'After');

    editor.commands.insertContentAt(after + 5, '!');
    editor.view.dispatch(closeHistory(editor.state.tr));
    const before = editor.getJSON();
    const range = crossSlideRanges(editor.state.doc)[rangeIndex];
    const replace = vi.spyOn(Transform.prototype, 'replace');
    const replaceRange = vi.spyOn(Transform.prototype, 'replaceRange');

    expect(editor.commands.insertContentAt(range, content)).toBe(false);
    expect(replace).not.toHaveBeenCalled();
    expect(replaceRange).not.toHaveBeenCalled();
    expect(editor.getJSON()).toEqual(before);
    expect(errors).toHaveBeenCalledOnce();
    expect(errors.mock.calls[0][0].error.message).toContain('границ');
    expect(editor.commands.undo()).toBe(true);
    expect(editor.getJSON()).toEqual(initial);
    expect(editor.commands.redo()).toBe(true);
    expect(editor.getJSON()).toEqual(before);
  });

  test.each([
    { name: 'plain text', text: 'Replacement' },
    { name: 'multiple blocks', html: '<h2>Replacement</h2><p>Body</p>' },
    { name: 'carousel', html: carouselHtml },
    { name: 'segment', html: '<section data-type="segment"><p>Segment</p></section>' },
  ])(`rejects $name paste for cross-boundary range ${rangeIndex}`, (input) => {
    const before = editor.getJSON();
    const range = crossSlideRanges(editor.state.doc)[rangeIndex];

    editor.commands.setTextSelection(range);
    const replace = vi.spyOn(Transform.prototype, 'replace');
    const replaceRange = vi.spyOn(Transform.prototype, 'replaceRange');

    expect(paste(input)).toBe(false);
    expect(replace).not.toHaveBeenCalled();
    expect(replaceRange).not.toHaveBeenCalled();
    expect(editor.getJSON()).toEqual(before);
    expect(errors).toHaveBeenCalledOnce();
    expect(errors.mock.calls[0][0].error.message).toContain('границ');
    expect(editor.commands.undo()).toBe(false);
    expect(editor.commands.redo()).toBe(false);
  });
}

test('allows partial text replacement within one slide with undo/redo and preserved siblings', () => {
  const initial = editor.getJSON();
  const from = paragraphStart(editor.state.doc, 'Alpha') + 1;

  expect(editor.commands.insertContentAt({ from, to: from + 3 }, 'X')).toBe(true);
  expect(editor.state.doc.child(1).child(0).textContent).toBe('AXa');
  expect(editor.state.doc.child(1).child(1).textContent).toBe('Bravo');
  const changed = editor.getJSON();

  expect(editor.commands.undo()).toBe(true);
  expect(editor.getJSON()).toEqual(initial);
  expect(editor.commands.redo()).toBe(true);
  expect(editor.getJSON()).toEqual(changed);
  expect(errors).not.toHaveBeenCalled();
});

test('pastes multiple blocks over one complete slide paragraph without losing their types or marks', () => {
  const before = editor.getJSON();
  const from = paragraphStart(editor.state.doc, 'Alpha') - 1;

  editor.commands.setNodeSelection(from);
  paste({ html: '<h2>Replacement</h2><p><strong>Body</strong></p>' });
  expect(editor.state.doc.child(1).child(0).child(0).type.name).toBe('heading');
  expect(editor.state.doc.child(1).child(0).child(1).type.name).toBe('paragraph');
  expect(editor.getHTML()).toContain('<strong>Body</strong>');
  expect(editor.state.doc.child(1).child(1).textContent).toBe('Bravo');
  const changed = editor.getJSON();

  expect(editor.commands.undo()).toBe(true);
  expect(editor.getJSON()).toEqual(before);
  expect(editor.commands.redo()).toBe(true);
  expect(editor.getJSON()).toEqual(changed);
  expect(errors).not.toHaveBeenCalled();
});

test('rejects programmatic pasteHTML across slide boundaries before fitting', () => {
  const before = editor.getJSON();

  editor.commands.setTextSelection(crossSlideRanges(editor.state.doc)[0]);
  const replaceRange = vi.spyOn(Transform.prototype, 'replaceRange');

  editor.view.pasteHTML('<h2>Replacement</h2><p>Body</p>');
  expect(replaceRange).not.toHaveBeenCalled();
  expect(editor.getJSON()).toEqual(before);
  expect(errors).toHaveBeenCalledOnce();
});

test('pastes a whole carousel over a selected whole carousel at the root and undoes it', () => {
  const before = editor.getJSON();
  const position = editor.state.doc.child(0).nodeSize;

  editor.commands.setNodeSelection(position);
  paste({ html: carouselHtml });
  expect(editor.state.doc.child(1).textContent).toBe('New carousel');
  expect(editor.state.doc.childCount).toBe(3);
  const changed = editor.getJSON();

  expect(editor.commands.undo()).toBe(true);
  expect(editor.getJSON()).toEqual(before);
  expect(editor.commands.redo()).toBe(true);
  expect(editor.getJSON()).toEqual(changed);
  expect(errors).not.toHaveBeenCalled();
});

test.each(inputs.slice(0, 4))('allows $name to replace a complete carousel at the root', ({ content }) => {
  const initial = editor.getJSON();
  const from = editor.state.doc.child(0).nodeSize;
  const to = from + editor.state.doc.child(1).nodeSize;

  expect(editor.commands.insertContentAt({ from, to }, content)).toBe(true);
  expect(editor.state.doc.firstChild?.textContent).toBe('Before');
  expect(editor.state.doc.lastChild?.textContent).toBe('After');
  const changed = editor.getJSON();

  expect(editor.commands.undo()).toBe(true);
  expect(editor.getJSON()).toEqual(initial);
  expect(editor.commands.redo()).toBe(true);
  expect(editor.getJSON()).toEqual(changed);
  expect(errors).not.toHaveBeenCalled();
});

test('rejects insertion between slides and an explicit range unrelated to the current selection', () => {
  const before = editor.getJSON();
  const carouselPosition = editor.state.doc.child(0).nodeSize;

  editor.commands.setTextSelection(1);
  expect(editor.commands.insertContentAt(carouselPosition + 1, 'Outside slide')).toBe(false);
  const range = crossSlideRanges(editor.state.doc)[0];

  expect(editor.commands.insertContentAt(range, 'Cross boundary')).toBe(false);
  expect(editor.getJSON()).toEqual(before);
  expect(errors).toHaveBeenCalledTimes(2);
});
