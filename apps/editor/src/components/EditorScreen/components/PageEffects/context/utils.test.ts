
import assert from 'node:assert/strict';

import { test } from 'vitest';

import type { EditorEffectDraft } from '../@types';

import {
  applyPendingStylePreviews,
  getBackgroundPreviewKey,
  getSidePreviewKey,
  getSideStylePreviewKey,
  groupPageEffects,
} from './utils';

const background = {
  id: 'background-1',
  type: 'background',
  kind: 'image',
  slug: 'Background',
  options: {
    style: {
      zIndex: 1,
    },
    image: {
      id: 'image-1',
      src: 'assets/image.png',
      style: {
        opacity: 1,
      },
    },
    shadow: {
      style: {
        opacity: 0.5,
      },
    },
  },
} as EditorEffectDraft;

const side = {
  id: 'side-1',
  type: 'side',
  kind: 'shadow',
  slug: 'Side',
  options: {
    shadow: {
      id: 'shadow-1',
      style: {
        zIndex: 2,
      },
    },
    text: {
      id: 'text-1',
      leftText: 'left',
      rightText: 'right',
      style: {
        zIndex: 3,
      },
    },
  },
} as EditorEffectDraft;

test('preserves existing preview key formats', () => {
  const backgroundKey = getBackgroundPreviewKey({
    effectId: 'background-1',
    layer: 'image',
    mediaId: 'image-1',
  });

  const defaultMediaKey = getBackgroundPreviewKey({
    effectId: 'background-1',
    layer: 'shadow',
  });

  const sideKey = getSideStylePreviewKey({
    effectId: 'side-1',
    kind: 'text',
    itemId: 'text-1',
  });

  assert.equal(backgroundKey, JSON.stringify(['background-1', 'image', 'image-1']));
  assert.equal(defaultMediaKey, JSON.stringify(['background-1', 'shadow', null]));
  assert.equal(sideKey, JSON.stringify(['side-1', 'text', 'text-1']));
  assert.equal(getSidePreviewKey('side-1', 'text-1'), JSON.stringify(['side-1', 'text-1']));
});

test('commits pending background and side styles without mutating existing effects', () => {
  const backgroundKey = getBackgroundPreviewKey({
    effectId: 'background-1',
    layer: 'image',
    mediaId: 'image-1',
  });

  const sideKey = getSideStylePreviewKey({
    effectId: 'side-1',
    kind: 'shadow',
    itemId: 'shadow-1',
  });

  const updatedEffects = applyPendingStylePreviews({
    effects: [background, side],
    backgroundPreviews: {
      [backgroundKey]: { opacity: 0.25 },
    },
    sidePreviews: {
      [sideKey]: { zIndex: 10 },
    },
  });

  const updatedBackground = updatedEffects[0];
  const updatedSide = updatedEffects[1];

  if (updatedBackground.type !== 'background' || updatedSide.type !== 'side') {
    throw new Error('Unexpected effect types');
  }

  assert.deepEqual(updatedBackground.options.image?.style, { opacity: 0.25 });
  assert.deepEqual(updatedBackground.options.shadow?.style, { opacity: 0.5 });
  assert.deepEqual(updatedSide.options.shadow?.style, { zIndex: 10 });
  assert.deepEqual(updatedSide.options.text?.style, { zIndex: 3 });

  assert.notEqual(updatedBackground, background);
  assert.notEqual(updatedSide, side);
});

test('keeps effect references unchanged when there are no relevant previews', () => {
  const effects = [background, side];

  const updatedEffects = applyPendingStylePreviews({
    effects,
    backgroundPreviews: {},
    sidePreviews: {},
  });

  assert.equal(updatedEffects[0], background);
  assert.equal(updatedEffects[1], side);
});

test('groups independent background and side effects', () => {
  const previous = {
    audio: [],
    vibration: [],
    flashlight: [],
    background: [],
    side: [],
  };

  const grouped = groupPageEffects({
    effects: [background, side],
    previous,
  });

  assert.equal(grouped.background?.[0], background);
  assert.equal(grouped.side?.[0], side);
  assert.deepEqual(grouped.audio, []);
});
