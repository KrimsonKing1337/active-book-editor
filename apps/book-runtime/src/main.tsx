import ReactDOM from 'react-dom/client';

import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { AppWrapper } from 'activeBook-core/components';
import { Page0 } from 'activeBook-core/pages/Page0';
import { StoreProvider } from 'activeBook-core/store';
import type { Config } from 'activeBook-core/@types';
import 'activeBook-core/styles/styles.scss';

import { BookPage, StartReading } from '@components';

import './styles.scss';

import bookDocumentDefault from '../book.json';
import type { BookDocument } from './@types';

// Page0 uses a silent sound to unlock browser audio after the reader's first interaction.
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
            element={<BookPage document={bookDocumentDefault as BookDocument} />}
          />
        </Routes>
      </AppWrapper>
    </MemoryRouter>
  </StoreProvider>,
);
