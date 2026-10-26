import type { CSSProperties } from 'react';

import type { EditorEffectDraft } from '../../@types';

export const removeLeadingZeros = (value: string): string => {
  return value.replace(/^(-?)0+(?=\d)/, '$1');
};

type LayerZIndexParams = {
  effects: EditorEffectDraft[];
  currentStyle: CSSProperties;
  defaultZIndex: number;
  isSide: boolean;
};

const getLayerStyles = (effect: EditorEffectDraft, isSide: boolean): (CSSProperties | undefined)[] => {
  if (isSide && effect.type === 'side') {
    const {
      shadow,
      text,
      style,
    } = effect.options;

    return [
      shadow?.style,
      text?.style,
      style,
    ];
  }

  if (!isSide && effect.type === 'background') {
    const {
      style,
      shadow,
      image,
      video,
    } = effect.options;

    return [
      style,
      shadow?.style,
      image?.style,
      video?.style,
    ];
  }

  return [];
};

export const getLayerZIndexData = ({
  effects,
  currentStyle,
  defaultZIndex,
  isSide,
}: LayerZIndexParams) => {
  const rawZIndex = Number(currentStyle.zIndex ?? defaultZIndex);
  const zIndex = Number.isFinite(rawZIndex) ? rawZIndex : 0;

  const layerZIndexes: number[] = [];

  for (const effectCur of effects) {
    const layerStyles = getLayerStyles(effectCur, isSide);

    for (const styleCur of layerStyles) {
      const value = Number(styleCur?.zIndex);

      if (styleCur?.zIndex !== undefined && Number.isFinite(value)) {
        layerZIndexes.push(value);
      }
    }
  }

  const minimumZIndex = Math.min(zIndex, ...layerZIndexes);
  const maximumZIndex = Math.max(zIndex, ...layerZIndexes);

  const sameIndexes = layerZIndexes.filter((indexCur) => indexCur === zIndex);

  const currentLayerIsRegistered = currentStyle.zIndex !== undefined;
  const digit = currentLayerIsRegistered ? 1 : 0;

  const otherLayersAtSameIndex = sameIndexes.length > digit;

  return {
    zIndex,
    minimumZIndex,
    maximumZIndex,
    otherLayersAtSameIndex,
  };
};
