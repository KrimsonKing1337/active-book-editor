import { expect, test } from 'vitest';

import { draftToVisual } from '../visualEffects';
import { compileBookDocument } from '../bookPreparation';

import { isBookDocument } from './index';

const page = (id: string, text: string) => ({
  id,
  document: { type: 'doc', content: [{ type: 'P', content: [{ type: 'text', text }] }] },
});
const rangeVisual = () => ({
  ...draftToVisual({
    pageId: 'one',
    draft: { id: 'positional', type: 'background', kind: 'background', slug: 'Range', options: {} },
  }),
  lifetime: { type: 'range', range: [{ from: 3, to: 5 }] },
});

test('requires nonempty pages, unique IDs and a single canonical visual format', () => {
  const book = { type: 'book', pages: [page('one', 'A')], visualEffects: [] };
  expect(isBookDocument(book)).toBe(true);
  expect(isBookDocument({ ...book, pages: [] })).toBe(false);
  expect(isBookDocument({ ...book, pages: [page('one', 'A'), page('one', 'B')] })).toBe(false);
  expect(isBookDocument({ ...book, rangeEffects: [] })).toBe(false);
  const duplicateModel = {
    ...page('one', 'A'),
    document: {
      type: 'doc',
      content: [],
      attrs: { pageEffects: { frame: [] } },
    },
  };
  expect(isBookDocument({ ...book, pages: [duplicateModel] })).toBe(false);
  expect(isBookDocument({ type: 'doc', content: [] })).toBe(false);
});

test('compiles ordered pages, preserves IDs and positional ranges, and strips editor metadata', () => {
  const first = page('persistent-first', 'Первая');
  const second = page('persistent-second', 'Вторая');
  const third = page('persistent-third', 'Третья');
  const document = {
    ...second.document,
    attrs: { pageEffects: { audio: [{ id: 'audio', type: 'audio', slug: 'Звук', options: { src: 'x.ogg' } }] } },
  };
  const book = { type: 'book', pages: [third, first, { ...second, document }], visualEffects: [rangeVisual()] };
  const original = JSON.stringify(book);
  const built = compileBookDocument(book);
  expect(built.pages.map((cur) => cur.id)).toEqual(['persistent-third', 'persistent-first', 'persistent-second']);
  expect(built.pages.map((cur) => cur.document.content)).toEqual(book.pages.map((cur) => cur.document.content));
  expect(built.pages[2].document.attrs?.pageEffects.audio[0]).not.toHaveProperty('slug');
  expect(built.visualEffects[0].lifetime).toEqual(book.visualEffects[0].lifetime);
  expect(JSON.stringify(book)).toBe(original);
});

test('accepts ranges beyond a shortened book and validates only numeric structure', () => {
  const book = { type: 'book', pages: [page('one', 'A')], visualEffects: [rangeVisual()] };
  expect(isBookDocument(JSON.parse(JSON.stringify(book)))).toBe(true);
  expect(compileBookDocument(book).visualEffects[0].lifetime).toEqual(book.visualEffects[0].lifetime);
  for (const range of [{ from: 2, to: 1 }, { from: 0, to: 1 }, { from: 1.5, to: 3 }, { from: '1', to: 3 }]) {
    const visual = { ...rangeVisual(), lifetime: { type: 'range', range: [range] } };
    expect(isBookDocument({ ...book, visualEffects: [visual] })).toBe(false);
  }
});
