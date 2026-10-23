import { useRef, useState, type CSSProperties } from 'react';

import type { BackgroundPreviewLayer } from '../../PageEffectsContext';

import { useBackgroundStyle } from '../BackgroundSettings/BackgroundStyleContext';

export type StylePropertyValue = string | number | undefined;

export type UseStyleEditorProps = {
  value: CSSProperties;
  layer: BackgroundPreviewLayer;
  mediaId?: string;
};

export const useStyleEditor = ({ value, layer, mediaId }: UseStyleEditorProps) => {
  const { preview, commit } = useBackgroundStyle();
  const [draftStyle, setDraftStyle] = useState<CSSProperties | null>(null);
  const draftStyleRef = useRef<CSSProperties | null>(null);

  const previewStyle = (style: CSSProperties, updateLocal = true) => {
    draftStyleRef.current = style;

    if (updateLocal) {
      setDraftStyle(style);
    }

    preview(layer, mediaId ?? null, style);
  };

  const setProperty = (name: string, nextValue: StylePropertyValue, updateLocal = true) => {
    const updated: Record<string, StylePropertyValue> = { ...(draftStyleRef.current ?? value) };

    if (nextValue === undefined || nextValue === '') {
      delete updated[name];
    } else {
      updated[name] = nextValue;
    }

    previewStyle(updated as CSSProperties, updateLocal);
  };

  const commitStyle = () => {
    if (!draftStyleRef.current || !commit()) {
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
