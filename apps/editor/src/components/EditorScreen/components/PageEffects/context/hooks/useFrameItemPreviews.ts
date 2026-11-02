import { useCallback, useEffect, useRef, useState } from 'react';

import type { FrameItemPreviews, FrameItemPreviewUpdate } from '../@types';

import { getFramePreviewKey } from '../utils';

type FrameSource = {
  pageId: string;
  items: FrameItemPreviews;
};

export const useFrameItemPreviews = (pageId: string) => {
  const ownerRef = useRef(pageId);

  ownerRef.current = pageId;

  const [source, setSource] = useState<FrameSource>({
    pageId,
    items: {},
  });

  const frameItemPreviews = source.pageId === pageId ? source.items : {};

  useEffect(() => {
    setSource({
      pageId,
      items: {},
    });
  }, [pageId]);

  const updateFrameItemPreview = useCallback((update: FrameItemPreviewUpdate) => {
    if (ownerRef.current !== pageId) {
      return;
    }

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

      const items = {
        ...current,
        [key]: itemPreview,
      };

      return {
        pageId,
        items,
      };
    });
  }, [pageId]);

  return {
    frameItemPreviews,
    updateFrameItemPreview,
  };
};
