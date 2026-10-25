import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeSideEffects, resolveSideOptions } from './side';

test('normalizes multiple side effects with multiple shadows and texts', () => {
  const effect = {
    id: 'side-1',
    type: 'side',
    slug: 'Поля',
    options: {
      shadows: [
        { id: 'one', animation: { preset: 'police', duration: 1000 } },
        { id: 'two', animation: { preset: 'caramel', duration: 2000 } },
      ],
      texts: [
        { id: 'text-a', leftText: 'Лево', rightText: 'Право' },
        { id: 'text-b', leftText: 'Текст', rightText: 'Ещё текст' },
      ],
    },
  };

  assert.deepEqual(normalizeSideEffects({ side: [effect] }), [effect]);
});

test('rejects side effects with invalid text entries', () => {
  const invalid = {
    id: 'side-1',
    type: 'side',
    options: { texts: [{ id: 'text', leftText: 123, rightText: 'ok' }] },
  };

  assert.deepEqual(normalizeSideEffects({ side: [invalid] }), []);
});

test('resolves individual shadow and text filters without changing layer positions', () => {
  const options = {
    shadows: [{
      id: 'shadow-a',
      position: 'top-left' as const,
      style: { color: '#ff0000', zIndex: 4 },
      styleFilters: [{ id: 'blur', property: 'filter' as const, function: 'blur' as const, value: '5px' }],
    }],
    texts: [{
      id: 'text-a',
      leftText: 'Left',
      rightText: 'Right',
      style: { color: '#ffffff', zIndex: 3 },
      styleFilters: [{ id: 'fade', property: 'filter' as const, function: 'opacity' as const, value: '50%' }],
    }],
  };

  const result = resolveSideOptions(options);

  assert.deepEqual(result.shadows, [{
    id: 'shadow-a',
    position: 'top-left',
    style: { color: '#ff0000', zIndex: 4, filter: 'blur(5px)' },
  }]);

  assert.deepEqual(result.texts, [{
    id: 'text-a',
    leftText: 'Left',
    rightText: 'Right',
    style: { color: '#ffffff', zIndex: 3, filter: 'opacity(50%)' },
  }]);

  assert.equal(options.shadows[0].style.filter, undefined);
});
