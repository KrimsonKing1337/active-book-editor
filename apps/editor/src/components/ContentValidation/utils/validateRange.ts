import type { Node, ResolvedPos } from '@tiptap/pm/model';
import type { Range } from '@tiptap/core';

const containerPosition = (position: ResolvedPos, name: string): number | undefined => {
  for (let depth = position.depth; depth > 0; depth -= 1) {
    if (position.node(depth).type.name === name) {
      return position.before(depth);
    }
  }
};

// Endpoints outside a carousel can enclose whole carousels. Inside, both must
// belong to the same slide. A position between slides is not an editing region.
export const validateRange = (doc: Node, range: Range): boolean => {
  const from = doc.resolve(range.from);
  const to = doc.resolve(range.to);

  const fromCarousel = containerPosition(from, 'carousel');
  const toCarousel = containerPosition(to, 'carousel');

  if (fromCarousel === undefined && toCarousel === undefined) {
    return false;
  }

  const fromSlide = containerPosition(from, 'carouselSlide');
  const toSlide = containerPosition(to, 'carouselSlide');

  if (fromSlide !== undefined && fromSlide === toSlide) {
    return true;
  }

  throw new Error('Выделение пересекает границу слайда. Выберите содержимое одного слайда или карусель целиком');
};
