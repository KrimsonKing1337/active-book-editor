import type {
  BookContentDocument,
  BookContentNode,
} from '@active-book/types';

import { isRecord } from '../effects/utils';

import { assertMediaAttributes } from './media';
import { assertMarks } from './marks';
import { fail } from './utils';

export { isContentLinkAllowed } from './marks';

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
  const isMedia = type === 'image' || type === 'video';
  const isOrdinaryBlock = type === 'paragraph' || type === 'heading' || type === 'coreComponent' || isMedia;
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

  if (type === 'image' || type === 'video') {
    assertMediaAttributes(value.attrs, { type, path: `${path}.attrs` });

    if (value.content !== undefined) {
      fail(`${path}.content`, `${type} is atomic`);
    }

    return;
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
    const attrs = value.attrs;

    if (!isRecord(attrs) || (attrs.level !== 1 && attrs.level !== 2)) {
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
