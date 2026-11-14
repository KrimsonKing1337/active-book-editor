import type { BookTextMark } from '@active-book/types';

import { isRecord } from '../effects/utils';

import { fail } from './utils';

const formattingMarks = new Set([
  'bold',
  'italic',
  'strike',
  'underline',
  'code',
]);

const linkProtocols = new Set([
  'http:',
  'https:',
  'mailto:',
  'tel:',
]);

const attributesNames = [
  'target',
  'rel',
  'class',
];

export const isContentLinkAllowed = (href: string): boolean => {
  try {
    const url = new URL(href, 'https://active-book.invalid/');

    return linkProtocols.has(url.protocol);
  } catch {
    return false;
  }
};

const assertMark: (
  value: unknown,
  path: string,
) => asserts value is BookTextMark = (value, path) => {
  if (!isRecord(value) || typeof value.type !== 'string') {
    fail(path, 'expected a mark with a type');
  }

  if (formattingMarks.has(value.type)) {
    return;
  }

  if (value.type !== 'link') {
    fail(path, `unknown mark "${value.type}"`);
  }

  const attrs = value.attrs;

  if (!isRecord(attrs) || typeof attrs.href !== 'string' || !isContentLinkAllowed(attrs.href)) {
    fail(`${path}.attrs.href`, 'expected an allowed URL (http, https, mailto, tel or a relative URL)');
  }

  for (const nameCur of attributesNames) {
    const attribute = attrs[nameCur];

    if (attribute !== undefined && attribute !== null && typeof attribute !== 'string') {
      fail(`${path}.attrs.${nameCur}`, 'expected a string or null');
    }
  }
};

export const assertMarks = (value: unknown, path: string): void => {
  if (value === undefined) {
    return;
  }

  if (!Array.isArray(value)) {
    fail(path, 'expected an array of marks');
  }

  const types = new Set<string>();

  for (const [index, mark] of value.entries()) {
    assertMark(mark, `${path}[${index}]`);

    if (types.has(mark.type)) {
      fail(`${path}[${index}]`, `duplicate mark "${mark.type}"`);
    }

    types.add(mark.type);
  }

  if (types.has('code') && types.size > 1) {
    fail(path, 'code excludes other marks in the standard TipTap schema');
  }
};
