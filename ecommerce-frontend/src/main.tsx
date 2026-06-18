import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

// 首屏前应用主题，避免闪烁
(() => {
  try {
    const t = localStorage.getItem('easyshop-theme');
    if (t === 'dark' || t === 'light') {
      document.documentElement.setAttribute('data-theme', t);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch {}
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
