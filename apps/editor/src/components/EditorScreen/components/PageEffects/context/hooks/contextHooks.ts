import { useContext } from 'react';

import type {
  BackgroundStylePreviewUpdater,
  BackgroundStylePreviews,
  PageEffectsContextValue,
} from '../@types';

import {
  BackgroundStylePreviewUpdaterContext,
  BackgroundStylePreviewsContext,
  PageEffectsContext,
} from '../contexts';

export const usePageEffects = (): PageEffectsContextValue => {
  const context = useContext(PageEffectsContext);

  if (!context) {
    throw new Error('usePageEffects must be used within PageEffectsProvider');
  }

  return context;
};

export const useBackgroundStylePreviews = (): BackgroundStylePreviews => {
  return useContext(BackgroundStylePreviewsContext);
};

export const useBackgroundStylePreviewUpdater = (): BackgroundStylePreviewUpdater => {
  const updater = useContext(BackgroundStylePreviewUpdaterContext);

  if (!updater) {
    throw new Error('useBackgroundStylePreviewUpdater must be used within PageEffectsProvider');
  }

  return updater;
};
