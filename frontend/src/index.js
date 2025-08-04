import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { PlaylistContextProvider } from './context/PlayListContext';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <PlaylistContextProvider>
    <App />
    </PlaylistContextProvider>
  </React.StrictMode>
);

