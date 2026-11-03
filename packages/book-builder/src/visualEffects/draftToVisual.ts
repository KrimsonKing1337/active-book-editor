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

type RegistrationOptions = Parameters<typeof createBuiltinRegistration>[0]['options'];

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
  const properties = ['style', 'shadow', 'text', 'image', 'video'];

  for (const propertyCur of properties) {
    const item = params[propertyCur] as Record<string, JsonValue> | undefined;

    let style = item;

    if (propertyCur !== 'style') {
      style = item?.style as Record<string, JsonValue> | undefined;
    }

    if (style) {
      delete style.zIndex;
    }
  }

  // Проверяем, какие свойства предыдущей регистрации можно сохранить
  const previousDraft = previous ? visualToDraft(previous) : null;

  let shouldPreservePlane = previousDraft?.type === 'background';
  let shouldPreserveVisibility = shouldPreservePlane;

  if (previousDraft?.type === 'frame') {
    const previousFrameOptions = previousDraft.options as FrameOptions;
    const currentFrameOptions = options as FrameOptions;

    const hasSameLayer = previousFrameOptions.layer === currentFrameOptions.layer;

    const frameMaskPrev = previousFrameOptions.frameMask;
    const frameMaskCur = currentFrameOptions.frameMask;

    const hasSameMask = JSON.stringify(frameMaskPrev) === JSON.stringify(frameMaskCur);

    shouldPreservePlane = hasSameLayer;
    shouldPreserveVisibility = hasSameMask;
  }

  // Восстанавливаем глубину
  let plane = defaultEffect.depth.plane;

  if (shouldPreservePlane && previous) {
    plane = previous.effect.depth.plane;
  }

  const depth = {
    ...defaultEffect.depth,
    plane,
  };

  // Восстанавливаем видимость и пользовательскую маску
  let visibility = {
    ...defaultEffect.visibility,
  };

  if (shouldPreserveVisibility && previous) {
    visibility = previous.effect.visibility;
  } else {
    const previousMask = previous?.effect.visibility.mask;

    if (previousMask) {
      visibility = {
        ...visibility,
        mask: previousMask,
      };
    }
  }

  // Собираем эффект
  const placement = previous?.effect.placement ?? defaultEffect.placement;

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
