import { StoreProvider } from 'activeBook-core/store';

import { AppModeContext } from 'activeBook-core/components/App/AppModeContext';

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
