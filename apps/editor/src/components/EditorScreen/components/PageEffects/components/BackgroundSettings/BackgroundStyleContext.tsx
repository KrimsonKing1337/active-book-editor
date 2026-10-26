import type { CSSProperties, PropsWithChildren } from 'react';

import { createContext, useContext } from 'react';

import type { FilterOperation } from '@active-book/book-builder/effects';

import type { BackgroundPreviewLayer } from '../../context';

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

export const useOptionalBackgroundStyle = (): BackgroundStyleContextValue | null => {
  return useContext(BackgroundStyleContext);
};

export const useBackgroundStyle = (): BackgroundStyleContextValue => {
  const context = useOptionalBackgroundStyle();

  if (!context) {
    throw new Error('StyleEditor must be used within BackgroundStyleProvider');
  }

  return context;
};
