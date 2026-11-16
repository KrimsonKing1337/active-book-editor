import ReactDOM from 'react-dom/client';

import { Page0 } from '@active-book/core/pages/Page0';

import { StoreProvider } from '@active-book/core/store';

import { AppWrapper } from '@active-book/core/components';

import { missingVisualDefinitions } from '@active-book/book-builder/visualEffects';

import { createBookRuntime } from '@active-book/book-builder/components/custom/runtime';

import type { BuiltBookDocument } from '@active-book/book-builder/bookPreparation/compileBookDocument';
import { createCustomVisualDefinitions } from '@active-book/book-builder/components/custom/visual';

import { BookPage, StartReading } from '@components';

import { loadCustomComponents } from './utils/loadCustomComponents';

import { AUDIO_UNLOCK_SRC, config } from './constants';

import bookDocumentDefault from '../book.json';

import '@active-book/common/styles';
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
      <AppWrapper
        storyPages={document.pages.map((pageCur, index) => ({
          id: pageCur.id,
          content: (
            <BookPage
              document={pageCur.document}
              page={index + 1}
              pageId={pageCur.id}
              customComponents={components}
              bookRuntime={bookRuntime}
            />
          ),
        }))}
        config={bookConfig}
        tableOfContents={[]}
        registrations={document.visualEffects}
        definitions={definitions}
      >
        <Page0
          header="Добро пожаловать"
          audioSrcForInit={AUDIO_UNLOCK_SRC}
          showButton={false}
          Footer={StartReading}
        />

      </AppWrapper>
    </StoreProvider>,
  );
};

void start().catch((error: unknown) => {
  console.error('[active-book] Cannot load custom browser components.', error);

  root.textContent = error instanceof Error ? error.message : 'Не удалось загрузить книгу';
});
