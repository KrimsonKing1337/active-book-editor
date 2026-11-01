import type { CSSProperties } from 'react';

import type { EditorEffectDraft } from '../../@types';

type LayerZIndexParams = {
  effects: EditorEffectDraft[];
  currentStyle: CSSProperties;
  defaultZIndex: number;
  isFrame: boolean;
};

type LayerStyle = CSSProperties | undefined;

const getLayerStyles = (effect: EditorEffectDraft, isFrame: boolean): LayerStyle[] => {
  if (isFrame && effect.type === 'frame') {
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

  if (!isFrame && effect.type === 'background') {
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
  isFrame,
}: LayerZIndexParams) => {
  const rawZIndex = Number(currentStyle.zIndex ?? defaultZIndex);
  const zIndex = Number.isFinite(rawZIndex) ? rawZIndex : 0;

  const layerZIndexes: number[] = [];

  for (const effectCur of effects) {
    const layerStyles = getLayerStyles(effectCur, isFrame);

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
  const currentLayerCount = currentLayerIsRegistered ? 1 : 0;

  const otherLayersAtSameIndex = sameIndexes.length > currentLayerCount;

  return {
    zIndex,
    minimumZIndex,
    maximumZIndex,
    otherLayersAtSameIndex,
  };
};
