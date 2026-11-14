import { isRecord } from '../effects/utils';

import { contentMediaFormat } from './formats';

/** These are file paths, not URLs: rendering encodes each segment exactly once. */
export const isContentAssetPath = (path: unknown): path is string => {
  if (typeof path !== 'string' || !path.startsWith('assets/') || path.includes('\\')) {
    return false;
  }

  const hasControl = [...path].some((characterCur) => {
    const code = characterCur.codePointAt(0)!;

    return code < 32 || code === 127;
  });

  const invalidSegment = path.split('/').some((segmentCur) => {
    return !segmentCur || segmentCur === '.' || segmentCur === '..';
  });

  return !hasControl && !invalidSegment;
};

type AssertLengthOptions = {
  path: string;
  allowPercent: boolean
};

const assertLength = (length: unknown, options: AssertLengthOptions): void => {
  if (length === undefined || length === null) {
    return;
  }

  const { path, allowPercent } = options;

  if (!isRecord(length) || typeof length.value !== 'number') {
    throw new Error(`${path}: expected a number`);
  }

  if (!Number.isFinite(length.value) || length.value <= 0) {
    throw new Error(`${path}: expected a positive finite length`);
  }

  const isPixel = length.unit === 'px';
  const isPercent = allowPercent && length.unit === '%' && length.value <= 100;

  if (!isPixel && !isPercent) {
    throw new Error(`${path}: unsupported unit or percentage outside (0, 100]`);
  }

  const wrongLengthAttr = Object.keys(length).some((keyCur) => {
    return keyCur !== 'value' && keyCur !== 'unit';
  });

  if (wrongLengthAttr) {
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

  if (typeof attrs.align !== 'string') {
    throw new Error(`${path}.align: expected a string`);
  }

  const alings = [
    'left',
    'center',
    'right',
  ];

  const isInvalidAlign = !alings.includes(attrs.align);

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

    const mediaAttrs = [
      'controls',
      'autoPlay',
      'muted',
      'loop',
    ];

    for (const nameCur of mediaAttrs) {
      allowed.add(nameCur);

      if (attrs[nameCur] !== undefined && typeof attrs[nameCur] !== 'boolean') {
        throw new Error(`${path}.${nameCur}: expected a boolean`);
      }
    }
  }

  for (const nameCur of Object.keys(attrs)) {
    if (!allowed.has(nameCur)) {
      throw new Error(`${path}.${nameCur}: unknown media attribute`);
    }
  }
};
