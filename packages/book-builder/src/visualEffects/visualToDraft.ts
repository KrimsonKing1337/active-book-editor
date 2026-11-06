import type {
  BackgroundEffect,
  BackgroundOptions,
  FrameEffect,
  FrameOptions,
} from '../effects';

import type { AuthoredVisualEffect } from './@types';

import { getVisualCategory, getVisualComponentId } from './definitions';
export type VisualDraft = BackgroundEffect | FrameEffect;

type PanelOptions = BackgroundOptions & FrameOptions & {
  kind?: VisualDraft['kind'];
};

/** A transient panel view. Depth and visibility remain authoritative in the description. */
export const visualToDraft = (description: AuthoredVisualEffect): VisualDraft => {
  const { effect, slug } = description;

  const type = getVisualCategory(effect.definitionId);
  const componentId = getVisualComponentId(effect.definitionId);

  // Authored options have passed JSON validation at the book boundary.
  const options = structuredClone(effect.params) as PanelOptions;

  const kind = componentId ? 'component' : options.kind;

  delete options.kind;

  // Восстанавливаем ссылку на пользовательский компонент
  if (componentId) {
    const separatorIndex = componentId.lastIndexOf('/');

    const packageName = componentId.slice(0, separatorIndex);
    const componentName = componentId.slice(separatorIndex + 1);

    options.component = {
      package: packageName,
      name: componentName,
    };
  }

  return {
    id: effect.id,
    type,
    kind,
    slug,
    options,
    placement: structuredClone(effect.placement),
    depth: structuredClone(effect.depth),
    visibility: structuredClone(effect.visibility ?? {}),
  } as VisualDraft;
};
