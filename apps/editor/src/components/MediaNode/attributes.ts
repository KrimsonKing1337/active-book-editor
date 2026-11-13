import type { Attribute } from '@tiptap/core';

import { assertMediaAttributes } from '@active-book/book-builder/content';

export type MediaKind = 'image' | 'video';

const readLength = (element: HTMLElement, name: string): unknown => {
  const serialized = element.getAttribute(`data-book-${name}`);

  if (serialized !== null) {
    return JSON.parse(serialized);
  }

  const literal = element.getAttribute(name) ?? element.style.getPropertyValue(name);

  if (!literal) {
    return null;
  }

  const match = /^(\d+(?:\.\d+)?)(px|%)?$/u.exec(literal);

  if (!match) {
    throw new Error(`Недопустимый размер медиа: ${literal}`);
  }

  return { value: Number(match[1]), unit: match[2] ?? 'px' };
};

const lengthAttribute = (name: string): Attribute => ({
  default: null,
  parseHTML: (element) => readLength(element, name),
  renderHTML: (attrs) => ({ [`data-book-${name}`]: JSON.stringify(attrs[name]) }),
});

const booleanAttribute = (name: string, initial: boolean): Attribute => ({
  default: initial,
  parseHTML: (element) => element.hasAttribute(name.toLowerCase()),
  renderHTML: (attrs) => {
    if (attrs[name] === true) {
      return { [name.toLowerCase()]: '' };
    }

    return {};
  },
});

export const mediaAttributes = (type: MediaKind): Record<string, Attribute> => {
  const attributes: Record<string, Attribute> = {
    src: { default: '' },
    width: lengthAttribute('width'),
    height: lengthAttribute('height'),
    align: {
      default: 'left',
      parseHTML: (element) => element.getAttribute('data-book-align') ?? 'left',
      renderHTML: (attrs) => ({ 'data-book-align': attrs.align }),
    },
    fit: {
      default: 'contain',
      parseHTML: (element) => element.getAttribute('data-book-fit') ?? 'contain',
      renderHTML: (attrs) => ({ 'data-book-fit': attrs.fit }),
    },
  };

  if (type === 'image') {
    attributes.alt = { default: '' };
  } else {
    attributes.poster = { default: null };
    attributes.controls = booleanAttribute('controls', true);
    attributes.autoPlay = booleanAttribute('autoPlay', false);
    attributes.muted = booleanAttribute('muted', true);
    attributes.loop = booleanAttribute('loop', false);
  }

  return attributes;
};

/** Validate before DOM parsing/fitting can discard malformed media attributes or children. */
export const validateMediaHtml = (html: Document): void => {
  for (const element of html.querySelectorAll('[data-type="image"], [data-type="video"]')) {
    const type = element.getAttribute('data-type');
    const isImage = type === 'image' && element.localName === 'img';
    const isVideo = type === 'video' && element.localName === 'video';

    if (!isImage && !isVideo) {
      throw new Error('Медиа должно быть атомарным изображением или видео');
    }
  }

  for (const element of html.querySelectorAll('img, video')) {
    const type = element.localName;

    if (!(element instanceof HTMLElement) || (type !== 'img' && type !== 'video')) {
      continue;
    }

    let kind: MediaKind = 'video';

    if (type === 'img') {
      kind = 'image';
    }

    if (element.childNodes.length) {
      throw new Error('Медиаузел не может содержать дочерние элементы');
    }

    const attrs: Record<string, unknown> = {};

    for (const [name, attribute] of Object.entries(mediaAttributes(kind))) {
      if (attribute.parseHTML) {
        attrs[name] = attribute.parseHTML(element);
      } else {
        attrs[name] = element.getAttribute(name) ?? attribute.default;
      }
    }

    assertMediaAttributes(attrs, { type: kind, path: 'clipboard.media' });
  }
  if (html.querySelector('audio, picture, source, iframe, object, embed, figure, figcaption')) {
    throw new Error('Этот тип медиасодержимого пока не поддерживается');
  }

};
