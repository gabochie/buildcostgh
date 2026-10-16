// BuildCost GH service worker — app-shell + offline-first calculator.
// Versioned cache so deploys invalidate cleanly. No build dependency.

const VERSION = "bcgh-v1"
const STATIC_CACHE = `${VERSION}-static`
const RUNTIME_CACHE = `${VERSION}-runtime`

// App shell: cached on install so first offline load works.
const PRECACHE_URLS = ["/offline", "/calculator", "/costs", "/manifest.webmanifest"]

// Cross-origin GETs we are willing to runtime-cache (fonts only).
const RUNTIME_CACHE_ALLOW = [/^https:\/\/fonts\.g(oogleapis|static)\.com\//]

function isAllowedRuntime(url) {
  return RUNTIME_CACHE_ALLOW.some((re) => re.test(url))
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("bcgh-") && k !== STATIC_CACHE && k !== RUNTIME_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

// Navigation: network-first, fall back to cached page, then /offline.
async function handleNavigation(request) {
  try {
    const response = await fetch(request)
    const cache = await caches.open(RUNTIME_CACHE)
    cache.put(request, response.clone())
    return response
  } catch {
    const cached = await caches.match(request, { ignoreSearch: true })
    if (cached) return cached
    const offline = await caches.match("/offline")
    if (offline) return offline
    return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } })
  }
}

// GET API: network-first with short cache fallback (rates stay usable offline).
async function handleApiGet(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    return Response.json({ error: "Offline — cached data unavailable", offline: true }, { status: 503 })
  }
}

// Static assets: cache-first, then network + populate.
async function handleStatic(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok && (request.url.startsWith(self.location.origin) || isAllowedRuntime(request.url))) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return caches.match("/offline")
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return
  const url = new URL(request.url)

  // Never intercept the SW itself or Next internals that must stay fresh.
  if (url.pathname === "/sw.js") return

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request))
    return
  }

  if (url.origin === self.location.origin && url.pathname.startsWith("/api/")) {
    event.respondWith(handleApiGet(request))
    return
  }

  if (url.origin === self.location.origin || isAllowedRuntime(request.url)) {
    event.respondWith(handleStatic(request))
  }
})

// ── Web Push ──
self.addEventListener("push", (event) => {
  let data = { title: "BuildCost GH", body: "New update from BuildCost GH.", url: "/" }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch {
    if (event.data) data.body = event.data.text()
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/assets/icon-192x192.png",
      badge: "/assets/icon-192x192.png",
      data: { url: data.url || "/" },
    }),
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || "/"
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    }),
  )
})

// Background Sync: flush queued offline estimates when connectivity returns.
self.addEventListener("sync", (event) => {
  if (event.tag === "bcgh-sync-estimates") {
    event.waitUntil(flushEstimateQueue())
  }
})

async function flushEstimateQueue() {
  try {
    const db = await openQueueDb()
    const queued = await dbGetAll(db)
    for (const item of queued) {
      try {
        const res = await fetch("/api/calculator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.inputs),
        })
        if (res.ok) await dbDelete(db, item.id)
      } catch {
        // keep queued — will retry on next sync
      }
    }
  } catch {
    // IndexedDB unavailable — no-op
  }
}

function openQueueDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("buildcost-offline", 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains("estimate-queue")) db.createObjectStore("estimate-queue", { keyPath: "id" })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function dbGetAll(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("estimate-queue", "readonly")
    const req = tx.objectStore("estimate-queue").getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
  })
}

function dbDelete(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("estimate-queue", "readwrite")
    const req = tx.objectStore("estimate-queue").delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}
