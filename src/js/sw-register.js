
/* Cache hors ligne ; le préfixe respecte les URLs du déploiement GitHub Pages. */
(function () {
  if (!("serviceWorker" in navigator)) return;
  var prefix = document.body.getAttribute("data-site-prefix") || "";
  if (window.location.protocol !== "https:" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") return;
  navigator.serviceWorker.register(prefix + "sw.js").catch(function () {});
}());
