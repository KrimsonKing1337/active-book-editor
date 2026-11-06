

import { createElement, StrictMode } from 'react';

import { act, cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';

import type { BookRuntime, VisualRendererProps } from '@active-book/types';

import { StoreProvider, store } from 'activeBook-core/store';
import { mainActions } from 'activeBook-core/store/main';

import { AppWrapper } from 'activeBook-core/components';

import { type VisualEffects, useVisualEffects } from 'activeBook-core/controllers/visualEffects';

import { isBookDocument } from '@active-book/book-builder/book';

import { createBookRuntime } from '@active-book/book-builder/components/custom/runtime';
import { loadBrowserLibrary } from '@active-book/book-builder/components/custom/browser';
import { createCustomVisualDefinitions } from '@active-book/book-builder/components/custom/visual';
import { compileVisualEffects } from '@active-book/book-builder/visualEffects';

import fixture from '@root/tests/fixtures/multipage-book/book.json';
import archiveUrl from '@root/tests/fixtures/multipage-book/dependencies/fixture-parts.tgz?url';

import 'activeBook-core/styles/styles.scss';

let session: VisualEffects;
const Probe = () => {
  session = useVisualEffects();

  return null;
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test('native identity and independent book sessions', async () => {
  const library = await loadBrowserLibrary(await (await fetch(archiveUrl)).blob());
  try {
    const implementations = Object.entries(library.visualComponents).map(([id, Implementation]) => {
      const renderer = vi.fn((props: VisualRendererProps & {
        book: BookRuntime
      }) => createElement(Implementation, props));
      library.visualComponents[id] = renderer;

      return renderer;
    });
    const definitions = createCustomVisualDefinitions([library], createBookRuntime('editor'));
    const book: unknown = fixture;
    if (!isBookDocument(book)) {
      throw new Error('Invalid fixture');
    }
    const initial = compileVisualEffects(book)
      .filter((cur) => cur.effect.id === 'range-native');
    const original = initial[0];
    const config = {
      id: 'native-contract',
      pages: 3,
      defaultTheme: 'dark',
    };
    const view = (registrations = initial, bookKey = 1) => (
      <StrictMode>
        <StoreProvider>
          <AppWrapper
            storyPages={[{
              id: 'first',
              content: <p>Native contract</p>,
            }, {
              id: 'second',
              content: null,
            }, {
              id: 'third',
              content: null,
            }]}
            editorTools={<Probe />}
            config={config}
            rangeEffects={[]}
            tableOfContents={[]}
            definitions={definitions}
            registrations={registrations}
            bookKey={bookKey}
          />
        </StoreProvider>
      </StrictMode>
    );
    const { rerender, unmount } = render(view());
    act(() => store.dispatch(mainActions.setPage(1)));
    const native = page.getByTestId('native-visual');
    await expect.element(native).toBeInTheDocument();
    const firstElement = native.element();
    const props = implementations.flatMap((renderer) => renderer.mock.calls).at(-1)?.[0];
    expect(props).toBeDefined();
    for (const region of ['application', 'story', 'storyViewport', 'narrativeFrame',
      'narrativeViewport', 'narrativeContent', 'storyViewportFrame', 'toolbar', 'toolbarFrame'] as const) {
      const selector = region === 'application' ? '[data-book-application]' : `[data-story-region="${region}"]`;
      expect(props?.regions[region]).toBe(document.querySelector(selector));
    }
    expect(props).not.toHaveProperty('geometry');
    expect(document.querySelectorAll('[data-book-application]')).toHaveLength(1);
    const wrapper = document.querySelector('[data-effect-id="range-native"]');
    const firstSession = session;
    const generation = session.getGeneration('range-native');
    const update = vi.spyOn(session, 'update');
    const create = vi.spyOn(session, 'register');
    rerender(view(JSON.parse(JSON.stringify(initial))));
    expect(update).not.toHaveBeenCalled();
    const params = {
      ...original.effect.params,
      custom: { color: 'red' },
    };
    const changed = [{
      ...original,
      effect: {
        ...original.effect,
        params,
      },
    }];
    rerender(view(changed));
    await expect.element(native).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    expect(native.element()).toBe(firstElement);
    const keyedParams = {
      ...params,
      componentKey: 'replacement',
    };
    const keyed = [{
      ...original,
      effect: {
        ...original.effect,
        params: keyedParams,
      },
    }];
    rerender(view(keyed));
    await expect.poll(() => native.element() !== firstElement).toBe(true);
    expect(document.querySelector('[data-effect-id="range-native"]')).toBe(wrapper);
    expect(session.getGeneration('range-native')).toBe(generation);
    expect(create).not.toHaveBeenCalled();
    const oldController = session.getController('range-native');
    act(() => oldController?.playback?.play());
    await expect.element(native).toHaveTextContent('1');
    rerender(view(keyed, 2));
    await expect.poll(() => firstSession.getSnapshot().length).toBe(0);
    expect(session).not.toBe(firstSession);
    expect(() => firstSession.update('range-native', {})).toThrow('destroyed');
    act(() => oldController?.destroy());
    expect(session.getSnapshot()).toHaveLength(1);
    const lastSession = session;
    unmount();
    await expect.poll(() => lastSession.getSnapshot().length).toBe(0);
  } finally {
    cleanup();
    library.dispose();
  }
});
