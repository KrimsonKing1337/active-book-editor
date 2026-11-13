import { Fragment, Node } from '@tiptap/pm/model';

import { assertContentDocument, assertContentNode } from '@active-book/book-builder/content';

import { validateMediaHtml } from '@components/MediaNode/attributes';

const selectors = {
  carousel: '[data-type="carousel"]',
  segment: '[data-type="segment"]',
  carouselSlide: '[data-type="carouselSlide"]',
};

const sourceTypes = new Set([
  'doc',
  'paragraph',
  'heading',
  'text',
  'hardBreak',
  'coreComponent',
  'carousel',
  'carouselSlide',
  'segment',
  'image',
  'video',
]);

type HtmlContext = {
  insideSlide: boolean;
  allowOpenSlide?: boolean;
};

const assertHtml = (html: string, context: HtmlContext): void => {
  const dom = new DOMParser().parseFromString(html, 'text/html');
  validateMediaHtml(dom);

  for (const element of dom.querySelectorAll('[data-type]')) {
    const type = element.getAttribute('data-type');

    if (type && !sourceTypes.has(type)) {
      throw new Error(`Неизвестный тип содержимого: ${type}`);
    }
  }
  const containers = dom.querySelectorAll(`${selectors.carousel}, ${selectors.segment}`);

  for (const slideCur of dom.querySelectorAll(selectors.carouselSlide)) {
    const parent = slideCur.parentElement;

    if (parent?.matches(`section${selectors.carousel}`)) {
      continue;
    }

    if (!context.allowOpenSlide || parent !== dom.body) {
      throw new Error('Слайд должен находиться внутри карусели');
    }

    const slice = slideCur.getAttribute('data-pm-slice') ?? '';
    const match = /^(\d+) (\d+)(?: |$)/u.exec(slice);

    if (!match || Number(match[1]) <= 0 || Number(match[2]) <= 0) {
      throw new Error('Слайд должен находиться внутри карусели');
    }
  }

  for (const containerCur of containers) {
    const ancestor = containerCur.parentElement
      ?.closest(`${selectors.carousel}, ${selectors.carouselSlide}`);

    if (context.insideSlide || ancestor) {
      throw new Error('Карусель и segment нельзя вставить внутрь слайда');
    }

    if (containerCur.getAttribute('data-type') === 'segment') {
      throw new Error('Узел segment пока не поддерживается');
    }

    if (!containerCur.children.length) {
      throw new Error('Карусель должна содержать хотя бы один слайд');
    }

    for (const slide of containerCur.children) {
      if (!slide.matches(`section${selectors.carouselSlide}`) || !slide.children.length) {
        throw new Error('Карусель должна содержать слайды с блочным содержимым');
      }
    }
  }
};

export const validateClipboardHtml = (html: string, insideSlide: boolean): void => {
  assertHtml(html, { insideSlide, allowOpenSlide: true });
};

export const validateInput = (content: unknown, insideSlide: boolean): void => {
  // TipTap accepts null (and an empty Fragment) as the clear-content input.
  if (content === null) {
    return;
  }

  if (typeof content === 'string') {
    assertHtml(content, { insideSlide });

    return;
  }

  if (content instanceof Node || content instanceof Fragment) {
    validateInput(content.toJSON(), insideSlide);

    return;
  }

  if (Array.isArray(content)) {
    for (const childCur of content) {
      validateInput(childCur, insideSlide);
    }

    return;
  }

  if (typeof content === 'object' && 'type' in content && content.type === 'doc') {
    assertContentDocument(content);

    const hasCarousel = content.content.some((childCur) => {
      return childCur.type === 'carousel';
    });

    if (insideSlide && hasCarousel) {
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
