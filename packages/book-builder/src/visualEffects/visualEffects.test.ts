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
    region: 'story',
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

test.each(['background', 'frame'] as const)('switching %s area replaces custom placement', (type) => {
  const draft: VisualDraft = type === 'background'
    ? {
      id: 'region',
      type,
      kind: 'background',
      slug: 'Region',
      options: { style: {} },
    }
    : {
      id: 'region',
      type,
      kind: 'component',
      slug: 'Region',
      options: { style: {} },
    };
  const initial = draftToVisual({
    draft,
    pageId: 'owner',
  });
  expect(initial.effect.placement.coordinates).toBe('storyViewport');
  expect(initial.effect.visibility.region).toBe('storyViewport');
  const previous: AuthoredVisualEffect = {
    ...initial,
    effect: {
      ...initial.effect,
      placement: {
        ...initial.effect.placement,
        coordinates: 'narrativeContent',
        offset: {
          x: {
            value: 13,
            unit: 'px',
          },
          y: {
            value: 20,
            unit: '%',
          },
        },
      },
      visibility: {
        region: 'narrativeViewport',
        mask: {
          type: 'polygon',
          points: [
            {
              x: {
                value: 0,
                unit: '%',
              },
              y: {
                value: 0,
                unit: '%',
              },
            },
            {
              x: {
                value: 100,
                unit: '%',
              },
              y: {
                value: 0,
                unit: '%',
              },
            },
            {
              x: {
                value: 100,
                unit: '%',
              },
              y: {
                value: 100,
                unit: '%',
              },
            },
          ],
        },
      },
    },
  };
  const custom = visualToDraft(previous);
  expect(custom.displayRegion).toBe('custom');
  expect(draftToVisual({
    draft: custom,
    pageId: 'owner',
    previous,
  })).toEqual(previous);

  for (const displayRegion of ['narrativeFrame', 'storyViewport'] as const) {
    const switched = draftToVisual({
      draft: {
        ...custom,
        displayRegion,
      },
      pageId: 'owner',
      previous,
    });
    expect(switched.effect.placement.coordinates).toBe(displayRegion);
    expect(switched.effect.placement.anchor).toEqual({
      region: displayRegion,
      point: 'top-left',
    });
    expect(switched.effect.placement.offset).toEqual({
      x: {
        value: 0,
        unit: 'px',
      },
      y: {
        value: 0,
        unit: 'px',
      },
    });
    expect(switched.effect.visibility).toEqual({
      region: displayRegion,
      mask: previous.effect.visibility.mask,
    });
    expect(switched.effect.params).not.toHaveProperty('displayRegion');
    expect(draftToVisual({
      draft: visualToDraft(switched),
      pageId: 'owner',
      previous: switched,
    })).toEqual(switched);
  }
});

test('frame area switches keep the frame mask; disabling it retains the selected area', () => {
  const draft: VisualDraft = {
    id: 'masked-area',
    type: 'frame',
    kind: 'component',
    slug: 'Mask',
    options: {
      frameMask: {
        enabled: true,
        sides: ['left', 'bottom'],
      },
    },
  };
  const previous = draftToVisual({
    draft,
    pageId: 'owner',
  });
  const panel = visualToDraft(previous);
  const switched = draftToVisual({
    draft: {
      ...panel,
      displayRegion: 'narrativeFrame',
    },
    previous,
    pageId: 'owner',
  });
  expect(switched.effect.placement.coordinates).toBe('narrativeFrame');
  expect(switched.effect.visibility).toEqual({
    region: 'frame',
    sides: ['left', 'bottom'],
  });
  const unmasked = visualToDraft(switched);
  if (unmasked.type !== 'frame') {
    throw new Error('Expected a frame');
  }
  unmasked.options.frameMask = {
    enabled: false,
    sides: ['left', 'bottom'],
  };
  const edited = draftToVisual({
    draft: unmasked,
    previous: switched,
    pageId: 'owner',
  });
  expect(edited.effect.visibility.region).toBe('narrativeFrame');
  expect(edited.effect.placement).toEqual(switched.effect.placement);
});


test('optional application coordinates survive authoring validation and compilation', () => {
  const book = readFixture();
  const registration = book.visualEffects[0];
  registration.effect.placement.coordinates = 'application';
  registration.effect.placement.anchor.region = 'application';
  registration.effect.visibility = { region: 'application' };
  expect(isBookDocument(book)).toBe(true);
  const built = compileBookDocument(book).visualEffects.find((cur) => {
    return cur.effect.id === registration.effect.id;
  });
  expect(built?.effect.visibility.region).toBe('application');
  expect(built?.effect.placement.coordinates).toBe('application');
});
