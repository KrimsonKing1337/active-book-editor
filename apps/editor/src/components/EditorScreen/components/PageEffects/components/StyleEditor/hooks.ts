import { type CSSProperties, useRef, useState } from 'react';

import type { FilterOperation } from '@active-book/book-builder/effects';

import type { BackgroundPreviewLayer } from '../../context';

import { useOptionalBackgroundStyle } from '../BackgroundSettings/BackgroundStyleContext';

export type StylePropertyValue = string | number | undefined;

export type StyleEditorController = {
  preview: (style: CSSProperties) => void;
  commit: () => boolean;
  commitFilters: (filters: FilterOperation[]) => void;
};

export type UseStyleEditorProps = {
  value: CSSProperties;
  layer: BackgroundPreviewLayer;
  mediaId?: string;
  controller?: StyleEditorController;
};

export const useStyleEditor = ({ value, layer, mediaId, controller }: UseStyleEditorProps) => {
  const backgroundStyle = useOptionalBackgroundStyle();

  const [draftStyle, setDraftStyle] = useState<CSSProperties | null>(null);

  const draftStyleRef = useRef<CSSProperties | null>(null);

  const previewStyle = (style: CSSProperties, updateLocal = true) => {
    draftStyleRef.current = style;

    if (updateLocal) {
      setDraftStyle(style);
    }

    const normalizedMediaId = mediaId ?? null;

    if (controller) {
      controller.preview(style);
    } else if (backgroundStyle) {
      backgroundStyle.preview(layer, normalizedMediaId, style);
    }
  };

  const setProperty = (name: string, nextValue: StylePropertyValue, updateLocal = true) => {
    const updatedValue = draftStyleRef.current ?? value;

    const updated: Record<string, StylePropertyValue> = {
      ...updatedValue,
    };

    if (nextValue === undefined || nextValue === '') {
      delete updated[name];
    } else {
      updated[name] = nextValue;
    }

    previewStyle(updated as CSSProperties, updateLocal);
  };

  const commitStyle = () => {
    if (!draftStyleRef.current) {
      return;
    }

    const didCommit = controller ? controller.commit() : backgroundStyle?.commit();

    if (!didCommit) {
      return;
    }

    draftStyleRef.current = null;

    setDraftStyle(null);
  };

  const currentStyle = draftStyle ?? value;

  return {
    currentStyle,
    previewStyle,
    setProperty,
    commitStyle,
  };
};
