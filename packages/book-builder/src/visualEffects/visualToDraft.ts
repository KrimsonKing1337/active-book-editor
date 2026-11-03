import type { VisualFrameVisibility } from '@active-book/types';

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

const getStyleTarget = (options: PanelOptions, kind: PanelOptions['kind']) => {
  if (kind === 'shadow' && options.shadow) {
    return options.shadow;
  }

  if (kind === 'text' && options.text) {
    return options.text;
  }

  if (kind === 'image' && options.image) {
    return options.image;
  }

  if (kind === 'video' && options.video) {
    return options.video;
  }

  return options;
};

/** A transient panel view. Depth and visibility remain authoritative in the description. */
export const visualToDraft = (description: AuthoredVisualEffect): VisualDraft => {
  const { effect, slug } = description;

  const type = getVisualCategory(effect.definitionId);
  const componentId = getVisualComponentId(effect.definitionId);

  // Authored options have passed JSON validation at the book boundary.
  const options: PanelOptions = JSON.parse(JSON.stringify(effect.params));

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

  // Восстанавливаем настройки рамочного эффекта
  if (type === 'frame') {
    let layer: FrameOptions['layer'] = 'above';

    if (effect.depth.plane === 'scene') {
      layer = 'behind';
    }

    const visibility = effect.visibility as VisualFrameVisibility;

    const isFrameMaskEnabled = visibility.region === 'frame';
    const frameSides = [...visibility.sides];

    options.layer = layer;

    options.frameMask = {
      enabled: isFrameMaskEnabled,
      sides: frameSides,
    };
  }

  // Восстанавливаем zIndex для отображения в панели редактора
  const styleTarget = getStyleTarget(options, kind);

  styleTarget.style = {
    ...styleTarget.style,
    zIndex: effect.depth.order,
  };

  return  {
    id: effect.id,
    type,
    kind,
    slug,
    options,
  } as VisualDraft;
};
