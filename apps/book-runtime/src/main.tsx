import ReactDOM from 'react-dom/client';

import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { Page0 } from 'activeBook-core/pages/Page0';

import { StoreProvider } from 'activeBook-core/store';

import { AppWrapper } from 'activeBook-core/components';

import { missingVisualDefinitions } from '@active-book/book-builder/visualEffects';

import { createBookRuntime } from '@active-book/book-builder/components/custom/runtime';

import type { BuiltBookDocument } from '@active-book/book-builder/bookPreparation/compileBookDocument';
import { createCustomVisualDefinitions } from '@active-book/book-builder/components/custom/visual';

import { BookPage, StartReading } from '@components';

import { loadCustomComponents } from './utils/loadCustomComponents';

import { AUDIO_UNLOCK_SRC, config } from './constants';

import bookDocumentDefault from '../book.json';

import 'activeBook-core/styles/styles.scss';
import './styles.scss';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element was not found');
}

const bookRuntime = createBookRuntime('reader');

const start = async (): Promise<void> => {
  const { components, libraries } = await loadCustomComponents();

  const definitions = createCustomVisualDefinitions(libraries, bookRuntime);

  const document = bookDocumentDefault as unknown as BuiltBookDocument;

  const missing = missingVisualDefinitions(document.visualEffects, definitions);
  if (missing.length) {
    libraries.forEach((cur) => cur.dispose());

    const missingMessage = missing.join(', ');

    throw new Error(`Не загружены определения эффектов: ${missingMessage}`);
  }

  const bookConfig = {
    ...config,
    pages: document.pages.length,
  };

  const reactRoot = ReactDOM.createRoot(root);

  const dispose = () => {
    reactRoot.unmount();

    libraries.forEach((cur) => cur.dispose());
  };

  window.addEventListener('pagehide', (event) => {
    if (!event.persisted) {
      dispose();
    }
  });

  reactRoot.render(
    <StoreProvider>
      <MemoryRouter>
        <AppWrapper
          config={bookConfig}
          tableOfContents={[]}
          rangeEffects={[]}
          registrations={document.visualEffects}
          definitions={definitions}
        >
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
              const { id, document } = pageCur;

              const path = `/page-${index + 1}`;

              const element = (
                <BookPage
                  key={id}
                  document={document}
                  page={index + 1}
                  pageId={id}
                  customComponents={components}
                  bookRuntime={bookRuntime}
                />
              );

              return (
                <Route
                  key={id}
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
