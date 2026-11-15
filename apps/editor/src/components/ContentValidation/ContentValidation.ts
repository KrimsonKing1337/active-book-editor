import type { Range, RawCommands } from '@tiptap/core';

import { commands, Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';

import {
  clipboardGuards,
  createDocumentValidator,
  reportContentError,
  validateInput,
  validateRange,
} from './utils';

// Validate the source before ProseMirror fitting can lift or discard forbidden containers.
export const ContentValidation = Extension.create({
  name: 'contentValidation',

  addCommands() {
    const insertContentAt: RawCommands['insertContentAt'] = (...args) => {
      return (props) => {
        const [
          position,
          content,
          options,
        ] = args;

        let range: Range;

        if (typeof position === 'number') {
          range = { from: position, to: position };
        } else {
          range = position;
        }

        try {
          const insideSlide = validateRange(props.tr.doc, range);

          validateInput(content, insideSlide);

          const command = commands.insertContentAt(position, content, {
            ...options,
            errorOnInvalidContent: true,
          });

          return command(props);
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

          const command = commands.setContent(content, {
            ...options,
            errorOnInvalidContent: true,
          });

          return command(props);
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
    const validateDocument = createDocumentValidator();

    return [
      new Plugin({
        filterTransaction(transaction, state) {
          if (!transaction.docChanged) {
            return true;
          }

          try {
            validateDocument(transaction.doc, state.doc);

            return true;
          } catch (error) {
            reportContentError(editor, error);

            return false;
          }
        },
        props: clipboardGuards(editor),
      }),
    ];
  },
});
