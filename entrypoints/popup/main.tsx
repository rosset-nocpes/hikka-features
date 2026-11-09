import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '../app.css';
import App from './App';

// hikka's typeface; content scripts get it from the site, the popup doesn't.
Fonts.injectFontToDocument(Fonts._FONTSOURCE_VARIABLE_GEIST_CSS);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={new QueryClient()}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
