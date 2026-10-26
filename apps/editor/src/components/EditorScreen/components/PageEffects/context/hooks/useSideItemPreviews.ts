import { useCallback, useState } from 'react';

import type { SideItemPreviews, SideItemPreviewUpdate } from '../@types';

import { getSidePreviewKey } from '../utils';

export const useSideItemPreviews = () => {
  const [sideItemPreviews, setSideItemPreviews] = useState<SideItemPreviews>({});

  const updateSideItemPreview = useCallback((update: SideItemPreviewUpdate) => {
    const {
      effectId,
      itemId,
      changes,
    } = update;
    const key = getSidePreviewKey(effectId, itemId);

    setSideItemPreviews((current) => {
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
    sideItemPreviews,
    updateSideItemPreview,
  };
};
