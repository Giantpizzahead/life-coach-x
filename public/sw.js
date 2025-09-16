const CACHE_NAME = "life-helper-v1";
const urlsToCache = [
  "/life-coach-x/",
  "/life-coach-x/index.html",
  "/life-coach-x/static/js/bundle.js",
  "/life-coach-x/static/css/main.css",
  "/life-coach-x/manifest.json",
  "/life-coach-x/logo.png",
  "/life-coach-x/lifecoachx.png",
];

// Install event - cache resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Opened cache");
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log("Cache install failed:", error);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch((error) => {
        console.log("Fetch failed:", error);
        // Return a fallback page or response
        if (event.request.destination === "document") {
          return caches.match("/life-coach-x/index.html");
        }
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
