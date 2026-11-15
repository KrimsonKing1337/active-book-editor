import type { JSONContent } from '@tiptap/core';

import { Editor } from '@tiptap/core';
import { NodeSelection } from '@tiptap/pm/state';
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
import { page, userEvent } from 'vitest/browser';

import { CustomComponentsContext } from '@project/libraries';

import { ContentError } from '@components/ContentError';

import { createEmptyDocument, editorExtensions } from '../utils';

let editor: Editor;
const nestedClick = vi.fn();
const TestButton = () => (
  <button type="button" onClick={nestedClick}>
    Вложенное действие
  </button>
);

const document = (): JSONContent => editor.getJSON();

const carousel: JSONContent = {
  type: 'carousel',
  content: [
    { type: 'carouselSlide', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Первый' }] }] },
    { type: 'carouselSlide', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Второй' }] }] },
  ],
};

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
    onContentError: () => {},
  });
  render(
    <CustomComponentsContext
      value={{
        components: { 'test-parts/Button': TestButton },
        definitions: [],
        visualDefinitions: [],
      }}
    >
      <ContentError editor={editor} />
      <EditorContent editor={editor} />
    </CustomComponentsContext>,
  );
});

afterEach(() => {
  cleanup();
  editor.destroy();
  vi.restoreAllMocks();
  nestedClick.mockClear();
});

test('creates two editable slides in one Editor and switches without content updates or undo entries', async () => {
  const update = vi.fn();

  editor.on('update', update);
  expect(editor.commands.insertCarousel()).toBe(true);
  expect(document().content?.[0]).toMatchObject({
    type: 'carousel',
    content: [
      { type: 'carouselSlide', content: [{ type: 'paragraph' }] },
      { type: 'carouselSlide', content: [{ type: 'paragraph' }] },
    ],
  });

  await page.getByRole('button', { name: 'Слайд 1', exact: true }).click();
  await userEvent.keyboard('Первый текст');
  await page.getByRole('button', { name: 'Слайд 2', exact: true }).click();
  await userEvent.keyboard('Второй текст');

  const content = document();

  update.mockClear();
  await page.getByRole('button', { name: 'Слайд 1', exact: true }).click();
  await expect.element(page.getByText('Первый текст', { exact: true })).toBeVisible();
  expect(document()).toEqual(content);
  expect(update).not.toHaveBeenCalled();
  expect(editor.view.dom.querySelectorAll('.tiptap')).toHaveLength(0);
  expect(editor.view.dom.querySelectorAll('[data-type="carouselSlide"]')).toHaveLength(2);
  editor.commands.undo();
  expect(document().content?.[0].content?.[1].content?.[0].content).toBeUndefined();
  editor.commands.redo();
  expect(document()).toEqual(content);
});

test('adds, reorders and deletes slides with undo/redo and protects the last slide', async () => {
  editor.commands.setContent({ type: 'doc', content: [carousel] });
  await page.getByRole('button', { name: 'Слайд 1', exact: true }).click();
  const before = document();

  await page.getByRole('button', { name: 'Переместить слайд вправо', exact: true }).click();
  expect(document().content?.[0].content?.[1].content?.[0].content?.[0].text).toBe('Первый');
  editor.commands.undo();
  expect(document()).toEqual(before);
  editor.commands.redo();
  const reordered = document();

  await page.getByRole('button', { name: 'Добавить слайд', exact: true }).click();
  expect(document().content?.[0].content).toHaveLength(3);
  const emptySlide = document();

  editor.commands.insertContent('Новый текст');
  const added = document();

  editor.commands.undo();
  expect(document()).toEqual(emptySlide);
  editor.commands.undo();
  expect(document()).toEqual(reordered);
  editor.commands.redo();
  expect(document()).toEqual(emptySlide);
  editor.commands.redo();
  expect(document()).toEqual(added);

  await page.getByRole('button', { name: 'Удалить слайд', exact: true }).click();
  expect(document().content?.[0].content).toHaveLength(2);
  editor.commands.undo();
  expect(document()).toEqual(added);
  editor.commands.redo();
  await page.getByRole('button', { name: 'Удалить слайд', exact: true }).click();
  await expect.element(page.getByRole('button', { name: 'Удалить слайд', exact: true })).toBeDisabled();
  expect(editor.commands.changeCarouselSlides(0, 'delete')).toBe(false);
  expect(document().content?.[0].content).toHaveLength(1);

  await page.getByRole('button', { name: 'Выделить карусель', exact: true }).click();
  expect(editor.state.selection).toBeInstanceOf(NodeSelection);
  await userEvent.keyboard('{Delete}');
  expect(document().content).toEqual([{ type: 'paragraph' }]);
});

test('keeps Backspace/Delete within slide boundaries and supports ordinary multi-block text paste', async () => {
  editor.commands.setContent({ type: 'doc', content: [carousel, { type: 'paragraph' }] });
  const before = document();

  for (const index of [0, 1]) {
    editor.commands.selectCarouselSlide(0, index);
    editor.commands.focus();
    await userEvent.keyboard('{Backspace}');
    expect(document()).toEqual(before);
    expect(editor.state.selection.$from.parent.type.name).toBe('paragraph');
    editor.commands.setTextSelection(editor.state.selection.$from.end());
    await userEvent.keyboard('{Delete}');
    expect(document()).toEqual(before);
  }

  editor.commands.selectCarouselSlide(0, 1);
  pasteHtml('<h2>Вставленный заголовок</h2><p><strong>Жирный</strong><br><code>code</code></p>');
  const slide = document().content?.[0].content?.[1];

  expect(slide?.content?.some((node) => node.type === 'heading')).toBe(true);
  expect(editor.getHTML()).toContain('<strong>Жирный</strong>');
  expect(editor.getHTML()).toContain('<code>code</code>');
  expect(editor.getHTML()).toContain('<br>');

  editor.commands.selectCarouselSlide(0, 1);
  editor.commands.setTextSelection({ from: editor.state.selection.from, to: editor.state.selection.from + 10 });
  const clipboardData = new DataTransfer();

  editor.view.dom.dispatchEvent(new ClipboardEvent('copy', {
    clipboardData,
    bubbles: true,
    cancelable: true,
  }));
  expect(clipboardData.getData('text/html')).toContain('h2');
  editor.commands.selectCarouselSlide(0, 0);
  pasteHtml(clipboardData.getData('text/html'));
  expect(document().content?.[0].content).toHaveLength(2);
});

test('rejects nested containers from commands and raw clipboard HTML without flattening source content', async () => {
  editor.commands.setContent({ type: 'doc', content: [carousel] });
  editor.commands.selectCarouselSlide(0, 0);
  const before = document();
  const error = vi.fn();

  editor.on('contentError', error);
  expect(editor.commands.insertContent(carousel)).toBe(false);
  expect(editor.commands.insertCarousel()).toBe(false);
  expect(editor.commands.setContent({ type: 'carouselSlide', content: [{ type: 'paragraph' }] })).toBe(false);
  expect(editor.commands.insertContentAt(3, { type: 'segment', content: [{ type: 'paragraph' }] })).toBe(false);
  for (const type of ['carousel', 'segment']) {
    const nested = {
      type: 'carousel',
      content: [{ type: 'carouselSlide', content: [{ type, content: carousel.content }] }],
    };

    expect(editor.commands.setContent({ type: 'doc', content: [nested] })).toBe(false);
    const html = `<section data-type="${type}">`
      + '<section data-type="carouselSlide"><p>Keep me</p></section></section>';

    pasteHtml(html);
    expect(document()).toEqual(before);
  }

  editor.commands.setNodeSelection(0);
  const nestedHtml = '<section data-type="carousel"><section data-type="carouselSlide">'
    + '<section data-type="carousel"><section data-type="carouselSlide"><p>Nested</p>'
    + '</section></section></section></section>';

  pasteHtml(nestedHtml);
  expect(document()).toEqual(before);
  expect(error).toHaveBeenCalled();
  await expect.element(page.getByRole('alert')).toBeVisible();

  const invalid = editor.schema.nodeFromJSON({
    type: 'doc',
    content: [{ type: 'carousel', content: [{ type: 'carouselSlide', content: [carousel] }] }],
  });

  editor.view.dispatch(editor.state.tr.replaceWith(0, editor.state.doc.content.size, invalid.content));
  expect(document()).toEqual(before);
});

test('round-trips a carousel clipboard and keeps embedded component selection inside its slide', async () => {
  editor.commands.setContent({ type: 'doc', content: [carousel] });
  editor.commands.setNodeSelection(0);
  const expected = document();
  const clipboardData = new DataTransfer();

  editor.view.dom.dispatchEvent(new ClipboardEvent('copy', {
    clipboardData,
    bubbles: true,
    cancelable: true,
  }));
  expect(clipboardData.getData('text/html')).toContain('data-type="carouselSlide"');
  editor.commands.clearContent();
  editor.view.dispatch(closeHistory(editor.state.tr));
  pasteHtml(clipboardData.getData('text/html'));
  expect(document()).toEqual(expected);
  editor.commands.undo();
  expect(document().content).toEqual([{ type: 'paragraph' }]);
  editor.commands.redo();
  expect(document()).toEqual(expected);

  editor.commands.selectCarouselSlide(0, 1);
  editor.commands.insertContent({ type: 'coreComponent', attrs: { name: 'Button', package: 'test-parts' } });
  await page.getByRole('button', { name: 'Вложенное действие', exact: true }).click();
  expect(nestedClick).toHaveBeenCalledOnce();
  await expect.element(page.getByRole('button', { name: 'Вложенное действие', exact: true })).toHaveFocus();
  expect(editor.state.selection).toBeInstanceOf(NodeSelection);
  expect(editor.state.selection.$from.parent.type.name).toBe('carouselSlide');
  await page.getByRole('button', { name: 'Button', exact: true }).click();
  await userEvent.keyboard('{Delete}');
  expect(document().content?.[0].content).toHaveLength(2);
});
