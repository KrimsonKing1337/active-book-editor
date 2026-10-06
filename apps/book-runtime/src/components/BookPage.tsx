import { PageWrapper } from 'activeBook-core/components';

import type { BookDocument } from '../types';
import { renderNode } from '../utils/renderNode';

type BookPageProps = {
  document: BookDocument;
};

export const BookPage = ({ document }: BookPageProps) => {
  return (
    <PageWrapper>
      {(document.content ?? []).map((node, index) => renderNode(node, index))}
    </PageWrapper>
  );
};
