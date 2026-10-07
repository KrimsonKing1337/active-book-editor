import { PageWrapper } from 'activeBook-core/components';

import type { BookDocument } from '@book-runtime/types';
import { renderNode } from '@book-runtime/utils/renderNode';

type BookPageProps = {
  document: BookDocument;
};

export const BookPage = ({ document }: BookPageProps) => {
  const content = document.content ?? [];

  return (
    <PageWrapper>
      {content.map((node, index) => {
        return renderNode(node, index);
      })}
    </PageWrapper>
  );
};
