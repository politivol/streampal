import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/layout.css';
import './styles/type.css';
import './styles/components.css';
import './styles/cards.css';
import './header.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
