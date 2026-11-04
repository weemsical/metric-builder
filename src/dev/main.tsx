import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './platform-theme.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
