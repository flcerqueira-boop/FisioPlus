const CACHE_VERSION = "fisioplus-v3";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/app.js",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png"
];

// ─── INSTALL: cacheia assets estáticos ───────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  // Força ativação imediata sem esperar o SW antigo fechar
  self.skipWaiting();
});

// ─── ACTIVATE: remove caches antigos e assume controle imediato ──────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_VERSION)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── FETCH: network first para app, cache fallback ────────────────────────
self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Nunca intercepta Firebase, EmailJS ou Google Fonts
  if (
    url.includes("firestore") ||
    url.includes("firebase") ||
    url.includes("googleapis") ||
    url.includes("emailjs") ||
    url.includes("gstatic.com") ||
    url.includes("fonts.googleapis")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Atualiza o cache com a versão mais recente
        if (response && response.status === 200 && event.request.method === "GET") {
          const cloned = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, cloned));
        }
        return response;
      })
      .catch(() => {
        // Offline: usa cache
        return caches.match(event.request).then((cached) =>
          cached || caches.match("/index.html")
        );
      })
  );
});

// ─── MESSAGE: força update quando solicitado pelo app ────────────────────
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
