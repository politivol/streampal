import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import '@shoelace-style/shoelace/dist/themes/light.css';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/skeleton/skeleton.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/tag/tag.js';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';

setBasePath('https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2/dist/');

// Initialize development helpers (safely)
if (import.meta.env.DEV) {
  import('./lib/devHelpers.js')
    .then(({ initDevHelpers }) => {
      initDevHelpers();
    })
    .catch((error) => {
      console.warn('Dev helpers not available:', error.message);
    });
}

let toasts = document.getElementById('toasts');
if (!toasts) {
  toasts = document.createElement('div');
  toasts.id = 'toasts';
  document.body.appendChild(toasts);
}
Object.assign(toasts.style, {
  position: 'fixed',
  top: '1rem',
  right: '1rem',
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
