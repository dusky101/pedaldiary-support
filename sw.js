// Pedal Diary service worker.
//
// Network-first for same-origin GET requests: the live site is ALWAYS served
// fresh when online (so a push deploys immediately), and the cache is only used
// as an offline fallback. Cross-origin requests (e.g. the Apple App Store badge)
// are left untouched. Bump CACHE to retire old offline copies.

const CACHE = "pedaldiary-v1";

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (k) {
              return k !== CACHE;
            })
            .map(function (k) {
              return caches.delete(k);
            })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", function (event) {
  const req = event.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then(function (res) {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(function (c) {
            c.put(req, copy);
          });
        }
        return res;
      })
      .catch(function () {
        return caches.match(req).then(function (cached) {
          return cached || caches.match("/index.html");
        });
      })
  );
});
