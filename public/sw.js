const CACHE = "chord-drone-min-v2"; // bump this
const ASSETS = ["index.html", "manifest.webmanifest"]; // relative paths

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
      caches.keys().then(keys =>
          Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
      )
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(caches.match(e.request).then((cached) => cached || fetch(e.request)));
});
