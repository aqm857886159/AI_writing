import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { DocProvider } from './providers/DocProvider.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DocProvider>
      <App />
    </DocProvider>
  </React.StrictMode>
);


