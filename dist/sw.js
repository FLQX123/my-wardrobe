// Service Worker for "我的虚拟衣橱" PWA
// Cache-First strategy for App Shell and static assets

const CACHE_NAME = 'mywardrobe-v2'
// Precache everything needed for offline
const APP_SHELL = [
  '/my-wardrobe/',
  '/my-wardrobe/index.html',
  '/my-wardrobe/manifest.json',
  '/my-wardrobe/icons/wardrobe-192.png',
  '/my-wardrobe/icons/wardrobe-512.png',
]

// Install: pre-cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL).catch(() => {
        // Silently skip if some files can't be pre-cached (e.g. dev mode)
      })
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

// Fetch: Cache-First strategy
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Only handle GET requests
  if (request.method !== 'GET') return

  // Skip non-http(s) requests (e.g. chrome-extension://)
  if (!request.url.startsWith('http')) return

  // Skip Vite HMR and internal dev requests
  if (request.url.includes('/@vite/') ||
      request.url.includes('/@fs/') ||
      request.url.includes('__vite_ping') ||
      request.url.includes('hmr') ||
      request.url.includes('hot-update')) {
    return
  }

  // Skip browser extensions
  if (!request.url.startsWith(self.location.origin)) {
    // Still cache same-origin only for safety
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      // Return cached response immediately if found
      if (cached) return cached

      // Otherwise fetch from network and cache
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        // Cache eligible responses (JS, CSS, HTML, images, fonts, icons)
        const url = request.url
        const isCacheable = /\.(js|css|html|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|json)$/.test(url) ||
                            request.destination === 'document' ||
                            request.destination === 'script' ||
                            request.destination === 'style' ||
                            request.destination === 'image' ||
                            request.destination === 'font'

        if (isCacheable) {
          const cloned = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, cloned)
          })
        }

        return response
      }).catch(() => {
        // Offline fallback for navigation requests
        if (request.destination === 'document') {
          return caches.match('/index.html')
        }
        // For other requests, just fail (will show browser offline page)
      })
    })
  )
})
