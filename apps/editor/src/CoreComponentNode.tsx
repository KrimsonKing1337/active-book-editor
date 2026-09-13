import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';

import { Counter } from 'activeBook-core/components';

const componentRegistry = {
  Counter,
} as const;

type ComponentName = keyof typeof componentRegistry;

function CoreComponentView({ node, selected }: NodeViewProps) {
  const name = node.attrs.name as ComponentName;
  const Component = componentRegistry[name];

  return (
    <NodeViewWrapper
      className={`core-component-node${selected ? ' is-selected' : ''}`}
      data-component={name}
    >
      <div className="core-component-label">{name}</div>
      {Component ? <Component /> : <div>Unknown component: {name}</div>}
    </NodeViewWrapper>
  );
}

export const CoreComponentNode = Node.create({
  name: 'coreComponent',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      name: {
        default: 'Counter',
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
    return ['active-book-component', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CoreComponentView);
  },
});
