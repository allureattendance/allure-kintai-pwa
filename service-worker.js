/* ==================================================
   ALLURE勤怠PWA service-worker.js
   役割：
   ・PWAとして認識させるためのService Worker
   ・現段階ではキャッシュを最小限にして安全運用
   ================================================== */

const CACHE_NAME = "allure-kintai-pwa-v1";

self.addEventListener("install", function (event) {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  // 今は通信を優先して、古いキャッシュで誤動作しないようにする
  event.respondWith(fetch(event.request));
});