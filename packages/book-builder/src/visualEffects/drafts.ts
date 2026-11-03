import type { JsonValue, VisualEffectRegistration } from '@active-book/types';

import type { BackgroundOptions, FrameOptions } from '../effects';

import { resolveBackgroundOptions, resolveFrameOptions } from '../effects';

import type { AuthoredVisualEffect } from './@types';
import { getVisualCategory, getVisualComponentId } from './definitions';

export { type VisualDraft, visualToDraft } from './visualToDraft';
export { draftToVisual } from './draftToVisual';

type Params = VisualEffectRegistration['effect']['params'];
type Options = BackgroundOptions & FrameOptions;

export const resolveVisualParams = (description: AuthoredVisualEffect): Params => {
  const params = description.effect.params;
  const options = params as Options;

  const category = getVisualCategory(description.effect.definitionId);

  let resolved: FrameOptions | BackgroundOptions;

  if (category === 'background') {
    resolved = resolveBackgroundOptions(options);
  } else {
    resolved = resolveFrameOptions(options);
  }

  const isCustomComponent = Boolean(getVisualComponentId(description.effect.definitionId));
  const nativeParams = isCustomComponent ? params : {};

  const compiled: Record<string, JsonValue> = JSON.parse(JSON.stringify({
    ...nativeParams,
    ...resolved,
    kind: params.kind,
    custom: params.custom,
    componentKey: params.componentKey,
  }));

  delete compiled.styleFilters;

  if (isCustomComponent && params.style === undefined && params.styleFilters === undefined) {
    delete compiled.style;
  }

  return compiled;
};
