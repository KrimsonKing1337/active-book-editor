import { type ComponentType } from 'react';

import type { BookRuntime } from '@active-book/types';

import { PageWrapper } from 'activeBook-core/components';
import { Audio, Vibration, Flashlight } from 'activeBook-core/components/ProxyHooks';

import type { PageDocument } from '@types';

import { renderNode } from '@utils/renderNode';

import {
  getAudioEffects,
  getVibrationEffects,
  getFlashlightEffects,
} from './utils';

type BookPageProps = {
  document: PageDocument;
  page: number;
  pageId: string;
  customComponents: Record<string, ComponentType>;
  bookRuntime: BookRuntime;
};

export const BookPage = ({
  document,
  page,
  pageId,
  customComponents,
  bookRuntime,
}: BookPageProps) => {
  const content = document.content ?? [];

  const audioEffects = getAudioEffects(document);
  const vibrationEffects = getVibrationEffects(document);
  const flashlightEffects = getFlashlightEffects(document);

  return (
    <PageWrapper data-page-id={pageId}>
      { /* Эффекты */ }
      <>
        {audioEffects.map((effectCur) => {
          return (
            <Audio
              key={effectCur.id}
              id={effectCur.id}
              page={page}
              {...effectCur.options}
            />
          );
        })}

        {flashlightEffects.map((effectCur) => {
          return (
            <Flashlight
              key={effectCur.id}
              id={effectCur.id}
              page={page}
              {...effectCur.options}
            />
          );
        })}

        {vibrationEffects.map((effectCur) => {
          return (
            <Vibration
              key={effectCur.id}
              id={effectCur.id}
              page={page}
              {...effectCur.options}
            />
          );
        })}
      </>

      {content.map((nodeCur, index) => {
        return renderNode({
          node: nodeCur,
          key: index,
          customComponents,
          bookRuntime,
        });
      })}
    </PageWrapper>
  );
};
