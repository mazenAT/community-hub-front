import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeMobileApp } from './services/mobileInit';
import { frontendWebhookHandler } from './services/frontendWebhookHandler';

    // Initialize mobile app features
initializeMobileApp().catch(() => {
  // Silent fail for mobile features
});

// Initialize frontend webhook handler
    frontendWebhookHandler.initialize();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
