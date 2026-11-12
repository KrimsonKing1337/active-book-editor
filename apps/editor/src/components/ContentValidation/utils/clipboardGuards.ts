import type { Editor } from '@tiptap/core';
import type { EditorProps } from '@tiptap/pm/view';
import type { Fragment, Slice } from '@tiptap/pm/model';

import { reportContentError } from './errors';
import { validateClipboardHtml, validateInput } from './validateInput';
import { validateRange } from './validateRange';

const openSlideContent = (slice: Slice): Fragment => {
  const content = slice.content;
  const first = content.firstChild;
  const open = Math.min(slice.openStart, slice.openEnd);

  // Clipboard/drag slices retain open ancestor context. Ignore only that known
  // context for validation; ProseMirror receives the original Slice unchanged.
  // A closed author container must never be treated as context.
  if (content.childCount === 1 && first?.type.name === 'carousel' && open >= 2) {
    if (first.childCount === 1 && first.firstChild?.type.name === 'carouselSlide') {
      return first.firstChild.content;
    }
  }

  if (content.childCount === 1 && first?.type.name === 'carouselSlide' && open >= 1) {
    return first.content;
  }

  return content;
};

export const clipboardGuards = (editor: Editor): EditorProps => {
  return {
    handleDOMEvents: {
      paste(view, event) {
        try {
          const insideSlide = validateRange(view.state.doc, view.state.selection);
          const html = event.clipboardData?.getData('text/html') ?? '';

          validateClipboardHtml(html, insideSlide);

          return false;
        } catch (error) {
          event.preventDefault();

          reportContentError(editor, error);

          return true;
        }
      },
    },
    handlePaste(...args) {
      const [view, event, slice] = args;

      try {
        const insideSlide = validateRange(view.state.doc, view.state.selection);
        const html = event.clipboardData?.getData('text/html') ?? '';

        validateClipboardHtml(html, insideSlide);
        validateInput(openSlideContent(slice), insideSlide);

        return false;
      } catch (error) {
        reportContentError(editor, error);

        return true;
      }
    },
    handleDrop(...args) {
      const [view, event, slice, moved] = args;

      const target = view.posAtCoords({ left: event.clientX, top: event.clientY });

      if (!target) {
        return false;
      }

      try {
        // External drops insert at the pointer, rather than replacing the selection.
        // Internal moves also delete their source selection; validate both ends.
        if (moved) {
          validateRange(view.state.doc, view.state.selection);
        }

        const insideSlide = validateRange(view.state.doc, { from: target.pos, to: target.pos });
        const html = event.dataTransfer?.getData('text/html') ?? '';

        validateClipboardHtml(html, insideSlide);
        validateInput(openSlideContent(slice), insideSlide);

        return false;
      } catch (error) {
        reportContentError(editor, error);

        return true;
      }
    },
  };
};
