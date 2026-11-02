import type { JsonValue, VisualEffectRegistration } from '@active-book/types';

import type { BackgroundOptions, FrameOptions } from '../effects';

import { resolveBackgroundOptions, resolveFrameOptions } from '../effects';

import type { AuthoredVisualEffect } from './@types';
import { visualCategory, visualComponentId } from './definitions';

export { type VisualDraft, visualToDraft } from './visualToDraft';
export { draftToVisual } from './draftToVisual';

export const resolveVisualParams = (
  description: AuthoredVisualEffect,
): VisualEffectRegistration['effect']['params'] => {
  const params = description.effect.params;
  const options = params as BackgroundOptions & FrameOptions;
  const resolved = visualCategory(description.effect.definitionId) === 'background'
    ? resolveBackgroundOptions(options) : resolveFrameOptions(options);

  const isNative = !!visualComponentId(description.effect.definitionId);
  const nativeParams = isNative ? params : {};

  const compiled: Record<string, JsonValue> = JSON.parse(JSON.stringify({
    ...nativeParams,
    ...resolved,
    kind: params.kind,
    custom: params.custom,
    componentKey: params.componentKey,
  }));
  delete compiled.styleFilters;
  if (isNative && params.style === undefined && params.styleFilters === undefined) {
    delete compiled.style;
  }

  return compiled;
};
