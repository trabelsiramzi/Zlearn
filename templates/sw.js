/* Cache précaché, versionné par phase ; les pages servent depuis le cache hors ligne. */
var CACHE_NAME = "zlearn-phase5-v1";
var PRECACHE_URLS = {{PRECACHE_URLS}};
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
