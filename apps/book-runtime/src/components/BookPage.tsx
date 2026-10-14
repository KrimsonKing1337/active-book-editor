import { PageWrapper } from 'activeBook-core/components';

import { Audio } from 'activeBook-core/components/ProxyHooks';

import { EnableAudio } from './EnableAudio';

import { renderNode } from '@utils/renderNode';

import type { BookDocument } from '../@types';

type BookPageProps = {
  document: BookDocument;
};

export const BookPage = ({ document }: BookPageProps) => {
  const content = document.content ?? [];
  const audioEffects = document.attrs?.pageEffects ?? [];

  return (
    <PageWrapper>
      {audioEffects.length > 0 && (
        <EnableAudio />
      )}

      {audioEffects.map((effect) => (
        <Audio
          key={effect.id}
          id={effect.id}
          page={0}
          {...effect.options}
        />
      ))}

      {content.map((node, index) => {
        return renderNode(node, index);
      })}
    </PageWrapper>
  );
};
