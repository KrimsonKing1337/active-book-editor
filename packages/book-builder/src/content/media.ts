import { isRecord } from '../effects/utils';

import { contentMediaFormat } from './formats';

/** These are file paths, not URLs: rendering encodes each segment exactly once. */
export const isContentAssetPath = (path: unknown): path is string => {
  if (typeof path !== 'string' || !path.startsWith('assets/') || path.includes('\\')) {
    return false;
  }

  const hasControl = [...path].some((character) => {
    const code = character.codePointAt(0)!;

    return code < 32 || code === 127;
  });
  const invalidSegment = path.split('/').some((segment) => !segment || segment === '.' || segment === '..');

  return !hasControl && !invalidSegment;
};

const assertLength = (length: unknown, options: {
  path: string;
  allowPercent: boolean
}): void => {
  if (length === undefined || length === null) {
    return;
  }

  const { path, allowPercent } = options;

  if (!isRecord(length) || typeof length.value !== 'number' || !Number.isFinite(length.value) || length.value <= 0) {
    throw new Error(`${path}: expected a positive finite length`);
  }

  const isPixel = length.unit === 'px';
  const isPercent = allowPercent && length.unit === '%' && length.value <= 100;

  if (!isPixel && !isPercent) {
    throw new Error(`${path}: unsupported unit or percentage outside (0, 100]`);
  }

  if (Object.keys(length).some((key) => key !== 'value' && key !== 'unit')) {
    throw new Error(`${path}: unknown length attribute`);
  }
};

type MediaValidation = {
  type: 'image' | 'video';
  path: string;
};

export const assertMediaAttributes = (attrs: unknown, { type, path }: MediaValidation): void => {
  if (!isRecord(attrs) || !isContentAssetPath(attrs.src)) {
    throw new Error(`${path}.src: expected a file path inside assets/`);
  }

  if (!contentMediaFormat(attrs.src, type)) {
    throw new Error(`${path}.src: unsupported ${type} file extension`);
  }

  assertLength(attrs.width, { path: `${path}.width`, allowPercent: true });
  assertLength(attrs.height, { path: `${path}.height`, allowPercent: false });

  const isInvalidAlign = typeof attrs.align !== 'string' || ![
    'left',
    'center',
    'right',
  ].includes(attrs.align);

  if (attrs.align !== undefined && isInvalidAlign) {
    throw new Error(`${path}.align: expected left, center or right`);
  }

  if (attrs.fit !== undefined && attrs.fit !== 'contain' && attrs.fit !== 'cover') {
    throw new Error(`${path}.fit: expected contain or cover`);
  }

  const allowed = new Set([
    'src',
    'width',
    'height',
    'align',
    'fit',
  ]);

  if (type === 'image') {
    allowed.add('alt');

    if (attrs.alt !== undefined && typeof attrs.alt !== 'string') {
      throw new Error(`${path}.alt: expected a string`);
    }
  } else {
    allowed.add('poster');

    if (attrs.poster !== undefined && attrs.poster !== null) {
      if (!isContentAssetPath(attrs.poster) || !contentMediaFormat(attrs.poster, 'image')) {
        throw new Error(`${path}.poster: expected an image file path inside assets/`);
      }
    }

    for (const name of [
      'controls',
      'autoPlay',
      'muted',
      'loop',
    ]) {
      allowed.add(name);

      if (attrs[name] !== undefined && typeof attrs[name] !== 'boolean') {
        throw new Error(`${path}.${name}: expected a boolean`);
      }
    }
  }

  for (const name of Object.keys(attrs)) {
    if (!allowed.has(name)) {
      throw new Error(`${path}.${name}: unknown media attribute`);
    }
  }
};
