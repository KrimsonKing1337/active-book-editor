import assert from 'node:assert/strict';

import { test } from 'vitest';

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
  withFrameShadow: true,
  speed: 150,
};

const backgroundImageStyle = {
  zIndex: 1,
};

const backgroundImage = {
  id: 'forest-image',
  src: 'assets/forest.webp',
  style: backgroundImageStyle,
};

const backgroundOptions = {
  image: backgroundImage,
};

const frameText = {
  id: 'text-1',
  leftText: 'Лево',
  rightText: 'Право',
};

const frameOptions = {
  text: frameText,
};

test('compiles independent effects with kind and strips editor-only slug', () => {
  const document = {
    type: 'doc',
    attrs: {
      pageEffects: {
        audio: [{ id: 'a', type: 'audio', slug: 'Звук', options: audioOptions }],
        vibration: [{ id: 'v', type: 'vibration', slug: 'Толчок', options: vibrationOptions }],
        flashlight: [{ id: 'f', type: 'flashlight', slug: 'Вспышка', options: flashlightOptions }],
        background: [{ id: 'b', type: 'background', kind: 'image', slug: 'Лес', options: backgroundOptions }],
        frame: [{ id: 's', type: 'frame', kind: 'text', slug: 'Рамочные', options: frameOptions }],
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
        background: [{ id: 'b', type: 'background', kind: 'image', options: backgroundOptions }],
        frame: [{ id: 's', type: 'frame', kind: 'text', options: frameOptions }],
      },
    },
    content: [{ type: 'P' }],
  });
});

test('an empty document compiles with empty effect groups', () => {
  assert.deepEqual(compileBookDocument({ type: 'doc', content: [] }), {
    type: 'doc',
    attrs: {
      pageEffects: { audio: [], vibration: [], flashlight: [], background: [], frame: [] },
    },
    content: [],
  });
});
