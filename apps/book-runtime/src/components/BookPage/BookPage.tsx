import { type ComponentType, createElement } from 'react';

import { PageWrapper } from 'activeBook-core/components';
import { Audio, Vibration, Flashlight, Background, Side } from 'activeBook-core/components/ProxyHooks';

import type { BookDocument, CustomComponentType } from '@types';
import type { BookRuntime } from '@active-book/types';

import { renderNode } from '@utils/renderNode';

import { resolveBackgroundOptions } from '@active-book/book-builder/effects';

import {
  getAudioEffects,
  getVibrationEffects,
  getFlashlightEffects,
  getBackgroundEffects,
  getSideEffects,
} from './utils';

type BookPageProps = {
  document: BookDocument;
  customComponents: Record<string, ComponentType>;
  bookRuntime: BookRuntime;
};

export const BookPage = ({ document, customComponents, bookRuntime }: BookPageProps) => {
  const content = document.content ?? [];

  const audioEffects = getAudioEffects(document);
  const vibrationEffects = getVibrationEffects(document);
  const flashlightEffects = getFlashlightEffects(document);
  const backgroundEffects = getBackgroundEffects(document);
  const sideEffects = getSideEffects(document);

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

        {sideEffects.map((effectCur) => {
          const { component, ...options } = effectCur.options;
          const componentId = component ? `${component.package}/${component.name}` : null;
          const CustomComponent = componentId ? customComponents[componentId] as CustomComponentType : undefined;

          const componentElement = CustomComponent
            ? createElement(CustomComponent, { book: bookRuntime })
            : null;

          return (
            <Side
              key={effectCur.id}
              id={effectCur.id}
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
