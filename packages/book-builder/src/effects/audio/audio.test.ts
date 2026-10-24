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

test('rejects ungrouped audio effects', () => {
  const ungrouped = [{
    id: 'audio-1',
    type: 'audio',
    slug: 'Дождь',
    options: audioOptions,
  }];

  assert.deepEqual(normalizeAudioEffects(ungrouped), []);
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
