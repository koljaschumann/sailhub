import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@tsc/ui';
import { AuthProvider } from '@tsc/supabase';
import { ToastProvider } from '@tsc/ui';
import { DataProvider } from './context/DataContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
