// Kesit Excel · çalışma kitabı: sayfalar, hücreler, hesaplama, dinamik dizi taşması, döngü koruması.
import { ayristir, degerlendir, coz, Dizi, Hata, H, hataMi, sayiMetin, adresCoz, alanCoz, kaydir, HATA_TR, SINIR, adres } from './formul.js';
import { ISLEVLER } from './islevler.js';
import { bicimle, trSayi } from './tarih.js';

const anahtar = (r, c) => r + ',' + c;
const trB = s => String(s).toLocaleUpperCase('tr');

export class Sayfa {
  constructor(kitap, ad) { this.kitap = kitap; this.ad = ad; this.h = new Map(); }
  kullanilan() {
    let r = 0, c = 0;
    for (const k of this.h.keys()) { const [a, b] = k.split(',').map(Number); if (a > r) r = a; if (b > c) c = b; }
    for (const k of this.kitap.tasma.keys()) { const [s, rc] = k.split('!'); if (s !== this.ad) continue; const [a, b] = rc.split(',').map(Number); if (a > r) r = a; if (b > c) c = b; }
    return { r, c };
  }
}

export class Kitap {
  constructor({ bugun = null } = {}) {
    this.sayfalar = new Map(); this.islevler = ISLEVLER; this.bugun = bugun;
    this.sifirla();
  }
  sifirla() { this.sonuc = new Map(); this.tasma = new Map(); this.tasmaSahibi = new Map(); this.hesapta = new Set(); this.adim = { n: 0 }; }
  sayfa(ad = 'Sayfa1') { const v = this.sayfaBul(ad); if (v) return v; const s = new Sayfa(this, ad); this.sayfalar.set(ad, s); return s; }
  sayfaBul(ad) { if (this.sayfalar.has(ad)) return this.sayfalar.get(ad); const b = trB(ad); for (const [k, v] of this.sayfalar) if (trB(k) === b) return v; return null; }

  // içerik: '=' ile başlayan metin formüldür; sayı, mantıksal, null ya da metin değerdir
  yaz(sayfaAd, adr, icerik) {
    const s = this.sayfa(sayfaAd), p = typeof adr === 'string' ? adresCoz(adr) : adr;
    if (!p) throw new Error('Geçersiz adres: ' + adr);
    const k = anahtar(p.r, p.c);
    if (icerik == null || icerik === '') { s.h.delete(k); }
    else if (typeof icerik === 'string' && icerik.startsWith('=') && icerik.length > 1) {
      let agac = null, hata = null;
      try { agac = ayristir(icerik, ISLEVLER); } catch (e) { hata = e.message; }
      s.h.set(k, { f: icerik, agac, hata });
    } else s.h.set(k, { v: icerik });
    this.sifirla();
  }
  // Değer girişi: kullanıcı "1.234,5" ya da "15.03.2025" yazarsa sayıya çevrilir (Excel'in yaptığı gibi)
  yazGiris(sayfaAd, adr, metin) {
    if (typeof metin !== 'string' || metin.startsWith('=')) return this.yaz(sayfaAd, adr, metin);
    const t = metin.trim(), b = trB(t);
    if (b === 'DOĞRU' || b === 'TRUE') return this.yaz(sayfaAd, adr, true);
    if (b === 'YANLIŞ' || b === 'FALSE') return this.yaz(sayfaAd, adr, false);
    const n = sayiMetin(t);
    return this.yaz(sayfaAd, adr, n == null ? metin : n);
  }
  // Tablo yükle: başlıklar ilk satırda; tarihler seri sayı olarak verilmeli
  tablo(sayfaAd, basliklar, satirlar, bas = 'A1') {
    const p = adresCoz(bas), s = this.sayfa(sayfaAd);
    basliklar.forEach((h, j) => s.h.set(anahtar(p.r, p.c + j), { v: h }));
    satirlar.forEach((row, i) => row.forEach((v, j) => { if (v != null && v !== '') s.h.set(anahtar(p.r + 1 + i, p.c + j), { v }); }));
    this.sifirla();
  }
  // İlk hücreye formülü yazar, altına göreli başvuruları kaydırarak doldurur (Excel'de çift tıklayıp aşağı doldurma)
  doldur(sayfaAd, ilk, formul, n) { const p = adresCoz(ilk); for (let i = 0; i < n; i++) this.yaz(sayfaAd, { r: p.r + i, c: p.c }, kaydir(formul, i, 0)); }
  icerik(sayfaAd, r, c) { const s = this.sayfaBul(sayfaAd); const h = s && s.h.get(anahtar(r, c)); return h ? (h.f != null ? h.f : h.v) : null; }
  formulHatasi(sayfaAd, r, c) { const s = this.sayfaBul(sayfaAd); const h = s && s.h.get(anahtar(r, c)); return h && h.hata ? h.hata : null; }

  hucre(sayfaAd, r, c) {
    const s = this.sayfaBul(sayfaAd); if (!s) return H.BASV;
    const h = s.h.get(anahtar(r, c));
    if (h) return h.f != null ? this.formulHesapla(s, r, c, h) : h.v;
    const tk = s.ad + '!' + anahtar(r, c);
    if (!this.tasma.has(tk)) this.oncekiCapalar(s, r, c);
    return this.tasma.has(tk) ? this.tasma.get(tk) : null;
  }
  // Boş hücre okunurken, onu taşmayla doldurabilecek (solunda/üstünde) formüller önce hesaplanır
  oncekiCapalar(s, r, c) {
    for (const [k, h] of s.h) {
      if (h.f == null) continue;
      const [a, b] = k.split(',').map(Number);
      if (a <= r && b <= c && !this.sonuc.has(s.ad + '!' + k) && !this.hesapta.has(s.ad + '!' + k)) this.formulHesapla(s, a, b, h);
    }
  }
  formulHesapla(s, r, c, h) {
    const k = s.ad + '!' + anahtar(r, c);
    if (this.sonuc.has(k)) return this.sonuc.get(k);
    if (this.hesapta.has(k)) return H.DONGU;
    this.hesapta.add(k);
    let v;
    try {
      if (h.hata) v = new Hata('#FORMÜL');
      else { v = coz(degerlendir(h.agac, { kitap: this, sayfa: s, satir: r, sutun: c, adim: this.adim, bugun: this.bugun, degisken: null }), { kitap: this }); }
    } catch (e) { v = new Hata(e && e.kod ? e.kod : '#CALC!'); }
    this.hesapta.delete(k);
    if (v instanceof Dizi) {
      if (v.satir === 1 && v.sutun === 1) v = v.v[0][0];
      else v = this.tasir(s, r, c, v);
    }
    if (v == null) v = 0; // =A1 (A1 boş) Excel'de 0 gösterir
    if (typeof v === 'number' && !Number.isFinite(v)) v = H.SAYI;
    this.sonuc.set(k, v);
    return v;
  }
  tasir(s, r, c, d) {
    if (d.satir * d.sutun > SINIR.hucreDizi) return H.SAYI;
    for (let i = 0; i < d.satir; i++) for (let j = 0; j < d.sutun; j++) {
      if (!i && !j) continue;
      const kk = anahtar(r + i, c + j), tk = s.ad + '!' + kk;
      if (s.h.has(kk) || (this.tasmaSahibi.has(tk) && this.tasmaSahibi.get(tk) !== anahtar(r, c))) return H.TASMA;
    }
    for (let i = 0; i < d.satir; i++) for (let j = 0; j < d.sutun; j++) {
      if (!i && !j) continue;
      const tk = s.ad + '!' + anahtar(r + i, c + j), x = d.v[i][j];
      this.tasma.set(tk, x == null ? 0 : x); this.tasmaSahibi.set(tk, anahtar(r, c));
    }
    const x = d.v[0][0]; return x == null ? 0 : x;
  }
  hesapla() {
    this.sifirla();
    for (const s of this.sayfalar.values()) for (const [k, h] of s.h) if (h.f != null) { const [r, c] = k.split(',').map(Number); this.formulHesapla(s, r, c, h); }
    return this;
  }
  // Bir alanın değerleri (2B)
  degerler(sayfaAd, alan) {
    const a = typeof alan === 'string' ? alanCoz(alan) : alan, o = [];
    for (let r = a.r1; r <= a.r2; r++) { const s = []; for (let c = a.c1; c <= a.c2; c++) s.push(this.hucre(sayfaAd, r, c)); o.push(s); }
    return o;
  }
  // Bir formülü hücreye yazmadan, verilen konumdaymış gibi hesaplar (koşullu biçim kuralları, doğrulama)
  formulDegerlendir(sayfaAd, r, c, formul) {
    const s = this.sayfaBul(sayfaAd); if (!s) return H.BASV;
    let agac; try { agac = ayristir(formul, ISLEVLER); } catch { return new Hata('#FORMÜL'); }
    try { const v = coz(degerlendir(agac, { kitap: this, sayfa: s, satir: r, sutun: c, adim: this.adim, bugun: this.bugun, degisken: null }), { kitap: this }); return v instanceof Dizi ? v.v[0][0] : v; }
    catch (e) { return new Hata(e && e.kod ? e.kod : '#CALC!'); }
  }
  // Hazır bir AST'yi hesaplar (VBA WorksheetFunction köprüsü)
  formulDegerlendirAgac(sayfaAd, agac) {
    const s = this.sayfaBul(sayfaAd); if (!s) return H.BASV;
    try { const v = coz(degerlendir(agac, { kitap: this, sayfa: s, satir: 1, sutun: 1, adim: this.adim, bugun: this.bugun, degisken: null }), { kitap: this }); return v; }
    catch (e) { return new Hata(e && e.kod ? e.kod : '#CALC!'); }
  }
  tasmaMi(sayfaAd, r, c) { const s = this.sayfaBul(sayfaAd); return !!s && this.tasmaSahibi.has(s.ad + '!' + anahtar(r, c)); }
}

// Ekranda gösterim (Türkçe): sayı Türkçe biçim, hata Türkçe kodu, mantıksal DOĞRU/YANLIŞ
export function goster(v, bicim = null) {
  if (v == null) return '';
  if (hataMi(v)) return HATA_TR[v.kod] || v.kod;
  if (typeof v === 'boolean') return v ? 'DOĞRU' : 'YANLIŞ';
  if (typeof v === 'number') return bicim ? bicimle(v, bicim) : trSayi(v);
  return String(v);
}
export { adres };
