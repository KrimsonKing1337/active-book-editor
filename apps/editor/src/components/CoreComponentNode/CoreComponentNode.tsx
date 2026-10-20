import { Node, mergeAttributes } from '@tiptap/core';
import { type NodeViewProps, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';

import classNames from 'classnames';

import { Counter } from '@components/Counter';
import { useCustomComponents } from '@project/customComponentRegistry';

import styles from './CoreComponentNode.module.scss';

const componentRegistry = {
  Counter,
} as const;

type ComponentName = keyof typeof componentRegistry;

function CoreComponentView({ node, selected }: NodeViewProps) {
  const { components: customComponents, definitions: customComponentDefinitions } = useCustomComponents();
  const name = node.attrs.name as ComponentName;
  const packageName = node.attrs.package as string | null;
  const customId = packageName ? `${packageName}/${name}` : null;
  const Component = customId ? customComponents[customId] : componentRegistry[name];
  const definition = customComponentDefinitions.find((component) => component.id === customId);
  const componentLabel = definition?.title ?? name;

  const nodeViewWrapperClassNames = classNames({
    [styles.CoreComponentNode]: true,
    [styles.isSelected]: selected,
  });

  const unknownComponent = (
    <div>
      Unknown component: {customId ?? name}
    </div>
  );

  return (
    <NodeViewWrapper className={nodeViewWrapperClassNames} data-component={name} data-active-book-node={name}>
      <div className={styles.Label}>
        {componentLabel}
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
});
