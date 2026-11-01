import type { Editor, JSONContent } from '@tiptap/core';
import { EditorState } from '@tiptap/pm/state';

import type { BookDocument, BookPage } from '@active-book/book-builder/book';
import { normalizePageEffects } from '@active-book/book-builder/effects/utils';

import { createEmptyDocument } from '../utils';

export const createPage = (): BookPage => ({
  id: crypto.randomUUID(),
  document: createEmptyDocument(),
});

export const createEmptyBook = (): BookDocument => ({
  type: 'book',
  pages: [createPage()],
});

/** A fresh plugin state intentionally clears undo/redo when changing pages or projects. */
export const replaceEditorDocument = (editor: Editor, document: JSONContent): void => {
  const normalized = {
    ...document,
    attrs: {
      ...document.attrs,
      pageEffects: normalizePageEffects(document.attrs?.pageEffects),
    },
  };
  const state = EditorState.create({
    schema: editor.schema,
    doc: editor.schema.nodeFromJSON(normalized),
    plugins: editor.state.plugins,
  });

  editor.view.updateState(state);
  editor.emit('transaction', { editor, transaction: state.tr, appendedTransactions: [] });
  editor.emit('selectionUpdate', { editor, transaction: state.tr });
};
