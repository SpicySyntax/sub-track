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
    // Register service worker relative to Vite's base URL so it works when
    // deployed to a GitHub Pages project site (e.g. https://user.github.io/sub-track/)
  const swUrl = `${(import.meta as any).env.BASE_URL}sw.js`
    navigator.serviceWorker
      .register(swUrl)
      .then((reg) => {
        // registration successful
        console.log('Service worker registered:', reg.scope)
      })
      .catch((err) => console.warn('SW registration failed:', err))
  })
}
