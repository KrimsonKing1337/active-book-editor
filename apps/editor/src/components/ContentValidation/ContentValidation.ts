import type { RawCommands } from '@tiptap/core';

import { commands, Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';

import { assertContentDocument } from '@active-book/book-builder/content';

import { isInsideSlide } from '../CarouselNode/state';

import { reportContentError } from './errors';
import { validateInput } from './validateInput';

// Validate the source before ProseMirror fitting can lift or discard forbidden containers.
export const ContentValidation = Extension.create({
  name: 'contentValidation',

  addCommands() {
    const insertContentAt: RawCommands['insertContentAt'] = (...args) => {
      return (props) => {
        const [position, content, options] = args;

        let from = position;
        let isDocumentReplacement = false;

        if (typeof from !== 'number') {
          isDocumentReplacement = from.from === 0 && from.to === props.tr.doc.content.size;
          from = from.from;
        }

        try {
          const insideSlide = !isDocumentReplacement && isInsideSlide(props.state, from);

          validateInput(content, insideSlide);

          return commands.insertContentAt(position, content, {
            ...options,
            errorOnInvalidContent: true,
          })(props);
        } catch (error) {
          if (props.dispatch) {
            reportContentError(props.editor, error);
          }

          return false;
        }
      };
    };

    const setContent: RawCommands['setContent'] = (content, options) => {
      return (props) => {
        try {
          validateInput(content, false);

          return commands.setContent(content, {
            ...options,
            errorOnInvalidContent: true,
          })(props);
        } catch (error) {
          if (props.dispatch) {
            reportContentError(props.editor, error);
          }

          return false;
        }
      };
    };

    return { insertContentAt, setContent };
  },

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [new Plugin({
      filterTransaction(transaction) {
        if (!transaction.docChanged) {
          return true;
        }

        try {
          transaction.doc.check();
          assertContentDocument(transaction.doc.toJSON());

          return true;
        } catch (error) {
          reportContentError(editor, error);

          return false;
        }
      },
      props: {
        handleDOMEvents: {
          paste(view, event) {
            try {
              const clipboardData = event.clipboardData?.getData('text/html') ?? '';

              validateInput(clipboardData, isInsideSlide(view.state));

              return false;
            } catch (error) {
              event.preventDefault();

              reportContentError(editor, error);

              return true;
            }
          },
        },
        handleDrop(...args) {
          const [view, event, slice] = args;

          const target = view.posAtCoords({ left: event.clientX, top: event.clientY });
          const position = target?.pos ?? view.state.selection.from;
          const insideSlide = isInsideSlide(view.state, position);

          try {
            const dataTransfer = event.dataTransfer?.getData('text/html') ?? '';

            validateInput(dataTransfer, insideSlide);
            validateInput(slice.content, insideSlide);

            return false;
          } catch (error) {
            reportContentError(editor, error);

            return true;
          }
        },
      },
    })];
  },
});
