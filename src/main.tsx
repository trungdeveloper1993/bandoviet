import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
// Bundle Leaflet's stylesheet with the app (no CDN dependency); our overrides in
// index.css are imported afterwards so they win.
import 'leaflet/dist/leaflet.css';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
