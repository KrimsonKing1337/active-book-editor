import { Extension, type Editor, type JSONContent } from '@tiptap/core';
import { NodeSelection, Plugin } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import Document from '@tiptap/extension-document';
import StarterKit from '@tiptap/starter-kit';

import type { Config } from '@active-book/core/@types';

import type { PageEffects } from '@active-book/book-builder/effects';

import {
  ExistingProjectError,
  FileSystemAccessUnsupportedError,
  InvalidProjectError,
} from '@project/errors';

import { ComponentNode } from '@components/ComponentNode';
import { H1Node, H2Node, PNode } from '@components/EditableComponentNode';

import type { BuildState, TextComponentName } from './@types';

export const AUTO_SAVE_DELAY = 1500;

export const bookBlockNodes = [
  ComponentNode,
  PNode,
  H1Node,
  H2Node,
];

// Чтобы явно указать, что дефолтный текстовый узел - это P, пишем его первым.
// И тогда при нажатии на Enter вставится именно он.
export const PageDocument = Document.extend({
  content: '(P | bookBlock)+',

  addAttributes() {
    const defaultEffects = {
      audio: [],
      vibration: [],
    };

    return {
      visualEffects: { default: [] },
      pageEffects: {
        default: defaultEffects satisfies PageEffects,
      },
    };
  },
});

const ACTIVE_BLOCK_NAMES = new Set([
  'P',
  'H1',
  'H2',
  'coreComponent',
]);

export const ActiveBlockHighlight = Extension.create({
  name: 'activeBlockHighlight',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations(state) {
            const { selection } = state;

            let blockPosition: number;

            if (selection instanceof NodeSelection) {
              blockPosition = selection.from;
            } else if (selection.$head.depth > 0) {
              blockPosition = selection.$head.before(1);
            } else {
              return DecorationSet.empty;
            }

            const block = state.doc.nodeAt(blockPosition);

            if (!block || !ACTIVE_BLOCK_NAMES.has(block.type.name)) {
              return DecorationSet.empty;
            }

            const decoration = Decoration.node(blockPosition, blockPosition + block.nodeSize, {
              class: 'isActive',
            });

            return DecorationSet.create(state.doc, [decoration]);
          },
        },
      }),
    ];
  },
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

  PageDocument,
  ActiveBlockHighlight,
  ...bookBlockNodes,
];

export const editorConfig: Omit<Config, 'pages'> = {
  id: 'editor-preview',
  authorComments: 0,
  defaultTheme: 'dark',
  disableThemes: false,
};

export const createEmptyDocument = (): JSONContent => ({
  type: 'doc',
  content: [
    {
      type: 'P',
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

export const insertCustomComponent = (
  editor: Editor | null,
  packageName: string,
  name: string,
): void => {
  insertEditorContent(editor, {
    type: 'coreComponent',
    attrs: {
      name,
      package: packageName,
    },
  });
};

export const insertTextComponent = (editor: Editor | null, name: TextComponentName): void => {
  insertEditorContent(editor, {
    type: name,
  });
};
