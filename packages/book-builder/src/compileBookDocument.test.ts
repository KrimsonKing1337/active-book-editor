import assert from 'node:assert/strict';
import test from 'node:test';

import { compileBookDocument } from './compileBookDocument';

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

const flashlightOptions = {
  duration: 200,
  delay: 0,
  playOnLoad: true,
  withSideShadow: true,
  speed: 150,
};

test('compiles audio, vibration and flashlight and strips editor-only slug', () => {
  const document = {
    type: 'doc',
    attrs: {
      pageEffects: {
        audio: [{ id: 'a', type: 'audio', slug: 'Звук', options: audioOptions }],
        vibration: [{ id: 'v', type: 'vibration', slug: 'Толчок', options: vibrationOptions }],
        flashlight: [{ id: 'f', type: 'flashlight', slug: 'Вспышка', options: flashlightOptions }],
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
        flashlight: [{ id: 'f', type: 'flashlight', options: flashlightOptions }],
      },
    },
    content: [{ type: 'activeBookP' }],
  });

  assert.equal(document.attrs.pageEffects.audio[0].slug, 'Звук');
  assert.equal(document.attrs.pageEffects.vibration[0].slug, 'Толчок');
  assert.equal(document.attrs.pageEffects.flashlight[0].slug, 'Вспышка');
});

test('an empty document compiles with empty effect groups', () => {
  assert.deepEqual(compileBookDocument({ type: 'doc', content: [] }), {
    type: 'doc',
    attrs: {
      pageEffects: { audio: [], vibration: [], flashlight: [] },
    },
    content: [],
  });
});
