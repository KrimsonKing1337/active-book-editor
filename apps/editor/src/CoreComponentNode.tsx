import { Node, mergeAttributes } from '@tiptap/core';
import { type NodeViewProps, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';

import classNames from 'classnames';

import { Counter } from 'activeBook-core/components';

import './CoreComponentNode.scss';

const componentRegistry = {
  Counter,
} as const;

type ComponentName = keyof typeof componentRegistry;

function CoreComponentView({ node, selected }: NodeViewProps) {
  const name = node.attrs.name as ComponentName;

  const Component = componentRegistry[name];

  const nodeViewWrapperClassNames = classNames('CoreComponentNode', {
    selected,
  });

  const unknownComponent = (
    <div>
      Unknown component: {name}
    </div>
  );

  return (
    <NodeViewWrapper className={nodeViewWrapperClassNames} data-component={name}>
      <div className="label">
        {name}
      </div>

      {Component ? <Component /> : unknownComponent}
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
    const mergedAttributes = mergeAttributes(HTMLAttributes);

    return [
      'active-book-component',
      mergedAttributes,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CoreComponentView);
  },
});
