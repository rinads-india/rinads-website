/* RINPO Phone Web Alpha service worker.
 *
 * Intentionally does not cache authenticated business/API responses. The
 * service worker currently provides install/lifecycle support only; offline
 * business data is not a product claim in this release.
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Network-only by design. Do not introduce offline caches for authenticated
  // pages without a data-classification and cache-invalidation review.
  event.respondWith(fetch(request));
});
