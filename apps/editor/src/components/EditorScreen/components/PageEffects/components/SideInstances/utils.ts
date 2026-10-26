import { resolveSideOptions } from '@active-book/book-builder/effects';

import type { SideEffectDraft } from '../../@types';
import type { SideItemPreviews, SideStylePreviews } from '../../PageEffectsContext';

import { getSidePreviewKey, getSideStylePreviewKey } from '../../PageEffectsContext';

type ResolveSideInstanceOptionsParams = {
  effect: SideEffectDraft;
  previews: SideItemPreviews;
  stylePreviews: SideStylePreviews;
};

export const resolveSideInstanceOptions = ({
  effect,
  previews,
  stylePreviews,
}: ResolveSideInstanceOptionsParams) => {
  const { shadow, text } = effect.options;

  const shadowPreviewKey = shadow ? getSidePreviewKey(effect.id, shadow.id) : undefined;
  const textPreviewKey = text ? getSidePreviewKey(effect.id, text.id) : undefined;

  const shadowPreview = shadowPreviewKey ? previews[shadowPreviewKey] : undefined;
  const textPreview = textPreviewKey ? previews[textPreviewKey] : undefined;

  const shadowStyleKey = shadow ? getSideStylePreviewKey(effect.id, 'shadow', shadow.id) : undefined;
  const textStyleKey = text ? getSideStylePreviewKey(effect.id, 'text', text.id) : undefined;
  const componentStyleKey = getSideStylePreviewKey(effect.id, 'component', effect.id);

  const shadowStyle = shadowStyleKey ? stylePreviews[shadowStyleKey] : undefined;
  const textStyle = textStyleKey ? stylePreviews[textStyleKey] : undefined;
  const componentStyle = stylePreviews[componentStyleKey];

  const previewShadowStyle = shadowStyle ?? shadow?.style;
  const previewShadowHidden = shadowPreview?.hidden ?? shadow?.hidden;
  const shadowPlayState = shadowPreview?.playState ?? shadow?.animation?.playState;

  const shadowAnimation = {
    ...shadow?.animation,
    playState: shadowPlayState,
  };

  const previewShadow = shadow && {
    ...shadow,
    style: previewShadowStyle,
    hidden: previewShadowHidden,
    animation: shadowAnimation,
  };

  const previewTextStyle = textStyle ?? text?.style;
  const previewTextHidden = textPreview?.hidden ?? text?.hidden;
  const textPlayState = textPreview?.playState ?? text?.animation?.playState;

  const textAnimation = {
    ...text?.animation,
    playState: textPlayState,
  };

  const previewText = text && {
    ...text,
    style: previewTextStyle,
    hidden: previewTextHidden,
    animation: textAnimation,
  };

  const resolvedShadow = previewShadow ?? undefined;
  const resolvedText = previewText ?? undefined;
  const previewComponentStyle = componentStyle ?? effect.options.style;

  return resolveSideOptions({
    ...effect.options,
    shadow: resolvedShadow,
    text: resolvedText,
    style: previewComponentStyle,
  });
};
