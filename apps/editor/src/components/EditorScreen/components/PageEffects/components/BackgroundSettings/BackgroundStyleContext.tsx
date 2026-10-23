import { createContext, useContext, type CSSProperties, type PropsWithChildren } from 'react';

import type { BackgroundPreviewLayer } from '../../PageEffectsContext';

type BackgroundStyleContextValue = {
  preview: (layer: BackgroundPreviewLayer, mediaId: string | null, style: CSSProperties) => void;
  commit: () => boolean;
};

type BackgroundStyleProviderProps = PropsWithChildren<BackgroundStyleContextValue>;

const BackgroundStyleContext = createContext<BackgroundStyleContextValue | null>(null);

export const BackgroundStyleProvider = ({ children, preview, commit }: BackgroundStyleProviderProps) => {
  return (
    <BackgroundStyleContext.Provider value={{ preview, commit }}>
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
