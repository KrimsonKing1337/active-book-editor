import assert from 'node:assert/strict';

import { test } from 'vitest';

import type { FrameEffect } from './frame';

import { normalizePageEffects } from './utils';

const frame: FrameEffect[] = [
  {
    id: 'shadow',
    type: 'frame',
    kind: 'shadow',
    slug: 'Shadow',
    options: {
      shadow: {
        id: 'shadow-1',
        sides: ['left', 'right'],
        style: { zIndex: 3 },
      },
    },
  },
  {
    id: 'text',
    type: 'frame',
    kind: 'text',
    slug: 'Text',
    options: {
      text: {
        id: 'text-1',
        leftText: 'Left',
        rightText: 'Right',
        style: { zIndex: 7 },
      },
    },
  },
  {
    id: 'component',
    type: 'frame',
    kind: 'component',
    slug: 'Component',
    options: {
      component: {
        package: 'custom-effects',
        name: 'Smoke',
      },
      style: { zIndex: 5 },
    },
  },
];

test('restores every frame kind and its placement from saved page effects', () => {
  const background = [
    {
      id: 'background',
      type: 'background',
      kind: 'background',
      slug: 'Background',
      options: { style: { zIndex: 1 } },
    },
  ];
  const saved = JSON.parse(JSON.stringify({
    background,
    frame,
  }));

  const normalized = normalizePageEffects(saved);

  assert.deepEqual(normalized, {
    audio: [],
    vibration: [],
    flashlight: [],
    background,
    frame,
  });
  assert.deepEqual(normalizePageEffects(normalized), normalized);
});

test('normalizes absent and malformed frame groups to empty lists', () => {
  assert.deepEqual(normalizePageEffects(null), {
    audio: [],
    vibration: [],
    flashlight: [],
    background: [],
    frame: [],
  });

  const normalized = normalizePageEffects({
    frame: {},
    background: [],
  });

  assert.deepEqual(normalized.frame, []);
  assert.deepEqual(normalized.background, []);
});
