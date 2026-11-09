import type { FrameEffectDraft } from '../PageEffects/@types';

import {
  type FrameItemPreviews,
  type FrameStylePreviews,
  getFramePreviewKey,
  getFrameStylePreviewKey,
} from '../PageEffects/context';

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

  let previewShadow;

  if (shadow) {
    const preview = previews[getFramePreviewKey(effect.id, shadow.id)];
    const styleKey = getFrameStylePreviewKey({
      effectId: effect.id,
      kind: 'shadow',
      itemId: shadow.id,
    });

    previewShadow = {
      ...shadow,
      style: stylePreviews[styleKey] ?? shadow.style,
      hidden: preview?.hidden ?? shadow.hidden,
      animation: {
        ...shadow.animation,
        playState: preview?.playState ?? shadow.animation?.playState,
      },
    };
  }

  let previewText;

  if (text) {
    const preview = previews[getFramePreviewKey(effect.id, text.id)];
    const styleKey = getFrameStylePreviewKey({
      effectId: effect.id,
      kind: 'text',
      itemId: text.id,
    });

    previewText = {
      ...text,
      style: stylePreviews[styleKey] ?? text.style,
      hidden: preview?.hidden ?? text.hidden,
      animation: {
        ...text.animation,
        playState: preview?.playState ?? text.animation?.playState,
      },
    };
  }

  const componentStyleKey = getFrameStylePreviewKey({
    effectId: effect.id,
    kind: 'component',
    itemId: effect.id,
  });

  return {
    ...effect.options,
    shadow: previewShadow,
    text: previewText,
    style: stylePreviews[componentStyleKey] ?? effect.options.style,
  };
};
