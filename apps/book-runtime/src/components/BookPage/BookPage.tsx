import { type ComponentType, createElement } from 'react';



import type { BookRuntime } from '@active-book/types';

import { PageWrapper } from 'activeBook-core/components';
import { Audio, Vibration, Flashlight, Background, Frame } from 'activeBook-core/components/ProxyHooks';

import { resolveBackgroundOptions, resolveFrameOptions } from '@active-book/book-builder/effects';

import type { PageDocument, CustomComponentType } from '@types';


import { renderNode } from '@utils/renderNode';

import {
  getAudioEffects,
  getVibrationEffects,
  getFlashlightEffects,
  getBackgroundEffects,
  getFrameEffects,
} from './utils';

type BookPageProps = {
  document: PageDocument;
  page: number;
  pageId: string;
  customComponents: Record<string, ComponentType>;
  bookRuntime: BookRuntime;
};

export const BookPage = ({ document, page, pageId, customComponents, bookRuntime }: BookPageProps) => {
  const content = document.content ?? [];

  const audioEffects = getAudioEffects(document);
  const vibrationEffects = getVibrationEffects(document);
  const flashlightEffects = getFlashlightEffects(document);
  const backgroundEffects = getBackgroundEffects(document);
  const frameEffects = getFrameEffects(document);

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

        {frameEffects.map((effectCur) => {
          const { component, ...frameOptions } = effectCur.options;

          const options = resolveFrameOptions(frameOptions);

          let componentId = null;

          if (component) {
            componentId = `${component.package}/${component.name}`;
          }

          let CustomComponent;

          if (componentId) {
            CustomComponent = customComponents[componentId] as CustomComponentType;
          }

          const componentProps = {
            book: bookRuntime,
          };

          let componentElement = null;

          if (CustomComponent) {
            componentElement = createElement(CustomComponent, componentProps);
          }

          return (
            <Frame
              key={effectCur.id}
              id={effectCur.id}
              kind={effectCur.kind}
              {...options}
              Component={componentElement}
            />
          );
        })}

        {backgroundEffects.map((effectCur) => {
          const {
            component,
            ...effectOptions
          } = effectCur.options;

          const options = resolveBackgroundOptions(effectOptions);

          let componentId = null;

          if (component) {
            componentId = `${component.package}/${component.name}`;
          }

          let CustomComponent;

          if (componentId) {
            CustomComponent = customComponents[componentId] as CustomComponentType;
          }

          let componentElement = null;

          if (CustomComponent) {
            componentElement = createElement(CustomComponent, {
              book: bookRuntime,
            });
          }

          return (
            <Background
              key={effectCur.id}
              id={effectCur.id}
              kind={effectCur.kind}
              {...options}
              Component={componentElement}
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
