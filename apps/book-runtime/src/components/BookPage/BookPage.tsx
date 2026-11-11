import type { ComponentType } from 'react';

import type { BookRuntime } from '@active-book/types';

import {
  Audio,
  Vibration,
  Flashlight,
} from '@active-book/core/components/ProxyHooks';

import { assertContentDocument } from '@active-book/book-builder/content';

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
  assertContentDocument(document, `pages[${page - 1}].document`);

  const content = document.content ?? [];

  const audioEffects = getAudioEffects(document);
  const vibrationEffects = getVibrationEffects(document);
  const flashlightEffects = getFlashlightEffects(document);

  return (
    <div data-page-content-id={pageId}>
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
          path: `pages[${page - 1}].document.content[${index}]`,
        });
      })}
    </div>
  );
};
