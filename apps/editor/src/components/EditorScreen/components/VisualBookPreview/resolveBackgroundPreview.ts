import type { StyledBackgroundMedia } from '@active-book/book-builder/effects';

import type { BackgroundEffectDraft } from '../PageEffects/@types';
import type { BackgroundStylePreviews } from '../PageEffects/context';

import { getBackgroundPreviewKey } from '../PageEffects/context';

const layers = [
  'background',
  'shadow',
  'image',
  'video',
] as const;

export type BackgroundPreviewOptions = {
  effect: BackgroundEffectDraft;
  stylePreviews: BackgroundStylePreviews;
};

export const resolveBackgroundPreview = ({ effect, stylePreviews }: BackgroundPreviewOptions) => {
  const options = { ...effect.options };

  for (const layerCur of layers) {
    let media: StyledBackgroundMedia | undefined;

    if (layerCur === 'image' || layerCur === 'video') {
      media = options[layerCur];
    }

    const key = getBackgroundPreviewKey({
      effectId: effect.id,
      layer: layerCur,
      mediaId: media?.id,
    });

    const style = stylePreviews[key];

    if (!style) {
      continue;
    }

    if (layerCur === 'background') {
      options.style = style;
    } else if (layerCur === 'image' && options.image) {
      options.image = {
        ...options.image,
        style,
      };
    } else if (layerCur === 'video' && options.video) {
      options.video = {
        ...options.video,
        style,
      };
    } else if (layerCur === 'shadow' && options.shadow) {
      options.shadow = {
        ...options.shadow,
        style,
      };
    }
  }

  return options;
};
