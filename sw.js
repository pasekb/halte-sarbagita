/* Service worker Bus Trans Sarbagita.
   Naikkan angka VERSION setiap kali file app diubah, supaya pengguna mendapat versi baru. */
var VERSION = "sarbagita-v15";
var CORE = [
  "./", "index.html", "peta.html", "manifest.webmanifest",
  "icons/icon-32.png?v=2", "icons/icon-64.png?v=2", "icons/icon-192.png?v=2",
  "icons/icon-512.png?v=2", "icons/apple-touch-icon.png?v=2"
];
/* Leaflet disimpan sejak awal (kalau gagal, pemasangan tetap lanjut). */
var EXTRA = [
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css"
];
/* Pustaka dan font dari luar: disimpan saat pertama kali dipakai. */
var LIBS = ["cdnjs.cloudflare.com", "fonts.googleapis.com", "fonts.gstatic.com", "res.cloudinary.com"];
var TIMEOUT = 4000; /* ms: jaringan lambat -> pakai simpanan */

/* Hosting seperti Cloudflare Pages mengalihkan peta.html -> /peta. Jawaban hasil pengalihan
   tidak boleh dipakai untuk membuka halaman, jadi dibungkus ulang sebelum disimpan. */
function clean(res) {
  if (!res || !res.redirected) return Promise.resolve(res);
  return res.blob().then(function (b) {
    return new Response(b, { status: res.status, statusText: res.statusText, headers: res.headers });
  });
}

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) {
    return Promise.all(CORE.map(function (u) {
      return fetch(u, { cache: "reload" }).then(function (res) {
        if (!res.ok) throw new Error("Gagal mengambil " + u);
        return clean(res).then(function (r) { return c.put(u, r); });
      });
    })).then(function () {
      return Promise.all(EXTRA.map(function (u) { return c.add(u).catch(function () {}); }));
    });
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function put(req, res) {
  if (res && (res.ok || res.type === "opaque")) {
    var copy = res.clone();
    clean(copy).then(function (r) { return caches.open(VERSION).then(function (c) { return c.put(req, r); }); }).catch(function () {});
  }
  return res;
}

/* Simpanan untuk permintaan ini; untuk halaman, jatuh ke peta.html atau index.html. */
function saved(req) {
  return caches.match(req, { ignoreSearch: true }).then(function (r) {
    if (r || req.mode !== "navigate") return r;
    return caches.match(/peta/.test(new URL(req.url).pathname) ? "peta.html" : "index.html");
  });
}

self.addEventListener("fetch", function (e) {
  var req = e.request; if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin === location.origin) {
    /* File app: jaringan dulu supaya selalu terbaru; simpanan saat offline atau jaringan lambat. */
    e.respondWith(new Promise(function (resolve, reject) {
      var done = false;
      var timer = setTimeout(function () {
        saved(req).then(function (r) { if (r && !done) { done = true; resolve(r); } });
      }, TIMEOUT);
      fetch(req).then(function (res) {
        clearTimeout(timer); put(req, res);
        if (!done) { done = true; resolve(res); }
      }, function () {
        clearTimeout(timer); if (done) return;
        saved(req).then(function (r) { done = true; if (r) resolve(r); else reject(new TypeError("offline")); });
      });
    }));
  } else if (LIBS.indexOf(url.hostname) >= 0) {
    /* Leaflet dan font: pakai simpanan dulu. */
    e.respondWith(caches.match(req, { ignoreVary: true }).then(function (r) { return r || fetch(req).then(function (res) { return put(req, res); }); }));
  }
  /* Gambar peta (tile) tidak disimpan: selalu dari jaringan. */
});
