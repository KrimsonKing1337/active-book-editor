import { Editor } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import StarterKit from '@tiptap/starter-kit';
import { act, renderHook } from '@testing-library/react';
import { expect, test } from 'vitest';

import type { BackgroundEffectDraft } from '../../@types';

import { usePageEffectsState } from './usePageEffectsState';

const PageDocument = Document.extend({
  addAttributes() {
    return {
      pageEffects: { default: {} },
      visualEffects: { default: [] },
    };
  },
});

test('delayed settings from a previous page cannot write into the current page', () => {
  const editor = new Editor({ extensions: [StarterKit.configure({ document: false }), PageDocument] });
  const draft: BackgroundEffectDraft = {
    id: 'canonical-background',
    type: 'background',
    kind: 'background',
    slug: 'Background',
    options: { style: { backgroundColor: 'red' } },
  };
  const { result, rerender, unmount } = renderHook(({ pageId }) => usePageEffectsState({
    editor,
    pageId,
    ownerPageId: pageId,
  }), { initialProps: { pageId: 'old-page' } });
  const staleWrite = result.current.writeEffects;
  rerender({ pageId: 'current-page' });
  act(() => staleWrite([draft]));
  expect(editor.state.doc.attrs.visualEffects).toEqual([]);
  act(() => result.current.writeEffects([draft]));
  const descriptions = editor.state.doc.attrs.visualEffects;
  expect(descriptions[0].effect.id).toBe('canonical-background');
  expect(descriptions[0].lifetime).toEqual({ type: 'page', pageId: 'current-page' });
  expect(editor.state.doc.attrs.pageEffects).not.toHaveProperty('background');
  unmount();
  editor.destroy();
});
