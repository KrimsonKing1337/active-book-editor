import type { Editor } from '@tiptap/core';

import { visualToDraft } from '@active-book/book-builder/visualEffects';


import type { PageEffects as GroupedPageEffects } from '@active-book/book-builder/effects';

import type {
  AudioEffectDraft,
  BackgroundEffectDraft,
  EditorEffectDraft,
  FlashlightEffectDraft,
  FrameEffectDraft,
  VibrationEffectDraft,
} from '../@types';

import type {
  BackgroundPreviewKeyParams,
  BackgroundStylePreviews,
  FrameStylePreviewKeyParams,
  FrameStylePreviews,
} from './@types';

type GroupPageEffectsParams = {
  effects: EditorEffectDraft[];
  previous: GroupedPageEffects;
};

type ApplyPendingStylePreviewsParams = {
  effects: EditorEffectDraft[];
  backgroundPreviews: BackgroundStylePreviews;
  framePreviews: FrameStylePreviews;
};

export const getFramePreviewKey = (effectId: string, itemId: string): string => {
  return JSON.stringify([effectId, itemId]);
};

export const getFrameStylePreviewKey = ({
  effectId,
  kind,
  itemId,
}: FrameStylePreviewKeyParams): string => {
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
  const grouped: GroupedPageEffects = editor?.state.doc.attrs.pageEffects ?? {};

  const groupedAudio = grouped.audio ?? [];
  const groupedVibration = grouped.vibration ?? [];
  const groupedFlashlight = grouped.flashlight ?? [];
  const visual = editor?.state.doc.attrs.visualEffects ?? [];

  return [
    ...groupedAudio,
    ...groupedVibration,
    ...groupedFlashlight,
    ...visual.map(visualToDraft),
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

  const frame = effects.filter((effectCur): effectCur is FrameEffectDraft => {
    return effectCur.type === 'frame';
  });

  return {
    ...previous,
    audio,
    vibration,
    flashlight,
    background,
    frame,
  };
};

const applyFrameStylePreviews = (
  effect: FrameEffectDraft,
  previews: FrameStylePreviews,
): FrameEffectDraft => {
  const { shadow, text } = effect.options;

  const shadowKey = shadow && getFrameStylePreviewKey({
    effectId: effect.id,
    kind: 'shadow',
    itemId: shadow.id,
  });

  const textKey = text && getFrameStylePreviewKey({
    effectId: effect.id,
    kind: 'text',
    itemId: text.id,
  });

  const componentKey = getFrameStylePreviewKey({
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

  let updatedShadow = shadow;
  let updatedText = text;

  if (shadowStyle && shadow) {
    updatedShadow = {
      ...shadow,
      style: shadowStyle,
    };
  }

  if (textStyle && text) {
    updatedText = {
      ...text,
      style: textStyle,
    };
  }
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
  const {
    image,
    video,
    shadow,
  } = effect.options;

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
  let updatedImage = image;
  let updatedVideo = video;
  let updatedShadow = shadow;

  if (imageStyle && image) {
    updatedImage = {
      ...image,
      style: imageStyle,
    };
  }

  if (videoStyle && video) {
    updatedVideo = {
      ...video,
      style: videoStyle,
    };
  }

  if (shadowStyle && shadow) {
    updatedShadow = {
      ...shadow,
      style: shadowStyle,
    };
  }

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
  framePreviews,
}: ApplyPendingStylePreviewsParams): EditorEffectDraft[] => {
  return effects.map((effectCur) => {
    if (effectCur.type === 'frame') {
      return applyFrameStylePreviews(effectCur, framePreviews);
    }

    if (effectCur.type === 'background') {
      return applyBackgroundStylePreviews(effectCur, backgroundPreviews);
    }

    return effectCur;
  });
};
