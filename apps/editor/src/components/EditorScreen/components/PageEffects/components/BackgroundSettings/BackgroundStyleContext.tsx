import { type CSSProperties, type PropsWithChildren, createContext, useContext } from 'react';

import type { FilterOperation } from '@active-book/book-builder/effects';

import type { BackgroundPreviewLayer } from '../../PageEffectsContext';

type BackgroundStyleContextValue = {
  preview: (layer: BackgroundPreviewLayer, mediaId: string | null, style: CSSProperties) => void;
  commit: () => boolean;
  commitFilters: (layer: BackgroundPreviewLayer, mediaId: string | null, filters: FilterOperation[]) => void;
};

type BackgroundStyleProviderProps = PropsWithChildren<BackgroundStyleContextValue>;

const BackgroundStyleContext = createContext<BackgroundStyleContextValue | null>(null);

export const BackgroundStyleProvider = ({
  children,
  preview,
  commit,
  commitFilters,
}: BackgroundStyleProviderProps) => {
  const value = {
    preview,
    commit,
    commitFilters,
  };

  return (
    <BackgroundStyleContext.Provider value={value}>
      {children}
    </BackgroundStyleContext.Provider>
  );
};

export const useBackgroundStyle = (): BackgroundStyleContextValue => {
  const context = useContext(BackgroundStyleContext);

  if (!context) {
    throw new Error('StyleEditor must be used within BackgroundStyleProvider');
  }

  return context;
};
