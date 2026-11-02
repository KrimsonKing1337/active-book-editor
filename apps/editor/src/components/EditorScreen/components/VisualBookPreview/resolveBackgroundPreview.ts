import type { BackgroundEffectDraft } from '../PageEffects/@types';
import type { BackgroundStylePreviews } from '../PageEffects/context';

import { getBackgroundPreviewKey } from '../PageEffects/context';

type BackgroundPreviewOptions = {
  effect: BackgroundEffectDraft;
  stylePreviews: BackgroundStylePreviews;
};

export const resolveBackgroundPreview = ({ effect, stylePreviews }: BackgroundPreviewOptions) => {
  const options = { ...effect.options };
  for (const layer of ['background', 'shadow', 'image', 'video'] as const) {
    const media = layer === 'image' || layer === 'video' ? options[layer] : undefined;
    const key = getBackgroundPreviewKey({
      effectId: effect.id,
      layer,
      mediaId: media?.id,
    });
    const style = stylePreviews[key];
    if (!style) {
      continue;
    }

    if (layer === 'background') {
      options.style = style;
    } else if (layer === 'image' && options.image) {
      options.image = {
        ...options.image,
        style,
      };
    } else if (layer === 'video' && options.video) {
      options.video = {
        ...options.video,
        style,
      };
    } else if (layer === 'shadow' && options.shadow) {
      options.shadow = {
        ...options.shadow,
        style,
      };
    }
  }

  return options;
};
