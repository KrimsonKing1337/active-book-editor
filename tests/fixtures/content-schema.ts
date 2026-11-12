import { getSchema } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Paragraph from '@tiptap/extension-paragraph';

import { CarouselNode, CarouselSlide } from '@components/CarouselNode';

// Use the production container nodes; no DOM, project service or Core hook imports.
export const contentSchema = getSchema([
  StarterKit.configure({ paragraph: false }),
  Paragraph.extend({ group: 'block slideBlock' }),
  CarouselNode,
  CarouselSlide,
]);
