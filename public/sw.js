/*
 * KravConnect — service worker (runtime caching, conservador e seguro).
 *
 * - API e origens externas: NUNCA interceptadas — passam direto à rede, então
 *   nenhuma resposta de API é cacheada (evita servir dados velhos).
 * - Assets versionados (/assets/, com hash no nome): cache-first (imutáveis).
 * - Navegação/HTML same-origin: network-first com fallback ao cache, para o app
 *   abrir offline após a primeira visita.
 */
const CACHE = 'kravconnect-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // Só lida com same-origin; API e terceiros passam direto à rede.
  if (url.origin !== self.location.origin) return

  // Assets com hash no nome são imutáveis: cache-first.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(request, copy))
            return res
          }),
      ),
    )
    return
  }

  // HTML e demais same-origin: network-first com fallback ao cache (offline).
  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone()
        caches.open(CACHE).then((c) => c.put(request, copy))
        return res
      })
      .catch(() =>
        caches.match(request).then((hit) => hit || caches.match('/index.html')),
      ),
  )
})
