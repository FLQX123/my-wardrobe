import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Register Service Worker for PWA (localhost is exempt from HTTPS requirement)
// Only register in production to avoid caching stale dev files
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  let swReady = false
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/my-wardrobe/sw.js', { scope: '/my-wardrobe/' }).then(
      (registration) => {
        console.log('[PWA] Service Worker registered:', registration.scope)
        // If this is a new installation (no active SW yet), prompt to refresh
        if (registration.active && !navigator.serviceWorker.controller) {
          swReady = true
        }
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
                console.log('[PWA] New version available — page will update on next load')
              }
              if (newWorker.state === 'activated' && !swReady) {
                swReady = true
                // First-time install: ask user to refresh to cache all files
                if (document.readyState === 'complete') {
                  const tip = document.createElement('div')
                  tip.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:9999;background:rgba(0,0,0,0.85);color:#fff;padding:12px 24px;border-radius:24px;font-size:14px;letter-spacing:0.05em;animation:fadeIn 0.3s ease-out;'
                  tip.textContent = '下拉刷新页面，缓存后即可离线使用'
                  document.body.appendChild(tip)
                  setTimeout(() => { tip.style.opacity = '0'; tip.style.transition = 'opacity 0.5s'; setTimeout(() => tip.remove(), 500) }, 4000)
                }
              }
            })
          }
        })
      },
      (error) => {
        console.log('[PWA] Service Worker registration failed:', error)
      }
    )
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
