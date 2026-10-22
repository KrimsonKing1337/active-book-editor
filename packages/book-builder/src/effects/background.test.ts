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

test('assigns stable IDs to images in older books', () => {
  const background = [{
    id: 'forest',
    type: 'background',
    options: { images: [{ src: 'assets/tree.webp' }, { src: 'assets/tree.webp' }] },
  }];

  const first = normalizeBackgroundEffects({ background });
  const second = normalizeBackgroundEffects({ background });

  assert.deepEqual(first, second);
  assert.equal('id' in background[0].options.images[0], false);
  assert.deepEqual(first[0].options.images?.map((image) => image.id), [
    'legacy-image:forest:0',
    'legacy-image:forest:1',
  ]);
});
