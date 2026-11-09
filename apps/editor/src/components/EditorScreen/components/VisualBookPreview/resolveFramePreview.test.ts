import { expect, test } from 'vitest';

import type { FrameEffectDraft } from '../PageEffects/@types';

import { resolveFramePreview } from './resolveFramePreview';

const effect: FrameEffectDraft = {
  id: 'frame',
  type: 'frame',
  kind: 'shadow',
  slug: 'Frame preview',
  options: {
    shadow: {
      id: 'shadow',
      sides: ['top', 'left'],
      hidden: true,
      style: { opacity: 0.5 },
      animation: { preset: 'police', playState: 'running' },
    },
    text: {
      id: 'text',
      leftText: 'left',
      rightText: 'right',
      hidden: true,
      style: { color: 'red' },
      animation: { preset: 'none', playState: 'paused' },
    },
    style: { color: 'blue' },
  },
};

test('preview values override authored values without losing false, zero, or empty styles', () => {
  const before = JSON.stringify(effect);
  const result = resolveFramePreview({
    effect,
    previews: {
      '["frame","shadow"]': { hidden: false, playState: 'stopped' },
      '["frame","text"]': { hidden: false, playState: 'running' },
    },
    stylePreviews: {
      '["frame","shadow","shadow"]': { opacity: 0 },
      '["frame","text","text"]': {},
      '["frame","component","frame"]': {},
    },
  });

  expect(result.shadow).toMatchObject({
    hidden: false,
    style: { opacity: 0 },
    animation: { preset: 'police', playState: 'stopped' },
  });
  expect(result.text).toMatchObject({
    hidden: false,
    style: {},
    animation: { preset: 'none', playState: 'running' },
  });
  expect(result.style).toEqual({});
  expect(JSON.stringify(effect)).toBe(before);
});

test('missing previews retain authored styles, visibility and animation settings', () => {
  const result = resolveFramePreview({
    effect,
    previews: {},
    stylePreviews: {},
  });

  expect(result).toEqual(effect.options);
  expect(result.shadow?.style).toBe(effect.options.shadow?.style);
  expect(result.text?.style).toBe(effect.options.text?.style);
});

test('absent frame items stay absent even when stale preview entries exist', () => {
  const result = resolveFramePreview({
    effect: { ...effect, options: {} },
    previews: { '["frame","shadow"]': { hidden: false } },
    stylePreviews: { '["frame","text","text"]': { color: 'green' } },
  });

  expect(result).toEqual({
    shadow: undefined,
    text: undefined,
    style: undefined,
  });
});
