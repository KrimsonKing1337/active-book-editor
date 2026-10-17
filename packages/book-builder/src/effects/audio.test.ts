import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeAudioEffects } from './audio';

const audioOptions = {
  src: 'assets/audio/ambient.ogg',
  type: 'bg' as const,
  loop: true,
  playOnLoad: true,
  stopBy: 0,
  delay: 500,
  relativeVolume: 70,
  screamer: false,
  fadeOutWhenUnload: true,
};

test('migrates ungrouped legacy audio effects', () => {
  const legacy = [{
    id: 'legacy',
    slug: 'Дождь',
    options: audioOptions,
  }];

  assert.deepEqual(normalizeAudioEffects(legacy), [{ ...legacy[0], type: 'audio' }]);
});

test('keeps grouped audio effects and their discriminator', () => {
  const effect = {
    id: 'audio-1',
    type: 'audio',
    slug: 'Фон',
    options: audioOptions,
  };

  assert.deepEqual(normalizeAudioEffects({ audio: [effect] }), [effect]);
});
