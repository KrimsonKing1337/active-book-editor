import type { JsonValue } from '@active-book/types';

import { createBuiltinRegistration } from 'activeBook-core/controllers/visualEffects/utils/declarations';

import type { FrameOptions } from '../effects';
import { resolveBackgroundOptions, resolveFrameOptions } from '../effects';

import type { AuthoredVisualEffect } from './@types';
import type { VisualDraft } from './visualToDraft';

import { customVisualDefinitionId } from './definitions';
import { visualToDraft } from './visualToDraft';

type DraftToVisualOptions = {
  draft: VisualDraft;
  pageId: string;
  previous?: AuthoredVisualEffect;
};

export const draftToVisual = ({ draft, pageId, previous }: DraftToVisualOptions): AuthoredVisualEffect => {
  const {
    id,
    kind,
    type,
    slug,
    options,
  } = draft;
  const resolved = type === 'background' ? resolveBackgroundOptions(options) : resolveFrameOptions(options);
  const registration = createBuiltinRegistration({
    type,
    options: { ...resolved, id, kind } as Parameters<typeof createBuiltinRegistration>[0]['options'],
    lifetime: {
      type: 'page',
      page: 1,
    },
  });
  const component = options.component;
  const definitionId = kind === 'component' && component
    ? customVisualDefinitionId(type, `${component.package}/${component.name}`)
    : registration.effect.definitionId;
  const params: Record<string, JsonValue> = JSON.parse(JSON.stringify({ ...options, kind }));
  delete params.component;
  delete params.layer;
  delete params.frameMask;

  // These controls are panel views of depth.order, never a second persisted order.
  for (const property of ['style', 'shadow', 'text', 'image', 'video']) {
    const item = params[property] as Record<string, JsonValue> | undefined;
    const style = property === 'style' ? item : item?.style as Record<string, JsonValue> | undefined;
    if (style) {
      delete style.zIndex;
    }
  }

  const before = previous ? visualToDraft(previous) : null;
  const frameOptions = options as FrameOptions;
  const keepPlane = before?.type === 'background'
    || (before?.type === 'frame' && before.options.layer === frameOptions.layer);
  const keepVisibility = before?.type === 'background'
    || (before?.type === 'frame'
      && JSON.stringify(before.options.frameMask) === JSON.stringify(frameOptions.frameMask));
  const depth = {
    ...registration.effect.depth,
    plane: keepPlane && previous ? previous.effect.depth.plane : registration.effect.depth.plane,
  };
  const visibility = keepVisibility && previous ? previous.effect.visibility : {
    ...registration.effect.visibility,
    ...(previous?.effect.visibility.mask ? { mask: previous.effect.visibility.mask } : {}),
  };
  const effect = {
    ...registration.effect,
    definitionId,
    params,
    placement: previous?.effect.placement ?? registration.effect.placement,
    visibility,
    depth,
  };
  const lifetime = previous?.lifetime ?? {
    type: 'page',
    pageId,
  };

  return {
    effect,
    slug,
    lifetime,
  };
};
