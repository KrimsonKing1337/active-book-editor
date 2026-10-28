import assert from 'node:assert/strict';

import { test } from 'vitest';

import {
  getHexColor,
  getHexFromRgba,
  getRgbaChannels,
  getRgbaError,
  normalizeRgbaChannel,
} from './color';

test('converts HEX with alpha to four RGBA channels', () => {
  assert.deepEqual(getRgbaChannels('#cc3e72cc'), ['204', '62', '114', '80']);
  assert.deepEqual(getRgbaChannels('#ff0000'), ['255', '0', '0', '100']);
});

test('converts RGBA percentages back to eight-digit HEX', () => {
  assert.equal(getHexFromRgba(['204', '62', '114', '80']), '#cc3e72cc');
  assert.equal(getHexFromRgba(['255', '0', '0', '0']), '#ff000000');
});

test('uses zero for empty channel values', () => {
  assert.equal(getHexFromRgba(['', '', '', '']), '#00000000');
  assert.equal(getHexFromRgba(['0', '0', '0', '']), '#00000000');
});

test('validates RGB and alpha independently', () => {
  assert.match(getRgbaError(['256', '0', '0', '100']) ?? '', /0 до 255/);
  assert.match(getRgbaError(['0', '0', '0', '101']) ?? '', /0 до 100/);
  assert.equal(getHexFromRgba(['256', '0', '0', '100']), null);
  assert.equal(getHexFromRgba(['0', '0', '0', '101']), null);
  assert.equal(getRgbaError(['255', '255', '255', '100']), null);
});

test('keeps normalized HEX format for the picker', () => {
  assert.equal(getHexColor('#cc3e72'), '#cc3e72ff');
});

test('clamps overflowing RGB and alpha values after editing', () => {
  assert.equal(normalizeRgbaChannel('600', 0), '255');
  assert.equal(normalizeRgbaChannel('600', 1), '255');
  assert.equal(normalizeRgbaChannel('600', 2), '255');
  assert.equal(normalizeRgbaChannel('600', 3), '100');
  assert.equal(normalizeRgbaChannel('44', 3), '44');
  assert.equal(normalizeRgbaChannel('', 0), '0');
  assert.equal(normalizeRgbaChannel('', 3), '0');
});
