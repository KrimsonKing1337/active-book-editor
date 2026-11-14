import {
  describe,
  expect,
  test,
} from 'vitest';

import { compileBookDocument, compilePageDocument } from '../../bookPreparation';

import {
  assertContentDocument,
  assertContentNode,
  isContentLinkAllowed,
} from '../content';

const paragraph = {
  type: 'paragraph',
  content: [
    {
      type: 'text',
      text: 'A formatted link',
      marks: [
        { type: 'bold' },
        { type: 'italic' },
        { type: 'strike' },
        { type: 'underline' },
        {
          type: 'link',
          attrs: {
            href: 'https://example.com/story?chapter=1#note',
            target: '_blank',
            rel: 'nofollow',
            class: null,
          },
        },
      ],
    },
    { type: 'hardBreak' },
    {
      type: 'text',
      text: 'inline code',
      marks: [{ type: 'code' }],
    },
  ],
};

const slide = {
  type: 'carouselSlide',
  content: [
    paragraph,
    { type: 'heading', attrs: { level: 2 } },
    { type: 'coreComponent', attrs: { name: 'Badge', package: 'fixture-parts' } },
  ],
};

test('preserves slides and ordinary blocks through book compilation', () => {
  const carousel = { type: 'carousel', content: [slide, slide] };
  const document = { type: 'doc', content: [paragraph, carousel] };
  const compiled = compilePageDocument(document, 'page');

  expect(compiled.content).toEqual(document.content);
});

test.each(['carousel', 'segment'])('rejects %s inside a slide with its exact source path', (type) => {
  const carousel = {
    type: 'carousel',
    content: [{ type: 'carouselSlide', content: [{ type, content: [slide] }] }],
  };

  expect(() => assertContentNode(carousel))
    .toThrow(`node.content[0].content[0]: node "${type}" is not allowed inside carouselSlide`);
});

test('rejects empty containers, orphan slides and unknown nested blocks and marks', () => {
  for (const type of ['carousel', 'carouselSlide']) {
    expect(() => assertContentNode({ type, content: [] })).toThrow('requires nonempty content');
  }

  expect(() => assertContentDocument({ type: 'doc', content: [slide] })).toThrow('not allowed in block');
  expect(() => assertContentNode({ type: 'carousel', content: [paragraph] })).toThrow('not allowed in slide');
  expect(() => assertContentNode({
    type: 'carousel',
    content: [{ type: 'carouselSlide', content: [{ type: 'missingBlock' }] }],
  })).toThrow('node.content[0].content[0]: unknown node "missingBlock"');
  expect(() => assertContentNode({
    type: 'carousel',
    content: [{
      type: 'carouselSlide',
      content: [{ type: 'paragraph', content: [{
        type: 'text',
        text: 'x',
        marks: [{ type: 'missingMark' }],
      }] }],
    }],
  })).toThrow('node.content[0].content[0].content[0].marks[0]: unknown mark "missingMark"');
});

test('preserves the supported ProseMirror JSON without mutating it during compilation', () => {
  const content = [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Title' }],
    },
    { type: 'heading', attrs: { level: 2 } },
    paragraph,
    { type: 'coreComponent', attrs: { name: 'Badge', package: 'fixture-parts' } },
  ];
  const book = {
    type: 'book',
    pages: [{ id: 'page-one', document: { type: 'doc', content } }],
    visualEffects: [],
  };
  const saved: unknown = JSON.parse(JSON.stringify(book));
  const built = compileBookDocument(saved);

  expect(built.pages[0].document.content).toEqual(content);
  expect(saved).toEqual(book);
});

describe('diagnostic paths', () => {
  test.each([
    'audio',
    'P',
    'H1',
    'H2',
    'activeBookP',
  ])('rejects unsupported node %s', (type) => {
    const document = { type: 'doc', content: [{ type }] };

    expect(() => compilePageDocument(document, 'pages[2].document'))
      .toThrow(`pages[2].document.content[0]: unknown node "${type}"`);
  });

  test('reports an unknown mark inside nested text before it can disappear', () => {
    const document = {
      type: 'doc',
      content: [{
        type: 'heading',
        attrs: { level: 1 },
        content: [{
          type: 'text',
          text: 'Unknown',
          marks: [{ type: 'textAction' }],
        }],
      }],
    };

    expect(() => compilePageDocument(document, 'pages[0].document'))
      .toThrow('pages[0].document.content[0].content[0].marks[0]: unknown mark "textAction"');
  });

  test.each([
    0,
    3,
    '1',
    null,
  ])('rejects heading level %s', (level) => {
    expect(() => assertContentNode({ type: 'heading', attrs: { level } }))
      .toThrow('node.attrs.level: expected heading level 1 or 2');
  });

  test('rejects blocks inside paragraphs and text at the document root', () => {
    expect(() => assertContentDocument({ type: 'doc', content: [{ type: 'text', text: 'root' }] }))
      .toThrow('document.content[0]: node "text" is not allowed in block content');
    expect(() => assertContentNode({ type: 'paragraph', content: [{ type: 'paragraph' }] }))
      .toThrow('node.content[0]: node "paragraph" is not allowed in inline content');
  });

  test('rejects invalid children, empty text, duplicate marks and unsupported code combinations', () => {
    expect(() => assertContentDocument({ type: 'doc', content: [] })).toThrow('at least one block');
    expect(() => assertContentNode({ type: 'text', text: '' })).toThrow('nonempty text');
    expect(() => assertContentNode({ type: 'hardBreak', content: [] })).toThrow('cannot contain children');
    expect(() => assertContentNode({ type: 'paragraph', content: {} })).toThrow('expected an array');
    expect(() => assertContentNode({
      type: 'text',
      text: 'x',
      marks: [{ type: 'bold' }, { type: 'bold' }],
    }))
      .toThrow('duplicate mark');
    expect(() => assertContentNode({
      type: 'text',
      text: 'x',
      marks: [{ type: 'code' }, { type: 'bold' }],
    }))
      .toThrow('code excludes other marks');
  });
});

test.each([
  'https://example.com',
  'http://example.com',
  'mailto:author@example.com',
  'tel:+123456789',
  '#note',
  '../chapter.html',
])('allows a normal content link %s', (href) => {
  expect(isContentLinkAllowed(href)).toBe(true);
});

test.each([
  'javascript:alert(1)',
  'java\nscript:alert(1)',
  'data:text/html,hello',
  'file:///etc/passwd',
])('rejects an unsafe content link %s at the same boundary as other marks', (href) => {
  expect(isContentLinkAllowed(href)).toBe(false);
  expect(() => assertContentNode({
    type: 'text',
    text: 'link',
    marks: [{ type: 'link', attrs: { href } }],
  })).toThrow('node.marks[0].attrs.href');
});
