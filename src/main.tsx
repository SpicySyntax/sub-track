import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const root = document.getElementById('root')!
createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Register service worker if available
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        // registration successful
        console.log('Service worker registered:', reg.scope)
      })
      .catch((err) => console.warn('SW registration failed:', err))
  })
}
