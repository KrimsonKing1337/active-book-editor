import { PageWrapper } from 'activeBook-core/components';

import { Audio, Vibration } from 'activeBook-core/components/ProxyHooks';

import { renderNode } from '@utils/renderNode';

import type { BookDocument } from '../../@types';

import { getAudioEffects, getVibrationEffects } from './utils';

type BookPageProps = {
  document: BookDocument;
};

export const BookPage = ({ document }: BookPageProps) => {
  const content = document.content ?? [];
  const audioEffects = getAudioEffects(document);
  const vibrationEffects = getVibrationEffects(document);

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

      {vibrationEffects.map((effect) => (
        <Vibration
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
