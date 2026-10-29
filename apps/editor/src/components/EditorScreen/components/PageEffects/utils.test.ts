import assert from 'node:assert/strict';

import { test } from 'vitest';

import { createSideEffect } from './utils';

test.each(['shadow', 'text', 'component'] as const)('creates %s effects behind the narrative', (kind) => {
  const effect = createSideEffect(kind);

  assert.equal(effect.options.layer, 'behind');
});
