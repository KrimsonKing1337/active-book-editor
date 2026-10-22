import { createElement, type ComponentType } from 'react';

import { PageWrapper } from 'activeBook-core/components';
import { Audio, Vibration, Flashlight, Background } from 'activeBook-core/components/ProxyHooks';

import type { BookDocument, CustomComponentType } from '@types';
import type { BookRuntime } from '@active-book/types';

import { renderNode } from '@utils/renderNode';

import { getAudioEffects, getVibrationEffects, getFlashlightEffects, getBackgroundEffects } from './utils';

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

        {backgroundEffects.map((effectCur) => {
          const { component, ...options } = effectCur.options;
          const componentId = component ? `${component.package}/${component.name}` : null;
          const CustomComponent = componentId
            ? customComponents[componentId] as CustomComponentType
            : undefined;

          const componentElement = CustomComponent ? createElement(CustomComponent, { book: bookRuntime }) : null;

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
