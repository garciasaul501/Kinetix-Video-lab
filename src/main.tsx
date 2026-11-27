import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ToastProvider } from './components/ToastNotification';
import { FirebaseErrorBoundary } from './components/FirebaseErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FirebaseErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </FirebaseErrorBoundary>
  </StrictMode>,
);
