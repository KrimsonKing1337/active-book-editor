import { PageWrapper } from 'activeBook-core/components';

import { renderNode } from './renderNode';

export const BookPage = ({ document }) => {
  return (
    <PageWrapper>
      {(document.content ?? []).map((node, index) => renderNode(node, index))}
    </PageWrapper>
  );
};
