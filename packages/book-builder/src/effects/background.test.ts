import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeBackgroundEffects, resolveBackgroundOptions } from './background';

test('preserves background image IDs', () => {
  const image = {
    id: 'tree',
    src: 'assets/tree.webp',
  };

  const options = {
    images: [image],
  };

  const backgroundEffect = {
    id: 'forest',
    type: 'background',
    options,
  };

  const background = [backgroundEffect];

  const normalized = normalizeBackgroundEffects({ background });

  assert.equal(normalized[0].options.images?.[0].id, 'tree');
});

test('rejects background images without IDs', () => {
  const image = {
    src: 'assets/tree.webp',
  };

  const options = {
    images: [image],
  };

  const backgroundEffect = {
    id: 'forest',
    type: 'background',
    options,
  };

  const background = [backgroundEffect];

  assert.deepEqual(normalizeBackgroundEffects({ background }), []);
});

test('resolves per-layer filter arrays while preserving media options', () => {
  const operation = {
    id: 'blur-one',
    property: 'backdropFilter' as const,
    function: 'blur' as const,
    value: '12px',
  };

  const options = resolveBackgroundOptions({
    style: { opacity: 0.8 },
    styleFilters: [operation],
    images: [{
      id: 'image',
      src: 'assets/tree.webp',
      styleFilters: [{ ...operation, property: 'filter' }],
    }],
    videos: [{ id: 'video', src: 'assets/fog.webm', autoPlay: false }],
    shadow: { show: true, styleFilters: [operation] },
  });

  assert.equal(options.style.backdropFilter, 'blur(12px)');
  assert.equal(options.images?.[0].style.filter, 'blur(12px)');
  assert.equal(options.images?.[0].src, 'assets/tree.webp');
  assert.equal(options.videos?.[0].autoPlay, false);
  assert.equal(options.shadow?.style.backdropFilter, 'blur(12px)');
});
