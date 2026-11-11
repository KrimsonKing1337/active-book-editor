import type {
  BookContentDocument,
  BookContentNode,
  BookTextMark,
} from '@active-book/types';

import { isRecord } from '../effects/utils';

const formattingMarks = new Set(['bold', 'italic', 'strike', 'underline', 'code']);
const linkProtocols = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const attributesNames = ['target', 'rel', 'class'];

export const isContentLinkAllowed = (href: string): boolean => {
  try {
    const url = new URL(href, 'https://active-book.invalid/');

    return linkProtocols.has(url.protocol);
  } catch {
    return false;
  }
};

// У const-стрелки TypeScript требует явный тип переменной для сужения типов после вызова never.
function fail(path: string, message: string): never {
  throw new Error(`${path}: ${message}`);
}

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

type NodeLocation = 'block' | 'inline' | 'slide' | 'slideBlock' | 'any';

type AssertNodeOptions = {
  path: string;
  location: NodeLocation;
};

const assertNode = (value: unknown, options: AssertNodeOptions): void => {
  const { path, location } = options;

  if (!isRecord(value) || typeof value.type !== 'string') {
    fail(path, 'expected a node with a type');
  }

  const { type } = value;

  const isInline = type === 'text' || type === 'hardBreak';
  const isOrdinaryBlock = type === 'paragraph' || type === 'heading' || type === 'coreComponent';
  const isBlock = isOrdinaryBlock || type === 'carousel';
  const isSlide = type === 'carouselSlide';

  if (location === 'slideBlock' && (type === 'carousel' || type === 'segment')) {
    fail(path, `node "${type}" is not allowed inside carouselSlide`);
  }

  if (!isInline && !isBlock && !isSlide) {
    fail(path, `unknown node "${type}"`);
  }

  const wrongInline = location === 'inline' && !isInline;
  const wrongBlock = location === 'block' && !isBlock;
  const wrongSlide = location === 'slide' && !isSlide;
  const wrongSlideBlock = location === 'slideBlock' && !isOrdinaryBlock;

  const isWrongLocation = wrongInline || wrongBlock || wrongSlide || wrongSlideBlock;

  if (isWrongLocation) {
    fail(path, `node "${type}" is not allowed in ${location} content`);
  }

  if (isInline) {
    const valueTextIsValid = typeof value.text === 'string' && value.text.length !== 0;

    if (type === 'text' && !valueTextIsValid) {
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

  if (type === 'carousel' || isSlide) {
    if (!Array.isArray(value.content) || value.content.length === 0) {
      fail(`${path}.content`, `node "${type}" requires nonempty content`);
    }

    let childLocation: NodeLocation = 'slideBlock';

    if (type === 'carousel') {
      childLocation = 'slide';
    }

    for (const [index, child] of value.content.entries()) {
      const nodePath = `${path}.content[${index}]`;

      assertNode(child, {
        path: nodePath,
        location: childLocation,
      });
    }

    return;
  }

  if (type === 'heading') {
    const headingFail = () => {
      fail(`${path}.attrs.level`, 'expected heading level 1 or 2');
    };

    if (!isRecord(value.attrs)) {
      headingFail();
    }

    const attrs = value.attrs as Record<string, unknown>;
    const headingLevelIsWrong = attrs.level !== 1 && attrs.level !== 2;

    if (headingLevelIsWrong) {
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
