import { createElement } from 'react';

import type { BookRuntime, VisualEffectDefinition, VisualRendererProps } from '@active-book/types';

import { BackgroundRenderer } from '@active-book/core/components/BackgroundEffects/components/BackgroundRenderer';
import { FrameRenderer } from '@active-book/core/components/FrameEffects/components/FrameRenderer';

import type { BrowserLibrary } from './browser';

/** Package implementations remain runtime values, separate from the authored JSON. */
export const createCustomVisualDefinitions = (
  libraries: readonly BrowserLibrary[],
  book: BookRuntime,
): VisualEffectDefinition[] => {
  const definitions: VisualEffectDefinition[] = [];

  for (const libraryCur of libraries) {
    for (const definitionCur of libraryCur.visualDefinitions) {
      const Implementation = libraryCur.visualComponents[definitionCur.id];

      let Presentation = FrameRenderer;

      if (definitionCur.category === 'background') {
        Presentation = BackgroundRenderer;
      }

      const Renderer = (props: VisualRendererProps) => {
        const componentKey = props.params.componentKey;

        const hasValidComponentKey = typeof componentKey === 'string' || typeof componentKey === 'number';

        let key: string | number | undefined;

        if (hasValidComponentKey) {
          key = componentKey;
        }

        const implementationProps = {
          ...props,
          book,
          key,
        };

        const content = createElement(Implementation, implementationProps);

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

      const definition: VisualEffectDefinition = {
        id: definitionCur.id,
        defaultParams: definitionCur.defaultParams,
        Renderer,
      };

      definitions.push(definition);
    }
  }

  return definitions;
};
