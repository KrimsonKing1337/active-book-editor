import { useCallback, useEffect, useRef, useState } from 'react';

import type { FrameItemPreviews, FrameItemPreviewUpdate } from '../@types';

import { getFramePreviewKey } from '../utils';

export const useFrameItemPreviews = (pageId: string) => {
  const ownerRef = useRef(pageId);
  ownerRef.current = pageId;
  const [source, setSource] = useState<{ pageId: string; items: FrameItemPreviews }>({ pageId, items: {} });
  const frameItemPreviews = source.pageId === pageId ? source.items : {};

  useEffect(() => setSource({ pageId, items: {} }), [pageId]);

  const updateFrameItemPreview = useCallback((update: FrameItemPreviewUpdate) => {
    if (ownerRef.current !== pageId) return;
    const {
      effectId,
      itemId,
      changes,
    } = update;
    const key = getFramePreviewKey(effectId, itemId);

    setSource((sourceCur) => {
      const current = sourceCur.pageId === pageId ? sourceCur.items : {};
      const itemPreview = {
        ...current[key],
        ...changes,
      };

      return {
        pageId,
        items: {
          ...current,
          [key]: itemPreview,
        },
      };
    });
  }, [pageId]);

  return {
    frameItemPreviews,
    updateFrameItemPreview,
  };
};
