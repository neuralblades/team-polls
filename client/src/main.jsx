import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Set up axios defaults
import axios from 'axios';
axios.defaults.baseURL = import.meta.env.PROD ? '/' : 'http://localhost:5001';
axios.defaults.withCredentials = true;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
