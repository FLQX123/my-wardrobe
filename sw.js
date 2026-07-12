const CACHE_NAME = 'mywardrobe-v11'

self.addEventListener('install', () => {})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)))
    }).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  if (!request.url.startsWith(self.location.origin)) return

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(request).then((cached) => {
        const fetched = fetch(request).then((response) => {
          if (response && response.status === 200) {
            cache.put(request, response.clone())
          }
          return response
        })
        return cached || fetched
      })
    })
  )
})
