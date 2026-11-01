import { expect, test } from 'vitest';

import { isBookDocument } from './index';
import { compileBookDocument } from '../bookPreparation';

const page = (id: string, text: string) => ({
  id,
  document: { type: 'doc', content: [{ type: 'P', content: [{ type: 'text', text }] }] },
});

test('requires at least one document and unique permanent page IDs', () => {
  expect(isBookDocument({ type: 'book', pages: [page('one', 'A')] })).toBe(true);
  expect(isBookDocument({ type: 'book', pages: [] })).toBe(false);
  expect(isBookDocument({ type: 'book', pages: [page('one', 'A'), page('one', 'B')] })).toBe(false);
  expect(isBookDocument({ type: 'doc', content: [] })).toBe(false);
});

test('compiles every ordered page without changing IDs, content, source effects or positional ranges', () => {
  const first = page('persistent-first', 'Первая');
  const second = page('persistent-second', 'Вторая');
  const third = page('persistent-third', 'Третья');
  const document = {
    ...second.document,
    attrs: { pageEffects: { audio: [{ id: 'audio', type: 'audio', slug: 'Звук', options: { src: 'x.ogg' } }] } },
  };
  const book = {
    type: 'book',
    pages: [third, first, { ...second, document }],
    rangeEffects: [{ id: 'positional', range: [{ from: 1, to: 2 }] }],
  };
  const original = JSON.stringify(book);
  const built = compileBookDocument(book);
  expect(built.pages.map((cur) => cur.id)).toEqual(['persistent-third', 'persistent-first', 'persistent-second']);
  expect(built.pages.map((cur) => cur.document.content)).toEqual(book.pages.map((cur) => cur.document.content));
  expect(built.pages[2].document.attrs?.pageEffects.audio[0]).not.toHaveProperty('slug');
  expect(built).toHaveProperty('rangeEffects', book.rangeEffects);
  expect(JSON.stringify(book)).toBe(original);
});

test('validates numeric range bounds without clipping them when the book becomes shorter', () => {
  const book = { type: 'book', pages: [page('one', 'A')] };
  expect(isBookDocument({ ...book, rangeEffects: [{ range: [{ from: 1, to: 5 }] }] })).toBe(true);
  for (const range of [{ from: 2, to: 1 }, { from: 0, to: 1 }, { from: 1.5, to: 3 }, { from: '1', to: 3 }]) {
    expect(isBookDocument({ ...book, rangeEffects: [{ range: [range] }] })).toBe(false);
  }
});
