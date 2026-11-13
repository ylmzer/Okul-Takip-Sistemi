const CACHE_NAME = "ots-pwa-v55";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=116",
  "./scripts/modules/student-tracking/styles.css?v=1",
  "./theme-overrides.css?v=148",
  "./scripts/modules/system-admin/styles.css?v=1",
  "./scripts/modules/skill-training/styles.css?v=1",
  "./scripts/modules/annual-plan/styles.css?v=1",
  "./app.js?v=165",
  "./icons/logo-clean.svg",
  "./scripts/core/module-registry.js?v=1",
  "./scripts/core/cloud-sync.js?v=1",
  "./scripts/modules/settings/backup.js?v=1",
  "./scripts/modules/sorubank/bank-and-curriculum.js?v=1",
  "./scripts/modules/sorubank/journal-and-editor.js?v=1",
  "./scripts/modules/sorubank/export-print.js?v=1",
  "./scripts/modules/skill-training/holidays-and-views.js?v=1",
  "./scripts/modules/skill-training/reports.js?v=1",
  "./scripts/modules/skill-training/management.js?v=1",
  "./scripts/modules/sorubank/index.js?v=8",
  "./scripts/modules/skill-training/index.js?v=36",
  "./scripts/modules/student-tracking/index.js?v=14",
  "./scripts/modules/annual-plan/index.js?v=17",
  "./scripts/modules/course-tracking/index.js?v=9",
  "./scripts/modules/settings/index.js?v=8",
  "./scripts/modules/system-admin/index.js?v=1",
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
