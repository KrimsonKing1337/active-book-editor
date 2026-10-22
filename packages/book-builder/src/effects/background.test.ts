import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeBackgroundEffects } from './background';

test('preserves background image IDs', () => {
  const background = [{
    id: 'forest',
    type: 'background',
    options: { images: [{ id: 'tree', src: 'assets/tree.webp' }] },
  }];

  const normalized = normalizeBackgroundEffects({ background });

  assert.equal(normalized[0].options.images?.[0].id, 'tree');
});

test('rejects background images without IDs', () => {
  const background = [{
    id: 'forest',
    type: 'background',
    options: { images: [{ src: 'assets/tree.webp' }] },
  }];

  assert.deepEqual(normalizeBackgroundEffects({ background }), []);
});
