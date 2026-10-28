
import assert from 'node:assert/strict';

import { test } from 'vitest';

import type { EditorEffectDraft } from '../../@types';

import { getLayerZIndexData } from './utils';

const effects = [
  {
    id: 'background',
    type: 'background',
    kind: 'background',
    slug: 'Background',
    options: {
      style: { zIndex: 2 },
      shadow: { style: { zIndex: 10 } },
      image: { style: { zIndex: 5 } },
      video: { style: { zIndex: 5 } },
    },
  },
  {
    id: 'side',
    type: 'side',
    kind: 'shadow',
    slug: 'Side',
    options: {
      style: { zIndex: 9 },
      shadow: { style: { zIndex: 3 } },
      text: { style: { zIndex: 9 } },
    },
  },
] as EditorEffectDraft[];

test('calculates layer bounds from background effects only', () => {
  const data = getLayerZIndexData({
    effects,
    currentStyle: { zIndex: 5 },
    defaultZIndex: 0,
    isSide: false,
  });

  assert.deepEqual(data, {
    zIndex: 5,
    minimumZIndex: 2,
    maximumZIndex: 10,
    otherLayersAtSameIndex: true,
  });
});

test('calculates layer bounds from side effects only', () => {
  const data = getLayerZIndexData({
    effects,
    currentStyle: { zIndex: 9 },
    defaultZIndex: 0,
    isSide: true,
  });

  assert.deepEqual(data, {
    zIndex: 9,
    minimumZIndex: 3,
    maximumZIndex: 9,
    otherLayersAtSameIndex: true,
  });
});

test('does not count the registered current layer as another layer', () => {
  const singleLayer = [
    {
      id: 'background',
      type: 'background',
      kind: 'background',
      slug: 'Background',
      options: {
        style: { zIndex: 5 },
      },
    },
  ] as EditorEffectDraft[];

  const registered = getLayerZIndexData({
    effects: singleLayer,
    currentStyle: { zIndex: 5 },
    defaultZIndex: 0,
    isSide: false,
  });

  const unregistered = getLayerZIndexData({
    effects: singleLayer,
    currentStyle: {},
    defaultZIndex: 5,
    isSide: false,
  });

  assert.equal(registered.otherLayersAtSameIndex, false);
  assert.equal(unregistered.otherLayersAtSameIndex, true);
});

test('uses zero for non-finite values and excludes invalid layer indexes', () => {
  const invalidLayer = [
    {
      id: 'background',
      type: 'background',
      kind: 'background',
      slug: 'Background',
      options: {
        style: { zIndex: 'auto' },
      },
    },
  ] as EditorEffectDraft[];

  const data = getLayerZIndexData({
    effects: invalidLayer,
    currentStyle: { zIndex: 'auto' },
    defaultZIndex: 5,
    isSide: false,
  });

  assert.deepEqual(data, {
    zIndex: 0,
    minimumZIndex: 0,
    maximumZIndex: 0,
    otherLayersAtSameIndex: false,
  });
});
