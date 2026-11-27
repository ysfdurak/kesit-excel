// İlerleme ve tercihler bu tarayıcıda (localStorage) saklanır; sunucu yoktur.
import { DERSLER } from '../icerik/dersler.js';
const ANAHTAR = 'kesit-excel-v1';
const bos = () => ({ surum: 1, dersler: {}, rol: null, tema: null, seviye: null, son: null });
let D = oku();
function oku() { try { const v = JSON.parse(localStorage.getItem(ANAHTAR) || 'null'); return v && v.surum === 1 ? { ...bos(), ...v } : bos(); } catch { return bos(); } }
function yaz() {
  try {
    localStorage.setItem(ANAHTAR, JSON.stringify(D));
    // Kesit merkez sayfası (ysfdurak.github.io) kartında "x / y ders tamam" gösterir; aynı köken, yalnız iki sayı
    localStorage.setItem('kesit.ozet.excel', JSON.stringify({ bitti: Object.values(D.dersler).filter(d => d && d.t).length, toplam: DERSLER.length }));
  } catch { /* gizli pencere ya da kota: ilerleme bu oturumda kalır */ }
}
export const durum = () => D;
export function alistirmaTamam(dersId, alId) {
  const d = D.dersler[dersId] || (D.dersler[dersId] = { a: {}, t: null });
  d.a[alId] = Date.now(); D.son = dersId; yaz();
}
export function dersTamamla(dersId) { const d = D.dersler[dersId] || (D.dersler[dersId] = { a: {}, t: null }); if (!d.t) d.t = Date.now(); D.son = dersId; yaz(); }
export const dersBitti = id => !!(D.dersler[id] && D.dersler[id].t);
export const alistirmaBitti = (id, a) => !!(D.dersler[id] && D.dersler[id].a[a]);
export function rolSec(r) { D.rol = r; yaz(); }
export function temaSec(t) { D.tema = t; yaz(); }
export function seviyeKaydet(s) { D.seviye = s; yaz(); }
export function sonDers(id) { D.son = id; yaz(); }
export function disaAktar() { return JSON.stringify({ uygulama: 'Kesit Excel', tarih: new Date().toISOString(), ...D }, null, 1); }
export function iceAl(metin) {
  const v = JSON.parse(metin);
  if (!v || v.uygulama !== 'Kesit Excel' || v.surum !== 1 || typeof v.dersler !== 'object') throw new Error('Bu dosya bir Kesit Excel yedeği değil.');
  // Yalnız beklenen alanlar alınır
  const temiz = bos();
  for (const [k, x] of Object.entries(v.dersler)) if (/^m\d+-d\d+$/.test(k) && x && typeof x === 'object') temiz.dersler[k] = { a: Object.fromEntries(Object.entries(x.a || {}).filter(([a, t]) => /^a\d+$/.test(a) && typeof t === 'number')), t: typeof x.t === 'number' ? x.t : null };
  temiz.rol = typeof v.rol === 'string' ? v.rol : null; temiz.tema = v.tema === 'dark' || v.tema === 'light' ? v.tema : null;
  D = temiz; yaz();
}
export function sifirla() { D = bos(); yaz(); }
