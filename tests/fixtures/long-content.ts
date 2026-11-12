import type { JSONContent } from '@tiptap/core';

export const createLongDocument = (paragraphs: number, revision = 0): JSONContent => {
  const text = 'Editable narrative content with ordinary marks. '.repeat(6);
  const content: JSONContent[] = [];
  const interval = paragraphs / 10;
  const paragraph = (index: number): JSONContent => ({
    type: 'paragraph',
    content: [
      {
        type: 'text',
        text: `${revision}:${index} ${text}`,
        marks: [{ type: 'bold' }],
      },
      { type: 'text', text: ' unformatted text' },
    ],
  });

  for (let index = 0; index < paragraphs; index += 1) {
    if (index % interval === 0) {
      const slides = Array.from({ length: 2 }, (_unused, slide) => ({
        type: 'carouselSlide',
        content: Array.from({ length: 10 }, (_empty, block) => paragraph(index + slide * 10 + block)),
      }));

      content.push({ type: 'carousel', content: slides });
    }

    content.push(paragraph(index));
  }

  return { type: 'doc', content };
};
