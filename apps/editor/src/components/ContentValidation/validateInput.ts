import { Fragment, Node } from '@tiptap/pm/model';

import { assertContentDocument, assertContentNode } from '@active-book/book-builder/content';

const assertHtml = (html: string, insideSlide: boolean): void => {
  const dom = new DOMParser().parseFromString(html, 'text/html');
  const containers = dom.querySelectorAll('[data-type="carousel"], [data-type="segment"]');

  for (const slide of dom.querySelectorAll('[data-type="carouselSlide"]')) {
    if (!slide.parentElement?.matches('section[data-type="carousel"]')) {
      throw new Error('Слайд должен находиться внутри карусели');
    }
  }

  for (const container of containers) {
    if (insideSlide || container.parentElement?.closest('[data-type="carousel"]')) {
      throw new Error('Карусель и segment нельзя вставить внутрь слайда');
    }

    if (container.getAttribute('data-type') === 'segment') {
      throw new Error('Узел segment пока не поддерживается');
    }

    if (!container.children.length) {
      throw new Error('Карусель должна содержать хотя бы один слайд');
    }

    for (const slide of container.children) {
      if (!slide.matches('section[data-type="carouselSlide"]') || !slide.children.length) {
        throw new Error('Карусель должна содержать слайды с блочным содержимым');
      }
    }
  }
};

export const validateInput = (content: unknown, insideSlide: boolean): void => {
  // TipTap accepts null (and an empty Fragment) as the clear-content input.
  if (content === null) {
    return;
  }

  if (typeof content === 'string') {
    assertHtml(content, insideSlide);

    return;
  }

  if (content instanceof Node || content instanceof Fragment) {
    validateInput(content.toJSON(), insideSlide);

    return;
  }

  if (Array.isArray(content)) {
    for (const child of content) {
      validateInput(child, insideSlide);
    }

    return;
  }

  if (content !== null && typeof content === 'object' && 'type' in content && content.type === 'doc') {
    assertContentDocument(content);

    if (insideSlide && content.content.some((child) => child.type === 'carousel')) {
      throw new Error('Карусель нельзя вставить внутрь слайда');
    }

    return;
  }

  assertContentNode(content);

  if (content.type === 'carouselSlide') {
    throw new Error('Слайд должен находиться внутри карусели');
  }

  if (insideSlide && content.type === 'carousel') {
    throw new Error('Карусель нельзя вставить внутрь другого слайда');
  }
};
