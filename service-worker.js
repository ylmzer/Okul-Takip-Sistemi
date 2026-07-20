const CACHE_NAME = "ots-pwa-v46";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=81",
  "./theme-overrides.css?v=105",
  "./scripts/modules/student-tracking/styles.css?v=1",
  "./app.js?v=102",
  "./icons/logo-clean.svg",
  "./scripts/core/module-registry.js?v=1",
  "./scripts/modules/sorubank/index.js?v=8",
  "./scripts/modules/skill-training/index.js?v=12",
  "./scripts/modules/student-tracking/index.js?v=13",
  "./scripts/modules/annual-plan/index.js?v=15",
  "./scripts/modules/course-tracking/index.js?v=8",
  "./scripts/modules/settings/index.js?v=7",
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

  const url = new URL(request.url);

  // Supabase API, CDN kütüphaneleri ve API isteklerini asla cache'leme
  if (url.pathname.startsWith("/api/")) return;
  if (url.hostname.includes("supabase")) return;
  if (url.hostname.includes("cdn.jsdelivr.net")) return;

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
