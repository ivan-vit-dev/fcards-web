// Fotbalové Kartičky — Service Worker
// Handles offline asset caching and FCM background notifications.
//
// IMPORTANT: Replace __FIREBASE_CONFIG__ values with your actual Firebase project config
// before deploying to production.

const CACHE_NAME = "fkarticky-v1";

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  "/",
  "/cs",
  "/offline",
];

// ─── Lifecycle ────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch(() => {})
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch strategy: network-first for API, cache-first for static assets ─────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, cross-origin, and Firebase/API requests
  if (
    request.method !== "GET" ||
    !url.origin === self.location.origin ||
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("firebasestorage") ||
    url.hostname.includes("googleapis") ||
    url.hostname.includes("firebaseio")
  ) {
    return;
  }

  // Cache-first for Next.js static chunks
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) => cached ?? fetch(request).then((resp) => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return resp;
        })
      )
    );
    return;
  }

  // Network-first for pages (fall back to cache if offline)
  event.respondWith(
    fetch(request)
      .then((resp) => {
        if (resp.ok && resp.type === "basic") {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return resp;
      })
      .catch(() => caches.match(request))
  );
});

// ─── FCM background push notifications ───────────────────────────────────────
// To enable Firebase Cloud Messaging background delivery, uncomment and configure:
//
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey:            "AIzaSyAI8NZSosZDvzQ6dLayPUXe4vlGga89UX0",
  authDomain:        "fcards-web.firebaseapp.com",
  projectId:         "fcards-web",
  storageBucket:     "fcards-web.firebasestorage.app",
  messagingSenderId: "751396747782",
  appId:             "1:751396747782:web:1106a75f98dca0e8c62187",
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification ?? {};
  self.registration.showNotification(title ?? "Fotbalové Kartičky", {
    body,
    icon: icon ?? "/icons/icon-192.png",
    badge: "/icons/icon-96.png",
    data: payload.data,
  });
});

// Standard push event fallback (works without Firebase compat SDK for test pushes)
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); } catch { payload = { notification: { title: "Fotbalové Kartičky", body: event.data.text() } }; }

  const { title = "Fotbalové Kartičky", body = "", icon } = payload.notification ?? {};
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icon ?? "/icons/icon-192.png",
      badge: "/icons/icon-96.png",
      data: payload.data ?? {},
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/cs";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.includes(self.location.origin));
      return existing ? existing.focus() : clients.openWindow(url);
    })
  );
});
