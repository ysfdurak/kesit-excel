// Kesit Excel · veri doğrulama (Veri > Veri Doğrulama) ve formül denetimi (Formüller > Formül Denetleme).
import { alanCoz, adres, kaydir, Dizi, Bas, hataMi, ayristir, belirtec, degerlendir, coz, sayiya, EN_TR, HATA_TR } from './formul.js';
import { ISLEVLER } from './islevler.js';

const trB = s => String(s).toLocaleUpperCase('tr');
export const DOGRULAMA_TURLERI = { liste: 'Liste', tamSayi: 'Tam sayı', ondalik: 'Ondalık', tarih: 'Tarih', uzunluk: 'Metin uzunluğu', ozel: 'Özel (formül)' };
export const DOGRULAMA_OP = { arasinda: 'arasında', arasindaDegil: 'arasında değil', '=': 'eşit', '<>': 'eşit değil', '>': 'büyük', '<': 'küçük', '>=': 'büyük ya da eşit', '<=': 'küçük ya da eşit' };
export const HATA_STILI = { durdur: 'Durdur (girişi reddeder)', uyari: 'Uyarı (Evet derse kabul)', bilgi: 'Bilgi (bildirir, kabul eder)' };

// Formül ya da sabit: "=BUGÜN()", "=$B$1", "100", "15.03.2025"
function sinirDeger(kitap, sayfa, r, c, x, dr, dc) {
  if (x == null || x === '') return null;
  if (typeof x === 'number') return x;
  const s = String(x).trim();
  if (s.startsWith('=')) { const v = kitap.formulDegerlendir(sayfa, r, c, kaydir(s, dr, dc)); return typeof v === 'number' ? v : sayiya(v); }
  const t = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(s);
  if (t) return (Date.UTC(+t[3], +t[2] - 1, +t[1]) - Date.UTC(1899, 11, 30)) / 864e5;
  const n = Number(s.replace(/\./g, '').replace(',', '.')); return Number.isFinite(n) ? n : null;
}
// Liste kaynağı: "Elektronik;Giyim;Kitap" ya da "=$H$2:$H$8" ya da "=DOLAYLI($A2)"
export function listeDegerleri(kitap, sayfa, r, c, kaynak, dr = 0, dc = 0) {
  const s = String(kaynak ?? '').trim();
  if (!s) return [];
  if (!s.startsWith('=')) return s.split(/[;,]/).map(x => x.trim()).filter(Boolean);
  const sh = kitap.sayfaBul(sayfa);
  let v;
  try { const ag = ayristir(kaydir(s, dr, dc), ISLEVLER); v = coz(degerlendir(ag, { kitap, sayfa: sh, satir: r, sutun: c, adim: kitap.adim, bugun: kitap.bugun, degisken: null }), { kitap }); }
  catch { return []; }
  if (v instanceof Dizi) return v.v.flat().filter(x => x != null && x !== '' && !hataMi(x));
  return v == null || hataMi(v) ? [] : [v];
}
const karsilastir = (op, x, a, b) => ({ arasinda: x >= a && x <= b, arasindaDegil: x < a || x > b, '=': x === a, '<>': x !== a, '>': x > a, '<': x < a, '>=': x >= a, '<=': x <= a })[op];

// Bir değerin kurala uyup uymadığı. kural.alan: uygulandığı alan (göreli formüller sol üst hücreye göre yazılır)
export function dogrula(kitap, sayfa, r, c, deger, kural) {
  const al = alanCoz(kural.alan) || { r1: r, c1: c }, dr = r - al.r1, dc = c - al.c1;
  const bos = deger == null || deger === '';
  if (bos) return kural.bosYoksay !== false;
  switch (kural.tur) {
    case 'liste': {
      const l = listeDegerleri(kitap, sayfa, r, c, kural.kaynak, dr, dc);
      return l.some(x => typeof x === 'number' && typeof deger === 'number' ? x === deger : trB(x) === trB(deger));
    }
    case 'tamSayi': case 'ondalik': case 'tarih': {
      if (typeof deger !== 'number') return false;
      if (kural.tur === 'tamSayi' && !Number.isInteger(deger)) return false;
      const a = sinirDeger(kitap, sayfa, r, c, kural.d1, dr, dc), b = sinirDeger(kitap, sayfa, r, c, kural.d2, dr, dc);
      return !!karsilastir(kural.op || 'arasinda', deger, a, b);
    }
    case 'uzunluk': {
      const n = String(deger).length, a = sinirDeger(kitap, sayfa, r, c, kural.d1, dr, dc), b = sinirDeger(kitap, sayfa, r, c, kural.d2, dr, dc);
      return !!karsilastir(kural.op || 'arasinda', n, a, b);
    }
    case 'ozel': {
      // Excel özel formülü hücreye yazmadan önce dener: değer yazılmış gibi hesaplanır
      const s = kitap.sayfaBul(sayfa), k = r + ',' + c, eski = s && s.h.get(k);
      if (s) { s.h.set(k, { v: deger }); kitap.sifirla(); }
      try { const v = kitap.formulDegerlendir(sayfa, r, c, kaydir(kural.formul, dr, dc)); return v === true || (typeof v === 'number' && v !== 0); }
      finally { if (s) { if (eski) s.h.set(k, eski); else s.h.delete(k); kitap.sifirla(); } }
    }
  }
  return true;
}
// "Geçersiz Verileri Daire İçine Al": kurallara uymayan mevcut hücreler
export function gecersizler(kitap, sayfa, kurallar) {
  const out = new Set();
  for (const k of kurallar || []) {
    const al = alanCoz(k.alan); if (!al) continue;
    for (let r = al.r1; r <= al.r2; r++) for (let c = al.c1; c <= al.c2; c++) {
      const v = kitap.hucre(sayfa, r, c);
      if (!dogrula(kitap, sayfa, r, c, v, k)) out.add(adres(r, c));
    }
  }
  return out;
}
export function kuralBul(kurallar, r, c) {
  for (const k of kurallar || []) { const a = alanCoz(k.alan); if (a && r >= a.r1 && r <= a.r2 && c >= a.c1 && c <= a.c2) return k; }
  return null;
}

/* ---------------------------------------------------------------- formül denetimi */
// Etkileyenler: formülün okuduğu alanlar (ad ve tablo başvuruları çözülerek)
export function etkileyenler(kitap, sayfa, r, c) {
  const f = kitap.icerik(sayfa, r, c);
  if (typeof f !== 'string' || !f.startsWith('=')) return [];
  let tk; try { tk = belirtec(f.slice(1)); } catch { return []; }
  const sh = kitap.sayfaBul(sayfa), out = [];
  const bag = { kitap, sayfa: sh, satir: r, sutun: c, adim: kitap.adim, bugun: kitap.bugun, degisken: null };
  for (const t of tk) {
    if (t.t === 'ref') out.push({ sayfa: t.sayfa ? (kitap.sayfaBul(t.sayfa)?.ad ?? t.sayfa) : sh.ad, r1: t.r1, c1: t.c1, r2: t.tip === 'sutun' ? Math.max(1, kitap.sayfaBul(t.sayfa || sayfa)?.kullanilan().r || 1) : t.r2, c2: t.c2, metin: f.slice(1).slice(t.bas, t.son) });
    else if (t.t === 'tref' || t.t === 'ad') {
      let b; try { b = t.t === 'tref' ? kitap.tabloBasvuru(t, bag) : kitap.adDegeri(trB(t.v), bag); } catch { b = null; }
      if (b instanceof Bas) out.push({ sayfa: b.sayfa, r1: b.r1, c1: b.c1, r2: b.r2, c2: b.c2, metin: f.slice(1).slice(t.bas, t.son) });
    }
  }
  return out;
}
// Etkilenenler: bu hücreyi okuyan formüller (bütün sayfalarda)
export function etkilenenler(kitap, sayfa, r, c) {
  const out = [], hedef = trB(kitap.sayfaBul(sayfa)?.ad ?? sayfa);
  for (const s of kitap.sayfalar.values()) for (const [k, h] of s.h) {
    if (h.f == null) continue;
    const [a, b] = k.split(',').map(Number);
    if (etkileyenler(kitap, s.ad, a, b).some(x => trB(x.sayfa) === hedef && r >= x.r1 && r <= x.r2 && c >= x.c1 && c <= x.c2)) out.push({ sayfa: s.ad, r: a, c: b });
  }
  return out;
}

// Formülü Değerlendir: Excel'in adım adım hesap penceresi. Her adımda en soldaki, en içteki hesaplanabilir parça değere döner.
const TR_AD = EN_TR;
function degerMetni(v) {
  if (v == null) return '0';
  if (hataMi(v) || (v && v.kod)) return HATA_TR[v.kod] || v.kod;
  if (typeof v === 'boolean') return v ? 'DOĞRU' : 'YANLIŞ';
  if (typeof v === 'number') return String(+v.toPrecision(12)).replace('.', ',');
  if (v instanceof Dizi) { const d = v.v.flat(); return '{' + d.slice(0, 6).map(degerMetni).join(';') + (d.length > 6 ? ';…' : '') + '}'; }
  return '"' + String(v).replace(/"/g, '""') + '"';
}
export function yazdir(n, kaynak = '') {
  switch (n.t) {
    case 'num': return String(n.v).replace('.', ',');
    case 'str': return '"' + n.v.replace(/"/g, '""') + '"';
    case 'bool': return n.v ? 'DOĞRU' : 'YANLIŞ';
    case 'err': return HATA_TR[n.v] || n.v;
    case 'deg': return degerMetni(n.v);
    case 'bos': return '';
    case 'neg': return '-' + yazdir(n.a);
    case 'pct': return yazdir(n.a) + '%';
    case 'op': return yazdir(n.a) + n.op + yazdir(n.b);
    case 'fn': return (TR_AD[n.ad] || n.yazilan || n.ad) + '(' + n.args.map(a => yazdir(a)).join(';') + ')';
    case 'ad': return n.v;
    case 'dizi': return degerMetni(new Dizi(n.v));
    default: return n.metin || '?';
  }
}
const sabitMi = n => ['num', 'str', 'bool', 'err', 'deg', 'bos'].includes(n.t);
export function formulAdimlari(kitap, sayfa, r, c, enCok = 60) {
  const f = kitap.icerik(sayfa, r, c);
  if (typeof f !== 'string' || !f.startsWith('=')) return [];
  let agac; try { agac = ayristir(f, ISLEVLER); } catch (e) { return [{ metin: f, not: 'Formül okunamadı: ' + e.message }]; }
  const g = f.slice(1);
  // başvuruların özgün yazımı için metin ekle
  (function etiket(n) { if (n.t === 'ref' || n.t === 'tref') n.metin = n.bas != null ? g.slice(n.bas, n.son) : refYaz(n); for (const k of ['a', 'b']) if (n[k]) etiket(n[k]); if (n.args) n.args.forEach(etiket); })(agac);
  const sh = kitap.sayfaBul(sayfa);
  const hesap = n => { try { return coz(degerlendir(n, { kitap, sayfa: sh, satir: r, sutun: c, adim: kitap.adim, bugun: kitap.bugun, degisken: null }), { kitap }); } catch { return { kod: '#CALC!' }; } };
  const deg = v => ({ t: 'deg', v });
  // tek adım: soldan sağa ilk indirgenebilir düğüm
  function adim(n) {
    if (sabitMi(n)) return null;
    if (n.t === 'ref' || n.t === 'tref' || n.t === 'ad') return { yeni: deg(hesap(n)), ne: n.metin || n.v };
    if (n.t === 'fn' && ['IF', 'IFERROR', 'IFNA'].includes(n.ad) && n.args[0]) {
      const a0 = adim(n.args[0]); if (a0) { const args = n.args.slice(); args[0] = a0.yeni; return { yeni: { ...n, args }, ne: a0.ne }; }
      // koşul belli: EĞER yalnız seçilen dalı hesaplar
      if (n.ad === 'IF') { const v = n.args[0].t === 'deg' ? n.args[0].v : hesap(n.args[0]); const dal = v === true || (typeof v === 'number' && v !== 0) ? n.args[1] : n.args[2]; return { yeni: dal && dal.t !== 'bos' ? dal : deg(dal ? 0 : false), ne: 'EĞER koşulu ' + degerMetni(v) + ': ' + (v === true || v ? 'doğru' : 'yanlış') + ' dal' }; }
    }
    for (const k of ['a', 'b']) if (n[k]) { const x = adim(n[k]); if (x) return { yeni: { ...n, [k]: x.yeni }, ne: x.ne }; }
    if (n.args) for (let i = 0; i < n.args.length; i++) { const x = adim(n.args[i]); if (x) { const args = n.args.slice(); args[i] = x.yeni; return { yeni: { ...n, args }, ne: x.ne }; } }
    // bütün çocuklar sabit: düğümü hesapla
    return { yeni: deg(hesap(sabitleriAc(n))), ne: n.t === 'fn' ? (TR_AD[n.ad] || n.ad) : n.op || n.t };
  }
  const adimlar = [{ metin: '=' + yazdir(agac), ne: 'başlangıç' }];
  let cur = agac;
  for (let i = 0; i < enCok && !sabitMi(cur); i++) { const x = adim(cur); if (!x) break; cur = x.yeni; adimlar.push({ metin: '=' + yazdir(cur), ne: x.ne }); }
  return adimlar;
}
// 'deg' düğümlerini motorun anlayacağı düğümlere çevirir
function sabitleriAc(n) {
  if (n.t === 'deg') { const v = n.v; if (v instanceof Dizi) return { t: 'dizi', v: v.v }; if (hataMi(v)) return { t: 'err', v: v.kod }; if (v == null) return { t: 'num', v: 0 }; return { t: typeof v === 'number' ? 'num' : typeof v === 'boolean' ? 'bool' : 'str', v }; }
  const o = { ...n };
  for (const k of ['a', 'b']) if (o[k]) o[k] = sabitleriAc(o[k]);
  if (o.args) o.args = o.args.map(sabitleriAc);
  return o;
}
function refYaz(n) { return adres(n.r1, n.c1) + (n.tip === 'alan' ? ':' + adres(n.r2, n.c2) : ''); }
