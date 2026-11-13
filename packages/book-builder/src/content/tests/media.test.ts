import { expect, test } from 'vitest';

import { compileBookDocument } from '../../bookPreparation';
import { contentAssetPaths } from '../../bookPreparation/contentAssets';
import { assertContentDocument, assertContentNode } from '../content';
import { isContentAssetPath } from '../media';

const image = {
  type: 'image',
  attrs: {
    src: 'assets/a #?.png',
    width: { value: 80, unit: '%' },
    height: { value: 220, unit: 'px' },
    align: 'center',
    fit: 'cover',
    alt: 'Forest',
  },
};
const video = {
  type: 'video',
  attrs: {
    src: 'assets/movie.webm',
    poster: 'assets/a #?.png',
    controls: true,
    autoPlay: false,
    muted: true,
    loop: false,
  },
};

test('preserves mixed blocks and media slides through compilation and collects unique asset paths', () => {
  const document = {
    type: 'doc',
    content: [
      image,
      { type: 'paragraph', content: [{ type: 'text', text: 'Between media' }] },
      video,
      { type: 'carousel', content: [{ type: 'carouselSlide', content: [image, video] }] },
    ],
  };
  assertContentDocument(document);
  const book = compileBookDocument({
    type: 'book',
    pages: [{ id: 'media', document }],
    visualEffects: [],
  });
  expect(book.pages[0].document.content).toEqual(document.content);
  expect(contentAssetPaths(book)).toEqual(['assets/a #?.png', 'assets/movie.webm']);
});

test.each([
  'blob:temporary',
  'data:image/png;base64,data',
  'https://example.com/movie.webm',
  '/assets/image.png',
  './assets/image.png',
  'assets/../image.png',
  'assets//image.png',
  'assets/./image.png',
  'assets/dir\\image.png',
  'assets/a\n.png',
  '',
])('rejects a noncanonical/unsafe asset path: %s', (src) => {
  expect(isContentAssetPath(src)).toBe(false);
  expect(() => assertContentNode({ type: 'image', attrs: { src } })).toThrow(/src/u);
});

test.each([
  { src: undefined },
  { src: 'assets/movie.webm' },
  { width: '20%' },
  { width: { value: 0, unit: 'px' } },
  { width: { value: -2, unit: 'px' } },
  { width: { value: NaN, unit: 'px' } },
  { width: { value: Infinity, unit: 'px' } },
  { width: { value: 101, unit: '%' } },
  { width: { value: 20, unit: 'vw' } },
  { width: {
    value: 20,
    unit: 'px',
    other: 1,
  } },
  { height: { value: 20, unit: '%' } },
  { height: { value: -10, unit: 'px' } },
  { align: 'float' },
  { align: { toString: (): string => 'center' } },
  { fit: 'fill' },
  { alt: true },
  { future: true },
])('rejects malformed image attributes: %o', (attrs) => {
  expect(() => assertContentNode({ ...image, attrs: { ...image.attrs, ...attrs } })).toThrow();
});

test.each([
  { controls: 'true' },
  { muted: 0 },
  { autoPlay: null },
  { loop: 'false' },
  { poster: 'blob:temporary' },
  { poster: 'assets/movie.webm' },
  { poster: 'assets/../poster.png' },
])('rejects malformed video attributes: %o', (attrs) => {
  expect(() => assertContentNode({ ...video, attrs: { ...video.attrs, ...attrs } })).toThrow();
});

test('accepts omitted defaults and explicit automatic sizes; media remains atomic and block-only', () => {
  expect(() => assertContentNode({ type: 'image', attrs: {
    src: 'assets/small.png',
    width: null,
    height: null,
  } }))
    .not.toThrow();
  expect(() => assertContentNode({ type: 'video', attrs: { src: 'assets/movie.webm', poster: null } }))
    .not.toThrow();
  expect(() => assertContentNode({ ...image, content: [] })).toThrow(/atomic/u);
  expect(() => assertContentNode({ ...video, content: [{ type: 'paragraph' }] })).toThrow(/atomic/u);
  expect(() => assertContentNode({ type: 'paragraph', content: [image] })).toThrow(/inline/u);
  expect(() => assertContentNode({ ...image, marks: [{ type: 'bold' }] })).toThrow(/marks/u);
});
