import { transform } from '@svgr/core';
import { expect, test } from 'vitest';

import { optimizeSvg } from './svg';

const source = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <title>Gradient</title>
  <defs><linearGradient id="paint"><stop stop-color="red" /></linearGradient></defs>
  <rect width="100" height="100" fill="url(#paint)" />
</svg>`;

test('preserves viewBox and prefixes matching SVG identifiers and references', () => {
  const result = transform.sync(source, {
    plugins: [optimizeSvg, '@svgr/plugin-jsx'],
  }, { filePath: '/icons/gradient.svg' });
  const gradientId = result.match(/id="([^"]+)"/)?.[1];

  expect(result).toContain('viewBox="0 0 100 100"');
  expect(gradientId).toMatch(/^gradient_svg__/);
  expect(result).toContain(`url(#${gradientId})`);
  expect(result).not.toContain('<title>');
});

test('respects the SVGR option to disable SVG optimization', () => {
  const result = transform.sync(source, {
    svgo: false,
    plugins: [optimizeSvg, '@svgr/plugin-jsx'],
  });

  expect(result).toContain('id="paint"');
  expect(result).toContain('url(#paint)');
});
