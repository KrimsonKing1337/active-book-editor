import { PageWrapper } from 'activeBook-core/components';

import { Audio } from 'activeBook-core/components/ProxyHooks';

import { renderNode } from '@utils/renderNode';

import type { BookDocument } from '../@types';

type BookPageProps = {
  document: BookDocument;
};

export const BookPage = ({ document }: BookPageProps) => {
  const content = document.content ?? [];
  const audioEffects = (document.attrs?.pageEffects?.audio ?? []).filter((effect) => effect.options.src?.trim());

  return (
    <PageWrapper>
      {audioEffects.map((effect) => (
        <Audio
          key={effect.id}
          id={effect.id}
          page={1}
          {...effect.options}
        />
      ))}

      {content.map((node, index) => {
        return renderNode(node, index);
      })}
    </PageWrapper>
  );
};
