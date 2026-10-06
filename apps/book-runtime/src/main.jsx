import ReactDOM from 'react-dom/client';

import { App } from 'activeBook-core/components';
import 'activeBook-core/styles/styles.scss';

import { BookPage } from './BookPage';
import bookDocument from './book.json';

const config = {
  id: 'built-book',
  authorComments: 0,
  pages: 0,
  defaultTheme: 'dark',
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <App config={config} tableOfContents={[]} rangeEffects={[]}>
    <BookPage document={bookDocument} />
  </App>,
);
