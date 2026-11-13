import type { BookContentNode } from '@active-book/types';

import type { BookDocument } from '../book';

import { assertContentDocument } from '../content';

const collect = (nodes: readonly BookContentNode[], paths: Set<string>): void => {
  for (const node of nodes) {
    if (node.type === 'image' || node.type === 'video') {
      paths.add(node.attrs.src);

      if (node.type === 'video' && node.attrs.poster) {
        paths.add(node.attrs.poster);
      }
    } else if (node.type === 'carousel' || node.type === 'carouselSlide') {
      collect(node.content, paths);
    }
  }
};

export const contentAssetPaths = (book: Pick<BookDocument, 'pages'>): readonly string[] => {
  const paths = new Set<string>();

  for (const page of book.pages) {
    const document: unknown = page.document;
    assertContentDocument(document);
    collect(document.content, paths);
  }

  return [...paths];
};
