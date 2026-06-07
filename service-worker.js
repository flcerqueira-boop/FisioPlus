const CACHE_NAME = "fisioplus-v1";
const STATIC_ASSETS = [
  "/FisioPlus/",
  "/FisioPlus/index.html",
  "/FisioPlus/app.js",
  "/FisioPlus/manifest.json",
  "/FisioPlus/icon-192.png",
  "/FisioPlus/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Não cachear requisições Firebase/EmailJS
  if (
    event.request.url.includes("firestore") ||
    event.request.url.includes("firebase") ||
    event.request.url.includes("emailjs") ||
    event.request.url.includes("googleapis")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).catch(() => caches.match("/FisioPlus/index.html"));
    })
  );
});
