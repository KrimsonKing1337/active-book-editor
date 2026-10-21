import type { ComponentType, PropsWithChildren } from 'react';

import { Node } from '@tiptap/core';

import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from '@tiptap/react';

import classNames from 'classnames';

import { P, H1, H2 } from 'activeBook-core/components';

import styles from './EditableComponentNode.module.scss';

export const createCoreTextNode = (
  name: string,
  label: string,
  tag: string,
  Component: ComponentType<PropsWithChildren>,
) => {
  const EditableView = () => {
    const componentClassNames = classNames({
      [styles.P]: label === 'P',
    });

    return (
      <NodeViewWrapper
        className={componentClassNames}
        data-active-book-node={label}
      >
        <Component>
          <NodeViewContent />
        </Component>
      </NodeViewWrapper>
    );
  };

  return Node.create({
    name,
    group: 'bookBlock',
    content: 'inline*',

    parseHTML() {
      return [{ tag }];
    },

    renderHTML() {
      return [tag, 0];
    },

    addNodeView() {
      return ReactNodeViewRenderer(EditableView);
    },
  });
};

export const PNode = createCoreTextNode('P', 'P', 'div', P);
export const H1Node = createCoreTextNode('H1', 'H1', 'div', H1);
export const H2Node = createCoreTextNode('H2', 'H2', 'div', H2);
