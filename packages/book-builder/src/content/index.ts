import type {
  BookContentDocument,
  BookContentNode,
  BookTextMark,
} from '@active-book/types';

import { isRecord } from '../effects/utils';

const formattingMarks = new Set(['bold', 'italic', 'strike', 'underline', 'code']);
const linkProtocols = new Set(['http:', 'https:', 'mailto:', 'tel:']);

export const isContentLinkAllowed = (href: string): boolean => {
  try {
    const url = new URL(href, 'https://active-book.invalid/');

    return linkProtocols.has(url.protocol);
  } catch {
    return false;
  }
};

function fail(path: string, message: string): never {
  throw new Error(`${path}: ${message}`);
}

const assertMark: (value: unknown, path: string) => asserts value is BookTextMark = (value, path) => {
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

  for (const name of ['target', 'rel', 'class']) {
    const attribute = attrs[name];

    if (attribute !== undefined && attribute !== null && typeof attribute !== 'string') {
      fail(`${path}.attrs.${name}`, 'expected a string or null');
    }
  }
};

const assertMarks = (value: unknown, path: string): void => {
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

type NodeLocation = 'block' | 'inline' | 'any';

const assertNode = (value: unknown, options: { path: string; location: NodeLocation }): void => {
  const { path, location } = options;

  if (!isRecord(value) || typeof value.type !== 'string') {
    fail(path, 'expected a node with a type');
  }

  const { type } = value;
  const isInline = type === 'text' || type === 'hardBreak';
  const isBlock = type === 'paragraph' || type === 'heading' || type === 'coreComponent';

  if (!isInline && !isBlock) {
    fail(path, `unknown node "${type}"`);
  }

  if ((location === 'inline' && !isInline) || (location === 'block' && !isBlock)) {
    fail(path, `node "${type}" is not allowed in ${location} content`);
  }

  if (isInline) {
    if (type === 'text' && (typeof value.text !== 'string' || value.text.length === 0)) {
      fail(`${path}.text`, 'expected nonempty text');
    }

    if (value.content !== undefined) {
      fail(`${path}.content`, `node "${type}" cannot contain children`);
    }

    assertMarks(value.marks, `${path}.marks`);

    return;
  }

  if (value.marks !== undefined) {
    fail(`${path}.marks`, 'block nodes cannot have marks');
  }

  if (type === 'heading') {
    if (!isRecord(value.attrs) || (value.attrs.level !== 1 && value.attrs.level !== 2)) {
      fail(`${path}.attrs.level`, 'expected heading level 1 or 2');
    }
  }

  if (type === 'coreComponent') {
    const attrs = value.attrs;

    if (!isRecord(attrs) || typeof attrs.name !== 'string' || !attrs.name.trim()) {
      fail(`${path}.attrs.name`, 'expected a component name');
    }

    if (attrs.package !== undefined && attrs.package !== null && typeof attrs.package !== 'string') {
      fail(`${path}.attrs.package`, 'expected a package name or null');
    }

    if (value.content !== undefined) {
      fail(`${path}.content`, 'coreComponent is atomic');
    }

    return;
  }

  if (value.content === undefined) {
    return;
  }

  if (!Array.isArray(value.content)) {
    fail(`${path}.content`, 'expected an array');
  }

  for (const [index, child] of value.content.entries()) {
    assertNode(child, {
      path: `${path}.content[${index}]`,
      location: 'inline',
    });
  }
};

export const assertContentNode: (
  value: unknown,
  path?: string,
) => asserts value is BookContentNode = (value, path = 'node') => {
  assertNode(value, { path, location: 'any' });
};

export const assertContentDocument: (
  value: unknown,
  path?: string,
) => asserts value is BookContentDocument = (value, path = 'document') => {
  if (!isRecord(value) || value.type !== 'doc') {
    fail(path, 'expected a doc node');
  }

  if (value.attrs !== undefined && !isRecord(value.attrs)) {
    fail(`${path}.attrs`, 'expected an attributes object');
  }

  if (!Array.isArray(value.content) || value.content.length === 0) {
    fail(`${path}.content`, 'expected at least one block');
  }

  for (const [index, child] of value.content.entries()) {
    assertNode(child, {
      path: `${path}.content[${index}]`,
      location: 'block',
    });
  }
};
