import type { ComponentType, PropsWithChildren } from 'react';

import { Node } from '@tiptap/core';

import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from '@tiptap/react';

import { P, H1, H2 } from 'activeBook-core/components';

import styles from './EditableComponentNode.module.scss';

export const createCoreTextNode = (
  name: string,
  label: string,
  tag: string,
  Component: ComponentType<PropsWithChildren>,
) => {
  const className = label === 'P' ? styles.P : undefined;

  return Node.create({
    name,
    group: 'activeBookBlock',
    content: 'inline*',

    parseHTML() {
      return [{ tag }];
    },

    renderHTML() {
      return [tag, 0];
    },

    addNodeView() {
      return ReactNodeViewRenderer(() => (
        <NodeViewWrapper className={className} data-active-book-node={label}>
          <Component>
            <NodeViewContent />
          </Component>
        </NodeViewWrapper>
      ));
    },
  });
};

export const PNode = createCoreTextNode('activeBookP', 'P', 'div', P);
export const H1Node = createCoreTextNode('activeBookH1', 'H1', 'div', H1);
export const H2Node = createCoreTextNode('activeBookH2', 'H2', 'div', H2);
