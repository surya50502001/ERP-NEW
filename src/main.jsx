import React from 'react';
import ReactDOM from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import App from './App.jsx';
import './index.css';

// Automatically route API requests to backend PC IP when running in Mobile App
const isNative = Capacitor.isNativePlatform();
const savedApiUrl = localStorage.getItem('PRIME_ERP_API_URL');
const envApiUrl = import.meta.env.VITE_API_URL;
export const API_BASE_URL = savedApiUrl || envApiUrl || (isNative ? 'http://192.168.0.6:5000' : '');

if (API_BASE_URL) {
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    if (typeof input === 'string' && input.startsWith('/api')) {
      return originalFetch(`${API_BASE_URL}${input}`, init);
    }
    return originalFetch(input, init);
  };
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

