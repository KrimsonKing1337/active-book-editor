import { expect, test } from 'vitest';

import fixture from '../../../../tests/fixtures/multipage-book/book.json';

import { isBookDocument } from '../book';
import { compileBookDocument } from '../bookPreparation';

import type { VisualDraft } from './drafts';

import type { AuthoredVisualEffect } from './@types';

import { compileVisualEffects } from './compile';
import { missingVisualDefinitions } from './definitions';
import { draftToVisual, visualToDraft } from './drafts';

const readFixture = () => {
  const book: unknown = structuredClone(fixture);
  if (!isBookDocument(book)) {
    throw new Error('Invalid canonical fixture');
  }

  return book;
};

test('preview and builder compile identical registrations without mutating authoring data', () => {
  const book = readFixture();
  const serialized = JSON.stringify(book);
  expect(compileBookDocument(book).visualEffects).toEqual(compileVisualEffects(book));
  expect(JSON.stringify(book)).toBe(serialized);
  const image = compileVisualEffects(book).find((cur) => cur.effect.id === 'range-image');
  expect(image?.effect.params.image).toHaveProperty('style.filter', 'brightness(120%)');
  expect(image?.effect.params.image).not.toHaveProperty('styleFilters');
});

test('page lifetime follows permanent IDs through reorder; ranges retain their numeric positions', () => {
  const book = readFixture();
  book.pages.reverse();
  const built = compileVisualEffects(book);
  expect(built.find((cur) => cur.effect.id === 'bg-gamma')?.lifetime).toEqual({
    type: 'page',
    page: 1,
  });
  expect(built.find((cur) => cur.effect.id === 'bg-alpha')?.lifetime).toEqual({
    type: 'page',
    page: 3,
  });
  expect(built.find((cur) => cur.effect.id === 'range-native')?.lifetime).toEqual(book.visualEffects[3].lifetime);
  book.pages.splice(1);
  expect(isBookDocument(book)).toBe(true);
  const reopened = JSON.parse(JSON.stringify(book));
  expect(compileBookDocument(reopened).visualEffects.find((cur) => cur.effect.id === 'range-native')?.lifetime)
    .toEqual(book.visualEffects[3].lifetime);
});

test.each(['background', 'frame'] as const)('ordinary %s edits preserve placement and visibility', (type) => {
  const draft: VisualDraft = type === 'background'
    ? {
      id: 'stable',
      type,
      kind: 'background' as const,
      slug: 'Panel',
      options: {},
    }
    : {
      id: 'stable',
      type,
      kind: 'component' as const,
      slug: 'Panel',
      options: { layer: 'above' as const },
    };
  const original = draftToVisual({
    draft,
    pageId: 'owner',
  });
  const visibility: AuthoredVisualEffect['effect']['visibility'] = {
    region: 'book',
    mask: {
      type: 'circle',
      center: {
        x: {
          value: 50,
          unit: '%',
        },
        y: {
          value: 50,
          unit: '%',
        },
      },
      radius: {
        value: 40,
        unit: '%',
      },
    },
  };
  const placement = {
    ...original.effect.placement,
    coordinates: 'narrativeContent' as const,
  };
  const previous = {
    ...original,
    effect: {
      ...original.effect,
      placement,
      visibility,
      depth: {
        plane: 'aboveControls' as const,
        order: 7,
      },
    },
  };
  const panel = visualToDraft(previous);
  panel.slug = 'Changed';
  const edited = draftToVisual({
    draft: panel,
    pageId: 'owner',
    previous,
  });
  expect(edited.effect.id).toBe('stable');
  expect(edited.effect.placement).toEqual(placement);
  expect(edited.effect.visibility).toEqual(visibility);
  expect(edited.effect.depth).toEqual(previous.effect.depth);
  expect(edited.effect.params).not.toHaveProperty('layer');
  expect(edited.effect.params).not.toHaveProperty('frameMask');
  expect(edited.effect.params.style).not.toHaveProperty('zIndex');
});

test('custom frame panel round trips retain native params and component identity', () => {
  const previous = readFixture().visualEffects.find((cur) => cur.effect.id === 'range-native')!;
  const panel = visualToDraft(previous);
  const edited = draftToVisual({
    draft: panel,
    previous,
    pageId: 'unused-for-range',
  });
  expect(edited).toEqual(previous);
});

test('known custom definitions are not reported as missing', () => {
  const book = readFixture();
  const customRegistration = compileVisualEffects(book).find((registrationCur) => {
    return registrationCur.effect.definitionId.startsWith('custom.');
  });

  if (!customRegistration) {
    throw new Error('Fixture must contain a custom visual effect');
  }

  const definitionId = customRegistration.effect.definitionId;
  const customDefinition = {
    id: definitionId,
    defaultParams: {},
    Renderer: () => null,
  };

  expect(missingVisualDefinitions([customRegistration], [customDefinition])).toEqual([]);
  expect(missingVisualDefinitions([customRegistration], [])).toEqual([definitionId]);
});

test('book validation rejects malformed visual effects before inspecting their properties', () => {
  const book = readFixture();
  const visuals = book.pages[0].document.attrs!.visualEffects;

  book.pages[0].document.attrs!.visualEffects = [null];
  expect(isBookDocument(book)).toBe(false);

  book.pages[0].document.attrs!.visualEffects = visuals;
});

test('book validation rejects duplicate effect IDs and orphaned page owners', () => {
  const book = readFixture();
  const original = book.pages[0].document.attrs!.visualEffects[0];
  book.visualEffects.push({
    ...original,
    lifetime: {
      type: 'range',
      range: [],
    },
  });
  expect(isBookDocument(book)).toBe(false);
  book.visualEffects.pop();
  original.lifetime.pageId = 'missing';
  expect(isBookDocument(book)).toBe(false);
});


test('native instance parameters survive compilation alongside presentation options', () => {
  const book = readFixture();
  const native = book.visualEffects.find((cur) => cur.effect.id === 'range-native')!;
  native.effect.params = {
    speed: 12,
    palette: ['red', 'blue'],
  };
  expect(isBookDocument(book)).toBe(true);
  const built = compileBookDocument(book).visualEffects.find((cur) => cur.effect.id === 'range-native');
  expect(built?.effect.params).toEqual(native.effect.params);
});
