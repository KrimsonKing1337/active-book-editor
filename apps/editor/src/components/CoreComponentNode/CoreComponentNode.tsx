import { Node, mergeAttributes } from '@tiptap/core';
import { type NodeViewProps, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';

import classNames from 'classnames';

import { Counter } from '@components/Counter';

import styles from './CoreComponentNode.module.scss';

const componentRegistry = {
  Counter,
} as const;

type ComponentName = keyof typeof componentRegistry;

function CoreComponentView({ node, selected }: NodeViewProps) {
  const name = node.attrs.name as ComponentName;

  const Component = componentRegistry[name];

  const nodeViewWrapperClassNames = classNames({
    [styles.CoreComponentNode]: true,
    [styles.isSelected]: selected,
  });

  const unknownComponent = (
    <div>
      Unknown component: {name}
    </div>
  );

  return (
    <NodeViewWrapper className={nodeViewWrapperClassNames} data-component={name} data-active-book-node={name}>
      <div className={styles.Label}>
        {name}
      </div>

      {Component ? <Component /> : unknownComponent}
    </NodeViewWrapper>
  );
}

export const CoreComponentNode = Node.create({
  name: 'coreComponent',
  group: 'activeBookBlock',
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
