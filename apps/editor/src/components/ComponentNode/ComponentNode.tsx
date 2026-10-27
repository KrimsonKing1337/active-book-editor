import type { ComponentType } from 'react';

import { Node, mergeAttributes } from '@tiptap/core';
import { NodeSelection } from '@tiptap/pm/state';
import { type NodeViewProps, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';

import type { BookComponentProps } from '@active-book/types';

import { createBookRuntime } from '@active-book/book-builder/components/custom/runtime';


import { useCustomComponents } from '@project/customComponentRegistry';

import styles from './ComponentNode.module.scss';

const bookRuntime = createBookRuntime('editor');

const ComponentView = ({ node, editor, getPos }: NodeViewProps) => {
  const { components: customComponents, definitions: customComponentDefinitions } = useCustomComponents();

  const name = node.attrs.name as string;
  const packageName = node.attrs.package as string | null;
  const customId = packageName ? `${packageName}/${name}` : null;

  const definition = customComponentDefinitions.find((cur) => {
    return cur.id === customId;
  });

  const componentLabel = definition?.title ?? name;

  let Component;

  if (customId) {
    Component = customComponents[customId] as ComponentType<BookComponentProps> | undefined;
  }

  const handleSelectComponent = () => {
    const position = getPos();

    if (typeof position !== 'number') {
      return;
    }

    const selection = editor.state.selection;

    const isAlreadySelected =
      selection instanceof NodeSelection
      && selection.from === position;

    if (isAlreadySelected) {
      return;
    }

    // Select the TipTap node without stealing focus from interactive custom components.
    editor.commands.setNodeSelection(position);
  };

  const handleSelectComponentLabel = () => {
    handleSelectComponent();

    // The node label is an editor control, unlike interactive elements inside the component.
    editor.commands.focus();
  };

  const unknownComponentName = customId ?? name;

  const unknownComponent = (
    <div>
      Unknown component: {unknownComponentName}
    </div>
  );

  const component = Component ? <Component book={bookRuntime} /> : unknownComponent;

  return (
    <NodeViewWrapper
      className={styles.ComponentNode}
      data-component={name}
      data-active-book-node={name}
      onPointerDownCapture={handleSelectComponent}
      onClickCapture={handleSelectComponent}
      onFocusCapture={handleSelectComponent}
    >
      <button className={styles.Label} type="button" onClick={handleSelectComponentLabel}>
        {componentLabel}
      </button>

      {component}
    </NodeViewWrapper>
  );
};

export const ComponentNode = Node.create({
  name: 'coreComponent',
  priority: 110,
  group: 'bookBlock',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      name: {
        default: null,
      },
      package: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'active-book-component',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const mergedAttributes = mergeAttributes(HTMLAttributes);

    return [
      'active-book-component',
      mergedAttributes,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ComponentView);
  },

  addKeyboardShortcuts() {
    const deleteSelectedComponent = () => {
      const { doc, selection } = this.editor.state;

      const isSelectedComponent =
        selection instanceof NodeSelection
        && selection.node.type.name === this.name;

      if (!isSelectedComponent) {
        return false;
      }

      if (doc.childCount === 1) {
        const selectionContent = { from: selection.from, to: selection.to };
        const typeContent = { type: 'P' };

        return this.editor.commands.insertContentAt(selectionContent, typeContent);
      }

      return this.editor.commands.deleteSelection();
    };

    return {
      Backspace: deleteSelectedComponent,
      Delete: deleteSelectedComponent,
    };
  },
});
