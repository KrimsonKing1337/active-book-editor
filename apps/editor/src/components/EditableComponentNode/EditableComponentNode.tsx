import type { ComponentType, PropsWithChildren } from 'react';
import { Node } from '@tiptap/core';

import { P, H1, H2 } from 'activeBook-core/components';

import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from '@tiptap/react';

export const createCoreTextNode = (
  name: string,
  tag: string,
  Component: ComponentType<PropsWithChildren>,
) => {
  return Node.create({
    name,
    group: 'block',
    content: 'inline*',

    parseHTML() {
      return [{ tag }];
    },

    renderHTML() {
      return [tag, 0];
    },

    addNodeView() {
      return ReactNodeViewRenderer(() => (
        <NodeViewWrapper>
          <Component>
            <NodeViewContent />
          </Component>
        </NodeViewWrapper>
      ));
    },
  });
};

export const PNode = createCoreTextNode('activeBookP', 'div', P);
export const H1Node = createCoreTextNode('activeBookH1', 'div', H1);
export const H2Node = createCoreTextNode('activeBookH2', 'div', H2);
