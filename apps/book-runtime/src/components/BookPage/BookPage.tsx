import { PageWrapper } from 'activeBook-core/components';
import { Audio, Vibration, Flashlight } from 'activeBook-core/components/ProxyHooks';

import type { BookDocument } from '@types';

import { renderNode } from '@utils/renderNode';

import { getAudioEffects, getVibrationEffects, getFlashlightEffects } from './utils';

type BookPageProps = {
  document: BookDocument;
};

export const BookPage = ({ document }: BookPageProps) => {
  const content = document.content ?? [];

  const audioEffects = getAudioEffects(document);
  const vibrationEffects = getVibrationEffects(document);
  const flashlightEffects = getFlashlightEffects(document);

  return (
    <PageWrapper>
      { /* Эффекты */ }
      <>
        {audioEffects.map((effectCur) => {
          return (
            <Audio
              key={effectCur.id}
              id={effectCur.id}
              page={1}
              {...effectCur.options}
            />
          );
        })}

        {flashlightEffects.map((effectCur) => {
          return (
            <Flashlight
              key={effectCur.id}
              id={effectCur.id}
              page={1}
              {...effectCur.options}
            />
          );
        })}

        {vibrationEffects.map((effectCur) => {
          return (
            <Vibration
              key={effectCur.id}
              id={effectCur.id}
              page={1}
              {...effectCur.options}
            />
          );
        })}
      </>

      {content.map((node, index) => {
        return renderNode(node, index);
      })}
    </PageWrapper>
  );
};
