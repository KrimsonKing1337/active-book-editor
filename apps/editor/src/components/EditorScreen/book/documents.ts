import type { Editor, JSONContent } from '@tiptap/core';
import { EditorState } from '@tiptap/pm/state';

import type { BookDocument, BookPage } from '@active-book/book-builder/book';
import { normalizeSpecializedEffects } from '@active-book/book-builder/effects/utils';

import { createEmptyDocument } from '../utils';

export const createPage = (): BookPage => {
  return {
    id: crypto.randomUUID(),
    document: createEmptyDocument(),
  };
};

export const createEmptyBook = (): BookDocument => {
  const page = createPage();

  return {
    type: 'book',
    pages: [page],
    visualEffects: [],
  };
};

/** A fresh plugin state intentionally clears undo/redo when changing pages or projects. */
export const replaceEditorDocument = (editor: Editor, document: JSONContent): void => {
  const pageEffects = normalizeSpecializedEffects(document.attrs?.pageEffects);
  const visualEffects = document.attrs?.visualEffects ?? [];

  const attrs = {
    ...document.attrs,
    pageEffects,
    visualEffects,
  };

  const normalized = {
    ...document,
    attrs,
  };

  const state = EditorState.create({
    schema: editor.schema,
    doc: editor.schema.nodeFromJSON(normalized),
    plugins: editor.state.plugins,
  });

  editor.view.updateState(state);

  const emittingTransaction = {
    editor,
    transaction: state.tr,
    appendedTransactions: [],
  };

  const emittingSelectionUpdate = {
    editor,
    transaction: state.tr,
  };

  editor.emit('transaction', emittingTransaction);
  editor.emit('selectionUpdate', emittingSelectionUpdate);
};
