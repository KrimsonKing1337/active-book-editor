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

const backgroundOptions = {
  style: { zIndex: 4 },
  images: [{ id: 'forest-image', src: 'assets/forest.webp', style: { zIndex: 1 } }],
  videos: [],
  shadow: { show: true, style: { backgroundColor: 'rgba(0,0,0,0.3)' } },
};

const sideOptions = {
  shadows: [{ id: 'shadow-1', animation: { preset: 'police', duration: 1000 } }],
  texts: [{ id: 'text-1', leftText: 'Лево', rightText: 'Право' }],
};

const flashlightOptions = {
  duration: 200,
  delay: 0,
  playOnLoad: true,
  withSideShadow: true,
  speed: 150,
};

test('compiles audio, vibration, flashlight, background and side and strips editor-only slug', () => {
  const document = {
    type: 'doc',
    attrs: {
      pageEffects: {
        audio: [{ id: 'a', type: 'audio', slug: 'Звук', options: audioOptions }],
        vibration: [{ id: 'v', type: 'vibration', slug: 'Толчок', options: vibrationOptions }],
        flashlight: [{ id: 'f', type: 'flashlight', slug: 'Вспышка', options: flashlightOptions }],
        background: [{ id: 'b', type: 'background', slug: 'Лес', options: backgroundOptions }],
        side: [{ id: 's', type: 'side', slug: 'Боковые', options: sideOptions }],
      },
    },
    content: [{ type: 'P' }],
  };

  const built = compileBookDocument(document);

  assert.deepEqual(built, {
    type: 'doc',
    attrs: {
      pageEffects: {
        audio: [{ id: 'a', type: 'audio', options: audioOptions }],
        vibration: [{ id: 'v', type: 'vibration', options: vibrationOptions }],
        flashlight: [{ id: 'f', type: 'flashlight', options: flashlightOptions }],
        background: [{ id: 'b', type: 'background', options: backgroundOptions }],
        side: [{ id: 's', type: 'side', options: sideOptions }],
      },
    },
    content: [{ type: 'P' }],
  });

  assert.equal(document.attrs.pageEffects.audio[0].slug, 'Звук');
  assert.equal(document.attrs.pageEffects.vibration[0].slug, 'Толчок');
  assert.equal(document.attrs.pageEffects.flashlight[0].slug, 'Вспышка');
  assert.equal(document.attrs.pageEffects.side[0].slug, 'Боковые');
});

test('an empty document compiles with empty effect groups', () => {
  assert.deepEqual(compileBookDocument({ type: 'doc', content: [] }), {
    type: 'doc',
    attrs: {
      pageEffects: { audio: [], vibration: [], flashlight: [], background: [], side: [] },
    },
    content: [],
  });
});
