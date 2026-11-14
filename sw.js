/* Service worker Bus Trans Sarbagita.
   Naikkan angka VERSION setiap kali file app diubah, supaya pengguna mendapat versi baru. */
var VERSION = "sarbagita-v1";
var CORE = [
  "./", "index.html", "peta.html", "manifest.webmanifest",
  "icons/icon-32.png?v=2", "icons/icon-64.png?v=2", "icons/icon-192.png?v=2",
  "icons/icon-512.png?v=2", "icons/apple-touch-icon.png?v=2"
];
/* Pustaka dan font dari luar: disimpan saat pertama kali dipakai. */
var LIBS = ["cdnjs.cloudflare.com", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function put(req, res) {
  if (res && (res.ok || res.type === "opaque")) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
  return res;
}

self.addEventListener("fetch", function (e) {
  var req = e.request; if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin === location.origin) {
    /* File app: ambil dari jaringan dulu supaya selalu terbaru, pakai simpanan saat offline. */
    e.respondWith(fetch(req).then(function (res) { return put(req, res); }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (r) { return r || caches.match("index.html"); });
    }));
  } else if (LIBS.indexOf(url.hostname) >= 0) {
    /* Leaflet dan font: pakai simpanan dulu. */
    e.respondWith(caches.match(req).then(function (r) { return r || fetch(req).then(function (res) { return put(req, res); }); }));
  }
  /* Gambar peta (tile) tidak disimpan: selalu dari jaringan. */
});
