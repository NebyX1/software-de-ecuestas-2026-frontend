import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import './index.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query-client';
import { ErrorBoundary } from './components/ErrorBoundary';
import SimulationApp from './features/simulation/SimulationApp';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary><QueryClientProvider client={queryClient}><BrowserRouter>
      <Routes><Route path="/simular" element={<SimulationApp />} /><Route path="*" element={<App />} /></Routes>
    </BrowserRouter></QueryClientProvider></ErrorBoundary>
  </React.StrictMode>,
);
