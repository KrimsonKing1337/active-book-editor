import type { NodeViewProps } from '@tiptap/react';

import {
  NodeViewContent,
  NodeViewWrapper,
} from '@tiptap/react';

import {
  P,
  H1,
  H2,
} from '@active-book/core/components';

import styles from './TextNodeView.module.scss';

export const TextNodeView = ({ node }: NodeViewProps) => {
  let Component = P;
  let label = 'paragraph';
  let className: string | undefined;

  if (node.type.name === 'paragraph') {
    className = styles.Paragraph;
  } else if (node.attrs.level === 1) {
    Component = H1;
    label = 'heading 1';
  } else {
    Component = H2;
    label = 'heading 2';
  }

  return (
    <NodeViewWrapper className={className} data-active-book-node={label}>
      <Component>
        <NodeViewContent />
      </Component>
    </NodeViewWrapper>
  );
};
