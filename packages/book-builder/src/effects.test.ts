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
  };

  assert.deepEqual(normalizePageEffects(grouped), grouped);
});

test('the built document strips editor labels and retains runtime settings', () => {
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
      },
    },
    content: [{ type: 'activeBookP' }],
  });
  assert.equal(document.attrs.pageEffects.audio[0].slug, 'Фон');
});

test('an empty or old document compiles with an empty grouped effect collection', () => {
  const built = compileBookDocument({ type: 'doc', content: [] });

  assert.deepEqual(built, {
    type: 'doc',
    attrs: {
      pageEffects: { audio: [] },
    },
    content: [],
  });
});
