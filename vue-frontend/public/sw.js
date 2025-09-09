// Service Worker for caching and offline support
// Generate cache name based on build timestamp for automatic invalidation
const CACHE_NAME = `sagawa-cache-${new Date().getTime()}`;
const urlsToCache = [
  "/",
  "/index.html",
  "/favicon.svg",
];

// Helper function to check if a URL should be cached (skip extension URLs)
const shouldCacheUrl = (url) => {
  return !(
    url.includes("chrome-extension://") ||
    url.includes("moz-extension://") ||
    url.includes("safari-extension://") ||
    url.includes("edge-extension://")
  );
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Filter out extension URLs before caching
      const validUrls = urlsToCache.filter(url => shouldCacheUrl(url));
      return Promise.allSettled(
        validUrls.map((url) =>
          cache.add(url).catch((err) => {
            // console.warn(`Failed to cache ${url}:`, err);
          })
        )
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  // Skip caching for API requests, POST requests, and browser extensions
  if (
    event.request.method !== "GET" ||
    event.request.url.includes("/api/") ||
    event.request.url.includes("localhost") ||
    event.request.url.startsWith("chrome-extension://") ||
    event.request.url.startsWith("moz-extension://") ||
    event.request.url.startsWith("safari-extension://") ||
    event.request.url.startsWith("edge-extension://")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }
      
      // Clone the request for fetching
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // Clone the response for caching
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    }).catch(() => {
      // Fallback to network if cache fails
      return fetch(event.request);
    })
  );
});

// Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete all caches except the current one
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
