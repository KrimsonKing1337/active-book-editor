import assert from 'node:assert/strict';

import { test } from 'vitest';

import type { EditorEffectDraft } from '../../@types';

import { getLayerZIndexData } from './utils';

const effects: EditorEffectDraft[] = [
  {
    id: 'background',
    type: 'background',
    kind: 'background',
    slug: 'Background',
    options: {
      style: { zIndex: 2 },
      shadow: { style: { zIndex: 10 } },
      image: {
        id: 'image',
        src: '',
        style: { zIndex: 5 },
      },
      video: {
        id: 'video',
        src: '',
        style: { zIndex: 5 },
      },
    },
  },
  {
    id: 'frame-shadow',
    type: 'frame',
    kind: 'shadow',
    slug: 'Frame shadow',
    options: {
      shadow: {
        id: 'shadow',
        sides: ['left', 'right'],
        style: { zIndex: 3 },
      },
    },
  },
  {
    id: 'frame-text',
    type: 'frame',
    kind: 'text',
    slug: 'Frame text',
    options: {
      text: {
        id: 'text',
        leftText: 'Left',
        rightText: 'Right',
        style: { zIndex: 9 },
      },
    },
  },
  {
    id: 'frame-component',
    type: 'frame',
    kind: 'component',
    slug: 'Frame component',
    options: {
      style: { zIndex: 9 },
    },
  },
];

test('calculates layer bounds from background effects only', () => {
  const data = getLayerZIndexData({
    effects,
    currentStyle: { zIndex: 5 },
    defaultZIndex: 0,
    isFrame: false,
  });

  assert.deepEqual(data, {
    zIndex: 5,
    minimumZIndex: 2,
    maximumZIndex: 10,
    otherLayersAtSameIndex: true,
  });
});

test('calculates bounds and equal indexes from frame shadows, text and components only', () => {
  const data = getLayerZIndexData({
    effects,
    currentStyle: { zIndex: 9 },
    defaultZIndex: 0,
    isFrame: true,
  });

  assert.deepEqual(data, {
    zIndex: 9,
    minimumZIndex: 3,
    maximumZIndex: 9,
    otherLayersAtSameIndex: true,
  });
});

test('does not count the registered current layer as another layer', () => {
  const singleLayer: EditorEffectDraft[] = [
    {
      id: 'background',
      type: 'background',
      kind: 'background',
      slug: 'Background',
      options: {
        style: { zIndex: 5 },
      },
    },
  ];

  const registered = getLayerZIndexData({
    effects: singleLayer,
    currentStyle: { zIndex: 5 },
    defaultZIndex: 0,
    isFrame: false,
  });

  const unregistered = getLayerZIndexData({
    effects: singleLayer,
    currentStyle: {},
    defaultZIndex: 5,
    isFrame: false,
  });

  assert.equal(registered.otherLayersAtSameIndex, false);
  assert.equal(unregistered.otherLayersAtSameIndex, true);
});

test('uses zero for non-finite values and excludes invalid layer indexes', () => {
  const invalidLayer: EditorEffectDraft[] = [
    {
      id: 'background',
      type: 'background',
      kind: 'background',
      slug: 'Background',
      options: {
        style: { zIndex: 'auto' },
      },
    },
  ];

  const data = getLayerZIndexData({
    effects: invalidLayer,
    currentStyle: { zIndex: 'auto' },
    defaultZIndex: 5,
    isFrame: false,
  });

  assert.deepEqual(data, {
    zIndex: 0,
    minimumZIndex: 0,
    maximumZIndex: 0,
    otherLayersAtSameIndex: false,
  });
});
