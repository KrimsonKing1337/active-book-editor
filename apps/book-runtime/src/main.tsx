import ReactDOM from 'react-dom/client';

import { MemoryRouter, Route, Routes } from 'react-router-dom';

import type { Config } from 'activeBook-core/@types';
import { Page0 } from 'activeBook-core/pages/Page0';
import { StoreProvider } from 'activeBook-core/store';
import { AppWrapper } from 'activeBook-core/components';

import 'activeBook-core/styles/styles.scss';

import type { BookDocument } from '@types';

import { BookPage, StartReading } from '@components';
import { loadCustomComponents } from './utils/loadCustomComponents';
import { createBookRuntime } from '@active-book/book-builder/customComponents/runtime';

import bookDocumentDefault from '../book.json';

import './styles.scss';

// Page0 uses a silent sound to unlock browser audio after the reader's first interaction.
// eslint-disable-next-line max-len
const AUDIO_UNLOCK_SRC = 'data:audio/wav;base64,UklGRsQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YaAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA';

const config: Config = {
  id: 'built-book',
  authorComments: 0,
  pages: 1,
  defaultTheme: 'dark',
  disableThemes: false,
};

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element was not found');
}

const bookRuntime = createBookRuntime('reader');

const start = async (): Promise<void> => {
  const { components } = await loadCustomComponents();

  ReactDOM.createRoot(root).render(
    <StoreProvider>
      <MemoryRouter>
        <AppWrapper config={config} tableOfContents={[]} rangeEffects={[]}>
          <Routes>
            <Route
              path="/"
              element={(
                <Page0
                  header="Добро пожаловать"
                  audioSrcForInit={AUDIO_UNLOCK_SRC}
                  showButton={false}
                  Footer={StartReading}
                />
              )}
            />
            <Route
              path="/page-1"
              element={<BookPage document={bookDocumentDefault as BookDocument} customComponents={components} bookRuntime={bookRuntime} />}
            />
          </Routes>
        </AppWrapper>
      </MemoryRouter>
    </StoreProvider>,
  );
};

void start().catch((error: unknown) => {
  console.error('[active-book] Cannot load custom browser components.', error);

  root.textContent = error instanceof Error ? error.message : 'Не удалось загрузить книгу';
});
