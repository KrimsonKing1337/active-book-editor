import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeBackgroundEffects } from './background';

test('preserves background image IDs', () => {
  const image = {
    id: 'tree',
    src: 'assets/tree.webp',
  };

  const options = {
    images: [image],
  };

  const backgroundEffect = {
    id: 'forest',
    type: 'background',
    options,
  };

  const background = [backgroundEffect];

  const normalized = normalizeBackgroundEffects({ background });

  assert.equal(normalized[0].options.images?.[0].id, 'tree');
});

test('rejects background images without IDs', () => {
  const image = {
    src: 'assets/tree.webp',
  };

  const options = {
    images: [image],
  };

  const backgroundEffect = {
    id: 'forest',
    type: 'background',
    options,
  };

  const background = [backgroundEffect];

  assert.deepEqual(normalizeBackgroundEffects({ background }), []);
});
