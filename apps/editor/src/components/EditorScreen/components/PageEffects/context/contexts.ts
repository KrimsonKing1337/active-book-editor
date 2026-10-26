import { createContext } from 'react';

import type {
  BackgroundStylePreviewUpdater,
  BackgroundStylePreviews,
  PageEffectsContextValue,
} from './@types';

export const PageEffectsContext = createContext<PageEffectsContextValue | null>(null);
export const BackgroundStylePreviewsContext = createContext<BackgroundStylePreviews>({});
export const BackgroundStylePreviewUpdaterContext = createContext<BackgroundStylePreviewUpdater | null>(null);
