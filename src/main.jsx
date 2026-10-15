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

// Global fetch interceptor: handles API base URL prepend, Bearer JWT injection, and 401 redirection
const originalFetch = window.fetch;
window.fetch = function (input, init) {
  let url = input;
  let options = init ? { ...init } : {};

  if (typeof url === 'string' && url.startsWith('/api')) {
    if (API_BASE_URL) {
      url = `${API_BASE_URL}${url}`;
    }
  }

  // Inject Bearer token if present
  try {
    const token = localStorage.getItem('PRIME_ERP_TOKEN');
    if (token) {
      const headers = new Headers(options.headers || {});
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      options.headers = headers;
    }
  } catch (e) {
    // LocalStorage access safeguard
  }

  return originalFetch(url, options).then(response => {
    // If unauthorized (401) on non-auth endpoints, auto clear session and redirect to login
    if (response.status === 401 && typeof url === 'string' && !url.includes('/api/auth/login') && !url.includes('/api/auth/register')) {
      console.warn('Session expired or unauthorized. Logging out...');
      try {
        localStorage.removeItem('PRIME_ERP_USER');
        localStorage.removeItem('PRIME_ERP_TOKEN');
      } catch (e) {}
      if (window.location.hash !== '#/login' && window.location.hash !== '#/register') {
        window.location.hash = '#/login';
      }
    }
    return response;
  });
};


const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

