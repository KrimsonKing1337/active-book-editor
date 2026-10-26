import assert from 'node:assert/strict';
import test from 'node:test';

import type { EditorEffectDraft } from '../../@types';

import { EFFECT_CATEGORIES, getEffectGroup, getEffectPath, getFilteredEffects } from './catalog';

const effects = [
  {
    id: 'rain',
    type: 'audio',
    slug: 'Шум дождя',
    options: { type: 'sfx', src: 'assets/rain.mp3' },
  },
  {
    id: 'soundtrack',
    type: 'audio',
    slug: 'Саундтрек',
    options: { type: 'music', src: 'assets/music.ogg' },
  },
  {
    id: 'forest',
    type: 'background',
    kind: 'image',
    slug: 'Лес',
    options: { image: { id: 'image-1', src: 'assets/forest.webp' } },
  },
  {
    id: 'shadow',
    type: 'side',
    kind: 'shadow',
    slug: 'Затемнение',
    options: { shadow: { id: 'shadow-1' } },
  },
] as EditorEffectDraft[];

test('lists every top-level effect category with its supported subtypes', () => {
  assert.deepEqual(EFFECT_CATEGORIES.map((category) => category.value), [
    'audio', 'background', 'side', 'vibration', 'flashlight',
  ]);

  const audio = EFFECT_CATEGORIES[0];

  assert.deepEqual(audio.groups.map((group) => group.value), ['sfx', 'music', 'bg']);
});

test('filters globally without changing the order of effects', () => {
  assert.deepEqual(
    getFilteredEffects(effects, null, null, '').map((effect) => effect.id),
    ['rain', 'soundtrack', 'forest', 'shadow'],
  );

  assert.deepEqual(
    getFilteredEffects(effects, null, null, 'лес').map((effect) => effect.id),
    ['forest'],
  );
});

test('limits a search to the current category or type', () => {
  assert.deepEqual(
    getFilteredEffects(effects, 'audio', null, 'assets').map((effect) => effect.id),
    ['rain', 'soundtrack'],
  );

  assert.deepEqual(
    getFilteredEffects(effects, 'audio', 'music', '').map((effect) => effect.id),
    ['soundtrack'],
  );

  assert.deepEqual(
    getFilteredEffects(effects, 'background', 'video', '').map((effect) => effect.id),
    [],
  );
});

test('searches names, IDs and media paths without case sensitivity', () => {
  assert.equal(getFilteredEffects(effects, null, null, 'RAIN.MP3')[0].id, 'rain');
  assert.equal(getFilteredEffects(effects, null, null, 'SOUNDTRACK')[0].id, 'soundtrack');
  assert.equal(getFilteredEffects(effects, 'side', null, 'SHADOW')[0].id, 'shadow');
});

test('keeps subtype and breadcrumb information independent of search', () => {
  assert.equal(getEffectGroup(effects[0]), 'sfx');
  assert.equal(getEffectPath(effects[2]), 'Background / Image');
  assert.equal(getEffectPath(effects[3]), 'Side / Shadow');
});
