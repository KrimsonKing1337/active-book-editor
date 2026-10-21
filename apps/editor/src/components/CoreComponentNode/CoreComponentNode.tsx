import { Node, mergeAttributes } from '@tiptap/core';
import { NodeSelection } from '@tiptap/pm/state';

import {
  type NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from '@tiptap/react';

import { useCustomComponents } from '@project/customComponentRegistry';

import { Counter } from '@components/Counter';

import styles from './CoreComponentNode.module.scss';

const componentRegistry = {
  Counter,
} as const;

type ComponentName = keyof typeof componentRegistry;

const CoreComponentView = ({ node, editor, getPos }: NodeViewProps) => {
  const { components: customComponents, definitions: customComponentDefinitions } = useCustomComponents();

  const name = node.attrs.name as ComponentName;
  const packageName = node.attrs.package as string | null;
  const customId = packageName ? `${packageName}/${name}` : null;
  const definition = customComponentDefinitions.find((cur) => cur.id === customId);
  const componentLabel = definition?.title ?? name;

  const Component = customId ? customComponents[customId] : componentRegistry[name];

  const handleSelectComponent = () => {
    const position = getPos();

    if (typeof position !== 'number') {
      return;
    }

    editor.chain().focus().setNodeSelection(position).run();
  };

  const unknownComponent = (
    <div>
      Unknown component: {customId ?? name}
    </div>
  );

  return (
    <NodeViewWrapper className={styles.CoreComponentNode} data-component={name} data-active-book-node={name}>
      <button className={styles.Label} type="button" onClick={handleSelectComponent}>
        {componentLabel}
      </button>

      {Component ? <Component /> : unknownComponent}
    </NodeViewWrapper>
  );
};

export const CoreComponentNode = Node.create({
  name: 'coreComponent',
  priority: 110,
  group: 'activeBookBlock',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      name: {
        default: 'Counter',
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
    return ReactNodeViewRenderer(CoreComponentView);
  },

  addKeyboardShortcuts() {
    const deleteSelectedComponent = () => {
      const { doc, selection } = this.editor.state;
      const isSelectedComponent = selection instanceof NodeSelection && selection.node.type.name === this.name;

      if (!isSelectedComponent) {
        return false;
      }

      if (doc.childCount === 1) {
        return this.editor.commands.insertContentAt(
          { from: selection.from, to: selection.to },
          { type: 'activeBookP' },
        );
      }

      return this.editor.commands.deleteSelection();
    };

    return {
      Backspace: deleteSelectedComponent,
      Delete: deleteSelectedComponent,
    };
  },
});
