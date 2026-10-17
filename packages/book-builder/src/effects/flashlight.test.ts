import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeFlashlightEffects } from './flashlight';

const options = {
  duration: 200,
  delay: 300,
  playOnLoad: true,
  sideShadow: true,
};

test('normalizes grouped flashlight effects', () => {
  const effect = {
    id: 'flashlight-1',
    type: 'flashlight',
    slug: 'Молния',
    options,
  };

  assert.deepEqual(normalizeFlashlightEffects({ flashlight: [effect] }), [effect]);
});

test('rejects invalid flashlight effects', () => {
  const invalid = [
    { id: 'bad-duration', type: 'flashlight', options: { ...options, duration: -1 } },
    { id: 'bad-delay', type: 'flashlight', options: { ...options, delay: -1 } },
    { id: 'bad-shadow', type: 'flashlight', options: { ...options, sideShadow: 'yes' } },
    { id: '', type: 'flashlight', options },
  ];

  assert.deepEqual(normalizeFlashlightEffects({ flashlight: invalid }), []);
});
