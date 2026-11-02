import type { BackgroundEffect, BackgroundOptions, FrameEffect, FrameOptions } from '../effects';

import type { AuthoredVisualEffect } from './@types';
import { visualCategory, visualComponentId } from './definitions';

export type VisualDraft = BackgroundEffect | FrameEffect;

type PanelOptions = BackgroundOptions & FrameOptions & { kind?: VisualDraft['kind'] };

/** A transient panel view. Depth and visibility remain authoritative in the description. */
export const visualToDraft = (description: AuthoredVisualEffect): VisualDraft => {
  const { effect, slug } = description;
  const type = visualCategory(effect.definitionId);
  const componentId = visualComponentId(effect.definitionId);
  // Authored options have passed JSON validation at the book boundary.
  const options: PanelOptions = JSON.parse(JSON.stringify(effect.params));
  const kind = componentId ? 'component' : options.kind;
  delete options.kind;

  if (componentId) {
    const separator = componentId.lastIndexOf('/');
    options.component = {
      package: componentId.slice(0, separator),
      name: componentId.slice(separator + 1),
    };
  }

  if (type === 'frame') {
    options.layer = effect.depth.plane === 'scene' ? 'behind' : 'above';
    options.frameMask = {
      enabled: effect.visibility.region === 'frame',
      sides: effect.visibility.region === 'frame' ? [...effect.visibility.sides] : [],
    };
  }

  const orderStyle = { zIndex: effect.depth.order };
  if (kind === 'shadow' && options.shadow) {
    options.shadow.style = {
      ...options.shadow.style,
      ...orderStyle,
    };
  } else if (kind === 'text' && options.text) {
    options.text.style = {
      ...options.text.style,
      ...orderStyle,
    };
  } else if (kind === 'image' && options.image) {
    options.image.style = {
      ...options.image.style,
      ...orderStyle,
    };
  } else if (kind === 'video' && options.video) {
    options.video.style = {
      ...options.video.style,
      ...orderStyle,
    };
  } else {
    options.style = {
      ...options.style,
      ...orderStyle,
    };
  }

  // The definition family and kind determine the discriminated panel type.
  return {
    id: effect.id,
    type,
    kind,
    slug,
    options,
  } as VisualDraft;
};
