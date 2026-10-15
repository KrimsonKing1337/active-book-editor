import assert from 'node:assert/strict';
import test from 'node:test';

import { compileBookDocument, normalizePageEffects } from './effects.ts';

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

const vibrationOptions = {
  duration: 250,
  delay: 300,
  playOnLoad: true,
};

test('migrates legacy pageEffects arrays without changing audio settings', () => {
  const legacyEffects = [{
    id: 'old-audio',
    slug: 'Дождь',
    options: audioOptions,
  }];

  assert.deepEqual(normalizePageEffects(legacyEffects), {
    audio: [{
      ...legacyEffects[0],
      type: 'audio',
    }],
    vibration: [],
  });
});

test('keeps grouped audio effects and their type discriminator', () => {
  const grouped = {
    audio: [{
      id: 'audio-1',
      type: 'audio',
      slug: 'Фон',
      options: audioOptions,
    }],
    vibration: [],
  };

  assert.deepEqual(normalizePageEffects(grouped), grouped);
});

test('keeps grouped vibration effects without mixing them with audio', () => {
  const grouped = {
    audio: [],
    vibration: [{
      id: 'vibration-1',
      type: 'vibration',
      slug: 'Тревога',
      options: vibrationOptions,
    }],
  };

  assert.deepEqual(normalizePageEffects(grouped), grouped);
});

test('the built document strips editor labels for audio and vibration', () => {
  const document = {
    type: 'doc',
    attrs: {
      pageEffects: {
        audio: [{
          id: 'audio-1',
          type: 'audio',
          slug: 'Фон',
          options: audioOptions,
        }],
        vibration: [{
          id: 'vibration-1',
          type: 'vibration',
          slug: 'Тревога',
          options: vibrationOptions,
        }],
      },
    },
    content: [{ type: 'activeBookP' }],
  };

  const built = compileBookDocument(document);

  assert.deepEqual(built, {
    type: 'doc',
    attrs: {
      pageEffects: {
        audio: [{
          id: 'audio-1',
          type: 'audio',
          options: audioOptions,
        }],
        vibration: [{
          id: 'vibration-1',
          type: 'vibration',
          options: vibrationOptions,
        }],
      },
    },
    content: [{ type: 'activeBookP' }],
  });

  assert.equal(document.attrs.pageEffects.audio[0].slug, 'Фон');
  assert.equal(document.attrs.pageEffects.vibration[0].slug, 'Тревога');
});

test('an empty or old document compiles with empty grouped effects', () => {
  const built = compileBookDocument({ type: 'doc', content: [] });

  assert.deepEqual(built, {
    type: 'doc',
    attrs: {
      pageEffects: { audio: [], vibration: [] },
    },
    content: [],
  });
});

test('rejects malformed vibration options instead of emitting invalid runtime effects', () => {
  const normalized = normalizePageEffects({
    vibration: [{
      id: 'bad',
      type: 'vibration',
      slug: 'Invalid',
      options: { duration: -1, delay: 0, playOnLoad: true },
    }],
  });

  assert.deepEqual(normalized, { audio: [], vibration: [] });
});
