import ReactDOM from 'react-dom/client';

import { App } from 'activeBook-core/components';
import type { Config } from 'activeBook-core/@types';
import 'activeBook-core/styles/styles.scss';

import bookDocument from '../book.json';
import { BookPage } from '@book-runtime/components/BookPage';
import type { BookDocument } from '@book-runtime/types';

const config: Config = {
  id: 'built-book',
  authorComments: 0,
  pages: 0,
  defaultTheme: 'dark',
  disableThemes: false,
};

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element was not found');
}

ReactDOM.createRoot(root).render(
  <App config={config} tableOfContents={[]} rangeEffects={[]}>
    <BookPage document={bookDocument as BookDocument} />
  </App>,
);
