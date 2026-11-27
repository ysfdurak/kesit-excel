// Kesit Excel · işlev kütüphanesi. İç adlar İngilizce; Türkçe adlar formul.js'deki TR_EN tablosuyla eşlenir.
// Davranış Excel 365'e göredir (dinamik diziler, taşma). Excel'den bilinçli ayrılan yerler belgede listelenir.
import { H, Hata, Dizi, Bas, hataMi, coz, sayiya, metne, mantiga, karsilastir, degerlendir, sayiMetin, SINIR, Lambda, lambdaCagir, ATLANAN } from './formul.js';
import { seriden, seriye, zaman, ayinSonGunu, bicimle, metindenTarih } from './tarih.js';

const F = {};
const tanim = (ad, fn, opt = {}) => { F[ad] = { fn, ...opt }; };
const trB = s => String(s).toLocaleUpperCase('tr');
const trK = s => String(s).toLocaleLowerCase('tr');

/* ---------------------------------------------------------------- yardımcılar */
const deger = (x, bag) => coz(x, bag);
const diziyeCevir = (x, bag) => { const v = deger(x, bag); return v instanceof Dizi ? v : new Dizi([[v]]); };
const tumHucreler = d => d.v.flat();
// SUM/AVERAGE gibi: doğrudan yazılan değerde metin sayı ve mantıksal sayılır; aralıktakinde yalnız sayılar.
function sayilar(args, bag, { mantik = false } = {}) {
  const out = [];
  for (const a of args) {
    if (a == null && args.length) continue;
    const v = deger(a, bag);
    if (v instanceof Dizi) {
      for (const x of tumHucreler(v)) { if (hataMi(x)) return x; if (typeof x === 'number') out.push(x); else if (mantik && typeof x === 'boolean') out.push(x ? 1 : 0); }
    } else {
      if (hataMi(v)) return v;
      if (v == null) continue;
      const n = sayiya(v); if (hataMi(n)) return n; out.push(n);
    }
  }
  return out;
}
// Skaler işlevi dizilere yay (Excel 365: =SOLDAN(A2:A5;2) taşar)
function yay(fn, n = null) {
  return (args, bag) => {
    const v = args.map(a => deger(a, bag));
    const diziler = v.map((x, i) => (n == null || n.includes(i)) && x instanceof Dizi ? x : null);
    if (!diziler.some(Boolean)) return fn(v, bag);
    const R = Math.max(...diziler.map(d => d ? d.satir : 1)), C = Math.max(...diziler.map(d => d ? d.sutun : 1));
    if (R * C > SINIR.hucreDizi) return H.HESAP;
    const out = [];
    for (let r = 0; r < R; r++) { const s = []; for (let c = 0; c < C; c++) s.push(fn(v.map((x, i) => diziler[i] ? (diziler[i].satir === 1 || r < diziler[i].satir) && (diziler[i].sutun === 1 || c < diziler[i].sutun) ? diziler[i].al(r, c) : H.NA : x), bag)); out.push(s); }
    return new Dizi(out);
  };
}
const ilkHata = (...xs) => xs.find(hataMi);
const N = (v) => sayiya(v);
const T = (v) => metne(v);
// Yuvarlama: kaydırmayı ondalık gösterimle yap (2,675 → 2,68; ikili kayan nokta hatasına düşmeden).
// yon 0: yarım yukarı (sıfırdan uzağa), 1: yukarı (sıfırdan uzağa), -1: aşağı (sıfıra doğru)
const kay = (v, e) => { const [m, ex] = String(v).split('e'); return Number(m + 'e' + (Number(ex || 0) + e)); };
function yuvarlaYon(x, d, yon) {
  const s = Math.sign(x), a = Math.abs(x);
  if (a === 0) return 0;
  const m = Number(kay(a, d).toPrecision(15));
  const r = yon === 0 ? Math.round(m) : yon > 0 ? Math.ceil(m) : Math.floor(m);
  return s * kay(r, -d);
}
const bos = v => v == null || v === '';

/* ---------------------------------------------------------------- matematik ve istatistik */
tanim('SUM', (a, b) => { const x = sayilar(a, b); return hataMi(x) ? x : x.reduce((t, v) => t + v, 0); });
tanim('AVERAGE', (a, b) => { const x = sayilar(a, b); return hataMi(x) ? x : x.length ? x.reduce((t, v) => t + v, 0) / x.length : H.BOL0; });
tanim('MIN', (a, b) => { const x = sayilar(a, b); return hataMi(x) ? x : x.length ? Math.min(...x) : 0; });
tanim('MAX', (a, b) => { const x = sayilar(a, b); return hataMi(x) ? x : x.length ? Math.max(...x) : 0; });
tanim('PRODUCT', (a, b) => { const x = sayilar(a, b); return hataMi(x) ? x : x.length ? x.reduce((t, v) => t * v, 1) : 0; });
tanim('COUNT', (a, b) => {
  let n = 0;
  for (const x of a) { const v = deger(x, b); if (v instanceof Dizi) n += tumHucreler(v).filter(y => typeof y === 'number').length; else if (typeof v === 'number' || (typeof v === 'string' && sayiMetin(v) != null) || typeof v === 'boolean') n++; }
  return n;
});
tanim('COUNTA', (a, b) => { let n = 0; for (const x of a) { const v = deger(x, b); if (v instanceof Dizi) n += tumHucreler(v).filter(y => y != null).length; else if (v != null) n++; } return n; });
tanim('COUNTBLANK', (a, b) => { const v = deger(a[0], b); return v instanceof Dizi ? tumHucreler(v).filter(bos).length : bos(v) ? 1 : 0; });
tanim('ROUND', yay(([x, d]) => { const e = ilkHata(N(x), N(d ?? 0)); if (e) return e; return yuvarlaYon(N(x), Math.trunc(N(d ?? 0)), 0); }));
tanim('ROUNDUP', yay(([x, d]) => { const e = ilkHata(N(x), N(d ?? 0)); if (e) return e; return yuvarlaYon(N(x), Math.trunc(N(d ?? 0)), 1); }));
tanim('ROUNDDOWN', yay(([x, d]) => { const e = ilkHata(N(x), N(d ?? 0)); if (e) return e; return yuvarlaYon(N(x), Math.trunc(N(d ?? 0)), -1); }));
tanim('TRUNC', yay(([x, d]) => { const e = ilkHata(N(x), N(d ?? 0)); if (e) return e; return yuvarlaYon(N(x), Math.trunc(N(d ?? 0)), -1); }));
tanim('INT', yay(([x]) => { const n = N(x); return hataMi(n) ? n : Math.floor(n); }));
tanim('MOD', yay(([x, y]) => { const a = N(x), b = N(y); const e = ilkHata(a, b); if (e) return e; if (b === 0) return H.BOL0; const r = a - b * Math.floor(a / b); return Math.abs(r) < 1e-12 ? 0 : r; }));
tanim('ABS', yay(([x]) => { const n = N(x); return hataMi(n) ? n : Math.abs(n); }));
tanim('SIGN', yay(([x]) => { const n = N(x); return hataMi(n) ? n : Math.sign(n); }));
tanim('SQRT', yay(([x]) => { const n = N(x); return hataMi(n) ? n : n < 0 ? H.SAYI : Math.sqrt(n); }));
tanim('POWER', yay(([x, y]) => { const a = N(x), b = N(y); const e = ilkHata(a, b); if (e) return e; if (a === 0 && b < 0) return H.BOL0; const r = Math.pow(a, b); return Number.isFinite(r) ? r : H.SAYI; }));
tanim('PI', () => Math.PI);
tanim('MROUND', yay(([x, m]) => { const a = N(x), b = N(m); const e = ilkHata(a, b); if (e) return e; if (b === 0) return 0; if (Math.sign(a) * Math.sign(b) < 0) return H.SAYI; return yuvarlaYon(a / b, 0, 0) * b; }));
tanim('CEILING.MATH', yay(([x, s, m]) => { const a = N(x), sig = s == null ? 1 : Math.abs(N(s)); if (hataMi(a) || hataMi(sig)) return ilkHata(a, sig); if (sig === 0) return 0; const mod = m == null ? 0 : N(m); return a < 0 && mod ? -Math.ceil(-a / sig - 1e-12) * sig : Math.ceil(a / sig - 1e-12) * sig; }));
tanim('FLOOR.MATH', yay(([x, s, m]) => { const a = N(x), sig = s == null ? 1 : Math.abs(N(s)); if (hataMi(a) || hataMi(sig)) return ilkHata(a, sig); if (sig === 0) return 0; const mod = m == null ? 0 : N(m); return a < 0 && mod ? -Math.floor(-a / sig + 1e-12) * sig : Math.floor(a / sig + 1e-12) * sig; }));
const sirali = x => x.slice().sort((p, q) => p - q);
tanim('MEDIAN', (a, b) => { const x = sayilar(a, b); if (hataMi(x)) return x; if (!x.length) return H.SAYI; const s = sirali(x), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; });
tanim('MODE.SNGL', (a, b) => { const x = sayilar(a, b); if (hataMi(x)) return x; const say = new Map(); let en = null, ec = 1; for (const v of x) { const c = (say.get(v) || 0) + 1; say.set(v, c); if (c > ec) { ec = c; en = v; } } return en == null ? H.NA : en; });
tanim('LARGE', (a, b) => { const x = sayilar([a[0]], b), k = N(deger(a[1], b)); if (hataMi(x)) return x; if (hataMi(k)) return k; const s = sirali(x).reverse(); return k >= 1 && k <= s.length ? s[Math.ceil(k) - 1] : H.SAYI; });
tanim('SMALL', (a, b) => { const x = sayilar([a[0]], b), k = N(deger(a[1], b)); if (hataMi(x)) return x; if (hataMi(k)) return k; const s = sirali(x); return k >= 1 && k <= s.length ? s[Math.ceil(k) - 1] : H.SAYI; });
const rank = (a, b) => { const v = N(deger(a[0], b)), x = sayilar([a[1]], b), azalan = !(a[2] != null && N(deger(a[2], b))); if (hataMi(v)) return v; if (hataMi(x)) return x; if (!x.some(y => y === v)) return H.NA; return 1 + x.filter(y => azalan ? y > v : y < v).length; };
tanim('RANK.EQ', rank); tanim('RANK', rank);
function varyans(x) { const m = x.reduce((t, v) => t + v, 0) / x.length; return x.reduce((t, v) => t + (v - m) ** 2, 0) / (x.length - 1); }
tanim('STDEV.S', (a, b) => { const x = sayilar(a, b); if (hataMi(x)) return x; return x.length < 2 ? H.BOL0 : Math.sqrt(varyans(x)); });
tanim('VAR.S', (a, b) => { const x = sayilar(a, b); if (hataMi(x)) return x; return x.length < 2 ? H.BOL0 : varyans(x); });
function yuzdelik(x, p) { const s = sirali(x), h = (s.length - 1) * p, i = Math.floor(h); return s[i] + (s[Math.min(s.length - 1, i + 1)] - s[i]) * (h - i); }
tanim('PERCENTILE.INC', (a, b) => { const x = sayilar([a[0]], b), p = N(deger(a[1], b)); if (hataMi(x)) return x; if (hataMi(p)) return p; if (!x.length || p < 0 || p > 1) return H.SAYI; return yuzdelik(x, p); });
tanim('QUARTILE.INC', (a, b) => { const x = sayilar([a[0]], b), q = Math.trunc(N(deger(a[1], b))); if (hataMi(x)) return x; if (hataMi(q)) return q; if (!x.length || q < 0 || q > 4) return H.SAYI; return yuzdelik(x, q / 4); });
tanim('SUMPRODUCT', (a, b) => {
  const d = a.map(x => diziyeCevir(x, b));
  const R = d[0].satir, C = d[0].sutun;
  if (d.some(x => x.satir !== R || x.sutun !== C)) return H.DEGER;
  let t = 0;
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    let p = 1;
    for (const x of d) { const v = x.v[r][c]; if (hataMi(v)) return v; p *= typeof v === 'number' ? v : 0; }
    t += p;
  }
  return t;
});
const ALT = { 1: 'AVERAGE', 2: 'COUNT', 3: 'COUNTA', 4: 'MAX', 5: 'MIN', 6: 'PRODUCT', 7: 'STDEV.S', 9: 'SUM', 10: 'VAR.S' };
tanim('SUBTOTAL', (a, b) => { const k = N(deger(a[0], b)); if (hataMi(k)) return k; const f = ALT[k % 100]; return f ? F[f].fn(a.slice(1), b) : H.DEGER; });

/* ---------------------------------------------------------------- mantık ve bilgi */
tanim('TRUE', () => true); tanim('FALSE', () => false);
tanim('IF', (args, bag) => {
  const k = deger(degerlendir(args[0], bag), bag);
  const dal = (i, yok) => args[i] && args[i].t !== 'bos' ? degerlendir(args[i], bag) : (args[i] ? 0 : yok);
  if (k instanceof Dizi) {
    const e = deger(dal(1, true), bag), h = deger(dal(2, false), bag);
    return new Dizi(k.v.map((s, r) => s.map((x, c) => { const m = mantiga(x); if (hataMi(m)) return m; const v = m ? e : h; return v instanceof Dizi ? (v.al(r, c) ?? H.NA) : v; })));
  }
  const m = mantiga(k); if (hataMi(m)) return m;
  return m ? dal(1, true) : dal(2, false);
}, { tembel: true });
tanim('IFS', (args, bag) => {
  for (let i = 0; i + 1 < args.length; i += 2) { const m = mantiga(deger(degerlendir(args[i], bag), bag)); if (hataMi(m)) return m; if (m) return degerlendir(args[i + 1], bag); }
  return H.NA;
}, { tembel: true });
tanim('SWITCH', (args, bag) => {
  const v = deger(degerlendir(args[0], bag), bag); if (hataMi(v)) return v;
  let i = 1;
  for (; i + 1 < args.length; i += 2) { const d = deger(degerlendir(args[i], bag), bag); if (karsilastir(v, d) === 0 && typeof v === typeof d) return degerlendir(args[i + 1], bag); }
  return i < args.length ? degerlendir(args[i], bag) : H.NA;
}, { tembel: true });
function mantiklar(a, b) {
  const out = [];
  for (const x of a) { const v = deger(x, b); const xs = v instanceof Dizi ? tumHucreler(v).filter(y => typeof y === 'boolean' || typeof y === 'number') : [v]; for (const y of xs) { const m = mantiga(y); if (hataMi(m)) return m; out.push(m); } }
  return out.length ? out : H.DEGER;
}
tanim('AND', (a, b) => { const x = mantiklar(a, b); return hataMi(x) ? x : x.every(Boolean); });
tanim('OR', (a, b) => { const x = mantiklar(a, b); return hataMi(x) ? x : x.some(Boolean); });
tanim('XOR', (a, b) => { const x = mantiklar(a, b); return hataMi(x) ? x : x.filter(Boolean).length % 2 === 1; });
tanim('NOT', yay(([v]) => { const m = mantiga(v); return hataMi(m) ? m : !m; }));
tanim('IFERROR', (args, bag) => {
  const v = deger(degerlendir(args[0], bag), bag);
  if (v instanceof Dizi) { const y = deger(degerlendir(args[1], bag), bag); return new Dizi(v.v.map(s => s.map(x => hataMi(x) ? (y instanceof Dizi ? y.al(0, 0) : y) : x))); }
  return hataMi(v) ? degerlendir(args[1], bag) : v;
}, { tembel: true });
tanim('IFNA', (args, bag) => { const v = deger(degerlendir(args[0], bag), bag); return hataMi(v) && v.kod === '#N/A' ? degerlendir(args[1], bag) : v; }, { tembel: true });
tanim('ISBLANK', yay(([v]) => v == null));
tanim('ISNUMBER', yay(([v]) => typeof v === 'number'));
tanim('ISTEXT', yay(([v]) => typeof v === 'string'));
tanim('ISERROR', yay(([v]) => hataMi(v)));
tanim('ISNA', yay(([v]) => hataMi(v) && v.kod === '#N/A'));
tanim('ISEVEN', yay(([v]) => { const n = N(v); return hataMi(n) ? n : Math.trunc(n) % 2 === 0; }));
tanim('ISODD', yay(([v]) => { const n = N(v); return hataMi(n) ? n : Math.abs(Math.trunc(n) % 2) === 1; }));

/* ---------------------------------------------------------------- koşullu özetler */
const jokerRe = s => new RegExp('^' + String(s).replace(/~([*?~])|([*?])|([.+^${}()|[\]\\])/g, (m, kac, jok, ozel) => kac ? '\\' + kac : jok === '*' ? '[\\s\\S]*' : jok === '?' ? '[\\s\\S]' : '\\' + ozel) + '$', 'i');
export function olcut(k) {
  // ölçüt → (değer) => bool
  if (hataMi(k)) return () => false;
  if (typeof k === 'number' || typeof k === 'boolean') return v => typeof v === typeof k && v === k;
  const s = String(k ?? '');
  const m = /^(<>|>=|<=|=|<|>)?([\s\S]*)$/.exec(s);
  const op = m[1] || '=', ifade = m[2];
  if (ifade === '' && (op === '=' || !m[1])) return v => v == null || v === '';
  if (ifade === '' && op === '<>') return v => !(v == null || v === '');
  let hedef = sayiMetin(ifade);
  const b = trB(ifade);
  if (hedef == null && (b === 'DOĞRU' || b === 'TRUE' || b === 'YANLIŞ' || b === 'FALSE')) hedef = b === 'DOĞRU' || b === 'TRUE';
  if (hedef != null) {
    const sayisal = typeof hedef === 'number';
    return v => {
      if (sayisal ? typeof v !== 'number' : typeof v !== 'boolean') return op === '<>';
      const c = karsilastir(v, hedef);
      return op === '=' ? c === 0 : op === '<>' ? c !== 0 : op === '<' ? c < 0 : op === '>' ? c > 0 : op === '<=' ? c <= 0 : c >= 0;
    };
  }
  if (op === '=' || op === '<>') {
    const re = /[*?]/.test(ifade) ? jokerRe(trK(ifade)) : null, h = trK(ifade);
    return v => { const t = typeof v === 'string' ? trK(v) : null; const esit = t != null && (re ? re.test(t) : t === h); return op === '=' ? esit : !esit; };
  }
  return v => { if (typeof v !== 'string') return false; const c = karsilastir(v, ifade); return op === '<' ? c < 0 : op === '>' ? c > 0 : op === '<=' ? c <= 0 : c >= 0; };
}
function kosulDizileri(a, b, bas) {
  // [aralık1, ölçüt1, aralık2, ölçüt2, …] → maske
  const ciftler = [];
  for (let i = bas; i + 1 < a.length; i += 2) ciftler.push([diziyeCevir(a[i], b), deger(a[i + 1], b)]);
  if (!ciftler.length) return H.DEGER;
  const R = ciftler[0][0].satir, C = ciftler[0][0].sutun;
  if (ciftler.some(([d]) => d.satir !== R || d.sutun !== C)) return H.DEGER;
  const maske = ciftler.map(([d, k]) => { const f = olcut(k); return d.v.map(s => s.map(f)); });
  return { R, C, test: (r, c) => maske.every(m => m[r][c]) };
}
function kosulSay(a, b) { const m = kosulDizileri(a, b, 0); if (hataMi(m)) return m; let n = 0; for (let r = 0; r < m.R; r++) for (let c = 0; c < m.C; c++) if (m.test(r, c)) n++; return n; }
// Ölçüt dizi olursa (=EĞERSAY(A:A; D2:D5)) sonuç da dizi olur
function olcutYay(fn, olcutIdx) {
  return (a, b) => {
    const idx = olcutIdx(a.length), k = idx.map(i => deger(a[i], b));
    const d = k.find(x => x instanceof Dizi);
    if (!d) return fn(a, b);
    return new Dizi(d.v.map((s, r) => s.map((_, c) => { const a2 = a.slice(); idx.forEach((i, j) => { a2[i] = k[j] instanceof Dizi ? k[j].al(r, c) : k[j]; }); return fn(a2, b); })));
  };
}
const ciftIdx = bas => n => { const o = []; for (let i = bas + 1; i < n; i += 2) o.push(i); return o; };
tanim('COUNTIF', olcutYay((a, b) => kosulSay(a, b), () => [1]));
tanim('COUNTIFS', olcutYay((a, b) => kosulSay(a, b), ciftIdx(0)));
function kosulTopla(degerler, m, tur) {
  const x = [];
  for (let r = 0; r < m.R; r++) for (let c = 0; c < m.C; c++) if (m.test(r, c)) { const v = degerler.v[r] ? degerler.v[r][c] : null; if (hataMi(v)) return v; if (typeof v === 'number') x.push(v); }
  if (tur === 'sum') return x.reduce((t, v) => t + v, 0);
  if (tur === 'avg') return x.length ? x.reduce((t, v) => t + v, 0) / x.length : H.BOL0;
  if (tur === 'max') return x.length ? Math.max(...x) : 0;
  return x.length ? Math.min(...x) : 0;
}
function boyutUydur(d, R, C, bag, x) {
  // ETOPLA'da toplam aralığı ölçüt aralığıyla aynı boyda değilse Excel sol üst köşeden aynı boyda alır
  if (x instanceof Bas && (x.satir !== R || x.sutun !== C)) return coz(new Bas(x.sayfa, x.r1, x.c1, x.r1 + R - 1, x.c1 + C - 1), bag);
  return d;
}
tanim('SUMIF', olcutYay((a, b) => { const m = kosulDizileri([a[0], a[1]], b, 0); if (hataMi(m)) return m; const t = a[2] != null && a[2] !== undefined ? boyutUydur(diziyeCevir(a[2], b), m.R, m.C, b, a[2]) : diziyeCevir(a[0], b); return kosulTopla(t instanceof Dizi ? t : new Dizi([[t]]), m, 'sum'); }, () => [1]));
tanim('AVERAGEIF', olcutYay((a, b) => { const m = kosulDizileri([a[0], a[1]], b, 0); if (hataMi(m)) return m; const t = a[2] != null ? boyutUydur(diziyeCevir(a[2], b), m.R, m.C, b, a[2]) : diziyeCevir(a[0], b); return kosulTopla(t instanceof Dizi ? t : new Dizi([[t]]), m, 'avg'); }, () => [1]));
const cokKosul = tur => olcutYay((a, b) => { const m = kosulDizileri(a, b, 1); if (hataMi(m)) return m; const t = diziyeCevir(a[0], b); if (t.satir !== m.R || t.sutun !== m.C) return H.DEGER; return kosulTopla(t, m, tur); }, ciftIdx(1));
tanim('SUMIFS', cokKosul('sum')); tanim('AVERAGEIFS', cokKosul('avg')); tanim('MAXIFS', cokKosul('max')); tanim('MINIFS', cokKosul('min'));

/* ---------------------------------------------------------------- arama */
function esitMi(aranan, v, joker) {
  if (typeof aranan === 'string' && typeof v === 'string') return joker && /[*?]/.test(aranan) ? jokerRe(trK(aranan)).test(trK(v)) : trK(aranan) === trK(v);
  return typeof aranan === typeof v && karsilastir(aranan, v) === 0;
}
function bul(aranan, liste, tur) {
  // tur 0 tam (joker), 1 ≤ en büyük (sıralı varsayılır), -1 ≥ en küçük
  if (tur === 0) { for (let i = 0; i < liste.length; i++) if (esitMi(aranan, liste[i], true)) return i; return -1; }
  // Excel ikili arama yapar; sıralı listede sonuç aynıdır. Doğrusal: aynı türde, koşulu sağlayan son/ilk.
  let en = -1;
  for (let i = 0; i < liste.length; i++) {
    const v = liste[i]; if (v == null || typeof v !== typeof aranan) continue;
    const c = karsilastir(v, aranan);
    if (tur === 1) { if (c <= 0) en = i; else break; }
    else { if (c >= 0) en = i; else break; }
  }
  return en;
}
tanim('VLOOKUP', yay((a, bag) => {
  const [aranan, tablo, sutun, yaklasik] = a;
  if (hataMi(aranan)) return aranan;
  const t = tablo instanceof Dizi ? tablo : new Dizi([[tablo]]), c = N(sutun);
  if (hataMi(c)) return c; if (c < 1) return H.DEGER; if (c > t.sutun) return H.BASV;
  const yak = yaklasik == null ? true : mantiga(yaklasik);
  const i = bul(aranan, t.v.map(s => s[0]), yak ? 1 : 0);
  return i < 0 ? H.NA : (t.v[i][Math.trunc(c) - 1] ?? 0);
}, [0, 2, 3]));
tanim('HLOOKUP', yay((a) => {
  const [aranan, tablo, satir, yaklasik] = a;
  const t = tablo instanceof Dizi ? tablo : new Dizi([[tablo]]), r = N(satir);
  if (hataMi(r)) return r; if (r < 1) return H.DEGER; if (r > t.satir) return H.BASV;
  const yak = yaklasik == null ? true : mantiga(yaklasik);
  const i = bul(aranan, t.v[0], yak ? 1 : 0);
  return i < 0 ? H.NA : (t.v[Math.trunc(r) - 1][i] ?? 0);
}, [0, 2, 3]));
tanim('MATCH', yay((a) => {
  const [aranan, liste, tur] = a;
  const d = liste instanceof Dizi ? liste : new Dizi([[liste]]);
  if (d.satir > 1 && d.sutun > 1) return H.NA;
  const t = tur == null ? 1 : Math.sign(N(tur));
  const i = bul(aranan, tumHucreler(d), t);
  return i < 0 ? H.NA : i + 1;
}, [0, 2]));
tanim('INDEX', (a, bag) => {
  const d = diziyeCevir(a[0], bag);
  let r = a[1] == null ? 0 : N(deger(a[1], bag)), c = a[2] == null ? 0 : N(deger(a[2], bag));
  if (hataMi(r)) return r; if (hataMi(c)) return c;
  r = Math.trunc(r); c = Math.trunc(c);
  if (d.satir === 1 && a[2] == null) { c = r; r = 1; }
  if (r < 0 || c < 0 || r > d.satir || c > d.sutun) return H.BASV;
  if (r === 0 && c === 0) return d;
  if (r === 0) return new Dizi(d.v.map(s => [s[c - 1]]));
  if (c === 0) { if (d.sutun === 1) return d.v[r - 1][0]; return new Dizi([d.v[r - 1]]); }
  const v = d.v[r - 1][c - 1];
  return v == null ? 0 : v;
});
tanim('XLOOKUP', (a, bag) => {
  const ara = deger(a[0], bag), L = diziyeCevir(a[1], bag), D = diziyeCevir(a[2], bag);
  const yok = a[3] != null ? deger(a[3], bag) : H.NA;
  const mod = a[4] != null ? N(deger(a[4], bag)) : 0, yon = a[5] != null ? N(deger(a[5], bag)) : 1;
  const dikey = L.sutun === 1;
  if (!dikey && L.satir !== 1) return H.DEGER;
  const liste = dikey ? L.v.map(s => s[0]) : L.v[0];
  if ((dikey ? D.satir : D.sutun) !== liste.length) return H.DEGER;
  const tek = aranan => {
    if (hataMi(aranan)) return aranan;
    const sira = [...liste.keys()]; if (yon < 0) sira.reverse();
    let en = -1;
    for (const i of sira) {
      const v = liste[i];
      if (mod === 2 ? esitMi(aranan, v, true) : esitMi(aranan, v, false)) { en = i; break; }
      if ((mod === -1 || mod === 1) && v != null && typeof v === typeof aranan) {
        const c = karsilastir(v, aranan);
        if (mod === -1 && c < 0 && (en < 0 || karsilastir(v, liste[en]) > 0)) en = i;
        if (mod === 1 && c > 0 && (en < 0 || karsilastir(v, liste[en]) < 0)) en = i;
      }
    }
    if (en < 0) return yok;
    return dikey ? (D.sutun === 1 ? (D.v[en][0] ?? 0) : new Dizi([D.v[en].map(x => x ?? 0)])) : (D.satir === 1 ? (D.v[0][en] ?? 0) : new Dizi(D.v.map(s => [s[en] ?? 0])));
  };
  if (ara instanceof Dizi) return new Dizi(ara.v.map(s => s.map(x => { const v = tek(x); return v instanceof Dizi ? v.al(0, 0) : v; })));
  return tek(ara);
});
tanim('XMATCH', (a, bag) => {
  const ara = deger(a[0], bag), L = diziyeCevir(a[1], bag), mod = a[2] != null ? N(deger(a[2], bag)) : 0, yon = a[3] != null ? N(deger(a[3], bag)) : 1;
  const liste = tumHucreler(L), sira = [...liste.keys()]; if (yon < 0) sira.reverse();
  let en = -1;
  for (const i of sira) {
    const v = liste[i];
    if (mod === 2 ? esitMi(ara, v, true) : esitMi(ara, v, false)) { en = i; break; }
    if ((mod === -1 || mod === 1) && v != null && typeof v === typeof ara) { const c = karsilastir(v, ara); if (mod === -1 && c < 0 && (en < 0 || karsilastir(v, liste[en]) > 0)) en = i; if (mod === 1 && c > 0 && (en < 0 || karsilastir(v, liste[en]) < 0)) en = i; }
  }
  return en < 0 ? H.NA : en + 1;
});
tanim('CHOOSE', (args, bag) => { const i = N(deger(degerlendir(args[0], bag), bag)); if (hataMi(i)) return i; const k = Math.trunc(i); if (k < 1 || k >= args.length) return H.DEGER; return degerlendir(args[k], bag); }, { tembel: true });
tanim('ROW', (args, bag) => { if (!args.length || args[0].t === 'bos') return bag.satir; const v = degerlendir(args[0], bag); if (!(v instanceof Bas)) return H.DEGER; return v.satir === 1 ? v.r1 : new Dizi(Array.from({ length: v.satir }, (_, i) => [v.r1 + i])); }, { tembel: true });
tanim('COLUMN', (args, bag) => { if (!args.length || args[0].t === 'bos') return bag.sutun; const v = degerlendir(args[0], bag); if (!(v instanceof Bas)) return H.DEGER; return v.sutun === 1 ? v.c1 : new Dizi([Array.from({ length: v.sutun }, (_, i) => v.c1 + i)]); }, { tembel: true });
tanim('ROWS', (a, b) => { const v = a[0] instanceof Bas ? a[0] : diziyeCevir(a[0], b); return v.satir; });
tanim('COLUMNS', (a, b) => { const v = a[0] instanceof Bas ? a[0] : diziyeCevir(a[0], b); return v.sutun; });

/* ---------------------------------------------------------------- metin */
const metinArg = v => { if (hataMi(v)) return v; return T(v); };
tanim('LEFT', yay(([s, n]) => { const t = metinArg(s), k = n == null ? 1 : N(n); const e = ilkHata(t, k); if (e) return e; if (k < 0) return H.DEGER; return [...t].slice(0, Math.trunc(k)).join(''); }));
tanim('RIGHT', yay(([s, n]) => { const t = metinArg(s), k = n == null ? 1 : N(n); const e = ilkHata(t, k); if (e) return e; if (k < 0) return H.DEGER; const a = [...t]; return Math.trunc(k) === 0 ? '' : a.slice(-Math.trunc(k)).join(''); }));
tanim('MID', yay(([s, b, n]) => { const t = metinArg(s), i = N(b), k = N(n); const e = ilkHata(t, i, k); if (e) return e; if (i < 1 || k < 0) return H.DEGER; return [...t].slice(Math.trunc(i) - 1, Math.trunc(i) - 1 + Math.trunc(k)).join(''); }));
tanim('LEN', yay(([s]) => { const t = metinArg(s); return hataMi(t) ? t : [...t].length; }));
const bulIslev = harfDuyarli => yay(([aranan, icinde, bas]) => {
  const a = metinArg(aranan), t = metinArg(icinde), i = bas == null ? 1 : N(bas); const e = ilkHata(a, t, i); if (e) return e;
  if (i < 1 || i > [...t].length + 1) return H.DEGER;
  let p;
  if (harfDuyarli) p = t.indexOf(a, Math.trunc(i) - 1);
  else { const re = /[*?]/.test(a) ? new RegExp(String(a).replace(/~([*?~])|([*?])|([.+^${}()|[\]\\])/g, (m, k, j, o) => k ? '\\' + k : j === '*' ? '[\\s\\S]*?' : j === '?' ? '[\\s\\S]' : '\\' + o), 'i') : null; const tt = trK(t).slice(Math.trunc(i) - 1); if (re) { const m = re.exec(tt); p = m ? m.index + Math.trunc(i) - 1 : -1; } else { const q = tt.indexOf(trK(a)); p = q < 0 ? -1 : q + Math.trunc(i) - 1; } }
  return p < 0 ? H.DEGER : p + 1;
});
tanim('FIND', bulIslev(true)); tanim('SEARCH', bulIslev(false));
tanim('TRIM', yay(([s]) => { const t = metinArg(s); return hataMi(t) ? t : t.replace(/ +/g, ' ').replace(/^ | $/g, ''); }));
tanim('CLEAN', yay(([s]) => { const t = metinArg(s); return hataMi(t) ? t : t.replace(/[\x00-\x1f]/g, ''); }));
tanim('UPPER', yay(([s]) => { const t = metinArg(s); return hataMi(t) ? t : trB(t); }));
tanim('LOWER', yay(([s]) => { const t = metinArg(s); return hataMi(t) ? t : trK(t); }));
tanim('PROPER', yay(([s]) => { const t = metinArg(s); return hataMi(t) ? t : trK(t).replace(/(^|[^A-Za-zÇĞİÖŞÜçğıöşü])([a-zçğıöşü])/g, (m, o, h) => o + h.toLocaleUpperCase('tr')); }));
tanim('SUBSTITUTE', yay(([s, eski, yeni, kac]) => {
  const t = metinArg(s), e1 = metinArg(eski), y = metinArg(yeni); const e = ilkHata(t, e1, y); if (e) return e;
  if (e1 === '') return t;
  if (kac == null) return t.split(e1).join(y);
  const n = Math.trunc(N(kac)); if (hataMi(n) || n < 1) return H.DEGER;
  let i = -1; for (let k = 0; k < n; k++) { i = t.indexOf(e1, i + 1); if (i < 0) return t; }
  return t.slice(0, i) + y + t.slice(i + e1.length);
}));
tanim('REPLACE', yay(([s, b, n, y]) => { const t = metinArg(s), i = N(b), k = N(n), yy = metinArg(y); const e = ilkHata(t, i, k, yy); if (e) return e; if (i < 1 || k < 0) return H.DEGER; const a = [...t]; return a.slice(0, i - 1).join('') + yy + a.slice(i - 1 + k).join(''); }));
tanim('REPT', yay(([s, n]) => { const t = metinArg(s), k = N(n); const e = ilkHata(t, k); if (e) return e; if (k < 0 || t.length * k > 32767) return H.DEGER; return t.repeat(Math.trunc(k)); }));
tanim('CONCATENATE', yay(a => { let o = ''; for (const v of a) { const t = metinArg(v); if (hataMi(t)) return t; o += t; } return o; }));
tanim('CONCAT', (a, b) => { let o = ''; for (const x of a) { const v = deger(x, b); for (const y of v instanceof Dizi ? tumHucreler(v) : [v]) { const t = metinArg(y); if (hataMi(t)) return t; o += t; } } return o; });
tanim('TEXTJOIN', (a, b) => {
  const ay = metinArg(deger(a[0], b)), atla = mantiga(deger(a[1], b)); const e = ilkHata(ay, atla); if (e) return e;
  const p = [];
  for (const x of a.slice(2)) { const v = deger(x, b); for (const y of v instanceof Dizi ? tumHucreler(v) : [v]) { if (hataMi(y)) return y; const t = metne(y); if (atla && t === '') continue; p.push(t); } }
  const s = p.join(ay); return s.length > 32767 ? H.DEGER : s;
});
tanim('TEXT', yay(([v, k]) => { if (hataMi(v)) return v; const kod = metinArg(k); if (hataMi(kod)) return kod; let x = v; if (typeof x === 'string') { const n = sayiMetin(x); if (n == null) return x; x = n; } if (x == null) x = 0; if (typeof x === 'boolean') return x ? 'DOĞRU' : 'YANLIŞ'; return bicimle(x, kod); }));
tanim('VALUE', yay(([v]) => { if (hataMi(v)) return v; if (typeof v === 'number') return v; if (v == null) return 0; const n = sayiMetin(String(v)); return n == null ? H.DEGER : n; }));
tanim('NUMBERVALUE', yay(([v, o, g]) => {
  if (hataMi(v)) return v; if (typeof v === 'number') return v;
  const od = o == null ? ',' : T(o)[0], gr = g == null ? '.' : T(g)[0];
  let s = String(v ?? '').replace(/\s/g, ''); if (s === '') return 0;
  const yuz = (s.match(/%/g) || []).length; s = s.replace(/%/g, '');
  s = s.split(gr).join(''); s = s.replace(od, '.');
  if (!/^[+-]?\d*\.?\d+(e[+-]?\d+)?$/i.test(s)) return H.DEGER;
  return Number(s) / Math.pow(100, yuz);
}));
tanim('EXACT', yay(([a, b]) => { const x = metinArg(a), y = metinArg(b); const e = ilkHata(x, y); return e || x === y; }));
tanim('CHAR', yay(([n]) => { const k = N(n); if (hataMi(k)) return k; if (k < 1 || k > 255) return H.DEGER; return String.fromCharCode(Math.trunc(k)); }));
tanim('CODE', yay(([s]) => { const t = metinArg(s); if (hataMi(t)) return t; return t === '' ? H.DEGER : t.charCodeAt(0); }));
function oncesiSonrasi(sonra) {
  return yay(([s, ay, kac, mod, son, yok]) => {
    const t = metinArg(s), a = metinArg(ay); const e = ilkHata(t, a); if (e) return e;
    let n = kac == null ? 1 : Math.trunc(N(kac)); if (hataMi(n) || n === 0) return H.DEGER;
    const duyarsiz = mod != null && N(mod) === 1, tt = duyarsiz ? trK(t) : t, aa = duyarsiz ? trK(a) : a;
    const konumlar = []; if (aa === '') { konumlar.push(n > 0 ? 0 : t.length); }
    else { let i = tt.indexOf(aa); while (i >= 0) { konumlar.push(i); i = tt.indexOf(aa, i + aa.length); } }
    if (son != null && N(son)) { if (n > 0) konumlar.push(t.length); else konumlar.unshift(-aa.length); }
    const k = n > 0 ? konumlar[n - 1] : konumlar[konumlar.length + n];
    if (k == null) return yok != null ? yok : H.NA;
    return sonra ? t.slice(k + aa.length) : t.slice(0, k);
  });
}
tanim('TEXTBEFORE', oncesiSonrasi(false)); tanim('TEXTAFTER', oncesiSonrasi(true));
tanim('TEXTSPLIT', (a, b) => {
  const t = metinArg(deger(a[0], b)); if (hataMi(t)) return t;
  const sut = a[1] != null ? metinArg(deger(a[1], b)) : null, sat = a[2] != null ? metinArg(deger(a[2], b)) : null, atla = a[3] != null && mantiga(deger(a[3], b)) === true;
  const satirlar = sat ? t.split(sat) : [t];
  let v = satirlar.map(s => (sut ? s.split(sut) : [s]));
  if (atla) v = v.map(s => s.filter(x => x !== '')).filter(s => s.length);
  const C = Math.max(...v.map(s => s.length));
  return new Dizi(v.map(s => Array.from({ length: C }, (_, i) => i < s.length ? s[i] : H.NA)));
});

/* ---------------------------------------------------------------- tarih ve saat */
const tarihArg = v => { if (hataMi(v)) return v; if (v == null) return 0; if (typeof v === 'number') return v; if (typeof v === 'boolean') return H.DEGER; const d = metindenTarih(v); if (d != null) return d; const n = sayiMetin(v); return n == null ? H.DEGER : n; };
tanim('DATE', yay(([y, m, d]) => { const a = N(y), b = N(m), c = N(d); const e = ilkHata(a, b, c); if (e) return e; if (a < 0 || a > 9999) return H.SAYI; const s = seriden(Math.trunc(a), Math.trunc(b), Math.trunc(c)); return s < 0 ? H.SAYI : s; }));
const parca = alan => yay(([v]) => { const s = tarihArg(v); if (hataMi(s)) return s; if (s < 0) return H.SAYI; return seriye(s)[alan]; });
tanim('YEAR', parca('y')); tanim('MONTH', parca('m')); tanim('DAY', parca('d'));
tanim('HOUR', parca('saat')); tanim('MINUTE', parca('dakika')); tanim('SECOND', parca('saniye'));
tanim('TODAY', (a, b) => Math.floor(b.bugun ?? bugunSeri()));
tanim('NOW', (a, b) => b.bugun ?? bugunSeri(true));
function bugunSeri(saatli) { const d = new Date(); return seriden(d.getFullYear(), d.getMonth() + 1, d.getDate()) + (saatli ? zaman(d.getHours(), d.getMinutes(), d.getSeconds()) : 0); }
tanim('TIME', yay(([h, m, s]) => { const a = N(h), b = N(m), c = N(s); const e = ilkHata(a, b, c); if (e) return e; const t = Math.trunc(a) * 3600 + Math.trunc(b) * 60 + Math.trunc(c); if (t < 0) return H.SAYI; return (t % 86400) / 86400; }));
tanim('WEEKDAY', yay(([v, t]) => {
  const s = tarihArg(v), k = t == null ? 1 : N(t); const e = ilkHata(s, k); if (e) return e;
  const g = seriye(s).gs; // 0 = Pazar
  switch (Math.trunc(k)) { case 1: case 17: return g + 1; case 2: case 11: return ((g + 6) % 7) + 1; case 3: return (g + 6) % 7;
    case 12: return ((g + 5) % 7) + 1; case 13: return ((g + 4) % 7) + 1; case 14: return ((g + 3) % 7) + 1; case 15: return ((g + 2) % 7) + 1; case 16: return ((g + 1) % 7) + 1; }
  return H.SAYI;
}));
function isoHafta(s) { const t = seriye(s); const d = new Date(Date.UTC(t.y, t.m - 1, t.d)); const gun = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - gun + 3); const ilk = new Date(Date.UTC(d.getUTCFullYear(), 0, 4)); return 1 + Math.round(((d - ilk) / 86400000 - 3 + ((ilk.getUTCDay() + 6) % 7)) / 7); }
tanim('ISOWEEKNUM', yay(([v]) => { const s = tarihArg(v); return hataMi(s) ? s : isoHafta(s); }));
tanim('WEEKNUM', yay(([v, t]) => {
  const s = tarihArg(v), k = t == null ? 1 : Math.trunc(N(t)); const e = ilkHata(s, k); if (e) return e;
  if (k === 21) return isoHafta(s);
  const bas = { 1: 0, 17: 0, 2: 1, 11: 1, 12: 2, 13: 3, 14: 4, 15: 5, 16: 6 }[k]; if (bas == null) return H.SAYI;
  const y = seriye(s).y, ocak1 = seriden(y, 1, 1), g1 = seriye(ocak1).gs;
  const kay = (g1 - bas + 7) % 7;
  return Math.floor((s - ocak1 + kay) / 7) + 1;
}));
tanim('EDATE', yay(([v, m]) => { const s = tarihArg(v), k = N(m); const e = ilkHata(s, k); if (e) return e; const t = seriye(s); const ay = t.m + Math.trunc(k), y = t.y + Math.floor((ay - 1) / 12), mm = ((ay - 1) % 12 + 12) % 12 + 1; return seriden(y, mm, Math.min(t.d, ayinSonGunu(y, mm))); }));
tanim('EOMONTH', yay(([v, m]) => { const s = tarihArg(v), k = N(m); const e = ilkHata(s, k); if (e) return e; const t = seriye(s); const ay = t.m + Math.trunc(k), y = t.y + Math.floor((ay - 1) / 12), mm = ((ay - 1) % 12 + 12) % 12 + 1; return seriden(y, mm, ayinSonGunu(y, mm)); }));
function tatilKumesi(x, bag) { if (x == null) return new Set(); const v = deger(x, bag); const xs = v instanceof Dizi ? tumHucreler(v) : [v]; const o = new Set(); for (const y of xs) { if (y == null) continue; const s = tarihArg(y); if (hataMi(s)) return s; o.add(Math.floor(s)); } return o; }
function haftaSonu(k) {
  // WORKDAY.INTL hafta sonu kodu: 1 = Cmt-Paz … 11 = yalnız Pazar; ya da "0000011" (Pzt…Paz, 1 = tatil)
  if (k == null) return [false, false, false, false, false, true, true];
  if (typeof k === 'string') { if (!/^[01]{7}$/.test(k) || k === '1111111') return null; return [...k].map(x => x === '1'); }
  const n = Math.trunc(k), m = { 1: [5, 6], 2: [6, 0], 3: [0, 1], 4: [1, 2], 5: [2, 3], 6: [3, 4], 7: [4, 5], 11: [6], 12: [0], 13: [1], 14: [2], 15: [3], 16: [4], 17: [5] }[n];
  if (!m) return null;
  const o = [false, false, false, false, false, false, false]; for (const i of m) o[i] = true; return o; // 0 = Pazartesi
}
const isGunuMu = (s, hs, tatil) => !hs[(seriye(s).gs + 6) % 7] && !tatil.has(s);
function isgunu(bas, gun, hs, tatil) {
  let s = Math.floor(bas), k = Math.trunc(gun); const adim = k >= 0 ? 1 : -1;
  while (k !== 0) { s += adim; if (isGunuMu(s, hs, tatil)) k -= adim; }
  return s;
}
tanim('WORKDAY', (a, b) => { const s = tarihArg(deger(a[0], b)), g = N(deger(a[1], b)); const e = ilkHata(s, g); if (e) return e; const t = tatilKumesi(a[2], b); if (hataMi(t)) return t; return isgunu(s, g, haftaSonu(null), t); });
tanim('WORKDAY.INTL', (a, b) => { const s = tarihArg(deger(a[0], b)), g = N(deger(a[1], b)); const e = ilkHata(s, g); if (e) return e; const hs = haftaSonu(a[2] == null ? null : deger(a[2], b)); if (!hs) return H.SAYI; const t = tatilKumesi(a[3], b); if (hataMi(t)) return t; return isgunu(s, g, hs, t); });
function tamIsgunu(bas, son, hs, tatil) { let a = Math.floor(bas), z = Math.floor(son), isaret = 1; if (z < a) { [a, z] = [z, a]; isaret = -1; } let n = 0; for (let s = a; s <= z; s++) if (isGunuMu(s, hs, tatil)) n++; return n * isaret; }
tanim('NETWORKDAYS', (a, b) => { const s = tarihArg(deger(a[0], b)), z = tarihArg(deger(a[1], b)); const e = ilkHata(s, z); if (e) return e; const t = tatilKumesi(a[2], b); if (hataMi(t)) return t; return tamIsgunu(s, z, haftaSonu(null), t); });
tanim('NETWORKDAYS.INTL', (a, b) => { const s = tarihArg(deger(a[0], b)), z = tarihArg(deger(a[1], b)); const e = ilkHata(s, z); if (e) return e; const hs = haftaSonu(a[2] == null ? null : deger(a[2], b)); if (!hs) return H.SAYI; const t = tatilKumesi(a[3], b); if (hataMi(t)) return t; return tamIsgunu(s, z, hs, t); });
tanim('DATEDIF', yay(([v1, v2, b]) => {
  const s = tarihArg(v1), z = tarihArg(v2), birim = metinArg(b); const e = ilkHata(s, z, birim); if (e) return e;
  if (z < s) return H.SAYI;
  const x = seriye(s), y = seriye(z), u = trB(birim);
  let ay = (y.y - x.y) * 12 + (y.m - x.m); if (y.d < x.d) ay--;
  switch (u) {
    case 'D': case 'G': return Math.floor(z) - Math.floor(s);
    case 'M': case 'A': return ay;
    case 'Y': return Math.floor(ay / 12);
    case 'YM': return ay % 12;
    case 'YD': { let yy = y.y; let a2 = seriden(yy, x.m, Math.min(x.d, ayinSonGunu(yy, x.m))); if (a2 > Math.floor(z)) a2 = seriden(yy - 1, x.m, Math.min(x.d, ayinSonGunu(yy - 1, x.m))); return Math.floor(z) - a2; }
    case 'MD': { if (y.d >= x.d) return y.d - x.d; const onceki = y.m === 1 ? [y.y - 1, 12] : [y.y, y.m - 1]; return ayinSonGunu(onceki[0], onceki[1]) - x.d + y.d; }
  }
  return H.SAYI;
}));
tanim('DATEVALUE', yay(([v]) => { if (typeof v !== 'string') return hataMi(v) ? v : H.DEGER; const d = metindenTarih(v); return d == null ? H.DEGER : Math.floor(d); }));
tanim('DAYS', yay(([z, s]) => { const a = tarihArg(z), b = tarihArg(s); const e = ilkHata(a, b); return e || Math.floor(a) - Math.floor(b); }));

/* ---------------------------------------------------------------- dinamik diziler */
tanim('FILTER', (a, b) => {
  const d = diziyeCevir(a[0], b), k = diziyeCevir(a[1], b);
  const dikey = k.sutun === 1 && k.satir === d.satir, yatay = k.satir === 1 && k.sutun === d.sutun;
  if (!dikey && !yatay) return H.DEGER;
  const sec = []; const kk = dikey ? k.v.map(s => s[0]) : k.v[0];
  for (let i = 0; i < kk.length; i++) { const m = mantiga(kk[i]); if (hataMi(m)) return m; if (m) sec.push(i); }
  if (!sec.length) return a[2] != null ? deger(a[2], b) : H.HESAP;
  return dikey ? new Dizi(sec.map(i => d.v[i].map(x => x ?? 0))) : new Dizi(d.v.map(s => sec.map(i => s[i] ?? 0)));
});
const anahtar = s => s.map(v => v == null ? '' : typeof v === 'string' ? 's' + trK(v) : typeof v + String(v)).join('\u0001');
tanim('UNIQUE', (a, b) => {
  const d = diziyeCevir(a[0], b), sutunla = a[1] != null && mantiga(deger(a[1], b)) === true, birKez = a[2] != null && mantiga(deger(a[2], b)) === true;
  const birimler = sutunla ? d.v[0].map((_, c) => d.v.map(s => s[c])) : d.v;
  const say = new Map(), sira = [];
  for (const u of birimler) { const k = anahtar(u); if (!say.has(k)) { say.set(k, 0); sira.push([k, u]); } say.set(k, say.get(k) + 1); }
  const sec = sira.filter(([k]) => !birKez || say.get(k) === 1).map(([, u]) => u.map(x => x ?? 0));
  if (!sec.length) return H.HESAP;
  return sutunla ? new Dizi(sec[0].map((_, r) => sec.map(u => u[r]))) : new Dizi(sec);
});
function siralaKarsilastir(x, y) { if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1; return karsilastir(x, y); }
tanim('SORT', (a, b) => {
  const d = diziyeCevir(a[0], b), i = a[1] != null ? Math.trunc(N(deger(a[1], b))) : 1, yon = a[2] != null ? N(deger(a[2], b)) : 1, sut = a[3] != null && mantiga(deger(a[3], b)) === true;
  if (hataMi(i) || hataMi(yon)) return H.DEGER;
  if (sut) { if (i < 1 || i > d.satir) return H.DEGER; const cols = d.v[0].map((_, c) => c).sort((p, q) => siralaKarsilastir(d.v[i - 1][p], d.v[i - 1][q]) * (yon < 0 ? -1 : 1) || p - q); return new Dizi(d.v.map(s => cols.map(c => s[c] ?? 0))); }
  if (i < 1 || i > d.sutun) return H.DEGER;
  const rows = d.v.map((s, r) => [s, r]).sort((p, q) => siralaKarsilastir(p[0][i - 1], q[0][i - 1]) * (yon < 0 ? -1 : 1) || p[1] - q[1]);
  return new Dizi(rows.map(([s]) => s.map(x => x ?? 0)));
});
tanim('SORTBY', (a, b) => {
  const d = diziyeCevir(a[0], b), olc = [];
  for (let k = 1; k < a.length; k += 2) { const by = diziyeCevir(a[k], b), yon = a[k + 1] != null ? N(deger(a[k + 1], b)) : 1; if (by.satir !== d.satir || by.sutun !== 1) return H.DEGER; olc.push([by.v.map(s => s[0]), yon < 0 ? -1 : 1]); }
  const rows = d.v.map((s, r) => r).sort((p, q) => { for (const [v, y] of olc) { const c = siralaKarsilastir(v[p], v[q]) * y; if (c) return c; } return p - q; });
  return new Dizi(rows.map(r => d.v[r].map(x => x ?? 0)));
});
tanim('SEQUENCE', (a, b) => {
  const r = Math.trunc(N(deger(a[0], b))), c = a[1] != null && a[1] !== undefined ? Math.trunc(N(deger(a[1], b)) || 1) : 1, s = a[2] != null ? N(deger(a[2], b)) : 1, st = a[3] != null ? N(deger(a[3], b)) : 1;
  if ([r, c, s, st].some(hataMi)) return H.DEGER;
  if (r < 1 || c < 1) return H.HESAP; if (r * c > SINIR.hucreDizi) return H.SAYI;
  return new Dizi(Array.from({ length: r }, (_, i) => Array.from({ length: c }, (_, j) => s + (i * c + j) * st)));
});
tanim('LET', (args, bag) => {
  if (args.length < 3 || args.length % 2 === 0) return H.DEGER;
  const onceki = bag.degisken, yeni = new Map(onceki || []);
  bag.degisken = yeni;
  try {
    for (let i = 0; i + 1 < args.length; i += 2) {
      if (args[i].t !== 'ad') return H.DEGER;
      yeni.set(trB(args[i].v), deger(degerlendir(args[i + 1], bag), bag));
    }
    return degerlendir(args[args.length - 1], bag);
  } finally { bag.degisken = onceki; }
}, { tembel: true });
tanim('TAKE', (a, b) => { const d = diziyeCevir(a[0], b); let r = a[1] != null ? Math.trunc(N(deger(a[1], b))) : d.satir, c = a[2] != null ? Math.trunc(N(deger(a[2], b))) : d.sutun; if (!r || !c) return H.HESAP; const rs = r > 0 ? d.v.slice(0, r) : d.v.slice(r); return new Dizi(rs.map(s => c > 0 ? s.slice(0, c) : s.slice(c))); });
tanim('DROP', (a, b) => { const d = diziyeCevir(a[0], b); const r = a[1] != null ? Math.trunc(N(deger(a[1], b))) : 0, c = a[2] != null ? Math.trunc(N(deger(a[2], b))) : 0; const rs = r >= 0 ? d.v.slice(r) : d.v.slice(0, r); const v = rs.map(s => c >= 0 ? s.slice(c) : s.slice(0, c)); return v.length && v[0].length ? new Dizi(v) : H.HESAP; });
tanim('VSTACK', (a, b) => { const ds = a.map(x => diziyeCevir(x, b)), C = Math.max(...ds.map(d => d.sutun)); return new Dizi(ds.flatMap(d => d.v.map(s => Array.from({ length: C }, (_, i) => i < s.length ? (s[i] ?? 0) : H.NA)))); });
tanim('HSTACK', (a, b) => { const ds = a.map(x => diziyeCevir(x, b)), R = Math.max(...ds.map(d => d.satir)); return new Dizi(Array.from({ length: R }, (_, r) => ds.flatMap(d => r < d.satir ? d.v[r].map(x => x ?? 0) : Array(d.sutun).fill(H.NA)))); });
tanim('CHOOSECOLS', (a, b) => { const d = diziyeCevir(a[0], b), cs = a.slice(1).map(x => Math.trunc(N(deger(x, b)))); if (cs.some(c => hataMi(c) || c === 0 || Math.abs(c) > d.sutun)) return H.DEGER; return new Dizi(d.v.map(s => cs.map(c => s[c > 0 ? c - 1 : d.sutun + c] ?? 0))); });
tanim('CHOOSEROWS', (a, b) => { const d = diziyeCevir(a[0], b), rs = a.slice(1).map(x => Math.trunc(N(deger(x, b)))); if (rs.some(r => hataMi(r) || r === 0 || Math.abs(r) > d.satir)) return H.DEGER; return new Dizi(rs.map(r => d.v[r > 0 ? r - 1 : d.satir + r].map(x => x ?? 0))); });

/* ---------------------------------------------------------------- başvuru üreten işlevler: DOLAYLI, KAYDIR, ADRES */
// DOLAYLI metni başvuruya çevirir: "B5", "Ürünler!B2:B41", "'Müşteri ham'!A1", ad ya da tablo başvurusu. Uçucudur: Excel her hesapta yeniden hesaplar.
tanim('INDIRECT', (a, bag) => {
  const m = deger(a[0], bag); if (hataMi(m)) return m;
  if (a[1] != null && a[1] !== undefined) { const st = mantiga(deger(a[1], bag)); if (st === false) return H.BASV; }
  const metin = String(m ?? '').trim(); if (!metin) return H.BASV;
  let agac; try { agac = ayristirBasvuru(metin); } catch { return H.BASV; }
  if (!agac || !['ref', 'ad', 'tref'].includes(agac.t)) return H.BASV;
  const v = degerlendir(agac, bag);
  return v instanceof Bas ? v : H.BASV;
}, { ucucu: true });
let ayristirBasvuru = () => null;
let pivotKanca = null;
export function pivotKancaKur(fn) { pivotKanca = fn; }
// ÖZETVERİAL: kitaptaki özet tablodan bir değer çeker (pivot.js kancayı kurar)
tanim('GETPIVOTDATA', (args, bag) => {
  const v = deger(degerlendir(args[0], bag), bag), b = degerlendir(args[1], bag);
  if (!(b instanceof Bas)) return H.BASV;
  if (!pivotKanca) return H.BASV;
  const ciftler = args.slice(2).map(x => deger(degerlendir(x, bag), bag));
  return pivotKanca(bag.kitap, v, b, ciftler);
}, { tembel: true });
export function basvuruAyristiriciKur(fn) { ayristirBasvuru = fn; }
// KAYDIR(başvuru; satır; sütun; [yükseklik]; [genişlik]): başvuru döndürür, grafik ve özetlerde "kayan pencere" için
tanim('OFFSET', (args, bag) => {
  const b = degerlendir(args[0], bag); if (!(b instanceof Bas)) return hataMi(b) ? b : H.DEGER;
  const n = i => args[i] && args[i].t !== 'bos' ? sayiya(deger(degerlendir(args[i], bag), bag)) : null;
  const dr = n(1), dc = n(2), y = n(3), g = n(4);
  for (const x of [dr, dc, y, g]) if (hataMi(x)) return x;
  const yuk = y == null ? b.satir : Math.trunc(y), gen = g == null ? b.sutun : Math.trunc(g);
  if (!yuk || !gen) return H.BASV;
  const r1 = b.r1 + Math.trunc(dr || 0), c1 = b.c1 + Math.trunc(dc || 0);
  const r2 = r1 + yuk + (yuk > 0 ? -1 : 1), c2 = c1 + gen + (gen > 0 ? -1 : 1);
  if (Math.min(r1, r2) < 1 || Math.min(c1, c2) < 1 || Math.max(r1, r2) > 1048576 || Math.max(c1, c2) > 16384) return H.BASV;
  return new Bas(b.sayfa, r1, c1, r2, c2);
}, { tembel: true, ucucu: true });
tanim('ADDRESS', (a, bag) => {
  const r = Math.trunc(N(deger(a[0], bag))), c = Math.trunc(N(deger(a[1], bag)));
  if (hataMi(r)) return r; if (hataMi(c)) return c;
  if (r < 1 || c < 1 || r > 1048576 || c > 16384) return H.DEGER;
  const tur = a[2] != null ? Math.trunc(N(deger(a[2], bag))) : 1, a1 = a[3] != null ? mantiga(deger(a[3], bag)) !== false : true;
  if (![1, 2, 3, 4].includes(tur)) return H.DEGER;
  const ar = tur === 1 || tur === 2, ac = tur === 1 || tur === 3;
  let sutun = ''; for (let x = c; x > 0; x = Math.floor((x - 1) / 26)) sutun = String.fromCharCode(65 + (x - 1) % 26) + sutun;
  let s = a1 ? (ac ? '$' : '') + sutun + (ar ? '$' : '') + r : 'R' + (ar ? r : '[' + r + ']') + 'C' + (ac ? c : '[' + c + ']');
  if (a[4] != null) { const sf = String(deger(a[4], bag) ?? ''); if (sf) s = (/^[\wÇĞİÖŞÜçğıöşü]+$/.test(sf) ? sf : "'" + sf.replace(/'/g, "''") + "'") + '!' + s; }
  return s;
});

/* ---------------------------------------------------------------- finans: para ve zaman */
// İşaret kuralı Excel'deki gibidir: alınan para (kredi) artı, ödenen eksi. =DEVRESEL_ÖDEME(%1;12;10000) → -888,49
const finAl = (a, b, i, varsay) => a[i] == null ? varsay : N(deger(a[i], b));
function finHata(...x) { return x.find(hataMi); }
const fvF = (r, n, p, pv, t) => r === 0 ? -(pv + p * n) : -(pv * (1 + r) ** n + p * (1 + r * t) * ((1 + r) ** n - 1) / r);
const pmtF = (r, n, pv, fv, t) => r === 0 ? -(pv + fv) / n : -(r * (pv * (1 + r) ** n + fv)) / ((1 + r * t) * ((1 + r) ** n - 1));
const sonlu = x => Number.isFinite(x) ? x : H.SAYI;
tanim('PMT', (a, b) => { const r = finAl(a, b, 0), n = finAl(a, b, 1), pv = finAl(a, b, 2), fv = finAl(a, b, 3, 0), t = finAl(a, b, 4, 0) ? 1 : 0; const e = finHata(r, n, pv, fv); if (e) return e; if (!n) return H.SAYI; return sonlu(pmtF(r, n, pv, fv, t)); });
tanim('FV', (a, b) => { const r = finAl(a, b, 0), n = finAl(a, b, 1), p = finAl(a, b, 2), pv = finAl(a, b, 3, 0), t = finAl(a, b, 4, 0) ? 1 : 0; const e = finHata(r, n, p, pv); if (e) return e; return sonlu(fvF(r, n, p, pv, t)); });
tanim('PV', (a, b) => { const r = finAl(a, b, 0), n = finAl(a, b, 1), p = finAl(a, b, 2), fv = finAl(a, b, 3, 0), t = finAl(a, b, 4, 0) ? 1 : 0; const e = finHata(r, n, p, fv); if (e) return e;
  return sonlu(r === 0 ? -(fv + p * n) : -(fv + p * (1 + r * t) * ((1 + r) ** n - 1) / r) / (1 + r) ** n); });
tanim('NPER', (a, b) => { const r = finAl(a, b, 0), p = finAl(a, b, 1), pv = finAl(a, b, 2), fv = finAl(a, b, 3, 0), t = finAl(a, b, 4, 0) ? 1 : 0; const e = finHata(r, p, pv, fv); if (e) return e;
  if (r === 0) return p === 0 ? H.SAYI : sonlu(-(pv + fv) / p);
  const pay = p * (1 + r * t) - fv * r, payda = p * (1 + r * t) + pv * r;
  if (pay / payda <= 0) return H.SAYI; return sonlu(Math.log(pay / payda) / Math.log(1 + r)); });
function ipmtF(r, per, n, pv, fv, t) {
  const p = pmtF(r, n, pv, fv, t);
  const faiz = per === 1 ? (t === 1 ? 0 : -pv) : (t === 1 ? fvF(r, per - 2, p, pv, 1) - p : fvF(r, per - 1, p, pv, 0));
  return faiz * r;
}
tanim('IPMT', (a, b) => { const r = finAl(a, b, 0), per = finAl(a, b, 1), n = finAl(a, b, 2), pv = finAl(a, b, 3), fv = finAl(a, b, 4, 0), t = finAl(a, b, 5, 0) ? 1 : 0; const e = finHata(r, per, n, pv, fv); if (e) return e;
  if (per < 1 || per > n) return H.SAYI; return sonlu(ipmtF(r, Math.trunc(per), n, pv, fv, t)); });
tanim('PPMT', (a, b) => { const r = finAl(a, b, 0), per = finAl(a, b, 1), n = finAl(a, b, 2), pv = finAl(a, b, 3), fv = finAl(a, b, 4, 0), t = finAl(a, b, 5, 0) ? 1 : 0; const e = finHata(r, per, n, pv, fv); if (e) return e;
  if (per < 1 || per > n) return H.SAYI; return sonlu(pmtF(r, n, pv, fv, t) - ipmtF(r, Math.trunc(per), n, pv, fv, t)); });
// Newton yöntemi; yakınsamazsa ikiye bölme. Excel de yinelemeli çözer ve 20 denemede bulamazsa #SAYI! verir.
function kokBul(f, tahmin) {
  let x = tahmin;
  for (let i = 0; i < 100; i++) {
    const y = f(x); if (!Number.isFinite(y)) break;
    if (Math.abs(y) < 1e-10) return x;
    const h = 1e-7 * Math.max(1, Math.abs(x)), d = (f(x + h) - y) / h;
    if (!d || !Number.isFinite(d)) break;
    const yeni = x - y / d; if (!Number.isFinite(yeni) || yeni <= -1) break;
    if (Math.abs(yeni - x) < 1e-12) return yeni; x = yeni;
  }
  // yedek: -0,99 ile 10 arasında işaret değişimi ara
  let lo = -0.99, hi = 10, flo = f(lo), fhi = f(hi);
  if (!(flo * fhi < 0)) return null;
  for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2, fm = f(m); if (Math.abs(fm) < 1e-10 || hi - lo < 1e-13) return m; if (flo * fm < 0) { hi = m; fhi = fm; } else { lo = m; flo = fm; } }
  return (lo + hi) / 2;
}
tanim('RATE', (a, b) => { const n = finAl(a, b, 0), p = finAl(a, b, 1), pv = finAl(a, b, 2), fv = finAl(a, b, 3, 0), t = finAl(a, b, 4, 0) ? 1 : 0, g = finAl(a, b, 5, 0.1); const e = finHata(n, p, pv, fv, g); if (e) return e;
  const f = r => Math.abs(r) < 1e-12 ? pv + p * n + fv : pv * (1 + r) ** n + p * (1 + r * t) * ((1 + r) ** n - 1) / r + fv;
  const r = kokBul(f, g); return r == null ? H.SAYI : r; });
const nakitler = (x, bag) => { const v = deger(x, bag); if (v instanceof Dizi) { const o = []; for (const y of tumHucreler(v)) { if (hataMi(y)) return y; if (typeof y === 'number') o.push(y); } return o; } if (hataMi(v)) return v; const n = sayiya(v); return hataMi(n) ? n : [n]; };
tanim('NPV', (a, b) => { const r = N(deger(a[0], b)); if (hataMi(r)) return r; const v = []; for (const x of a.slice(1)) { const n = nakitler(x, b); if (hataMi(n)) return n; v.push(...n); }
  return sonlu(v.reduce((t, x, i) => t + x / (1 + r) ** (i + 1), 0)); });
tanim('IRR', (a, b) => { const v = nakitler(a[0], b); if (hataMi(v)) return v; if (!v.some(x => x > 0) || !v.some(x => x < 0)) return H.SAYI;
  const g = a[1] != null ? N(deger(a[1], b)) : 0.1; const r = kokBul(x => v.reduce((t, c, i) => t + c / (1 + x) ** i, 0), g); return r == null ? H.SAYI : r; });
tanim('XNPV', (a, b) => { const r = N(deger(a[0], b)), v = nakitler(a[1], b), d = nakitler(a[2], b); for (const x of [r, v, d]) if (hataMi(x)) return x; if (v.length !== d.length) return H.SAYI;
  return sonlu(v.reduce((t, x, i) => t + x / (1 + r) ** ((d[i] - d[0]) / 365), 0)); });
tanim('XIRR', (a, b) => { const v = nakitler(a[0], b), d = nakitler(a[1], b); for (const x of [v, d]) if (hataMi(x)) return x; if (v.length !== d.length || !v.some(x => x > 0) || !v.some(x => x < 0)) return H.SAYI;
  const g = a[2] != null ? N(deger(a[2], b)) : 0.1; const r = kokBul(x => v.reduce((t, c, i) => t + c / (1 + x) ** ((d[i] - d[0]) / 365), 0), g); return r == null ? H.SAYI : r; });
tanim('SLN', (a, b) => { const c = finAl(a, b, 0), s2 = finAl(a, b, 1), l = finAl(a, b, 2); const e = finHata(c, s2, l); if (e) return e; if (!l) return H.BOL0; return (c - s2) / l; });
tanim('DDB', (a, b) => { const c = finAl(a, b, 0), sv = finAl(a, b, 1), l = finAl(a, b, 2), per = finAl(a, b, 3), fa = finAl(a, b, 4, 2); const e = finHata(c, sv, l, per, fa); if (e) return e;
  if (per < 1 || per > l || l <= 0 || c < 0 || sv < 0 || fa <= 0) return H.SAYI;
  let defter = c, dep = 0; for (let i = 1; i <= Math.ceil(per); i++) { dep = Math.max(0, Math.min(defter * fa / l, defter - sv)); defter -= dep; } return dep; });
tanim('DB', (a, b) => { const c = finAl(a, b, 0), sv = finAl(a, b, 1), l = finAl(a, b, 2), per = finAl(a, b, 3), ay = finAl(a, b, 4, 12); const e = finHata(c, sv, l, per, ay); if (e) return e;
  if (c <= 0 || l <= 0 || per < 1 || per > l + 1 || ay < 1 || ay > 12) return H.SAYI;
  const oran = Math.round((1 - (sv / c) ** (1 / l)) * 1000) / 1000;
  let top = c * oran * ay / 12; if (per === 1) return top;
  for (let i = 2; i <= per; i++) { const d = i === l + 1 ? (c - top) * oran * (12 - ay) / 12 : (c - top) * oran; if (i === per) return d; top += d; } return 0; });
tanim('EFFECT', (a, b) => { const nr = finAl(a, b, 0), n = Math.trunc(finAl(a, b, 1)); const e = finHata(nr, n); if (e) return e; if (nr <= 0 || n < 1) return H.SAYI; return (1 + nr / n) ** n - 1; });
tanim('NOMINAL', (a, b) => { const er = finAl(a, b, 0), n = Math.trunc(finAl(a, b, 1)); const e = finHata(er, n); if (e) return e; if (er <= 0 || n < 1) return H.SAYI; return n * ((1 + er) ** (1 / n) - 1); });

/* ---------------------------------------------------------------- LAMBDA ve yardımcıları (Excel 365) */
// LAMBDA tembeldir: parametreler ad, son bağımsız değişken gövdedir; tanımlandığı andaki LET değişkenlerini yakalar.
tanim('LAMBDA', (args, bag) => {
  if (!args.length) return H.DEGER;
  const params = args.slice(0, -1);
  // [b] köşeli parantezli parametre: belirteçleyici bunu tablo başvurusu (tref) olarak okur
  const secimliMi = p => p.t === 'tref' && !p.tablo && p.s1 && p.s2 == null && (!p.ozel || p.ozel === 'veri') && !p.satirlik;
  if (params.some(p => p.t !== 'ad' && !secimliMi(p))) return H.DEGER;
  const adlar = params.map(p => trB(p.t === 'ad' ? p.v : p.s1));
  if (new Set(adlar).size !== adlar.length) return H.DEGER;
  const secimli = new Set(params.filter(secimliMi).map(p => trB(p.s1)));
  return new Lambda(adlar, args[args.length - 1], bag.degisken ? new Map(bag.degisken) : null, null, secimli);
}, { tembel: true });
const lambdaAl = (x, bag) => { const v = deger(x, bag); return v instanceof Lambda ? v : null; };
const tekDeger = v => { v = v instanceof Bas ? coz(v, { kitap: null }) : v; if (v instanceof Dizi) return v.satir === 1 && v.sutun === 1 ? v.v[0][0] : H.HESAP; return v; };
const cagirTek = (L, args, bag) => { let v = lambdaCagir(L, args, bag); v = coz(v, bag); if (v instanceof Lambda) return H.HESAP; return tekDeger(v); };
tanim('MAP', (a, b) => {
  const L = lambdaAl(a[a.length - 1], b); if (!L || a.length < 2) return H.DEGER;
  const ds = a.slice(0, -1).map(x => diziyeCevir(x, b)), R = Math.max(...ds.map(d => d.satir)), C = Math.max(...ds.map(d => d.sutun));
  if (ds.some(d => !(d.satir === R || d.satir === 1) || !(d.sutun === C || d.sutun === 1))) return H.DEGER;
  if (R * C > SINIR.hucreDizi) return H.HESAP;
  return new Dizi(Array.from({ length: R }, (_, r) => Array.from({ length: C }, (_, c) => cagirTek(L, ds.map(d => d.al(r, c) ?? null), b))));
});
tanim('BYROW', (a, b) => { const d = diziyeCevir(a[0], b), L = lambdaAl(a[1], b); if (!L) return H.DEGER; return new Dizi(d.v.map(s => [cagirTek(L, [new Dizi([s.slice()])], b)])); });
tanim('BYCOL', (a, b) => { const d = diziyeCevir(a[0], b), L = lambdaAl(a[1], b); if (!L) return H.DEGER; return new Dizi([Array.from({ length: d.sutun }, (_, c) => cagirTek(L, [new Dizi(d.v.map(s => [s[c]]))], b))]); });
// SCAN: her adımdaki birikimi döndürür (kümülatif toplam); REDUCE: yalnız sonuncuyu
tanim('SCAN', (a, b) => {
  const L = lambdaAl(a[2], b); if (!L) return H.DEGER;
  let acc = a[0] == null ? null : deger(a[0], b); const d = diziyeCevir(a[1], b);
  return new Dizi(d.v.map(s => s.map(x => (acc = cagirTek(L, [acc, x ?? null], b)))));
});
tanim('REDUCE', (a, b) => {
  const L = lambdaAl(a[2], b); if (!L) return H.DEGER;
  let acc = a[0] == null ? null : deger(a[0], b); const d = diziyeCevir(a[1], b);
  for (const s of d.v) for (const x of s) { acc = coz(lambdaCagir(L, [acc, x ?? null], b), b); if (acc instanceof Lambda) return H.HESAP; }
  return acc;
});
tanim('MAKEARRAY', (a, b) => {
  const R = Math.trunc(N(deger(a[0], b))), C = Math.trunc(N(deger(a[1], b))), L = lambdaAl(a[2], b);
  if (hataMi(R) || hataMi(C) || !L) return H.DEGER; if (R < 1 || C < 1) return H.DEGER; if (R * C > SINIR.hucreDizi) return H.HESAP;
  return new Dizi(Array.from({ length: R }, (_, r) => Array.from({ length: C }, (_, c) => cagirTek(L, [r + 1, c + 1], b))));
});

/* ---------------------------------------------------------------- GRUPLAÖLÇÜT ve ÖZETÖLÇÜT: formülle özet tablo */
// Başlık: 0 yok, 1 var/gösterme, 2 yok/üret, 3 var/göster; boş bırakılırsa ilk satır metin, altı sayıysa "var ve göster".
function baslikKip(x, deg) {
  if (x != null) return Math.trunc(N(x));
  return deg.satir > 1 && typeof deg.v[0][0] === 'string' && typeof deg.v[1][0] === 'number' ? 3 : 0;
}
const TOPLAM_ETIKET = 'Toplam';
function gruplaAnahtar(satir) { return JSON.stringify(satir.map(x => x == null ? '' : hataMi(x) ? x.kod : typeof x === 'string' ? trB(x) : x)); }
function grupla(alanlar, satirlar) {
  const m = new Map();
  for (const i of satirlar) { const k = gruplaAnahtar(alanlar.v[i]); if (!m.has(k)) m.set(k, { degerler: alanlar.v[i].map(x => x ?? ''), satirlar: [] }); m.get(k).satirlar.push(i); }
  return [...m.values()];
}
const sirala = (gruplar, sutun, yon) => gruplar.sort((p, q) => { for (let j = sutun; j < p.degerler.length; j++) { const c = siralaKarsilastir(p.degerler[j], q.degerler[j]); if (c) return c * yon; } return 0; });
tanim('GROUPBY', (a, b) => {
  let rf = diziyeCevir(a[0], b), vf = diziyeCevir(a[1], b); const L = lambdaAl(a[2], b);
  if (!L || rf.satir !== vf.satir) return H.DEGER;
  const hk = baslikKip(a[3] == null ? null : deger(a[3], b), vf);
  const basR = hk === 1 || hk === 3 ? rf.v[0] : null, basV = hk === 1 || hk === 3 ? vf.v[0] : null;
  if (basR) { rf = new Dizi(rf.v.slice(1)); vf = new Dizi(vf.v.slice(1)); }
  const derinlik = a[4] == null ? 1 : Math.trunc(N(deger(a[4], b))), sira = a[5] == null ? 1 : Math.trunc(N(deger(a[5], b)));
  const filtre = a[6] == null ? null : diziyeCevir(a[6], b);
  let idx = rf.v.map((_, i) => i);
  if (filtre) { if (filtre.satir !== rf.satir + (basR ? 1 : 0) && filtre.satir !== rf.satir) return H.DEGER; const fo = filtre.satir === rf.satir ? 0 : 1; idx = idx.filter(i => mantiga(filtre.v[i + fo][0]) === true); }
  if (!idx.length) return H.HESAP;
  // İki parametreli işlev (PERCENTOF ya da LAMBDA(grup;hepsi;…)) grubun ve bütün süzülmüş verinin değerlerini alır
  const ikili = L.yerlesik === 'PERCENTOF' || (L.params && L.params.length === 2);
  const ozet = sat => vf.v[0].map((_, c) => cagirTek(L, [new Dizi(sat.map(i => [vf.v[i][c]])), ...(ikili ? [new Dizi(idx.map(i => [vf.v[i][c]]))] : [])], b));
  let gruplar = grupla(rf, idx);
  const K = rf.sutun;
  if (Math.abs(sira) <= K) sirala(gruplar, Math.abs(sira) - 1, sira < 0 ? -1 : 1);
  else { gruplar.forEach(g => { g.oz = ozet(g.satirlar); }); const j = Math.abs(sira) - K - 1; gruplar.sort((p, q) => siralaKarsilastir(p.oz[j], q.oz[j]) * (sira < 0 ? -1 : 1)); }
  const out = [];
  if (hk === 3) out.push([...basR, ...basV]);
  const satir = (etiketler, sat) => [...etiketler, ...ozet(sat)];
  // Ara toplam (derinlik 2): ilk alanın her grubu bitince o grubun toplam satırı
  const ara = Math.abs(derinlik) >= 2 && K >= 2, govde = [];
  let grupBas = null, grupSatirlari = [];
  const araToplam = () => { if (ara && grupBas !== null) govde.push(satir([grupBas, ...Array(K - 1).fill('')], grupSatirlari)); };
  for (const g of gruplar) {
    if (ara && (grupBas === null || gruplaAnahtar([g.degerler[0]]) !== gruplaAnahtar([grupBas]))) { araToplam(); grupBas = g.degerler[0]; grupSatirlari = []; }
    govde.push(satir(g.degerler, g.satirlar)); grupSatirlari.push(...g.satirlar);
  }
  araToplam();
  const genel = derinlik !== 0 ? satir([TOPLAM_ETIKET, ...Array(K - 1).fill('')], idx) : null;
  if (genel && derinlik < 0) out.push(genel);
  out.push(...govde);
  if (genel && derinlik > 0) out.push(genel);
  return new Dizi(out);
});
tanim('PIVOTBY', (a, b) => {
  let rf = diziyeCevir(a[0], b), cf = diziyeCevir(a[1], b), vf = diziyeCevir(a[2], b); const L = lambdaAl(a[3], b);
  if (!L || rf.satir !== vf.satir || cf.satir !== vf.satir || vf.sutun !== 1) return H.DEGER;
  const hk = baslikKip(a[4] == null ? null : deger(a[4], b), vf);
  const basR = hk === 1 || hk === 3 ? rf.v[0] : null;
  if (basR) { rf = new Dizi(rf.v.slice(1)); cf = new Dizi(cf.v.slice(1)); vf = new Dizi(vf.v.slice(1)); }
  const rDer = a[5] == null ? 1 : Math.trunc(N(deger(a[5], b))), rSira = a[6] == null ? 1 : Math.trunc(N(deger(a[6], b)));
  const cDer = a[7] == null ? 1 : Math.trunc(N(deger(a[7], b))), cSira = a[8] == null ? 1 : Math.trunc(N(deger(a[8], b)));
  const filtre = a[9] == null ? null : diziyeCevir(a[9], b);
  let idx = rf.v.map((_, i) => i);
  if (filtre) idx = idx.filter(i => mantiga((filtre.v[i + (filtre.satir === rf.satir ? 0 : 1)] || [])[0]) === true);
  if (!idx.length) return H.HESAP;
  const ikili = L.yerlesik === 'PERCENTOF' || (L.params && L.params.length === 2);
  const ozet = sat => cagirTek(L, [new Dizi(sat.map(i => [vf.v[i][0]])), ...(ikili ? [new Dizi(idx.map(i => [vf.v[i][0]]))] : [])], b);
  const sg = sirala(grupla(rf, idx), Math.max(0, Math.abs(rSira) - 1), rSira < 0 ? -1 : 1), cg = sirala(grupla(cf, idx), Math.max(0, Math.abs(cSira) - 1), cSira < 0 ? -1 : 1);
  const K = rf.sutun, kesis = (p, q) => { const s = new Set(q); return p.filter(i => s.has(i)); };
  const ust = [...(hk === 3 ? basR : Array(K).fill('')), ...cg.map(g => g.degerler.join(' ')), ...(cDer ? [TOPLAM_ETIKET] : [])];
  const out = [ust];
  for (const g of sg) out.push([...g.degerler, ...cg.map(c => { const k = kesis(g.satirlar, c.satirlar); return k.length ? ozet(k) : ''; }), ...(cDer ? [ozet(g.satirlar)] : [])]);
  if (rDer) out.push([TOPLAM_ETIKET, ...Array(K - 1).fill(''), ...cg.map(c => ozet(c.satirlar)), ...(cDer ? [ozet(idx)] : [])]);
  return new Dizi(out);
});

/* ---------------------------------------------------------------- dizi biçimlendirme */
function tekBoyut(d, yoksay, sutunSutun) {
  const out = [];
  const ekle = x => { if ((yoksay === 1 || yoksay === 3) && (x == null)) return; if ((yoksay === 2 || yoksay === 3) && hataMi(x)) return; out.push(x ?? 0); };
  if (sutunSutun) { for (let c = 0; c < d.sutun; c++) for (let r = 0; r < d.satir; r++) ekle(d.v[r][c]); } else for (const s of d.v) for (const x of s) ekle(x);
  return out;
}
const opsSayi = (x, b, v) => x == null ? v : Math.trunc(N(deger(x, b)));
tanim('TOCOL', (a, b) => { const o = tekBoyut(diziyeCevir(a[0], b), opsSayi(a[1], b, 0), mantiga(a[2] == null ? false : deger(a[2], b)) === true); return o.length ? new Dizi(o.map(x => [x])) : H.HESAP; });
tanim('TOROW', (a, b) => { const o = tekBoyut(diziyeCevir(a[0], b), opsSayi(a[1], b, 0), mantiga(a[2] == null ? false : deger(a[2], b)) === true); return o.length ? new Dizi([o]) : H.HESAP; });
function sar(a, b, satirSatir) {
  const d = diziyeCevir(a[0], b), n = Math.trunc(N(deger(a[1], b))), dolgu = a[2] == null ? H.NA : deger(a[2], b);
  if (d.satir > 1 && d.sutun > 1) return H.DEGER; if (hataMi(n) || n < 1) return H.SAYI;
  const v = d.v.flat().map(x => x ?? 0), parca = [];
  for (let i = 0; i < v.length; i += n) { const p = v.slice(i, i + n); while (p.length < n) p.push(dolgu); parca.push(p); }
  return new Dizi(satirSatir ? parca : Array.from({ length: n }, (_, r) => parca.map(p => p[r])));
}
tanim('WRAPROWS', (a, b) => sar(a, b, true));
tanim('WRAPCOLS', (a, b) => sar(a, b, false));
tanim('EXPAND', (a, b) => {
  const d = diziyeCevir(a[0], b), R = opsSayi(a[1], b, d.satir), C = opsSayi(a[2], b, d.sutun), dolgu = a[3] == null ? H.NA : deger(a[3], b);
  if (R < d.satir || C < d.sutun) return H.DEGER; if (R * C > SINIR.hucreDizi) return H.SAYI;
  return new Dizi(Array.from({ length: R }, (_, r) => Array.from({ length: C }, (_, c) => r < d.satir && c < d.sutun ? (d.v[r][c] ?? 0) : dolgu)));
});

/* ---------------------------------------------------------------- rastgele (uçucu) */
tanim('NA', () => H.NA);
tanim('RAND', () => Math.random(), { ucucu: true });
tanim('RANDBETWEEN', (a, b) => { const x = Math.ceil(N(deger(a[0], b))), y = Math.floor(N(deger(a[1], b))); if (hataMi(x) || hataMi(y)) return H.DEGER; if (x > y) return H.SAYI; return x + Math.floor(Math.random() * (y - x + 1)); }, { ucucu: true });
tanim('RANDARRAY', (a, b) => {
  const R = opsSayi(a[0], b, 1), C = opsSayi(a[1], b, 1), mn = a[2] == null ? 0 : N(deger(a[2], b)), mx = a[3] == null ? 1 : N(deger(a[3], b)), tam = a[4] == null ? false : mantiga(deger(a[4], b)) === true;
  if ([R, C, mn, mx].some(hataMi)) return H.DEGER; if (R < 1 || C < 1 || mn > mx) return H.DEGER; if (R * C > SINIR.hucreDizi) return H.SAYI;
  return new Dizi(Array.from({ length: R }, () => Array.from({ length: C }, () => tam ? Math.ceil(mn) + Math.floor(Math.random() * (Math.floor(mx) - Math.ceil(mn) + 1)) : mn + Math.random() * (mx - mn))));
}, { ucucu: true });

/* ---------------------------------------------------------------- regresyon, tahmin, sıklık */
// Eşleştirilmiş sayılar: iki dizide aynı konumda ikisi de sayıysa alınır (metin ve boşlar atlanır, Excel gibi)
function ciftler(ay, ax, b) {
  const y = diziyeCevir(ay, b).v.flat(), x = diziyeCevir(ax, b).v.flat();
  if (y.length !== x.length) return H.NA;
  const e = y.find(hataMi) || x.find(hataMi); if (e) return e;
  const p = []; for (let i = 0; i < y.length; i++) if (typeof y[i] === 'number' && typeof x[i] === 'number') p.push([x[i], y[i]]);
  return p;
}
function regresyon(p) {
  const n = p.length; if (n < 2) return H.BOL0;
  const mx = p.reduce((t, q) => t + q[0], 0) / n, my = p.reduce((t, q) => t + q[1], 0) / n;
  let sxy = 0, sxx = 0, syy = 0; for (const [x, y] of p) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; }
  if (sxx === 0) return H.BOL0;
  const egim = sxy / sxx; return { egim, kesim: my - egim * mx, sxy, sxx, syy };
}
tanim('SLOPE', (a, b) => { const p = ciftler(a[0], a[1], b); if (hataMi(p)) return p; const r = regresyon(p); return hataMi(r) ? r : r.egim; });
tanim('INTERCEPT', (a, b) => { const p = ciftler(a[0], a[1], b); if (hataMi(p)) return p; const r = regresyon(p); return hataMi(r) ? r : r.kesim; });
tanim('CORREL', (a, b) => { const p = ciftler(a[0], a[1], b); if (hataMi(p)) return p; const r = regresyon(p.map(([x, y]) => [y, x])); if (hataMi(r)) return r; return r.syy === 0 ? H.BOL0 : r.sxy / Math.sqrt(r.sxx * r.syy); });
tanim('RSQ', (a, b) => { const p = ciftler(a[0], a[1], b); if (hataMi(p)) return p; const r = regresyon(p); if (hataMi(r)) return r; return r.syy === 0 ? H.BOL0 : (r.sxy * r.sxy) / (r.sxx * r.syy); });
const tahmin = (a, b) => yay(([x], bb) => { const n = N(x); if (hataMi(n)) return n; const p = ciftler(a[1], a[2], bb); if (hataMi(p)) return p; const r = regresyon(p); return hataMi(r) ? r : r.kesim + r.egim * n; }, [0])([a[0]], b);
tanim('FORECAST.LINEAR', tahmin);
tanim('FORECAST', tahmin);
tanim('TREND', (a, b) => {
  const yd = diziyeCevir(a[0], b), y = yd.v.flat();
  const xd = a[1] == null ? new Dizi(y.map((_, i) => [i + 1])) : diziyeCevir(a[1], b), x = xd.v.flat();
  const yeni = a[2] == null ? xd : diziyeCevir(a[2], b), sabit = a[3] == null ? true : mantiga(deger(a[3], b)) !== false;
  if (x.length !== y.length) return H.BASV;
  if (y.some(v => typeof v !== 'number') || x.some(v => typeof v !== 'number')) return H.DEGER;
  let egim, kesim;
  if (sabit) { const r = regresyon(x.map((v, i) => [v, y[i]])); if (hataMi(r)) return r; ({ egim, kesim } = r); }
  else { const sxx = x.reduce((t, v) => t + v * v, 0); if (!sxx) return H.BOL0; egim = x.reduce((t, v, i) => t + v * y[i], 0) / sxx; kesim = 0; }
  return new Dizi(yeni.v.map(s => s.map(v => typeof v === 'number' ? kesim + egim * v : H.DEGER)));
});
tanim('FREQUENCY', (a, b) => {
  const veri = diziyeCevir(a[0], b).v.flat().filter(v => typeof v === 'number'), kov = diziyeCevir(a[1], b).v.flat().filter(v => typeof v === 'number');
  const sirali = kov.map((v, i) => ({ v, i })).sort((p, q) => p.v - q.v), say = new Array(kov.length + 1).fill(0);
  for (const x of veri) { const k = sirali.find(s => x <= s.v); say[k ? k.i : kov.length]++; }
  return new Dizi(say.map(n => [n]));
});
tanim('STDEV.P', (a, b) => { const x = sayilar(a, b); if (hataMi(x)) return x; return x.length < 1 ? H.BOL0 : Math.sqrt(x.reduce((t, v) => t + v * v, 0) / x.length - (x.reduce((t, v) => t + v, 0) / x.length) ** 2); });
// TOPLAMA (AGGREGATE): 19 işlev; seçenek 2, 3, 6, 7 hata değerlerini atlar. Gizli satır seçenekleri (1, 3, 5, 7) Kesit'te gizli satır olmadığı için etkisizdir.
const TOPLAMA_ISLEV = { 1: 'AVERAGE', 2: 'COUNT', 3: 'COUNTA', 4: 'MAX', 5: 'MIN', 6: 'PRODUCT', 7: 'STDEV.S', 8: 'STDEV.P', 9: 'SUM', 10: 'VAR.S', 12: 'MEDIAN', 13: 'MODE.SNGL', 14: 'LARGE', 15: 'SMALL', 16: 'PERCENTILE.INC', 17: 'QUARTILE.INC' };
tanim('AGGREGATE', (a, b) => {
  const fno = Math.trunc(N(deger(a[0], b))), sec = a[1] == null ? 0 : Math.trunc(N(deger(a[1], b)));
  const ad = TOPLAMA_ISLEV[fno]; if (!ad || !F[ad]) return H.DEGER; if (sec < 0 || sec > 7) return H.DEGER;
  const hataAtla = [2, 3, 6, 7].includes(sec);
  const temizle = x => { const v = diziyeCevir(x, b); return hataAtla ? new Dizi(v.v.map(s => s.map(y => hataMi(y) ? null : y))) : v; };
  if (fno >= 14) return F[ad].fn([temizle(a[2]), a[3] == null ? null : deger(a[3], b)], b);
  return F[ad].fn(a.slice(2).filter(x => x != null).map(temizle), b);
});

tanim('ISOMITTED', (args, bag) => {
  const a = args[0]; if (!a || a.t !== 'ad') return H.DEGER;
  const at = bag.degisken && bag.degisken.get(ATLANAN);
  return !!(at && at.has(trB(a.v)));
}, { tembel: true });

/* ---------------------------------------------------------------- düzenli ifadeler (Excel 365: PCRE2; burada JavaScript RegExp, yaygın desenlerde aynı) */
function desen(p, buyukKucuk, g = '') {
  const cs = buyukKucuk == null ? 0 : Math.trunc(N(buyukKucuk));
  try { return new RegExp(T(p), 'u' + g + (cs === 1 ? 'i' : '')); } catch { return null; }
}
tanim('REGEXTEST', yay(([m, p, cs]) => { const re = desen(p, cs); if (!re) return H.DEGER; return re.test(T(m)); }, [0]));
tanim('REGEXEXTRACT', (a, b) => {
  const mod = a[2] == null ? 0 : Math.trunc(N(deger(a[2], b)));
  const tekil = (m, p, cs) => {
    const re = desen(p, cs, mod === 1 ? 'g' : ''); if (!re) return H.DEGER;
    const t = T(m);
    if (mod === 1) { const hep = [...t.matchAll(re)].map(x => x[0]); return hep.length ? new Dizi([hep]) : H.NA; } // Türkçe web Excel'de denendi: yan yana taşar
    const x = re.exec(t); if (!x) return H.NA;
    if (mod === 2) return x.length > 1 ? new Dizi([x.slice(1).map(g => g ?? '')]) : H.NA;
    return x[0];
  };
  const m = deger(a[0], b), p = deger(a[1], b), cs = a[3] == null ? null : deger(a[3], b);
  if (m instanceof Dizi) { if (mod !== 0) return H.DEGER; return new Dizi(m.v.map(s => s.map(x => tekil(x, p, cs)))); }
  return tekil(m, p, cs);
});
tanim('REGEXREPLACE', yay(([m, p, yeni, kez, cs]) => {
  const n = kez == null ? 0 : Math.trunc(N(kez)), re = desen(p, cs, 'g'); if (!re) return H.DEGER;
  const t = T(m), y = T(yeni);
  if (!n) return t.replace(re, y);
  const hep = [...t.matchAll(re)], k = n > 0 ? n - 1 : hep.length + n; if (k < 0 || k >= hep.length) return t;
  const x = hep[k], tek = new RegExp(re.source, re.flags.replace('g', ''));
  return t.slice(0, x.index) + x[0].replace(tek, y) + t.slice(x.index + x[0].length);
}, [0]));
// YÜZDE: alt kümenin toplamı / bütünün toplamı (GRUPLAÖLÇÜT'te pay sütunu için)
tanim('PERCENTOF', (a, b) => { const x = sayilar([a[0]], b), y = sayilar([a[1]], b); if (hataMi(x)) return x; if (hataMi(y)) return y; const ty = y.reduce((t, v) => t + v, 0); return ty === 0 ? H.BOL0 : x.reduce((t, v) => t + v, 0) / ty; });
// KIRPARALIK: başvurunun baştaki/sondaki boş satır ve sütunlarını atar (1 baş, 2 son, 3 ikisi)
tanim('TRIMRANGE', (a, b) => {
  const v = a[0]; if (!(v instanceof Bas)) return H.DEGER;
  const ks = a[1] == null ? 3 : Math.trunc(N(deger(a[1], b))), kc = a[2] == null ? 3 : Math.trunc(N(deger(a[2], b)));
  const dolu = (r, c) => { const x = b.kitap.hucre(v.sayfa, r, c); return x != null && x !== ''; };
  let { r1, r2, c1, c2 } = v; r2 = Math.min(r2, r1 + 100000); c2 = Math.min(c2, c1 + 1000);
  const satirDolu = r => { for (let c = c1; c <= c2; c++) if (dolu(r, c)) return true; return false; }, sutunDolu = c => { for (let r = r1; r <= r2; r++) if (dolu(r, c)) return true; return false; };
  if (ks & 1) while (r1 < r2 && !satirDolu(r1)) r1++;
  if (ks & 2) while (r2 > r1 && !satirDolu(r2)) r2--;
  if (kc & 1) while (c1 < c2 && !sutunDolu(c1)) c1++;
  if (kc & 2) while (c2 > c1 && !sutunDolu(c2)) c2--;
  return new Bas(v.sayfa, r1, c1, r2, c2);
});

/* ---------------------------------------------------------------- ofis pratikleri: köprü, formül metni, tanımlayıcı istatistik */
// KÖPRÜ: hücrede görünen metni (yoksa hedefi) döndürür; tıklama tarayıcıdaki ızgarada yok, hedef formülde okunur
tanim('HYPERLINK', (a, b) => { const hedef = deger(a[0], b); if (hataMi(hedef)) return hedef; if (a[1] == null) return T(hedef); const ad = deger(a[1], b); return ad == null ? 0 : ad; });
tanim('FORMULATEXT', (a, b) => { const v = a[0]; if (!(v instanceof Bas)) return H.DEGER; const f = b.kitap.icerik(v.sayfa, v.r1, v.c1); return typeof f === 'string' && f.startsWith('=') ? f : H.NA; });
function momentler(x) { const n = x.length, m = x.reduce((t, v) => t + v, 0) / n, s = Math.sqrt(x.reduce((t, v) => t + (v - m) ** 2, 0) / (n - 1)); return { n, m, s }; }
tanim('SKEW', (a, b) => { const x = sayilar(a, b); if (hataMi(x)) return x; const { n, m, s } = momentler(x); if (n < 3 || !s) return H.BOL0; return n / ((n - 1) * (n - 2)) * x.reduce((t, v) => t + ((v - m) / s) ** 3, 0); });
tanim('KURT', (a, b) => { const x = sayilar(a, b); if (hataMi(x)) return x; const { n, m, s } = momentler(x); if (n < 4 || !s) return H.BOL0; return n * (n + 1) / ((n - 1) * (n - 2) * (n - 3)) * x.reduce((t, v) => t + ((v - m) / s) ** 4, 0) - 3 * (n - 1) ** 2 / ((n - 2) * (n - 3)); });
// Uçlardan yüzde p kadar veriyi (her uçtan yarısı, aşağı yuvarlanmış) atıp ortalar
tanim('TRIMMEAN', (a, b) => { const x = sayilar([a[0]], b), p = N(deger(a[1], b)); if (hataMi(x)) return x; if (hataMi(p) || p < 0 || p >= 1) return H.SAYI; const s = x.slice().sort((u, v) => u - v), k = Math.floor(s.length * p / 2), ic = s.slice(k, s.length - k); return ic.length ? ic.reduce((t, v) => t + v, 0) / ic.length : H.SAYI; });

export const ISLEVLER = F;
