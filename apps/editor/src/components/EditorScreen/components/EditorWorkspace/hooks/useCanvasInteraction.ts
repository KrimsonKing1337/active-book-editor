import {
  type KeyboardEvent,
  useEffect,
  useState,
} from 'react';

import type { Editor } from '@tiptap/core';

export const useCanvasInteraction = (editor: Editor | null) => {
  const [isNodeSelectionActive, setIsNodeSelectionActive] = useState(false);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const handleCanvasInteraction = (event: Event) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (editor.view.dom.contains(target)) {
        setIsNodeSelectionActive(true);

        return;
      }

      if (target instanceof Element && target.closest('[data-active-book-effects-ui]')) {
        return;
      }

      setIsNodeSelectionActive(false);
    };

    document.addEventListener('pointerdown', handleCanvasInteraction, true);
    document.addEventListener('focusin', handleCanvasInteraction, true);

    return () => {
      document.removeEventListener('pointerdown', handleCanvasInteraction, true);
      document.removeEventListener('focusin', handleCanvasInteraction, true);
    };
  }, [editor]);

  const handleCanvasKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape' || !editor) {
      return;
    }

    const target = event.target;

    if (!(target instanceof Node) || !editor.view.dom.contains(target)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const focusedElement = document.activeElement;

    if (focusedElement instanceof HTMLElement && editor.view.dom.contains(focusedElement)) {
      focusedElement.blur();
    }

    editor.commands.blur();
    setIsNodeSelectionActive(false);
  };

  return { isNodeSelectionActive, handleCanvasKeyDown };
};
