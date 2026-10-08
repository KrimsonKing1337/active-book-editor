import type { ComponentType, PropsWithChildren } from 'react';
import { Node } from '@tiptap/core';

import { P, H1, H2 } from 'activeBook-core/components';

import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from '@tiptap/react';

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

    addKeyboardShortcuts() {
      return {
        Enter: () => {
          const nodeIsActive = this.editor.isActive(this.name);

          if (!nodeIsActive) {
            return false;
          }

          const blockWasSplit = this.editor.commands.splitBlock();

          if (!blockWasSplit) {
            return false;
          }

          return this.editor.commands.setNode('activeBookP');
        },
      };
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
