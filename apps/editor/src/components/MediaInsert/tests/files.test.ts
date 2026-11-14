import { expect, test } from 'vitest';

import { assertMediaFile } from '../utils';

test('accepts supported image MIME/extensions and the filesystem fallback when MIME is missing', () => {
  expect(() => assertMediaFile(new File(['image'], 'image.PNG', { type: 'image/png' }), 'image')).not.toThrow();
  expect(() => assertMediaFile(new File(['image'], 'image.webp'), 'image')).not.toThrow();
});

test.each([
  new File([], 'empty.png', { type: 'image/png' }),
  new File(['image'], 'image.heic', { type: 'image/heic' }),
  new File(['movie'], 'image.png', { type: 'video/mp4' }),
  new File(['image'], 'image.svg', { type: 'text/html' }),
])('rejects empty, unsupported or mismatched imported images', (file) => {
  expect(() => assertMediaFile(file, 'image')).toThrow('поддерживаемого формата');
});

test('rejects unsupported video containers before attempting an import', () => {
  expect(() => assertMediaFile(new File(['movie'], 'movie.mov', { type: 'video/quicktime' }), 'video'))
    .toThrow('поддерживаемого формата');
});
