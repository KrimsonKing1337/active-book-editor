import assert from 'node:assert/strict';

import { test } from 'vitest';

import type { FrameEffect } from '../effects';

import { compilePageDocument } from './compileBookDocument';

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

  const built = compilePageDocument(document);

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
  assert.deepEqual(compilePageDocument({ type: 'doc', content: [] }), {
    type: 'doc',
    attrs: {
      pageEffects: { audio: [], vibration: [], flashlight: [], background: [], frame: [] },
    },
    content: [],
  });
});

test('preserves independent frame layers, masks and component references in compiled JSON', () => {
  const frame: FrameEffect[] = [
    {
      id: 'shadow',
      type: 'frame',
      kind: 'shadow',
      slug: 'Shadow',
      options: {
        layer: 'behind',
        shadow: { id: 'shadow-1', sides: ['left', 'right'], style: { zIndex: 3 } },
      },
    },
    {
      id: 'text',
      type: 'frame',
      kind: 'text',
      slug: 'Text',
      options: {
        layer: 'above',
        text: { id: 'text-1', leftText: 'Left', rightText: 'Right', style: { zIndex: 7 } },
      },
    },
    {
      id: 'component',
      type: 'frame',
      kind: 'component',
      slug: 'Component',
      options: {
        layer: 'above',
        component: { package: 'custom-effects', name: 'Smoke' },
        frameMask: { enabled: true, sides: ['top', 'bottom'] },
        style: { zIndex: 5 },
      },
    },
  ];
  const document = {
    type: 'doc',
    attrs: { pageEffects: { frame } },
    content: [{ type: 'P' }],
  };
  const saved = JSON.parse(JSON.stringify(document));

  const built = compilePageDocument(saved);

  assert.deepEqual(built, {
    type: 'doc',
    attrs: {
      pageEffects: {
        audio: [],
        vibration: [],
        flashlight: [],
        background: [],
        frame: [
          { id: 'shadow', type: 'frame', kind: 'shadow', options: frame[0].options },
          { id: 'text', type: 'frame', kind: 'text', options: frame[1].options },
          { id: 'component', type: 'frame', kind: 'component', options: frame[2].options },
        ],
      },
    },
    content: document.content,
  });
  assert.deepEqual(saved, document);
});
