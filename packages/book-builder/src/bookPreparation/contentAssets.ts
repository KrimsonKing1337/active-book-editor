import type { BookContentNode } from '@active-book/types';

import type { BookDocument } from '../book';

import { assertContentDocument } from '../content';

const collect = (nodes: readonly BookContentNode[], paths: Set<string>): void => {
  for (const nodeCur of nodes) {
    const { type } = nodeCur;

    if (type === 'image') {
      paths.add(nodeCur.attrs.src);
    } else if (type === 'video') {
      const { attrs } = nodeCur;

      if (attrs.poster) {
        paths.add(attrs.poster);
      }
    } else if (type === 'carousel' || type === 'carouselSlide') {
      collect(nodeCur.content, paths);
    }
  }
};

export const contentAssetPaths = (book: Pick<BookDocument, 'pages'>): readonly string[] => {
  const paths = new Set<string>();

  for (const pageCur of book.pages) {
    const document: unknown = pageCur.document;

    assertContentDocument(document);
    collect(document.content, paths);
  }

  return [...paths];
};
