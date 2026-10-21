import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeLegacyNodeNames } from './normalizeBookDocument';

test('migrates legacy text nodes recursively without changing other data', () => {
  const document = {
    type: 'doc',
    attrs: { pageEffects: { audio: [] } },
    content: [
      { type: 'activeBookH1', content: [{ type: 'text', text: 'Заголовок' }] },
      { type: 'activeBookH2' },
      { type: 'activeBookP', content: [{ type: 'text', text: 'Абзац', marks: [{ type: 'bold' }] }] },
      { type: 'coreComponent', attrs: { package: 'example', name: 'Widget' } },
    ],
  };

  const normalized = normalizeLegacyNodeNames(document);

  assert.deepEqual(normalized, {
    ...document,
    content: [
      { type: 'H1', content: [{ type: 'text', text: 'Заголовок' }] },
      { type: 'H2' },
      { type: 'P', content: [{ type: 'text', text: 'Абзац', marks: [{ type: 'bold' }] }] },
      { type: 'coreComponent', attrs: { package: 'example', name: 'Widget' } },
    ],
  });
  assert.equal(document.content[0].type, 'activeBookH1');
});

test('keeps current node names unchanged', () => {
  const document = { type: 'doc', content: [{ type: 'P' }, { type: 'H1' }, { type: 'H2' }] };

  assert.deepEqual(normalizeLegacyNodeNames(document), document);
});
