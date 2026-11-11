import type { JSONContent } from '@tiptap/core';
import type { Node } from '@tiptap/pm/model';

export const rangeDocument: JSONContent = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Before' }] },
    {
      type: 'carousel',
      content: [
        { type: 'carouselSlide', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Alpha' }] }] },
        { type: 'carouselSlide', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Bravo' }] }] },
      ],
    },
    { type: 'paragraph', content: [{ type: 'text', text: 'After' }] },
  ],
};

export const paragraphStart = (doc: Node, text: string): number => {
  let result: number | undefined;

  doc.descendants((node, position) => {
    if (node.type.name === 'paragraph' && node.textContent.startsWith(text)) {
      result = position + 1;
    }
  });

  if (result === undefined) {
    throw new Error(`Missing fixture paragraph: ${text}`);
  }

  return result;
};

export const crossSlideRanges = (doc: Node) => {
  const before = paragraphStart(doc, 'Before');
  const alpha = paragraphStart(doc, 'Alpha');
  const bravo = paragraphStart(doc, 'Bravo');
  const after = paragraphStart(doc, 'After');

  return [
    {
      name: 'outside to slide',
      from: before + 2,
      to: alpha + 2,
    },
    {
      name: 'slide to outside',
      from: bravo + 2,
      to: after + 2,
    },
    {
      name: 'between slides',
      from: alpha + 2,
      to: bravo + 2,
    },
  ];
};

export const carouselHtml = '<section data-type="carousel"><section data-type="carouselSlide">'
  + '<p>New carousel</p></section></section>';

export const carouselJson: JSONContent = {
  type: 'carousel',
  content: [{
    type: 'carouselSlide',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'New carousel' }] }],
  }],
};
