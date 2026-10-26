import type { CSSProperties } from 'react';

import type { Editor } from '@tiptap/core';

import type { PageEffects as GroupedPageEffects } from '@active-book/book-builder/effects';

import type {
  AudioEffectDraft,
  BackgroundEffectDraft,
  EditorEffectDraft,
  FlashlightEffectDraft,
  SideEffectDraft,
  VibrationEffectDraft,
} from './@types';

import type {
  BackgroundPreviewKeyParams,
  BackgroundStylePreviews,
  SideStylePreviewKeyParams,
  SideStylePreviews,
} from './PageEffectsContext.types';

type GroupPageEffectsParams = {
  effects: EditorEffectDraft[];
  previous: GroupedPageEffects;
};

type ApplyPendingStylePreviewsParams = {
  effects: EditorEffectDraft[];
  backgroundPreviews: BackgroundStylePreviews;
  sidePreviews: SideStylePreviews;
};

export const getSidePreviewKey = (effectId: string, itemId: string): string => {
  return JSON.stringify([effectId, itemId]);
};

export const getSideStylePreviewKey = ({
  effectId,
  kind,
  itemId,
}: SideStylePreviewKeyParams): string => {
  return JSON.stringify([effectId, kind, itemId]);
};

export const getBackgroundPreviewKey = ({
  effectId,
  layer,
  mediaId = null,
}: BackgroundPreviewKeyParams): string => {
  return JSON.stringify([effectId, layer, mediaId]);
};

export const getPageEffects = (editor: Editor | null): EditorEffectDraft[] => {
  const grouped = editor?.state.doc.attrs.pageEffects as GroupedPageEffects | undefined;

  if (!grouped) {
    return [];
  }

  const groupedAudio = grouped.audio ?? [];
  const groupedVibration = grouped.vibration ?? [];
  const groupedFlashlight = grouped.flashlight ?? [];
  const groupedBackground = grouped.background?.filter((cur) => Boolean(cur.kind)) ?? [];
  const groupedSide = grouped.side?.filter((cur) => Boolean(cur.kind)) ?? [];

  return [
    ...groupedAudio,
    ...groupedVibration,
    ...groupedFlashlight,
    ...groupedBackground,
    ...groupedSide,
  ];
};

export const groupPageEffects = ({ effects, previous }: GroupPageEffectsParams): GroupedPageEffects => {
  const audio = effects.filter((effectCur): effectCur is AudioEffectDraft => {
    return effectCur.type === 'audio';
  });

  const vibration = effects.filter((effectCur): effectCur is VibrationEffectDraft => {
    return effectCur.type === 'vibration';
  });

  const flashlight = effects.filter((effectCur): effectCur is FlashlightEffectDraft => {
    return effectCur.type === 'flashlight';
  });

  const background = effects.filter((effectCur): effectCur is BackgroundEffectDraft => {
    return effectCur.type === 'background';
  });

  const side = effects.filter((effectCur): effectCur is SideEffectDraft => {
    return effectCur.type === 'side';
  });

  return {
    ...previous,
    audio,
    vibration,
    flashlight,
    background,
    side,
  };
};

const applySideStylePreviews = (
  effect: SideEffectDraft,
  previews: SideStylePreviews,
): SideEffectDraft => {
  const { shadow, text } = effect.options;

  const shadowKey = shadow && getSideStylePreviewKey({
    effectId: effect.id,
    kind: 'shadow',
    itemId: shadow.id,
  });

  const textKey = text && getSideStylePreviewKey({
    effectId: effect.id,
    kind: 'text',
    itemId: text.id,
  });

  const componentKey = getSideStylePreviewKey({
    effectId: effect.id,
    kind: 'component',
    itemId: effect.id,
  });

  const shadowStyle = shadowKey ? previews[shadowKey] : undefined;
  const textStyle = textKey ? previews[textKey] : undefined;
  const componentStyle = previews[componentKey];

  if (!shadowStyle && !textStyle && !componentStyle) {
    return effect;
  }

  const updatedShadow = shadowStyle && shadow ? { ...shadow, style: shadowStyle } : shadow;
  const updatedText = textStyle && text ? { ...text, style: textStyle } : text;
  const updatedStyle = componentStyle ?? effect.options.style;

  const options = {
    ...effect.options,
    shadow: updatedShadow,
    text: updatedText,
    style: updatedStyle,
  };

  return {
    ...effect,
    options,
  };
};

const applyBackgroundStylePreviews = (
  effect: BackgroundEffectDraft,
  previews: BackgroundStylePreviews,
): BackgroundEffectDraft => {
  const { image, video, shadow } = effect.options;

  const backgroundKey = getBackgroundPreviewKey({
    effectId: effect.id,
    layer: 'background',
  });

  const imageKey = image && getBackgroundPreviewKey({
    effectId: effect.id,
    layer: 'image',
    mediaId: image.id,
  });

  const videoKey = video && getBackgroundPreviewKey({
    effectId: effect.id,
    layer: 'video',
    mediaId: video.id,
  });

  const shadowKey = getBackgroundPreviewKey({
    effectId: effect.id,
    layer: 'shadow',
  });

  const backgroundStyle = previews[backgroundKey];
  const imageStyle = imageKey ? previews[imageKey] : undefined;
  const videoStyle = videoKey ? previews[videoKey] : undefined;
  const shadowStyle = previews[shadowKey];

  if (
    !backgroundStyle
    && !imageStyle
    && !videoStyle
    && !shadowStyle
  ) {
    return effect;
  }

  const updatedStyle = backgroundStyle ?? effect.options.style;
  const updatedImage = imageStyle && image ? { ...image, style: imageStyle } : image;
  const updatedVideo = videoStyle && video ? { ...video, style: videoStyle } : video;
  const updatedShadow = shadowStyle && shadow ? { ...shadow, style: shadowStyle } : shadow;

  const options = {
    ...effect.options,
    style: updatedStyle,
    image: updatedImage,
    video: updatedVideo,
    shadow: updatedShadow,
  };

  return {
    ...effect,
    options,
  };
};

export const applyPendingStylePreviews = ({
  effects,
  backgroundPreviews,
  sidePreviews,
}: ApplyPendingStylePreviewsParams): EditorEffectDraft[] => {
  return effects.map((effectCur) => {
    if (effectCur.type === 'side') {
      return applySideStylePreviews(effectCur, sidePreviews);
    }

    if (effectCur.type === 'background') {
      return applyBackgroundStylePreviews(effectCur, backgroundPreviews);
    }

    return effectCur;
  });
};
