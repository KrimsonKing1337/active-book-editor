import {
  expect,
  test,
} from 'vitest';

import { crossSlideRanges, rangeDocument } from '@root/tests/fixtures/carousel-ranges';
import { contentSchema } from '@root/tests/fixtures/content-schema';

import { validateRange } from './validateRange';

const doc = contentSchema.nodeFromJSON(rangeDocument);

test.each(crossSlideRanges(doc))('rejects partial container replacement: $name', (range) => {
  expect(() => validateRange(doc, range)).toThrow('границу слайда');
});

test('accepts all endpoints within one slide, including its content edges', () => {
  const carouselPosition = doc.child(0).nodeSize;
  const slideStart = carouselPosition + 2;
  const slideEnd = slideStart + doc.child(1).child(0).content.size;

  expect(validateRange(doc, { from: slideStart, to: slideEnd })).toBe(true);
  expect(validateRange(doc, { from: slideStart + 2, to: slideStart + 3 })).toBe(true);
});

test('allows whole-carousels and surrounding narrative but rejects positions between slides', () => {
  const carouselPosition = doc.child(0).nodeSize;
  const carouselEnd = carouselPosition + doc.child(1).nodeSize;

  expect(validateRange(doc, { from: carouselPosition, to: carouselEnd })).toBe(false);
  expect(validateRange(doc, { from: 2, to: doc.content.size - 2 })).toBe(false);
  expect(validateRange(doc, { from: 0, to: doc.content.size })).toBe(false);
  expect(() => validateRange(doc, { from: carouselPosition + 1, to: carouselPosition + 1 }))
    .toThrow('границу слайда');
});
