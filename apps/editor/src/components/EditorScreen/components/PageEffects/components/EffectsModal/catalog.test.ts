import assert from 'node:assert/strict';
import test from 'node:test';

import type { EditorEffectDraft } from '../../@types';

import {
  EFFECT_CATEGORIES,
  getEffectGroup,
  getEffectPath,
  getFilteredEffects,
} from './catalog';

const effects = [
  {
    id: 'rain',
    type: 'audio',
    slug: 'Шум дождя',
    options: {
      type: 'sfx',
      src: 'assets/rain.mp3',
    },
  },
  {
    id: 'soundtrack',
    type: 'audio',
    slug: 'Саундтрек',
    options: {
      type: 'music',
      src: 'assets/music.ogg',
    },
  },
  {
    id: 'forest',
    type: 'background',
    kind: 'image',
    slug: 'Лес',
    options: {
      image: {
        id: 'image-1',
        src: 'assets/forest.webp',
      },
    },
  },
  {
    id: 'shadow',
    type: 'side',
    kind: 'shadow',
    slug: 'Затемнение',
    options: {
      shadow: {
        id: 'shadow-1',
      },
    },
  },
] as EditorEffectDraft[];

test('lists every top-level effect category with its supported subtypes', () => {
  assert.deepEqual(EFFECT_CATEGORIES.map((cur) => cur.value), [
    'audio', 'background', 'side', 'vibration', 'flashlight',
  ]);

  const audio = EFFECT_CATEGORIES[0];

  assert.deepEqual(audio.groups.map((cur) => cur.value), ['sfx', 'music', 'bg']);
});

test('filters globally without changing the order of effects', () => {
  assert.deepEqual(
    getFilteredEffects({
      effects,
      category: null,
      group: null,
      query: '',
    }).map((cur) => cur.id),
    ['rain', 'soundtrack', 'forest', 'shadow'],
  );

  assert.deepEqual(
    getFilteredEffects({
      effects,
      category: null,
      group: null,
      query: 'лес',
    }).map((cur) => cur.id),
    ['forest'],
  );
});

test('limits a search to the current category or type', () => {
  assert.deepEqual(
    getFilteredEffects({
      effects,
      category: 'audio',
      group: null,
      query: 'assets',
    }).map((cur) => cur.id),
    ['rain', 'soundtrack'],
  );

  assert.deepEqual(
    getFilteredEffects({
      effects,
      category: 'audio',
      group: 'music',
      query: '',
    }).map((cur) => cur.id),
    ['soundtrack'],
  );

  assert.deepEqual(
    getFilteredEffects({
      effects,
      category: 'background',
      group: 'video',
      query: '',
    }).map((cur) => cur.id),
    [],
  );
});

test('searches names, IDs and media paths without case sensitivity', () => {
  assert.equal(getFilteredEffects({
    effects,
    category: null,
    group: null,
    query: 'RAIN.MP3',
  })[0].id, 'rain');
  assert.equal(getFilteredEffects({
    effects,
    category: null,
    group: null,
    query: 'SOUNDTRACK',
  })[0].id, 'soundtrack');
  assert.equal(getFilteredEffects({
    effects,
    category: 'side',
    group: null,
    query: 'SHADOW',
  })[0].id, 'shadow');
});

test('keeps subtype and breadcrumb information independent of search', () => {
  assert.equal(getEffectGroup(effects[0]), 'sfx');
  assert.equal(getEffectPath(effects[2]), 'Background / Image');
  assert.equal(getEffectPath(effects[3]), 'Side / Shadow');
});
