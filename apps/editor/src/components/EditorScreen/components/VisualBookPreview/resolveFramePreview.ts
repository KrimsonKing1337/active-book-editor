import type { FrameEffectDraft } from '../PageEffects/@types';
import type { FrameItemPreviews, FrameStylePreviews } from '../PageEffects/context';


import { getFramePreviewKey, getFrameStylePreviewKey } from '../PageEffects/context';

type ResolveFrameInstanceOptionsParams = {
  effect: FrameEffectDraft;
  previews: FrameItemPreviews;
  stylePreviews: FrameStylePreviews;
};

export const resolveFramePreview = ({
  effect,
  previews,
  stylePreviews,
}: ResolveFrameInstanceOptionsParams) => {
  const { shadow, text } = effect.options;

  const shadowPreviewKey = shadow ? getFramePreviewKey(effect.id, shadow.id) : undefined;
  const textPreviewKey = text ? getFramePreviewKey(effect.id, text.id) : undefined;

  const shadowPreview = shadowPreviewKey ? previews[shadowPreviewKey] : undefined;
  const textPreview = textPreviewKey ? previews[textPreviewKey] : undefined;

  const shadowStyleKey = shadow
    ? getFrameStylePreviewKey({
      effectId: effect.id,
      kind: 'shadow',
      itemId: shadow.id,
    })
    : undefined;

  const textStyleKey = text
    ? getFrameStylePreviewKey({
      effectId: effect.id,
      kind: 'text',
      itemId: text.id,
    })
    : undefined;
  const componentStyleKey = getFrameStylePreviewKey({
    effectId: effect.id,
    kind: 'component',
    itemId: effect.id,
  });

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

  return {
    ...effect.options,
    shadow: resolvedShadow,
    text: resolvedText,
    style: previewComponentStyle,
  };
};
