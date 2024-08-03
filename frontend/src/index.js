import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { PlaylistContextProvider } from './context/PlayListContext';
import { AuthContext } from './context/AuthContext';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* <AuthContext> */}
    <PlaylistContextProvider>
    <App />
    </PlaylistContextProvider>
    {/* </AuthContext> */}
  </React.StrictMode>
);

