import { expect, test } from 'vitest';

import { contentAssetUrl, getMediaStyle } from '../layout';

test('maps numeric author dimensions to CSS properties without reader/Dialog preferences', () => {
  expect(getMediaStyle({ src: 'assets/image.png' })).toEqual({
    '--book-media-width': '100%',
    '--book-media-height': 'auto',
    '--book-media-start': '0px',
    '--book-media-end': 'auto',
    '--book-media-fit': 'contain',
  });
  const style = getMediaStyle({
    src: 'assets/image.png',
    width: { value: 45, unit: '%' },
    height: { value: 180, unit: 'px' },
    align: 'center',
    fit: 'cover',
  });
  expect(style).toMatchObject({
    '--book-media-width': '45%',
    '--book-media-height': '180px',
    '--book-media-start': 'auto',
    '--book-media-end': 'auto',
    '--book-media-fit': 'cover',
  });
  expect(style).not.toHaveProperty('objectFit');
  expect(style).not.toHaveProperty('--story-dialog-object-fit');
  expect(getMediaStyle({ src: 'assets/image.png', align: 'right' }))
    .toMatchObject({ '--book-media-start': 'auto', '--book-media-end': '0px' });
});

test('treats asset names as file names, including literal percent signs and URL punctuation', () => {
  expect(contentAssetUrl('assets/folder/a #?%.png')).toBe('./assets/folder/a%20%23%3F%25.png');
  expect(contentAssetUrl('assets/%2e%2e/image.png')).toBe('./assets/%252e%252e/image.png');
});
