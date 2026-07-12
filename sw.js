// Service Worker for "我的虚拟衣橱" PWA
// Stale-While-Revalidate: serve cached instantly, update cache in background

const CACHE_NAME = 'mywardrobe-v9'

// Install: pre-cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/my-wardrobe/',
        '/my-wardrobe/index.html',
        '/my-wardrobe/manifest.json',
      ]).catch(() => {})
    }).then(() => self.skipWaiting())
  )
})

// Activate: clean up old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch: Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') return
  if (!request.url.startsWith('http')) return
  if (request.url.includes('/@vite/') || request.url.includes('/@fs/') ||
      request.url.includes('__vite_ping') || request.url.includes('hmr') ||
      request.url.includes('hot-update')) return
  if (!request.url.startsWith(self.location.origin)) return

  // For navigation requests: always return cached index.html, network fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || caches.match('/my-wardrobe/').then((rootCached) => {
          return rootCached || fetch(request).then((response) => {
            const cloned = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put('/my-wardrobe/', cloned))
            return response
          })
        })
      }).catch(() => {
        // Absolute last resort: return a simple offline page
        return new Response(
          '<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>需要网络</title></head><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#f8f4ed"><p>请连接网络后刷新</p></body></html>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        )
      })
    )
    return
  }

  // For all other assets: Stale-While-Revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone())
          }
          return networkResponse
        }).catch(() => cached)

        // Return cached immediately, update in background
        return cached || fetchPromise
      })
    })
  )
})
