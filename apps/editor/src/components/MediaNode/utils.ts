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

  const unit = match[2] ?? 'px';

  return { value: Number(match[1]), unit };
};

const lengthAttribute = (name: string): Attribute => {
  const parseHtml = (element: HTMLElement) => {
    return readLength(element, name);
  };

  const renderHtml = (attrs: Record<string, any>) => {
    const bookName = `data-book-${name}`;
    const value = JSON.stringify(attrs[name]);

    return { [bookName]: value };
  };

  return {
    default: null,
    parseHTML: parseHtml,
    renderHTML: renderHtml,
  };
};

const booleanAttribute = (name: string, initial: boolean): Attribute => {
  const parseHtml = (element: HTMLElement) => {
    return element.hasAttribute(name.toLowerCase());
  };

  const renderHtml = (attrs: Record<string, any>) => {
    if (attrs[name] === true) {
      const lowerName = name.toLowerCase();

      return { [lowerName]: '' };
    }

    return {};
  };

  return {
    default: initial,
    parseHTML: parseHtml,
    renderHTML: renderHtml,
  };
};

export const mediaAttributes = (type: MediaKind): Record<string, Attribute> => {
  const src = { default: '' };

  const width = lengthAttribute('width');
  const height = lengthAttribute('height');

  const alignParseHtml = (element: HTMLElement) => {
    const align = element.getAttribute('data-book-align');

    return align ?? 'left';
  };

  const alignRenderHtml = (attrs: Record<string, any>) => {
    return { 'data-book-align': attrs.align };
  };

  const align = {
    default: 'left',
    parseHTML: alignParseHtml,
    renderHTML: alignRenderHtml,
  };

  const fitParseHtml = (element: HTMLElement) => {
    const fit = element.getAttribute('data-book-fit');

    return fit ?? 'contain';
  };

  const fitRenderHtml = (attrs: Record<string, any>) => {
    return { 'data-book-fit': attrs.fit };
  };

  const fit = {
    default: 'contain',
    parseHTML: fitParseHtml,
    renderHTML: fitRenderHtml,
  };

  const attributes: Record<string, Attribute> = {
    src,
    width,
    height,
    align,
    fit,
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
  for (const elementCur of html.querySelectorAll('[data-type="image"], [data-type="video"]')) {
    const type = elementCur.getAttribute('data-type');
    const isImage = type === 'image' && elementCur.localName === 'img';
    const isVideo = type === 'video' && elementCur.localName === 'video';

    if (!isImage && !isVideo) {
      throw new Error('Медиа должно быть атомарным изображением или видео');
    }
  }

  for (const elementCur of html.querySelectorAll('img, video')) {
    const type = elementCur.localName;

    if (!(elementCur instanceof HTMLElement) || (type !== 'img' && type !== 'video')) {
      continue;
    }

    let kind: MediaKind = 'video';

    if (type === 'img') {
      kind = 'image';
    }

    if (elementCur.childNodes.length) {
      throw new Error('Медиаузел не может содержать дочерние элементы');
    }

    const attrs: Record<string, unknown> = {};

    for (const [name, attribute] of Object.entries(mediaAttributes(kind))) {
      if (attribute.parseHTML) {
        attrs[name] = attribute.parseHTML(elementCur);
      } else {
        attrs[name] = elementCur.getAttribute(name) ?? attribute.default;
      }
    }

    assertMediaAttributes(attrs, { type: kind, path: 'clipboard.media' });
  }

  const unsupportedMedia = [
    'audio',
    'picture',
    'source',
    'iframe',
    'object',
    'embed',
    'figure',
    'figcaption',
  ];

  const unsupportedMediaSelector = unsupportedMedia.join(', ');

  if (html.querySelector(unsupportedMediaSelector)) {
    throw new Error('Этот тип медиасодержимого пока не поддерживается');
  }
};
