import { StrictMode } from 'react';

import { renderHook } from '@testing-library/react';
import {
  expect,
  test,
  vi,
} from 'vitest';

import { beginProjectWrite } from '@project/pendingOperations';

import { useBeforeUnload } from '../hooks/useBeforeUnload';
import { useSaveShortcut } from '../hooks/useSaveShortcut';

test('keeps current page handlers in StrictMode and removes them after unmount', () => {
  const onSave = vi.fn(async () => {});
  const nextSave = vi.fn(async () => {});
  const add = vi.spyOn(window, 'addEventListener');
  const remove = vi.spyOn(window, 'removeEventListener');
  const finishWrite = beginProjectWrite();
  const { rerender, unmount } = renderHook(({ isDirty, save }) => {
    useBeforeUnload(isDirty);
    useSaveShortcut(save);
  }, { initialProps: { isDirty: false, save: onSave }, wrapper: StrictMode });
  const unload = () => {
    const event = new Event('beforeunload', { cancelable: true });

    window.dispatchEvent(event);

    return event.defaultPrevented;
  };
  const shortcut = (options: KeyboardEventInit) => {
    const event = new KeyboardEvent('keydown', { cancelable: true, ...options });

    window.dispatchEvent(event);

    return event.defaultPrevented;
  };

  try {
    for (const name of ['beforeunload', 'keydown']) {
      const added = add.mock.calls.filter(([event]) => event === name);
      const removed = remove.mock.calls.filter(([event]) => event === name);

      expect(added).toHaveLength(2);
      expect(removed).toHaveLength(1);
      expect(removed[0][1]).toBe(added[0][1]);
    }

    expect(unload()).toBe(true);
    finishWrite();
    expect(unload()).toBe(false);
    expect(shortcut({ code: 'KeyS', ctrlKey: true })).toBe(true);
    expect(onSave).toHaveBeenCalledTimes(1);
    rerender({ isDirty: true, save: nextSave });
    expect(unload()).toBe(true);
    expect(shortcut({ code: 'KeyS', metaKey: true })).toBe(true);
    expect(nextSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(shortcut({ code: 'KeyS' })).toBe(false);
    expect(shortcut({ code: 'KeyA', ctrlKey: true })).toBe(false);
    expect(nextSave).toHaveBeenCalledTimes(1);
    rerender({ isDirty: false, save: nextSave });
    expect(unload()).toBe(false);
    expect(add.mock.calls.filter(([event]) => event === 'beforeunload')).toHaveLength(2);
    unmount();

    for (const name of ['beforeunload', 'keydown']) {
      const added = add.mock.calls.filter(([event]) => event === name);
      const removed = remove.mock.calls.filter(([event]) => event === name);

      expect(removed.map(([, listener]) => listener)).toEqual(added.map(([, listener]) => listener));
    }

    expect(unload()).toBe(false);
    expect(shortcut({ code: 'KeyS', ctrlKey: true })).toBe(false);
    expect(nextSave).toHaveBeenCalledTimes(1);
  } finally {
    unmount();
    finishWrite();
    vi.restoreAllMocks();
  }
});
