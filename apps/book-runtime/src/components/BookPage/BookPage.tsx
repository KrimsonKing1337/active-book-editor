import type { ComponentType } from 'react';

import type { BookRuntime } from '@active-book/types';

import { Vibration, Flashlight } from '@active-book/core/components';

import { assertContentDocument } from '@active-book/book-builder/content';

import type { PageDocument } from '@types';

import { renderNode } from '@utils/renderNode';

import {
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
  const documentPath = `pages[${page - 1}].document`;

  assertContentDocument(document, documentPath);

  const content = document.content ?? [];

  const vibrationEffects = getVibrationEffects(document);
  const flashlightEffects = getFlashlightEffects(document);

  return (
    <div data-page-content-id={pageId}>
      { /* Эффекты */ }

      <>
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
        const nodePath = `${documentPath}.content[${index}]`;

        return renderNode({
          node: nodeCur,
          key: index,
          customComponents,
          bookRuntime,
          path: nodePath,
        });
      })}
    </div>
  );
};
