import { PageWrapper } from 'activeBook-core/components';

import { renderNode } from '@utils/renderNode';

import type { BookDocument } from '../@types';

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
