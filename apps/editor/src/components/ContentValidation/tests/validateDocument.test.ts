import { Fragment } from '@tiptap/pm/model';
import {
  expect,
  test,
  vi,
} from 'vitest';

import { contentSchema } from '@root/tests/fixtures/content-schema';
import { rangeDocument } from '@root/tests/fixtures/carousel-ranges';

import { createDocumentValidator } from '../utils';

test('reuses immutable top-level blocks but checks changed blocks and undo documents', () => {
  const validate = createDocumentValidator();
  const original = contentSchema.nodeFromJSON(rangeDocument);

  validate(original);
  const untouched = vi.spyOn(original.child(0), 'toJSON');
  const replacement = contentSchema.nodes.paragraph.create(null, contentSchema.text('Changed'));
  const changed = original.copy(Fragment.from([
    original.child(0),
    original.child(1),
    replacement,
  ]));

  expect(() => validate(changed, original)).not.toThrow();
  expect(untouched).not.toHaveBeenCalled();
  expect(() => validate(original, changed)).not.toThrow();
  vi.restoreAllMocks();
});

test('rejects repeated unknown-node transactions without caching failed candidates and keeps original paths', () => {
  const validate = createDocumentValidator();
  const original = contentSchema.nodeFromJSON(rangeDocument);

  validate(original);
  const unknown = contentSchema.nodes.codeBlock.create(null, contentSchema.text('Unknown block'));
  const invalid = original.copy(original.content.append(Fragment.from(unknown)));

  for (let attempt = 0; attempt < 2; attempt += 1) {
    expect(() => validate(invalid, original)).toThrow('document.content[3]: unknown node "codeBlock"');
  }

  const otherBlock = contentSchema.nodes.paragraph.create(null, contentSchema.text('Another edit'));
  const otherEdit = invalid.copy(Fragment.from([otherBlock, ...invalid.content.content.slice(1)]));

  expect(() => validate(otherEdit, invalid)).toThrow('document.content[3]: unknown node "codeBlock"');

  expect(() => validate(original)).not.toThrow();
});

test('revalidates marked text and heading attributes after other nodes have been cached', () => {
  const validate = createDocumentValidator();
  const original = contentSchema.nodeFromJSON(rangeDocument);

  validate(original);
  const heading = contentSchema.nodes.heading.create({ level: 3 }, contentSchema.text('Unsupported heading'));
  const unsafeLink = contentSchema.marks.link.create({ href: 'javascript:alert(1)' });
  const linkedText = contentSchema.text('Link', [unsafeLink]);
  const paragraph = contentSchema.nodes.paragraph.create(null, linkedText);

  expect(() => validate(original.copy(original.content.append(Fragment.from(heading))), original))
    .toThrow('document.content[3].attrs.level');
  expect(() => validate(original.copy(original.content.append(Fragment.from(paragraph))), original))
    .toThrow('document.content[3].content[0].marks[0].attrs.href');
});

test('rejects cached blocks in an invalid parent context, nested carousels and an empty document', () => {
  const validate = createDocumentValidator();
  const original = contentSchema.nodeFromJSON(rangeDocument);

  validate(original);
  const carousel = original.child(1);
  const nestedSlide = contentSchema.nodes.carouselSlide.create(null, carousel);
  const nestedCarousel = contentSchema.nodes.carousel.create(null, nestedSlide);

  expect(() => validate(original.copy(carousel.content), original)).toThrow('Invalid content for node doc');
  expect(() => validate(original.copy(Fragment.from(nestedCarousel)), original)).toThrow('Invalid content');
  expect(() => validate(original.copy(Fragment.empty), original)).toThrow();
});

test('checks the root contract even when every child block has been cached', () => {
  const validate = createDocumentValidator();
  const original = contentSchema.nodeFromJSON(rangeDocument);

  validate(original);
  const wrongRoot = contentSchema.nodes.blockquote.create(null, original.content);

  expect(() => validate(wrongRoot, original)).toThrow('expected a doc node');
});

test('handles overlapping prefix/suffix diffs for duplicate block insertion and deletion', () => {
  const validate = createDocumentValidator();
  const paragraph = contentSchema.nodes.paragraph.create(null, contentSchema.text('Repeated'));
  const original = contentSchema.nodes.doc.create(null, [paragraph, paragraph]);
  const inserted = contentSchema.nodes.doc.create(null, [
    paragraph,
    paragraph,
    paragraph,
  ]);

  validate(original);
  expect(() => validate(inserted, original)).not.toThrow();
  expect(() => validate(original, inserted)).not.toThrow();
});
