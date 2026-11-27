/* Kesit Excel service worker: önce ağ, ağ yoksa son kopya. */
const CACHE = 'kesit-excel-v0-5-0';
const CORE = ['./', 'index.html', 'css/kesit.css', 'vendor/fonts.css', 'manifest.webmanifest', 'favicon.svg', 'sw-kaydet.js',
  'js/app.js', 'js/yardim.js', 'js/durum.js', 'js/izgara.js', 'js/pivot-ui.js', 'js/sorgu-ui.js', 'js/sayfalar.js', 'js/en.js', 'js/grafik-ui.js', 'js/kosullu-ui.js', 'js/makro-ui.js', 'js/pano-ui.js', 'js/model-ui.js',
  'motor/formul.js', 'motor/islevler.js', 'motor/kitap.js', 'motor/tarih.js', 'motor/pivot.js', 'motor/sorgu.js', 'motor/denetci.js', 'motor/grafik.js', 'motor/kosullu.js', 'motor/vba.js', 'motor/bicim.js', 'motor/dogrulama.js', 'motor/senaryo.js', 'motor/veriaraclari.js',
  'icerik/dersler.js', 'icerik/dersler-1.js', 'icerik/dersler-2.js', 'icerik/dersler-3.js', 'icerik/dersler-4.js', 'icerik/dersler-5.js', 'icerik/dersler-6.js', 'icerik/modeller.js', 'icerik/ekler.js', 'icerik/islev-bilgi.js', 'icerik/sayfalar.js', 'icerik/veri.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('kesit-excel-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => { if (res.ok && res.type === 'basic') { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; }).catch(() => caches.match(r).then(m => m || (r.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
