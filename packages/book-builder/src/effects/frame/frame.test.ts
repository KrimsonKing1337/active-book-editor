import assert from 'node:assert/strict';

import { test } from 'vitest';

import type { FrameSide } from '@active-book/core/hooks/effects/frame';

import { normalizeFrameEffects, resolveFrameOptions } from './frame';

test('normalizes independent shadow, text and component effects', () => {
  const frame = [
    {
      id: 'shadow',
      type: 'frame',
      kind: 'shadow',
      options: {
        shadow: {
          id: 'shadow-1',
          sides: ['left', 'right'],
          thickness: 40,
        },
      },
    },
    {
      id: 'text',
      type: 'frame',
      kind: 'text',
      options: {
        text: {
          id: 'text-1',
          leftText: 'Лево',
          rightText: 'Право',
        },
      },
    },
    {
      id: 'component',
      type: 'frame',
      kind: 'component',
      options: {
        custom: { tint: 'blue' },
      },
    },
  ];

  const result = normalizeFrameEffects({ frame });

  assert.equal(result.length, 3);
  assert.equal(result[0].slug, 'Новый рамочный эффект');
  assert.equal(result[0].options.shadow?.id, 'shadow-1');
  assert.deepEqual(result[0].options.shadow?.sides, ['left', 'right']);
  assert.equal(result[1].options.text?.id, 'text-1');
  assert.deepEqual(result[2].options.custom, { tint: 'blue' });
});

test('rejects malformed frame groups and invalid independent text', () => {
  const invalidKind = {
    id: 'legacy',
    type: 'frame',
    options: {
      shadows: [
        {
          id: 'shadow-1',
        },
      ],
    },
  };

  const invalid = {
    id: 'invalid',
    type: 'frame',
    kind: 'text',
    options: {
      text: {
        id: 'text-1',
        leftText: 123,
        rightText: '',
      },
    },
  };

  assert.deepEqual(normalizeFrameEffects({ frame: [invalidKind, invalid] }), []);
});

test('resolves custom frame layer styles on the wrapper', () => {
  const result = resolveFrameOptions({
    style: {
      zIndex: 7,
      opacity: 0.8,
    },
    styleFilters: [
      {
        id: 'blur-one',
        property: 'backdropFilter',
        function: 'blur',
        value: '3px',
      },
    ],
  });

  assert.equal(result.style.zIndex, 7);
  assert.equal(result.style.opacity, 0.8);
  assert.equal(result.style.backdropFilter, 'blur(3px)');
});

test('resolves filters on one frame effect at a time', () => {
  const shadow = {
    id: 'shadow',
    sides: ['top', 'bottom'] as FrameSide[],
    style: {
      color: '#ff0000',
      zIndex: 4,
    },
    styleFilters: [
      {
        id: 'blur',
        property: 'filter' as const,
        function: 'blur' as const,
        value: '5px',
      },
    ],
  };

  const text = {
    id: 'text',
    leftText: 'Left',
    rightText: 'Right',
    style: {
      color: '#ffffff',
      zIndex: 3,
    },
    styleFilters: [
      {
        id: 'fade',
        property: 'filter' as const,
        function: 'opacity' as const,
        value: '50%',
      },
    ],
  };

  const result = resolveFrameOptions({
    shadow,
    text,
  });

  assert.deepEqual(result.shadow, {
    id: 'shadow',
    sides: ['top', 'bottom'],
    style: {
      color: '#ff0000',
      zIndex: 4,
      filter: 'blur(5px)',
    },
  });

  assert.equal(result.text?.style.filter, 'opacity(50%)');
  assert.deepEqual(shadow.style, {
    color: '#ff0000',
    zIndex: 4,
  });
});

test('rejects missing frame text fields and invalid shadow IDs', () => {
  const malformed = [
    {
      id: 'shadow',
      type: 'frame',
      kind: 'shadow',
      options: {
        shadow: {
          id: ' ',
        },
      },
    },
    {
      id: 'text',
      type: 'frame',
      kind: 'text',
      options: {
        text: {
          id: 'text-1',
          leftText: 'Left',
        },
      },
    },
    {
      id: 'not-an-object',
      type: 'frame',
      kind: 'text',
      options: {
        text: null,
      },
    },
  ];

  assert.deepEqual(normalizeFrameEffects({ frame: malformed }), []);
});
