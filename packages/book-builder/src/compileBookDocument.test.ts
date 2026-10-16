import assert from 'node:assert/strict';
import test from 'node:test';

import { compileBookDocument } from './compileBookDocument.ts';

const audioOptions = {
  src: 'assets/rain.ogg',
  type: 'bg',
  loop: true,
  playOnLoad: true,
  stopBy: 0,
  delay: 0,
  relativeVolume: 70,
  screamer: false,
  fadeOutWhenUnload: true,
};

const vibrationOptions = {
  duration: 250,
  delay: 300,
  playOnLoad: true,
};

test('compiles audio and vibration and strips editor-only slug', () => {
  const document = {
    type: 'doc',
    attrs: {
      pageEffects: {
        audio: [{ id: 'a', type: 'audio', slug: 'Звук', options: audioOptions }],
        vibration: [{ id: 'v', type: 'vibration', slug: 'Толчок', options: vibrationOptions }],
      },
    },
    content: [{ type: 'activeBookP' }],
  };

  const built = compileBookDocument(document);

  assert.deepEqual(built, {
    type: 'doc',
    attrs: {
      pageEffects: {
        audio: [{ id: 'a', type: 'audio', options: audioOptions }],
        vibration: [{ id: 'v', type: 'vibration', options: vibrationOptions }],
      },
    },
    content: [{ type: 'activeBookP' }],
  });

  assert.equal(document.attrs.pageEffects.audio[0].slug, 'Звук');
  assert.equal(document.attrs.pageEffects.vibration[0].slug, 'Толчок');
});

test('an empty document compiles with empty effect groups', () => {
  assert.deepEqual(compileBookDocument({ type: 'doc', content: [] }), {
    type: 'doc',
    attrs: {
      pageEffects: { audio: [], vibration: [] },
    },
    content: [],
  });
});
