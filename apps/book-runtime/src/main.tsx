import ReactDOM from 'react-dom/client';

import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { Page0 } from 'activeBook-core/pages/Page0';

import { StoreProvider } from 'activeBook-core/store';

import { AppWrapper } from 'activeBook-core/components';

import { createBookRuntime } from '@active-book/book-builder/components/custom/runtime';

import 'activeBook-core/styles/styles.scss';

import type { BookDocument } from '@active-book/book-builder/book';

import { BookPage, StartReading } from '@components';

import { loadCustomComponents } from './utils/loadCustomComponents';
import { AUDIO_UNLOCK_SRC, config } from './constants';

import bookDocumentDefault from '../book.json';

import './styles.scss';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element was not found');
}

const bookRuntime = createBookRuntime('reader');

const start = async (): Promise<void> => {
  const { components } = await loadCustomComponents();

  const document = bookDocumentDefault as BookDocument;

  const bookConfig = {
    ...config,
    pages: document.pages.length,
  };

  ReactDOM.createRoot(root).render(
    <StoreProvider>
      <MemoryRouter>
        <AppWrapper config={bookConfig} tableOfContents={[]} rangeEffects={[]}>
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

            {document.pages.map((pageCur, index) => {
              const path = `/page-${index + 1}`;

              const element = (
                <BookPage
                  key={pageCur.id}
                  document={pageCur.document}
                  page={index + 1}
                  pageId={pageCur.id}
                  customComponents={components}
                  bookRuntime={bookRuntime}
                />
              );

              return (
                <Route
                  key={pageCur.id}
                  path={path}
                  element={element}
                />
              );
            })}
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
