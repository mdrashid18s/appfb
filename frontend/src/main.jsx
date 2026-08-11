/**
 * @file main.jsx
 * @description Frontend application entry point file.
 * Initializes React DOM, enables StrictMode, sets up Browser Router for client-side routing,
 * and wraps the root application inside the global Toast Notification Provider.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';

/**
 * Mount the React root component into the HTML DOM element with ID 'root'.
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Provides browser history & routing context to the entire application */}
    <BrowserRouter>
      {/* Provides global toast notification state to all child components */}
      <ToastProvider>
        {/* Main application component holding route definitions */}
        <App />
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
