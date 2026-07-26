import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Pesos de fuente corporativos utilizados en la app
import '@fontsource/titillium-web/400.css';
import '@fontsource/titillium-web/600.css';
import '@fontsource/titillium-web/700.css';
import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';

import './index.css';
import { App } from '@/app/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
