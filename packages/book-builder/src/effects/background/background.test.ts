import assert from 'node:assert/strict';

import { test } from 'vitest';

import { normalizeBackgroundEffects, resolveBackgroundOptions } from './background';

test('accepts independent background, image, video and shadow effects', () => {
  const background = [
    {
      id: 'bg',
      type: 'background',
      kind: 'background',
      options: {
        style: {
          backgroundColor: '#000',
        },
      },
    },
    {
      id: 'img',
      type: 'background',
      kind: 'image',
      options: {
        image: {
          id: 'img-1',
          src: 'forest.webp',
        },
      },
    },
    {
      id: 'vid',
      type: 'background',
      kind: 'video',
      options: {
        video: {
          id: 'vid-1',
          src: 'fog.webm',
        },
      },
    },
    {
      id: 'shadow',
      type: 'background',
      kind: 'shadow',
      options: {
        shadow: {
          show: true,
        },
      },
    },
    {
      id: 'component',
      type: 'background',
      kind: 'component',
      options: {},
    },
  ];

  const effects = normalizeBackgroundEffects({ background });

  assert.equal(effects.length, 5);
  assert.deepEqual(effects.map((cur) => cur.kind), [
    'background',
    'image',
    'video',
    'shadow',
    'component',
  ]);
  assert.equal(effects[1].options.image?.id, 'img-1');
});

test('rejects legacy grouped background effects and missing media IDs', () => {
  const legacy = {
    id: 'old',
    type: 'background',
    options: {
      images: [
        {
          id: 'img',
          src: 'forest.webp',
        },
      ],
    },
  };

  const invalid = {
    id: 'new',
    type: 'background',
    kind: 'image',
    options: {
      image: {
        src: 'forest.webp',
      },
    },
  };

  assert.deepEqual(normalizeBackgroundEffects({ background: [legacy, invalid] }), []);
});

test('resolves filters on the selected layer without changing media settings', () => {
  const operation = {
    id: 'blur',
    property: 'filter' as const,
    function: 'blur' as const,
    value: '12px',
  };

  const image = {
    id: 'img',
    src: 'assets/tree.webp',
    styleFilters: [operation],
  };

  const video = {
    id: 'vid',
    src: 'assets/fog.webm',
    loop: false,
  };

  const backdropOperation = {
    ...operation,
    property: 'backdropFilter' as const,
  };

  const shadow = {
    show: true,
    styleFilters: [backdropOperation],
  };

  const style = {
    backgroundColor: '#222',
  };

  const options = resolveBackgroundOptions({
    image,
    video,
    shadow,
    style,
  });

  assert.equal(options.image?.style.filter, 'blur(12px)');
  assert.equal(options.image?.src, image.src);
  assert.equal(options.video?.loop, false);
  assert.equal(options.shadow?.style.backdropFilter, 'blur(12px)');
  assert.equal(options.style.backgroundColor, '#222');
});

test('rejects non-record entries and invalid media properties', () => {
  const malformed = [
    null,
    {
      id: 'invalid-options',
      type: 'background',
      kind: 'background',
      options: null,
    },
    {
      id: 'invalid-image-source',
      type: 'background',
      kind: 'image',
      options: {
        image: {
          id: 'image-1',
          src: 42,
        },
      },
    },
    {
      id: 'blank-video-id',
      type: 'background',
      kind: 'video',
      options: {
        video: {
          id: ' ',
          src: 'assets/video.webm',
        },
      },
    },
  ];

  assert.deepEqual(normalizeBackgroundEffects({ background: malformed }), []);
});
