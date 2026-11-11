import type { Editor } from '@tiptap/core';

export const reportContentError = (editor: Editor, cause: unknown): void => {
  let error = new Error('Не удалось вставить содержимое', { cause });

  if (cause instanceof Error) {
    error = cause;
  }

  editor.emit('contentError', {
    editor,
    error,
    disableCollaboration: () => {},
  });
};
