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
      options: {},
    };
  const original = draftToVisual({
    draft,
    pageId: 'owner',
  });
  const visibility: AuthoredVisualEffect['effect']['visibility'] = {
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
    region: 'narrativeContent' as const,
  };
  const previous = {
    ...original,
    effect: {
      ...original.effect,
      placement,
      visibility,
      depth: {
        plane: 'aboveStoryControls' as const,
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
  expect(edited.effect.params.style ?? {}).not.toHaveProperty('zIndex');
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

test.each(['background', 'frame'] as const)('shared %s placement metadata round trips all regions', (type) => {
  const draft: VisualDraft = type === 'background'
    ? {
      id: 'region',
      type,
      kind: 'background',
      slug: 'Region',
      options: {},
    }
    : {
      id: 'region',
      type,
      kind: 'component',
      slug: 'Region',
      options: {},
    };
  const initial = draftToVisual({
    draft,
    pageId: 'owner',
  });
  const defaultRegion = type === 'frame' ? 'storyViewportFrame' : 'storyViewport';
  expect(initial.effect.placement).toEqual({ region: defaultRegion });
  for (const region of [
    'application',
    'story',
    'storyViewport',
    'narrativeFrame',
    'storyViewportFrame',
    'toolbar',
    'toolbarFrame',
    'narrativeViewport',
    'narrativeContent',
  ] as const) {
    const panel = visualToDraft(initial);
    panel.placement = {
      region,
      anchor: 'bottom-right',
      offset: {
        x: {
          value: -12,
          unit: 'px',
        },
        y: {
          value: 5,
          unit: '%',
        },
      },
      scale: 0.8,
      rotate: 12,
    };
    panel.depth = {
      plane: 'aboveStoryControls',
      order: -4,
    };
    const edited = draftToVisual({
      draft: panel,
      previous: initial,
      pageId: 'owner',
    });
    expect(edited.effect.placement).toEqual(panel.placement);
    expect(edited.effect.depth).toEqual(panel.depth);
    expect(edited.effect.params).not.toHaveProperty('placement');
    expect(draftToVisual({
      draft: visualToDraft(edited),
      previous: edited,
      pageId: 'owner',
    })).toEqual(edited);
  }
});

test('rectangle, mask and plane are independent and removing sides never changes region', () => {
  const draft: VisualDraft = {
    id: 'mask',
    type: 'frame',
    kind: 'component',
    slug: 'Mask',
    options: {},
    placement: { region: 'storyViewportFrame' },
    visibility: {
      sides: ['left', 'bottom'],
      frameWidth: {
        value: 20,
        unit: 'px',
      },
    },
    depth: {
      plane: 'aboveNarrative',
      order: 4,
    },
  };
  const previous = draftToVisual({
    draft,
    pageId: 'owner',
  });
  const panel = visualToDraft(previous);
  panel.placement = { region: 'toolbarFrame' };
  const edited = draftToVisual({
    draft: panel,
    previous,
    pageId: 'owner',
  });
  expect(edited.effect.visibility).toEqual(draft.visibility);
  expect(edited.effect.depth).toEqual(draft.depth);
  panel.visibility = {};
  const unmasked = draftToVisual({
    draft: panel,
    previous: edited,
    pageId: 'owner',
  });
  expect(unmasked.effect.placement.region).toBe('toolbarFrame');
  expect(unmasked.effect.visibility).toEqual({});
});

test('minimal application placement compiles and old coordinate descriptions are rejected', () => {
  const book = readFixture();
  const registration = book.visualEffects[0];
  registration.effect.placement = { region: 'application' };
  delete registration.effect.visibility;
  registration.effect.depth = { plane: 'aboveStoryControls' };
  expect(isBookDocument(book)).toBe(true);
  const built = compileBookDocument(book).visualEffects.find((cur) => cur.effect.id === registration.effect.id);
  expect(built?.effect.placement).toEqual({ region: 'application' });
  const bad = JSON.parse(JSON.stringify(book));
  bad.visualEffects[0].effect.placement.coordinates = 'story';
  expect(isBookDocument(bad)).toBe(false);
  const badTransform = JSON.parse(JSON.stringify(book));
  badTransform.visualEffects[0].effect.placement.scale = 'large';
  expect(isBookDocument(badTransform)).toBe(false);
});

test('every frame region is a rectangle without implicit masks or legacy aliases', () => {
  const book = readFixture();
  for (const region of [
    'storyViewportFrame',
    'narrativeFrame',
    'toolbarFrame',
    'toolbar',
  ] as const) {
    const authored = book.visualEffects[0];
    authored.effect.placement = { region };
    authored.effect.visibility = {};
    expect(isBookDocument(book)).toBe(true);
    expect(draftToVisual({
      draft: visualToDraft(authored),
      previous: authored,
      pageId: 'owner',
    })).toEqual(authored);
  }
  const invalid = JSON.parse(JSON.stringify(book));
  invalid.visualEffects[0].effect.placement.region = 'frame';
  expect(isBookDocument(invalid)).toBe(false);
  const badWidth = JSON.parse(JSON.stringify(book));
  badWidth.visualEffects[0].effect.visibility = {
    sides: ['left'],
    frameWidth: {
      value: -1,
      unit: 'px',
    },
  };
  expect(isBookDocument(badWidth)).toBe(false);
});

test('asymmetric side widths survive editing, serialization and builder validation', () => {
  const book = readFixture();
  const authored = book.visualEffects[0];
  const width = {
    top: { value: 12, unit: 'px' as const },
    right: { value: 24, unit: 'px' as const },
    bottom: { value: 8, unit: 'px' as const },
    left: { value: 5, unit: '%' as const },
  };
  authored.effect.placement = { region: 'toolbarFrame' };
  authored.effect.visibility = {
    sides: [
      'top',
      'right',
      'bottom',
      'left',
    ],
    frameWidth: width,
  };

  expect(isBookDocument(book)).toBe(true);
  const draft = visualToDraft(authored);
  const saved = draftToVisual({
    draft,
    previous: authored,
    pageId: 'owner',
  });
  expect(saved.effect.visibility?.frameWidth).toEqual(width);
  expect(compileBookDocument(book).visualEffects.find((cur) => cur.effect.id === authored.effect.id)
    ?.effect.visibility?.frameWidth).toEqual(width);

  const invalid = JSON.parse(JSON.stringify(book));
  invalid.visualEffects[0].effect.visibility.frameWidth.left.value = -1;
  expect(isBookDocument(invalid)).toBe(false);

  const missingSide = JSON.parse(JSON.stringify(book));
  delete missingSide.visualEffects[0].effect.visibility.frameWidth.bottom;
  expect(isBookDocument(missingSide)).toBe(false);
});
