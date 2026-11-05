import type { JsonValue } from '@active-book/types';

import { createBuiltinRegistration } from 'activeBook-core/controllers/visualEffects/utils/declarations';

import type { FrameOptions } from '../effects';
import { resolveBackgroundOptions, resolveFrameOptions } from '../effects';

import type { AuthoredVisualEffect } from './@types';
import type { VisualDraft } from './visualToDraft';

import { customVisualDefinitionId } from './definitions';

type DraftToVisualOptions = {
  draft: VisualDraft;
  pageId: string;
  previous?: AuthoredVisualEffect;
};

type RegistrationOptions = Parameters<typeof createBuiltinRegistration>[0]['options'];

const Z_INDEX_STYLE_PROPERTIES = [
  'style',
  'shadow',
  'text',
  'image',
  'video',
] as const;

export const draftToVisual = ({
  draft,
  pageId,
  previous,
}: DraftToVisualOptions): AuthoredVisualEffect => {
  const {
    id,
    kind,
    type,
    slug,
    options,
  } = draft;

  // Подготавливаем параметры встроенного эффекта
  let resolvedOptions;

  if (type === 'background') {
    resolvedOptions = resolveBackgroundOptions(options);
  } else {
    resolvedOptions = resolveFrameOptions(options);
  }

  const registrationOptions = {
    ...resolvedOptions,
    id,
    kind,
  };

  const registration = createBuiltinRegistration({
    type,
    options: registrationOptions as RegistrationOptions,
    lifetime: {
      type: 'page',
      page: 1,
    },
  });

  const defaultEffect = registration.effect;
  // Определяем реализацию компонента
  let definitionId = defaultEffect.definitionId;

  const component = options.component;

  if (kind === 'component' && component) {
    const componentId = `${component.package}/${component.name}`;

    definitionId = customVisualDefinitionId(type, componentId);
  }

  // Подготавливаем сериализуемые параметры
  const params: Record<string, JsonValue> = JSON.parse(JSON.stringify({
    ...options,
    kind,
  }));

  delete params.component;
  delete params.layer;
  delete params.frameMask;

  // Удаляем дублирующий zIndex: порядок хранится в depth.order
  for (const propertyCur of Z_INDEX_STYLE_PROPERTIES) {
    const item = params[propertyCur] as Record<string, JsonValue> | undefined;

    let style = item;

    if (propertyCur !== 'style') {
      style = item?.style as Record<string, JsonValue> | undefined;
    }

    if (style) {
      delete style.zIndex;
    }
  }

  // Placement and depth are authored metadata, shared by all visual implementations.
  const placement = draft.placement ?? previous?.effect.placement ?? defaultEffect.placement;
  const depth = draft.depth ?? previous?.effect.depth ?? defaultEffect.depth;
  let visibility = previous?.effect.visibility ?? defaultEffect.visibility;

  if (type === 'frame') {
    const frameMask = (options as FrameOptions).frameMask;
    if (frameMask || placement.region === 'frame') {
      visibility = { ...visibility };
      if (frameMask?.enabled) {
        visibility.sides = frameMask.sides;
      } else if (placement.region === 'frame') {
        // The frame region inherently consists of its sides, even after an unmasked draft.
        visibility.sides = ['top', 'right', 'bottom', 'left'];
      } else {
        delete visibility.sides;
      }
    }
  }

  const effect = {
    ...defaultEffect,
    definitionId,
    params,
    placement,
    visibility,
    depth,
  };

  let lifetime: AuthoredVisualEffect['lifetime'] = {
    type: 'page',
    pageId,
  };

  if (previous) {
    lifetime = previous.lifetime;
  }

  return {
    effect,
    slug,
    lifetime,
  };
};
