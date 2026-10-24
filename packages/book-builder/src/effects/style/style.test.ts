import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveStyle } from './style';

test('keeps repeated filter functions in their original order', () => {
  const operations = [
    {
      id: 'one',
      property: 'filter' as const,
      function: 'sepia' as const,
      value: '30%',
    },
    {
      id: 'two',
      property: 'filter' as const,
      function: 'blur' as const,
      value: '4px',
    },
    {
      id: 'three',
      property: 'filter' as const,
      function: 'sepia' as const,
      value: '20%',
    },
    {
      id: 'four',
      property: 'backdropFilter' as const,
      function: 'invert' as const,
      value: '10%',
    },
  ];

  const style = resolveStyle({ opacity: 0.5 }, operations);

  assert.equal(style.filter, 'sepia(30%) blur(4px) sepia(20%)');
  assert.equal(style.backdropFilter, 'invert(10%)');
  assert.equal(style.opacity, 0.5);
});

test('empty operations remove unstructured filter declarations', () => {
  const inputStyle = {
    filter: 'blur(10px)',
    backdropFilter: 'sepia(80%)',
  };

  const style = resolveStyle(inputStyle, []);

  assert.equal(style.filter, undefined);
  assert.equal(style.backdropFilter, undefined);
});

test('missing operations do not restore unstructured filter declarations', () => {
  const inputStyle = {
    opacity: 0.5,
    backdropFilter: 'blur(10px)',
  };

  const style = resolveStyle(inputStyle, undefined);

  assert.equal(style.backdropFilter, undefined);
  assert.equal(style.opacity, 0.5);
});
