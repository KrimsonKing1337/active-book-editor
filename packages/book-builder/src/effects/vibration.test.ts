import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeVibrationEffects } from './vibration.ts';

const options = {
  duration: 250,
  delay: 300,
  playOnLoad: true,
};

test('normalizes grouped vibration effects', () => {
  const effect = {
    id: 'vibration-1',
    type: 'vibration',
    slug: 'Тревога',
    options,
  };

  assert.deepEqual(normalizeVibrationEffects({ vibration: [effect] }), [effect]);
});

test('rejects invalid vibration effects', () => {
  const invalid = {
    type: 'vibration',
    id: 'bad',
    options: { duration: -1, delay: 0, playOnLoad: true },
  };

  assert.deepEqual(normalizeVibrationEffects({ vibration: [invalid] }), []);
});
