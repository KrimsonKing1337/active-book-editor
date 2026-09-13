import React from 'react';
import ReactDOM from 'react-dom/client';

import { EditorScreen } from './EditorScreen';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <EditorScreen />
  </React.StrictMode>,
);
