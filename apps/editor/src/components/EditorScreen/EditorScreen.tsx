import { StoreProvider } from '@active-book/core/store';

import { AppModeContext } from '@active-book/core/components/App/AppModeContext';

import { EditorWorkspace } from './EditorWorkspace';

export const EditorScreen = () => {
  return (
    <StoreProvider>
      <AppModeContext value="editor">
        <EditorWorkspace />
      </AppModeContext>
    </StoreProvider>
  );
};
