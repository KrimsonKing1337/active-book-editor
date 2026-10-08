import ReactDOM from 'react-dom/client';

import { App } from 'activeBook-core/components';
import type { Config } from 'activeBook-core/@types';
import 'activeBook-core/styles/styles.scss';

import { BookPage } from '@components/BookPage';

import bookDocumentDefault from '../book.json';
import type { BookDocument } from './types';

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
    <BookPage document={bookDocumentDefault as BookDocument} />
  </App>,
);
