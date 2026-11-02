import { createElement } from 'react';

import type { BookRuntime, VisualEffectDefinition, VisualRendererProps } from '@active-book/types';

import { BackgroundRenderer } from 'activeBook-core/components/BackgroundEffects/components/BackgroundRenderer';
import { FrameRenderer } from 'activeBook-core/components/FrameEffects/components/FrameRenderer';

import type { BrowserLibrary } from './browser';

/** Package implementations remain runtime values, separate from the authored JSON. */
export const createCustomVisualDefinitions = (
  libraries: readonly BrowserLibrary[],
  book: BookRuntime,
): VisualEffectDefinition[] => {
  return libraries.flatMap((libraryCur) => libraryCur.visualDefinitions.map((definitionCur) => {
    const Implementation = libraryCur.visualComponents[definitionCur.id];
    const Presentation = definitionCur.category === 'background' ? BackgroundRenderer : FrameRenderer;
    const Renderer = (props: VisualRendererProps) => {
      const componentKey = props.params.componentKey;
      const key = typeof componentKey === 'string' || typeof componentKey === 'number' ? componentKey : undefined;

      const content = createElement(Implementation, { ...props, book, key });

      const presentationParams = {
        ...props.params,
        kind: 'component',
      };
      const presentationProps = {
        ...props,
        params: presentationParams,
      };

      return createElement(Presentation, presentationProps, content);
    };

    return {
      id: definitionCur.id,
      defaultParams: definitionCur.defaultParams,
      Renderer,
    };
  }));
};
