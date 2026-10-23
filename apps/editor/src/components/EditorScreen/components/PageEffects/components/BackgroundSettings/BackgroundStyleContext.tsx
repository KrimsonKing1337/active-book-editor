import type { CSSProperties, PropsWithChildren } from 'react';

import type { BackgroundPreviewLayer } from '../../PageEffectsContext';

import { createContext, useContext } from 'react';
type BackgroundStyleContextValue = {
  preview: (layer: BackgroundPreviewLayer, mediaId: string | null, style: CSSProperties) => void;
  commit: () => boolean;
};

type BackgroundStyleProviderProps = PropsWithChildren<BackgroundStyleContextValue>;

const BackgroundStyleContext = createContext<BackgroundStyleContextValue | null>(null);

export const BackgroundStyleProvider = ({ children, preview, commit }: BackgroundStyleProviderProps) => {
  const value = {
    preview,
    commit,
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
