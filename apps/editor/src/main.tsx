import React from 'react';

import ReactDOM from 'react-dom/client';

import { EditorScreen } from '@components';

import 'reset-css/reset.css';
import '@active-book/core/styles/styles.scss';
import './styles.scss';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <EditorScreen />
  </React.StrictMode>,
);
