import { useCallback, useState } from 'react';

import type { FrameItemPreviews, FrameItemPreviewUpdate } from '../@types';

import { getFramePreviewKey } from '../utils';

export const useFrameItemPreviews = () => {
  const [frameItemPreviews, setFrameItemPreviews] = useState<FrameItemPreviews>({});

  const updateFrameItemPreview = useCallback((update: FrameItemPreviewUpdate) => {
    const {
      effectId,
      itemId,
      changes,
    } = update;
    const key = getFramePreviewKey(effectId, itemId);

    setFrameItemPreviews((current) => {
      const itemPreview = {
        ...current[key],
        ...changes,
      };

      return {
        ...current,
        [key]: itemPreview,
      };
    });
  }, []);

  return {
    frameItemPreviews,
    updateFrameItemPreview,
  };
};
