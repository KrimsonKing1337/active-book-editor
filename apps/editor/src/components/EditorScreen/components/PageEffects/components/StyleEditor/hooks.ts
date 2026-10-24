import type { CSSProperties } from 'react';

import { useRef, useState } from 'react';

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

    const normalizedMediaId = mediaId ?? null;

    preview(layer, normalizedMediaId, style);
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

    const didCommit = commit();

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
