
import assert from 'node:assert/strict';

import { test } from 'vitest';

import type { EditorEffectDraft } from '../@types';

import {
  applyPendingStylePreviews,
  getBackgroundPreviewKey,
  getFramePreviewKey,
  getFrameStylePreviewKey,
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

const frame = {
  id: 'frame-1',
  type: 'frame',
  kind: 'shadow',
  slug: 'Frame',
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

  const frameKey = getFrameStylePreviewKey({
    effectId: 'frame-1',
    kind: 'text',
    itemId: 'text-1',
  });

  assert.equal(backgroundKey, JSON.stringify([
    'background-1',
    'image',
    'image-1',
  ]));
  assert.equal(defaultMediaKey, JSON.stringify([
    'background-1',
    'shadow',
    null,
  ]));
  assert.equal(frameKey, JSON.stringify([
    'frame-1',
    'text',
    'text-1',
  ]));
  assert.equal(getFramePreviewKey('frame-1', 'text-1'), JSON.stringify(['frame-1', 'text-1']));
});

test('commits pending background and frame styles without mutating existing effects', () => {
  const backgroundKey = getBackgroundPreviewKey({
    effectId: 'background-1',
    layer: 'image',
    mediaId: 'image-1',
  });

  const frameKey = getFrameStylePreviewKey({
    effectId: 'frame-1',
    kind: 'shadow',
    itemId: 'shadow-1',
  });

  const updatedEffects = applyPendingStylePreviews({
    effects: [background, frame],
    backgroundPreviews: {
      [backgroundKey]: { opacity: 0.25 },
    },
    framePreviews: {
      [frameKey]: { zIndex: 10 },
    },
  });

  const updatedBackground = updatedEffects[0];
  const updatedFrame = updatedEffects[1];

  if (updatedBackground.type !== 'background' || updatedFrame.type !== 'frame') {
    throw new Error('Unexpected effect types');
  }

  assert.deepEqual(updatedBackground.options.image?.style, { opacity: 0.25 });
  assert.deepEqual(updatedBackground.options.shadow?.style, { opacity: 0.5 });
  assert.deepEqual(updatedFrame.options.shadow?.style, { zIndex: 10 });
  assert.deepEqual(updatedFrame.options.text?.style, { zIndex: 3 });

  assert.notEqual(updatedBackground, background);
  assert.notEqual(updatedFrame, frame);
});

test('keeps effect references unchanged when there are no relevant previews', () => {
  const effects = [background, frame];

  const updatedEffects = applyPendingStylePreviews({
    effects,
    backgroundPreviews: {},
    framePreviews: {},
  });

  assert.equal(updatedEffects[0], background);
  assert.equal(updatedEffects[1], frame);
});

test('groups independent background and frame effects', () => {
  const previous = {

    vibration: [],
    flashlight: [],
    background: [],
    frame: [],
  };

  const grouped = groupPageEffects({
    effects: [background, frame],
    previous,
  });

  assert.equal(grouped.background?.[0], background);
  assert.equal(grouped.frame?.[0], frame);
});
