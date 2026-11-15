import assert from 'node:assert/strict';

import { test } from 'vitest';

import { createFrameEffect } from './utils';

test.each([
  'shadow',
  'text',
  'component',
] as const)('creates %s effects behind the narrative', (kind) => {
  const effect = createFrameEffect(kind);

  assert.equal(effect.depth?.plane, 'belowNarrative');
  assert.equal(effect.placement?.region, 'storyViewportFrame');
});
