import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeMobileApp } from './services/mobileInit'
import { frontendWebhookHandler } from './services/frontendWebhookHandler'

// Initialize mobile app features
initializeMobileApp().catch(console.error);

// Initialize frontend webhook handler for Fawry
frontendWebhookHandler.initialize();

createRoot(document.getElementById("root")!).render(<App />);
