const CACHE_NAME = "ots-pwa-v20";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=71",
  "./theme-overrides.css?v=74",
  "./app.js?v=77",
  "./icons/logo-clean.svg",
  "./scripts/modules/sorubank/index.js",
  "./scripts/modules/skill-training/index.js",
  "./scripts/modules/student-tracking/index.js",
  "./scripts/modules/annual-plan/index.js",
  "./scripts/modules/course-tracking/index.js",
  "./scripts/modules/settings/index.js",
  "./manifest.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  if (new URL(request.url).pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("./index.html")))
  );
});
