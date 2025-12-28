import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  // StrictMode can sometimes cause double initialization of MediaPipe in dev, 
  // but good practice to keep it. We handle cleanup in useEffect.
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
