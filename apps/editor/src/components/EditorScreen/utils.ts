import type { Editor, JSONContent } from '@tiptap/core';

import { Extension } from '@tiptap/core';
import { NodeSelection, Plugin } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import Document from '@tiptap/extension-document';
import StarterKit from '@tiptap/starter-kit';
import Paragraph from '@tiptap/extension-paragraph';
import Heading from '@tiptap/extension-heading';

import type { Config } from '@active-book/core/@types';

import type { PageEffects } from '@active-book/book-builder/effects';

import { isContentLinkAllowed } from '@active-book/book-builder/content';

import {
  ExistingProjectError,
  FileSystemAccessUnsupportedError,
  InvalidProjectError,
} from '@project/errors';

import { ComponentNode } from '@components/ComponentNode';
import { CarouselNode, CarouselSlide } from '@components/CarouselNode';
import { ContentValidation } from '@components/ContentValidation';

import type { BuildState, TextBlock } from './@types';

export const AUTO_SAVE_DELAY = 1500;

export const contentNodes = [
  Paragraph.extend({ group: 'block slideBlock' }),
  Heading.extend({ group: 'block slideBlock' }).configure({ levels: [1, 2] }),
  ComponentNode.extend({ group: 'block slideBlock' }),
  CarouselNode,
  CarouselSlide,
];

// The paragraph comes first so Enter and required empty blocks use the standard text node.
export const PageDocument = Document.extend({
  content: '(paragraph | block)+',

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
  'paragraph',
  'heading',
  'coreComponent',
  'carousel',
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

            const blockShift = blockPosition + block.nodeSize;

            const decoration = Decoration.node(blockPosition, blockShift, {
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
    link: {
      openOnClick: false,
      isAllowedUri: isContentLinkAllowed,
    },
    hardBreak: {
      keepMarks: true,
    },
  }),

  PageDocument,
  ActiveBlockHighlight,
  ...contentNodes,
  ContentValidation,
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
      type: 'paragraph',
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

type CustomComponent = {
  packageName: string;
  name: string;
};

export const insertCustomComponent = (editor: Editor | null, component: CustomComponent): void => {
  const { name, packageName } = component;

  insertEditorContent(editor, {
    type: 'coreComponent',
    attrs: {
      name,
      package: packageName,
    },
  });
};

export const insertTextBlock = (editor: Editor | null, block: TextBlock): void => {
  insertEditorContent(editor, block);
};
