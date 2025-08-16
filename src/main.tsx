import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeMobileApp } from './services/mobileInit'
import { frontendWebhookHandler } from './services/frontendWebhookHandler'

// Wait for DOM to be ready before initializing services
const initializeServices = async () => {
  try {
    // Initialize mobile app features
    await initializeMobileApp();
    console.log('Mobile app initialized successfully');
  } catch (error) {
    console.error('Failed to initialize mobile app:', error);
  }

  try {
    // Initialize frontend webhook handler for Fawry
    frontendWebhookHandler.initialize();
    console.log('Frontend webhook handler initialized successfully');
  } catch (error) {
    console.error('Failed to initialize frontend webhook handler:', error);
  }
};

// Initialize services after a short delay to ensure DOM is ready
setTimeout(initializeServices, 100);

// Render the app with error handling
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  
  const root = createRoot(rootElement);
  root.render(<App />);
} catch (error) {
  console.error('Failed to render app:', error);
  
  // Show a fallback error message
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        font-family: Arial, sans-serif;
        text-align: center;
        padding: 20px;
      ">
        <div style="font-size: 48px; margin-bottom: 20px;">😵</div>
        <h1 style="color: #333; margin-bottom: 10px;">App Failed to Load</h1>
        <p style="color: #666; margin-bottom: 20px;">Something went wrong while loading the application.</p>
        <button 
          onclick="window.location.reload()" 
          style="
            padding: 12px 24px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
          "
        >
          Reload Page
        </button>
      </div>
    `;
  }
}
