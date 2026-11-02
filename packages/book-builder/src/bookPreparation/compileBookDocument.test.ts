import assert from 'node:assert/strict';

import { test } from 'vitest';

import type { FrameEffect } from '../effects';

import { draftToVisual } from '../visualEffects';

import { compileBookDocument, compilePageDocument } from './compileBookDocument';

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

test('compiles independent effects with kind and strips editor-only slug', () => {
  const document = {
    type: 'doc',
    attrs: {
      pageEffects: {
        audio: [{ id: 'a', type: 'audio', slug: 'Звук', options: audioOptions }],
        vibration: [{ id: 'v', type: 'vibration', slug: 'Толчок', options: vibrationOptions }],
        flashlight: [{ id: 'f', type: 'flashlight', slug: 'Вспышка', options: flashlightOptions }],
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
      },
    },
    content: [{ type: 'P' }],
  });
});

test('an empty document compiles with empty effect groups', () => {
  assert.deepEqual(compilePageDocument({ type: 'doc', content: [] }), {
    type: 'doc',
    attrs: {
      pageEffects: { audio: [], vibration: [], flashlight: [] },
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
  const visualEffects = frame.map((draft) => draftToVisual({ draft, pageId: 'owner' }));
  const document = {
    type: 'doc',
    attrs: { visualEffects },
    content: [{ type: 'P' }],
  };
  const book = { type: 'book', pages: [{ id: 'owner', document }], visualEffects: [] };
  const saved = JSON.parse(JSON.stringify(book));
  const built = compileBookDocument(saved);
  assert.deepEqual(built.visualEffects.map((cur) => cur.effect.id), ['shadow', 'text', 'component']);
  assert.deepEqual(built.visualEffects.map((cur) => cur.effect.depth), [
    { plane: 'scene', order: 3 },
    { plane: 'aboveNarrative', order: 7 },
    { plane: 'aboveNarrative', order: 5 },
  ]);
  assert.deepEqual(built.visualEffects[2].effect.visibility, { region: 'frame', sides: ['top', 'bottom'] });
  assert.equal(built.visualEffects[2].effect.definitionId, 'custom.frame/custom-effects/Smoke');
  assert.equal(built.pages[0].document.attrs?.visualEffects, undefined);
  assert.deepEqual(saved, book);
});
