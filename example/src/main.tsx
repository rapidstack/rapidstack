import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './inner/app.tsx';
import { Page } from './test-page.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App>
      <Page />
    </App>
  </React.StrictMode>
);
