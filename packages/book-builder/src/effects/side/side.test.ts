import assert from 'node:assert/strict';

import { test } from 'vitest';

import { normalizeSideEffects, resolveSideOptions } from './side';

test('normalizes independent shadow, text and component effects', () => {
  const side = [
    {
      id: 'shadow',
      type: 'side',
      kind: 'shadow',
      options: {
        shadow: {
          id: 'shadow-1',
          thickness: 40,
        },
      },
    },
    {
      id: 'text',
      type: 'side',
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
      type: 'side',
      kind: 'component',
      options: {},
    },
  ];

  const result = normalizeSideEffects({ side });

  assert.equal(result.length, 3);
  assert.equal(result[0].options.shadow?.id, 'shadow-1');
  assert.equal(result[1].options.text?.id, 'text-1');
});

test('rejects legacy side groups and invalid independent text', () => {
  const legacy = {
    id: 'legacy',
    type: 'side',
    options: {
      shadows: [{
        id: 'shadow-1',
      }],
    },
  };

  const invalid = {
    id: 'invalid',
    type: 'side',
    kind: 'text',
    options: {
      text: {
        id: 'text-1',
        leftText: 123,
        rightText: '',
      },
    },
  };

  assert.deepEqual(normalizeSideEffects({ side: [legacy, invalid] }), []);
});

test('resolves custom side layer styles on the wrapper', () => {
  const result = resolveSideOptions({
    style: {
      zIndex: 7,
      opacity: 0.8,
    },
    styleFilters: [{
      id: 'blur-one',
      property: 'backdropFilter',
      function: 'blur',
      value: '3px',
    }],
  });

  assert.equal(result.style.zIndex, 7);
  assert.equal(result.style.opacity, 0.8);
  assert.equal(result.style.backdropFilter, 'blur(3px)');
});

test('resolves filters on one side effect at a time', () => {
  const shadow = {
    id: 'shadow',
    style: {
      color: '#ff0000',
      zIndex: 4,
    },
    styleFilters: [{
      id: 'blur',
      property: 'filter' as const,
      function: 'blur' as const,
      value: '5px',
    }],
  };

  const text = {
    id: 'text',
    leftText: 'Left',
    rightText: 'Right',
    style: {
      color: '#ffffff',
      zIndex: 3,
    },
    styleFilters: [{
      id: 'fade',
      property: 'filter' as const,
      function: 'opacity' as const,
      value: '50%',
    }],
  };

  const result = resolveSideOptions({ shadow, text });

  assert.deepEqual(result.shadow, {
    id: 'shadow',
    style: {
      color: '#ff0000',
      zIndex: 4,
      filter: 'blur(5px)',
    },
  });

  assert.equal(result.text?.style.filter, 'opacity(50%)');
  assert.deepEqual(shadow.style, { color: '#ff0000', zIndex: 4 });
});

test('rejects missing side text fields and invalid shadow IDs', () => {
  const malformed = [
    {
      id: 'shadow',
      type: 'side',
      kind: 'shadow',
      options: {
        shadow: {
          id: ' ',
        },
      },
    },
    {
      id: 'text',
      type: 'side',
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
      type: 'side',
      kind: 'text',
      options: {
        text: null,
      },
    },
  ];

  assert.deepEqual(normalizeSideEffects({ side: malformed }), []);
});
