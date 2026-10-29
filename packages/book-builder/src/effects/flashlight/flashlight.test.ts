import assert from 'node:assert/strict';

import { test } from 'vitest';

import { normalizeFlashlightEffects } from './flashlight';

const options = {
  duration: 200,
  delay: 300,
  playOnLoad: true,
  withFrameShadow: true,
  speed: 150,
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
    { id: 'bad-shadow', type: 'flashlight', options: { ...options, withFrameShadow: 'yes' } },
    { id: 'bad-speed', type: 'flashlight', options: { ...options, speed: 0 } },
    { id: '', type: 'flashlight', options },
  ];

  assert.deepEqual(normalizeFlashlightEffects({ flashlight: invalid }), []);
});
