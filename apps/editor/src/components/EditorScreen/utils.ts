import type { Editor, JSONContent } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import StarterKit from '@tiptap/starter-kit';

import type { Config } from 'activeBook-core/@types';

import { CoreComponentNode } from '@components/CoreComponentNode';
import { H1Node, H2Node, PNode } from '@components/EditableComponentNode';

import { ExistingProjectError, FileSystemAccessUnsupportedError, InvalidProjectError } from '@project/errors';

import type { BuildState, TextComponentName } from './@types';

export const AUTO_SAVE_DELAY = 1500;

export const activeBookBlockNodes = [
  CoreComponentNode,
  PNode,
  H1Node,
  H2Node,
];

// Чтобы явно указать, что дефолтный текстовый узел - это P, пишем его первым.
// И тогда при нажатии на Enter вставится именно он.
export const ActiveBookDocument = Document.extend({
  content: '(activeBookP | activeBookBlock)+',
});

export const editorExtensions = [
  StarterKit.configure({
    document: false,
    paragraph: false,
    heading: false,
    blockquote: false,
    codeBlock: false,
    bulletList: false,
    orderedList: false,
    listItem: false,
    horizontalRule: false,
    trailingNode: false,
    hardBreak: {
      keepMarks: true,
    },
  }),

  ActiveBookDocument,
  ...activeBookBlockNodes,
];

export const editorConfig: Config = {
  id: 'editor-preview',
  authorComments: 0,
  pages: 0,
  defaultTheme: 'dark',
  disableThemes: false,
};

export const createEmptyDocument = (): JSONContent => ({
  type: 'doc',
  content: [
    {
      type: 'activeBookP',
    },
  ],
});

export const getProjectErrorMessage = (error: unknown): string => {
  if (error instanceof FileSystemAccessUnsupportedError) {
    return 'Этот браузер не поддерживает выбор локальных папок для проектов';
  }

  if (error instanceof ExistingProjectError) {
    return 'В выбранной папке уже есть book.json. ' +
      'Откройте этот проект через «Открыть проект», чтобы не перезаписать его';
  }

  if (error instanceof InvalidProjectError) {
    return error.message;
  }

  return 'Не удалось выполнить операцию с проектом. Подробности — в консоли';
};

export const getBuildStateLabel = (buildState: BuildState): string => {
  if (buildState === 'success') {
    return 'Готово: результат в dist-book/';
  }

  if (buildState === 'error') {
    return 'Сборка завершилась с ошибкой. Смотри консоль dev-сервера';
  }

  return '';
};

export const insertEditorContent = (editor: Editor | null, content: JSONContent): void => {
  if (!editor) {
    return;
  }

  const editorChain = editor.chain();
  const focusedEditorChain = editorChain.focus();
  const contentEditorChain = focusedEditorChain.insertContent(content);

  contentEditorChain.run();
};

export const insertComponent = (editor: Editor | null, name: string): void => {
  const componentContent: JSONContent = {
    type: 'coreComponent',
    attrs: {
      name,
    },
  };

  insertEditorContent(editor, componentContent);
};

export const insertTextComponent = (editor: Editor | null, name: TextComponentName): void => {
  const typeMap = {
    P: 'activeBookP',
    H1: 'activeBookH1',
    H2: 'activeBookH2',
  } as const;

  const nodeType = typeMap[name];

  const textContent: JSONContent = {
    type: nodeType,
  };

  insertEditorContent(editor, textContent);
};
