import { expect, test } from 'vitest';

import type { AudioEffect } from '@active-book/types';

import { compileBookDocument, compilePageDocument } from '../bookPreparation';
import { isBookDocument } from '../book';

import { compileAudioEffects } from './compile';

const source = 'assets/аудио/гром #?%.wav';

const audio: AudioEffect = {
  id: 'thunder',
  src: source,
  lifetime: { type: 'page', page: 'chapter' },
};

const book = {
  type: 'book',
  pages: [
    'opening',
    'chapter',
    'ending',
  ].map((id) => ({ id, document: { type: 'doc', content: [{ type: 'paragraph' }] } })),
  visualEffects: [],
};

test('round trips book audio and compiles page references and shared escaped assets', () => {
  const effects: AudioEffect[] = [
    audio,
    {
      id: 'storm',
      src: source,
      lifetime: { type: 'range', range: [{ from: 1, to: 2 }, { from: 2, to: 3 }] },
      delay: 150,
      stopBy: 150,
      fadeOut: true,
      waitTillTheEnd: true,
    },
  ];
  const withAudio = { ...book, audioEffects: [{ ...effects[0], slug: 'Гром' }, effects[1]] };
  const loaded: unknown = JSON.parse(JSON.stringify(withAudio));
  const assets = new Set<string>();
  expect(isBookDocument(loaded)).toBe(true);
  const compiled = compileBookDocument(loaded, assets);
  expect([...assets]).toEqual([source]);
  expect(compiled.audioEffects[0]).toEqual({
    id: 'thunder',
    src: './assets/%D0%B0%D1%83%D0%B4%D0%B8%D0%BE/%D0%B3%D1%80%D0%BE%D0%BC%20%23%3F%25.wav',
    lifetime: { type: 'page', page: 2 },
  });
  expect(compiled.audioEffects[1]).toEqual({
    ...effects[1],
    src: compiled.audioEffects[0].src,
  });
  expect(loaded).toEqual(withAudio);
  const [
    first,
    second,
    third,
  ] = book.pages;
  const reordered = compileAudioEffects({ pages: [
    second,
    first,
    third,
  ], audioEffects: effects });
  expect(reordered[0].lifetime).toEqual({ type: 'page', page: 1 });
  expect(reordered[1].lifetime).toEqual(effects[1].lifetime);
});

test.each([
  [{ id: undefined }, /\.id/],
  [{ id: ' ' }, /\.id/],
  [{ src: '' }, /\.src/],
  [{ src: 'assets/../outside.wav' }, /\.src/],
  [{ lifetime: { type: 'page', page: 'absent' } }, /unknown page ID/],
  [{ lifetime: { type: 'range', range: [] } }, /positional range/],
  [{ lifetime: { type: 'range', range: [{ from: 1, to: 4 }] } }, /range\[0\]/],
  [{ lifetime: { type: 'range', range: [{ from: 2, to: 1 }] } }, /range\[0\]/],
  [{ delay: -1 }, /\.delay/],
  [{ stopBy: Infinity }, /\.stopBy/],
  [{ stopBy: '200' }, /\.stopBy/],
  [{ relativeVolume: 101 }, /\.relativeVolume/],
  [{ type: 'voice' }, /\.type/],
  [{ fadeIn: 50 }, /\.fadeIn/],
  [{ onPlay: () => {} }, /unknown audio field/],
])('rejects invalid authored audio %# with specific context', (override, message) => {
  expect(() => compileBookDocument({ ...book, audioEffects: [{ ...audio, ...override }] })).toThrow(message);
});

test('rejects sparse format arrays', () => {
  const format: string[] = [];
  format.length = 1;

  const effect = { ...audio, format };

  expect(() => compileBookDocument({ ...book, audioEffects: [effect] })).toThrow(/\.format/);
});

test('requires unique IDs across the entire book', () => {
  const duplicate = { ...audio, lifetime: { type: 'page', page: 'ending' } };
  expect(() => compileBookDocument({ ...book, audioEffects: [audio, duplicate] })).toThrow(/duplicate audio ID/);
});

test.each([
  { pageEffects: { audio: [] } },
  { audioEffects: [] },
  { audioEffects: [audio] },
])('rejects page-embedded audio %# when opening or compiling a book', (attrs) => {
  const [firstPage] = book.pages;
  const document = { ...firstPage.document, attrs };
  const documentWithPageAudio = {
    ...book,
    pages: [{ ...firstPage, document }],
    audioEffects: [],
  };
  expect(isBookDocument(documentWithPageAudio)).toBe(false);
  expect(() => compileBookDocument(documentWithPageAudio)).toThrow(/book.json/);
  expect(() => compilePageDocument(document)).toThrow(/book-level audioEffects/);
});

test.each(['', 'assets'])('an unfinished source %j can be saved and reopened as a draft', (src) => {
  const draft = { ...book, audioEffects: [{ ...audio, src }] };
  expect(isBookDocument(draft)).toBe(true);
  expect(() => compileBookDocument(draft)).toThrow(/\.src/);
});
