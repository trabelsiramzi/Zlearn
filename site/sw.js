/* Cache précaché, versionné par phase ; les pages servent depuis le cache hors ligne. */
var CACHE_NAME = "zlearn-phase5-v1";
var PRECACHE_URLS = ["./404.html","./akhlaq/01-lesson/index.html","./akhlaq/02-lesson/index.html","./akhlaq/03-lesson/index.html","./akhlaq/index.html","./aqida/01-lesson/index.html","./aqida/02-lesson/index.html","./aqida/03-lesson/index.html","./aqida/index.html","./assets/favicon.svg","./assets/fonts/Amiri-Bold.ttf","./assets/fonts/Amiri-OFL.txt","./assets/fonts/Amiri-Regular.ttf","./assets/fonts/Baloo-OFL.txt","./assets/fonts/BalooBhaijaan2-Bold.woff2","./assets/fonts/BalooBhaijaan2-SemiBold.woff2","./assets/fonts/IBM-Plex-OFL.txt","./assets/fonts/IBMPlexSansArabic-Medium.woff2","./assets/fonts/IBMPlexSansArabic-Regular.woff2","./assets/fonts/IBMPlexSansArabic-SemiBold.woff2","./assets/question-catalog.js","./assets/search-index.js","./assets/site.css","./assets/site.js","./assets/storage-catalog.js","./fiqh/01-lesson/index.html","./fiqh/02-lesson/index.html","./fiqh/03-lesson/index.html","./fiqh/04-lesson/index.html","./fiqh/index.html","./hadith/01-lesson/index.html","./hadith/02-lesson/index.html","./hadith/03-lesson/index.html","./hadith/index.html","./index.html","./mahfoudhat/akhlaq/index.html","./mahfoudhat/aqida/index.html","./mahfoudhat/fiqh/index.html","./mahfoudhat/hadith/index.html","./mahfoudhat/index.html","./mahfoudhat/nahw/index.html","./mahfoudhat/sira/index.html","./mahfoudhat/tajwid/index.html","./manifest.webmanifest","./nahw/01-lesson/index.html","./nahw/02-lesson/index.html","./nahw/03-lesson/index.html","./nahw/index.html","./review/index.html","./sira/01-lesson/index.html","./sira/02-lesson/index.html","./sira/03-lesson/index.html","./sira/index.html","./tajwid/01-lesson/index.html","./tajwid/02-lesson/index.html","./tajwid/03-lesson/index.html","./tajwid/04-lesson/index.html","./tajwid/index.html"];
self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE_NAME).then(function (cache) {
    return cache.addAll(PRECACHE_URLS.map(function (path) { return new URL(path, self.registration.scope).toString(); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (names) {
    return Promise.all(names.map(function (name) {
      if (name.indexOf("zlearn-") === 0 && name !== CACHE_NAME) return caches.delete(name);
    }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  var cached = caches.match(request, {ignoreSearch:request.mode === "navigate"});
  var fresh = fetch(request).then(function (response) {
    if (response && response.ok) return caches.open(CACHE_NAME).then(function (cache) {
      return cache.put(request, response.clone()).then(function () { return response; });
    });
    return response;
  });
  event.waitUntil(fresh.then(function () {}, function () {}));
  if (request.mode === "navigate") {
    event.respondWith(cached.then(function (cachedResponse) {
      return cachedResponse || fresh.catch(function () { return caches.match(new URL("404.html", self.registration.scope).toString()); });
    }));
    return;
  }
  event.respondWith(cached.then(function (cachedResponse) { return cachedResponse || fresh; }));
});
