import { StrictMode } from 'react';

import { act, renderHook } from '@testing-library/react';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import {
  expect,
  test,
  vi,
} from 'vitest';

import { useCanvasInteraction } from '../hooks/useCanvasInteraction';

test('keeps one capture listener per event in StrictMode, excludes effects UI and cleans up for null/unmount', () => {
  const editor = new Editor({ extensions: [StarterKit], content: '<p>Canvas</p>' });
  const root = editor.view.dom;
  const outside = document.createElement('button');
  const effects = document.createElement('button');

  effects.setAttribute('data-active-book-effects-ui', '');
  document.body.append(editor.view.dom, outside, effects);
  const add = vi.spyOn(document, 'addEventListener');
  const remove = vi.spyOn(document, 'removeEventListener');
  const {
    result,
    rerender,
    unmount,
  } = renderHook<ReturnType<typeof useCanvasInteraction>, Editor | null>((current) => useCanvasInteraction(current), {
    initialProps: editor,
    wrapper: StrictMode,
  });

  try {
    for (const event of ['pointerdown', 'focusin']) {
      const added = add.mock.calls.filter(([
        name, , capture,
      ]) => name === event && capture === true);
      const removed = remove.mock.calls.filter(([
        name, , capture,
      ]) => name === event && capture === true);

      expect(added).toHaveLength(2);
      expect(removed).toHaveLength(1);
      expect(removed[0][1]).toBe(added[0][1]);
    }

    editor.view.dom.addEventListener('pointerdown', (event) => event.stopPropagation());
    act(() => editor.view.dom.dispatchEvent(new Event('pointerdown', { bubbles: true })));
    expect(result.current.isNodeSelectionActive).toBe(true);
    act(() => effects.dispatchEvent(new Event('focusin', { bubbles: true })));
    expect(result.current.isNodeSelectionActive).toBe(true);
    act(() => outside.dispatchEvent(new Event('pointerdown', { bubbles: true })));
    expect(result.current.isNodeSelectionActive).toBe(false);
    act(() => editor.view.dom.dispatchEvent(new Event('focusin', { bubbles: true })));
    expect(result.current.isNodeSelectionActive).toBe(true);
    rerender(null);

    for (const event of ['pointerdown', 'focusin']) {
      expect(remove.mock.calls.filter(([
        name, , capture,
      ]) => name === event && capture === true)).toHaveLength(2);
    }

    const contains = vi.spyOn(editor.view.dom, 'contains');

    act(() => outside.dispatchEvent(new Event('pointerdown', { bubbles: true })));
    expect(contains).not.toHaveBeenCalled();
    rerender(editor);
    unmount();
    contains.mockClear();
    outside.dispatchEvent(new Event('focusin', { bubbles: true }));
    expect(contains).not.toHaveBeenCalled();
  } finally {
    unmount();
    vi.restoreAllMocks();
    editor.destroy();
    root.remove();
    outside.remove();
    effects.remove();
  }
});
