// Kesit Excel · VBA alt kümesi yorumlayıcısı. Makroyu Kesit çalışma kitabı (Kitap) üzerinde çalıştırır.
// Gerçek VBA'nın tamamı değildir; derslerde ve iş hayatında en sık kullanılan kısmı kapsar. Desteklenmeyen bir şey
// sessizce yanlış çalışmaz, satır numarasıyla "desteklenmiyor" hatası verir. eval kullanılmaz; adım ve hücre sınırı vardır.
import { adres, adresCoz, alanCoz, harfSutun, sutunHarf, hataMi, Hata, H, islevAdi, HATA_TR, Dizi } from './formul.js';
import { ISLEVLER } from './islevler.js';
import { seriden, seriye, bicimle, trSayi } from './tarih.js';

export const VBA_SINIR = { adim: 2_000_000, hucre: 300_000, cikti: 2000, satir: 1048576, sutun: 16384 };
const BUYUK = s => String(s).toUpperCase();
class VbaHata extends Error { constructor(m, satir) { super(m); this.satir = satir; } }
class Cikis { constructor(tur) { this.tur = tur; } }            // Exit For/Do/Sub/Function
const BOS = undefined;                                         // Empty

/* ================================================================ belirteçler */
const ANAHTAR = new Set(['SUB', 'END', 'FUNCTION', 'DIM', 'AS', 'SET', 'IF', 'THEN', 'ELSE', 'ELSEIF', 'FOR', 'TO', 'STEP', 'NEXT', 'EACH', 'IN', 'DO', 'LOOP', 'WHILE', 'UNTIL', 'WEND', 'SELECT', 'CASE', 'IS', 'WITH', 'EXIT', 'CALL', 'AND', 'OR', 'NOT', 'XOR', 'MOD', 'TRUE', 'FALSE', 'NOTHING', 'EMPTY', 'CONST', 'REDIM', 'PRESERVE', 'PUBLIC', 'PRIVATE', 'ON', 'ERROR', 'RESUME', 'GOTO', 'OPTION', 'EXPLICIT', 'BYVAL', 'BYREF', 'OPTIONAL', 'LIKE']);
function belirtec(kod) {
  // Satır sürdürme " _" birleştirilir; satır numarası korunur
  const ham = kod.replace(/\r\n?/g, '\n').split('\n');
  const satirlar = [];
  for (let i = 0; i < ham.length; i++) {
    let s = ham[i], bas = i + 1;
    while (/\s_\s*$/.test(s) && i + 1 < ham.length) { s = s.replace(/\s_\s*$/, ' ') + ham[++i]; }
    satirlar.push({ s, no: bas });
  }
  const out = [];
  for (const { s, no } of satirlar) {
    let i = 0; const ekle = t => out.push({ ...t, no });
    while (i < s.length) {
      const c = s[i];
      if (c === ' ' || c === '\t') { i++; continue; }
      if (c === "'") break;
      if (/^rem\b/i.test(s.slice(i)) && !/[A-Za-z0-9_]/.test(s[i - 1] || '')) break;
      if (c === '"') { let j = i + 1, v = ''; for (;;) { if (j >= s.length) throw new VbaHata('Kapanmamış tırnak', no); if (s[j] === '"') { if (s[j + 1] === '"') { v += '"'; j += 2; continue; } break; } v += s[j++]; } ekle({ t: 'str', v }); i = j + 1; continue; }
      if (c === '#') { const m = /^#(\d{1,2})\/(\d{1,2})\/(\d{4})#/.exec(s.slice(i)); if (m) { ekle({ t: 'num', v: seriden(+m[3], +m[1], +m[2]) }); i += m[0].length; continue; } }
      const sayi = /^(\d+\.?\d*(?:[eE][+-]?\d+)?|\.\d+)[#!@&%]?/.exec(s.slice(i));
      if (sayi) { ekle({ t: 'num', v: Number(sayi[1]) }); i += sayi[0].length; continue; }
      const hex = /^&H([0-9A-Fa-f]+)&?/.exec(s.slice(i)); if (hex) { ekle({ t: 'num', v: parseInt(hex[1], 16) }); i += hex[0].length; continue; }
      const ad = /^[A-Za-zÇĞİÖŞÜçğıöşü_][A-Za-z0-9ÇĞİÖŞÜçğıöşü_]*[$%&!#]?/.exec(s.slice(i));
      if (ad) { const a = ad[0].replace(/[$%&!#]$/, ''); const b = BUYUK(a); if (ANAHTAR.has(b)) ekle({ t: 'kw', v: b }); else ekle({ t: 'ad', v: a }); i += ad[0].length; continue; }
      const iki = s.slice(i, i + 2);
      if (iki === ':=' || iki === '<>' || iki === '<=' || iki === '>=') { ekle({ t: 'op', v: iki }); i += 2; continue; }
      if (c === ';') { ekle({ t: 'op', v: ',' }); i++; continue; } // Debug.Print a; b
      if ('+-*/\\^&=<>(),.:'.includes(c)) { ekle({ t: c === ':' ? 'ayr' : 'op', v: c }); i++; continue; }
      throw new VbaHata(`Beklenmeyen karakter: ${c}`, no);
    }
    out.push({ t: 'sat', no });
  }
  return out;
}

/* ================================================================ ayrıştırıcı */
function ayristir(kod) {
  const tk = belirtec(kod); let p = 0;
  const bak = (k = 0) => tk[p + k] || { t: 'son', no: tk.length ? tk[tk.length - 1].no : 1 };
  const al = () => tk[p++];
  const kw = v => bak().t === 'kw' && bak().v === v;
  const op = v => bak().t === 'op' && bak().v === v;
  const bekle = (t, v) => { const x = bak(); if (x.t !== t || (v != null && x.v !== v)) throw new VbaHata(`${v || t} bekleniyor, "${x.v ?? 'satır sonu'}" bulundu`, x.no); return al(); };
  const satirSonu = () => { while (bak().t === 'sat' || bak().t === 'ayr') al(); };
  const satirBitti = () => bak().t === 'sat' || bak().t === 'ayr' || bak().t === 'son';

  // ---- ifade (öncelik: ^ > tekli - > * / > \ > Mod > + - > & > karşılaştırma > Not > And > Or/Xor)
  const IKILI = { OR: 1, XOR: 1, AND: 2, '=': 4, '<>': 4, '<': 4, '>': 4, '<=': 4, '>=': 4, LIKE: 4, IS: 4, '&': 5, '+': 6, '-': 6, MOD: 7, '\\': 8, '*': 9, '/': 9, '^': 11 };
  function ifade(min = 0) {
    let sol;
    if (kw('NOT')) { const no = al().no; sol = { t: 'not', a: ifade(3), no }; }
    else if (op('-')) { const no = al().no; sol = { t: 'neg', a: ifade(10), no }; } // VBA: -2^2 = -4 (üs önce)
    else if (op('+')) { al(); sol = ifade(10); }
    else sol = sonek(birincil());
    for (;;) {
      const x = bak(); const o = x.t === 'op' ? x.v : x.t === 'kw' ? x.v : null;
      const g = IKILI[o]; if (g == null || g <= min) break; // tüm işleçler soldan birleşir (VBA'da ^ dahil)
      al(); sol = { t: 'ikili', o, a: sol, b: ifade(g), no: x.no };
    }
    return sol;
  }
  function birincil() {
    const x = bak();
    if (x.t === 'num') { al(); return { t: 'sabit', v: x.v }; }
    if (x.t === 'str') { al(); return { t: 'sabit', v: x.v }; }
    if (x.t === 'kw' && (x.v === 'TRUE' || x.v === 'FALSE')) { al(); return { t: 'sabit', v: x.v === 'TRUE' }; }
    if (x.t === 'kw' && x.v === 'NOTHING') { al(); return { t: 'sabit', v: null }; }
    if (x.t === 'kw' && x.v === 'EMPTY') { al(); return { t: 'sabit', v: BOS }; }
    if (op('(')) { al(); const e = ifade(); bekle('op', ')'); return e; }
    if (op('.')) { al(); const a = bekle('ad'); return { t: 'uye', nesne: { t: 'with' }, ad: a.v, no: a.no }; } // With bloğu içi
    if (x.t === 'ad') { al(); return { t: 'ad', ad: x.v, no: x.no }; }
    throw new VbaHata(`İfade bekleniyor, "${x.v ?? 'satır sonu'}" bulundu`, x.no);
  }
  function argumanlar() {
    const args = [];
    if (op(')')) { al(); return args; }
    for (;;) {
      if (bak().t === 'ad' && bak(1).t === 'op' && bak(1).v === ':=') { const ad = al().v; al(); args.push({ ad, e: ifade() }); }
      else if (op(',')) args.push({ e: null });
      else args.push({ e: ifade() });
      if (op(',')) { al(); if (op(')')) { args.push({ e: null }); } continue; }
      bekle('op', ')'); return args;
    }
  }
  function sonek(e) {
    for (;;) {
      if (op('(')) { const no = al().no; e = { t: 'cagri', hedef: e, args: argumanlar(), no }; continue; }
      if (op('.')) { al(); const a = bak(); if (a.t !== 'ad' && a.t !== 'kw') throw new VbaHata('Nokta sonrası ad bekleniyor', a.no); al(); e = { t: 'uye', nesne: e, ad: a.v, no: a.no }; continue; }
      return e;
    }
  }
  // Parantezsiz çağrı bağımsız değişkenleri: MsgBox "a", vbInfo  /  Range("A1").Copy Destination:=Range("B1")
  function parantezsizArg() {
    const args = [];
    if (satirBitti() || (bak().t === 'kw' && ['ELSE', 'END'].includes(bak().v))) return args;
    for (;;) {
      if (bak().t === 'ad' && bak(1).t === 'op' && bak(1).v === ':=') { const ad = al().v; al(); args.push({ ad, e: ifade() }); }
      else if (op(',')) args.push({ e: null });
      else args.push({ e: ifade() });
      if (op(',')) { al(); continue; }
      return args;
    }
  }

  // ---- deyimler
  function blok(bitis) { // bitis: deyimin bittiğini söyleyen işlev
    const ds = [];
    for (;;) { satirSonu(); if (bak().t === 'son') throw new VbaHata('Blok kapanmadı (End … eksik)', bak().no); if (bitis()) return ds; ds.push(deyim()); }
  }
  function tipAtla() { if (kw('AS')) { al(); if (bak().t === 'ad' && BUYUK(bak().v) === 'NEW') al(); al(); while (op('.')) { al(); al(); } } }
  function dimListesi() {
    const out = [];
    for (;;) {
      if (kw('PRESERVE')) al();
      const a = bekle('ad'); let boyut = null;
      if (op('(')) { al(); boyut = []; if (!op(')')) for (;;) { let alt = null, ust = ifade(); if (kw('TO')) { al(); alt = ust; ust = ifade(); } boyut.push({ alt, ust }); if (op(',')) { al(); continue; } break; } bekle('op', ')'); }
      tipAtla(); out.push({ ad: a.v, boyut, no: a.no });
      if (op(',')) { al(); continue; } return out;
    }
  }
  function deyim() {
    const x = bak(), no = x.no;
    if (x.t === 'kw') {
      switch (x.v) {
        case 'DIM': case 'PUBLIC': case 'PRIVATE': al(); if (kw('CONST')) { al(); return constD(no); } return { t: 'dim', liste: dimListesi(), no };
        case 'REDIM': al(); return { t: 'redim', liste: dimListesi(), no };
        case 'CONST': al(); return constD(no);
        case 'SET': { al(); const hedef = sonek(birincil()); bekle('op', '='); return { t: 'atama', hedef, e: ifade(), set: true, no }; }
        case 'IF': return ifD();
        case 'FOR': return forD();
        case 'DO': return doD();
        case 'WHILE': { al(); const k = ifade(); const g = blok(() => kw('WEND')); al(); return { t: 'do', kosul: k, tur: 'while', bas: true, govde: g, no }; }
        case 'SELECT': return selectD();
        case 'WITH': { al(); const nesne = ifade(); const g = blok(() => kw('END') && bak(1).v === 'WITH'); al(); al(); return { t: 'with', nesne, govde: g, no }; }
        case 'EXIT': { al(); const k = al(); return { t: 'exit', tur: k.v, no }; }
        case 'CALL': { al(); const e = sonek(birincil()); return { t: 'cagriD', e, no }; }
        case 'ON': { al(); bekle('kw', 'ERROR'); if (kw('RESUME')) { al(); al(); return { t: 'onerror', devam: true, no }; } bekle('kw', 'GOTO'); const h = al(); return { t: 'onerror', devam: false, sifirla: h.v === 0, no }; }
        case 'OPTION': al(); al(); return { t: 'bos' };
        case 'END': { const n = bak(1).v; throw new VbaHata(n === 'SUB' || n === 'FUNCTION' ? `End ${n === 'SUB' ? 'Sub' : 'Function'} geldi ama açık bir blok kapanmamış: End If, Next, Loop, End With ya da End Select eksik` : `"End ${n ?? ''}" burada beklenmiyor: açılmamış bir bloğu kapatıyor`, no); }
        case 'NEXT': throw new VbaHata('Next var ama For yok (ya da For içindeki bir If kapanmamış)', no);
        case 'LOOP': throw new VbaHata('Loop var ama Do yok', no);
        case 'ELSE': case 'ELSEIF': throw new VbaHata('Else/ElseIf bir If bloğunun içinde olmalı', no);
        default: throw new VbaHata(`Burada "${x.v}" beklenmiyor`, no);
      }
    }
    // atama ya da çağrı
    const hedef = sonek(birincil());
    if (op('=')) { al(); return { t: 'atama', hedef, e: ifade(), no }; }
    // Parantezsiz çağrı: Range("A1").ClearContents  /  MsgBox "x"  /  AltSub 1, 2
    if (hedef.t === 'cagri' && satirBitti()) return { t: 'cagriD', e: hedef, no };
    const args = parantezsizArg();
    return { t: 'cagriD', e: args.length ? { t: 'cagri', hedef, args, no, parantezsiz: true } : hedef, no };
  }
  function constD(no) { const a = bekle('ad'); tipAtla(); bekle('op', '='); return { t: 'const', ad: a.v, e: ifade(), no }; }
  function ifD() {
    const no = al().no; const k = ifade(); bekle('kw', 'THEN');
    if (!satirBitti()) { // tek satırlık If
      const ds = [deyim()]; while (bak().t === 'ayr') { al(); if (kw('ELSE')) break; ds.push(deyim()); }
      let degil = null; if (kw('ELSE')) { al(); degil = [deyim()]; while (bak().t === 'ayr') { al(); degil.push(deyim()); } }
      return { t: 'if', dallar: [{ k, g: ds }], degil, no };
    }
    const dallar = [{ k, g: blok(() => kw('ELSEIF') || kw('ELSE') || (kw('END') && bak(1).v === 'IF')) }]; let degil = null;
    for (;;) {
      if (kw('ELSEIF')) { al(); const k2 = ifade(); bekle('kw', 'THEN'); dallar.push({ k: k2, g: blok(() => kw('ELSEIF') || kw('ELSE') || (kw('END') && bak(1).v === 'IF')) }); continue; }
      if (kw('ELSE')) { al(); degil = blok(() => kw('END') && bak(1).v === 'IF'); }
      bekle('kw', 'END'); bekle('kw', 'IF'); return { t: 'if', dallar, degil, no };
    }
  }
  function forD() {
    const no = al().no;
    if (kw('EACH')) { al(); const d = bekle('ad').v; bekle('kw', 'IN'); const kume = ifade(); const g = blok(() => kw('NEXT')); al(); if (bak().t === 'ad') al(); return { t: 'foreach', d, kume, govde: g, no }; }
    const d = bekle('ad').v; bekle('op', '='); const bas = ifade(); bekle('kw', 'TO'); const son = ifade(); let adim = null; if (kw('STEP')) { al(); adim = ifade(); }
    const g = blok(() => kw('NEXT')); al(); if (bak().t === 'ad') al();
    return { t: 'for', d, bas, son, adim, govde: g, no };
  }
  function doD() {
    const no = al().no; let kosul = null, tur = null, basta = true;
    if (kw('WHILE') || kw('UNTIL')) { tur = al().v.toLowerCase(); kosul = ifade(); }
    const g = blok(() => kw('LOOP')); al();
    if (!kosul && (kw('WHILE') || kw('UNTIL'))) { tur = al().v.toLowerCase(); kosul = ifade(); basta = false; }
    return { t: 'do', kosul, tur, bas: basta, govde: g, no };
  }
  function selectD() {
    const no = al().no; bekle('kw', 'CASE'); const e = ifade(); const durumlar = []; let degil = null;
    satirSonu();
    while (kw('CASE')) {
      al();
      if (kw('ELSE')) { al(); degil = blok(() => kw('CASE') || (kw('END') && bak(1).v === 'SELECT')); continue; }
      const kosullar = [];
      for (;;) {
        if (kw('IS')) { al(); const o = al().v; kosullar.push({ o, e: ifade() }); }
        else { const a = ifade(); if (kw('TO')) { al(); kosullar.push({ o: 'to', e: a, e2: ifade() }); } else kosullar.push({ o: '=', e: a }); }
        if (op(',')) { al(); continue; } break;
      }
      durumlar.push({ kosullar, g: blok(() => kw('CASE') || (kw('END') && bak(1).v === 'SELECT')) });
    }
    bekle('kw', 'END'); bekle('kw', 'SELECT');
    return { t: 'select', e, durumlar, degil, no };
  }
  // ---- modül: Sub ve Function tanımları
  const yordamlar = {};
  satirSonu();
  while (bak().t !== 'son') {
    if (kw('OPTION')) { al(); al(); satirSonu(); continue; }
    if (kw('PUBLIC') || kw('PRIVATE')) al();
    if (kw('DIM') || kw('CONST')) { throw new VbaHata('Modül düzeyinde değişken bu sürümde desteklenmiyor; Sub içinde tanımlayın', bak().no); }
    const tur = bak().v; if (tur !== 'SUB' && tur !== 'FUNCTION') throw new VbaHata('Kod Sub ya da Function ile başlamalı (ör. Sub Rapor())', bak().no);
    const no = al().no; const ad = bekle('ad').v; const parametreler = [];
    if (op('(')) { al(); if (!op(')')) for (;;) { while (kw('BYVAL') || kw('BYREF') || kw('OPTIONAL')) al(); const pa = bekle('ad').v; tipAtla(); let vars = null; if (op('=')) { al(); vars = ifade(); } parametreler.push({ ad: pa, vars }); if (op(',')) { al(); continue; } break; } bekle('op', ')'); }
    tipAtla();
    const govde = blok(() => kw('END') && (bak(1).v === tur));
    al(); al(); satirSonu();
    yordamlar[BUYUK(ad)] = { ad, tur, parametreler, govde, no };
  }
  return yordamlar;
}

/* ================================================================ nesne modeli */
class Aralik {
  constructor(m, sayfa, r1, c1, r2 = r1, c2 = c1) { this.m = m; this.sayfa = sayfa; this.r1 = Math.min(r1, r2); this.c1 = Math.min(c1, c2); this.r2 = Math.max(r1, r2); this.c2 = Math.max(c1, c2); }
  get tek() { return this.r1 === this.r2 && this.c1 === this.c2; }
  adres(mutlak = true) { const a = (r, c) => mutlak ? '$' + sutunHarf(c) + '$' + r : adres(r, c); return this.tek ? a(this.r1, this.c1) : a(this.r1, this.c1) + ':' + a(this.r2, this.c2); }
}
class Sayfa { constructor(m, ad) { this.m = m; this.ad = ad; } }
class Nesne { constructor(tur, veri = {}) { this.tur = tur; Object.assign(this, veri); } }
const XL = { XLUP: -4162, XLDOWN: -4121, XLTOLEFT: -4159, XLTORIGHT: -4161, VBCRLF: '\r\n', VBNEWLINE: '\r\n', VBLF: '\n', VBTAB: '\t', VBCR: '\r', VBYES: 6, VBNO: 7, VBOK: 1, VBOKONLY: 0, VBYESNO: 4, VBINFORMATION: 64, VBEXCLAMATION: 48, VBCRITICAL: 16, VBQUESTION: 32,
  VBRED: 255, VBGREEN: 65280, VBBLUE: 16711680, VBYELLOW: 65535, VBWHITE: 16777215, VBBLACK: 0, XLFILLDEFAULT: 0, XLNONE: -4142, XLCELLTYPEBLANKS: 4, XLVALUES: -4163, XLPASTEVALUES: -4163, XLASCENDING: 1, XLDESCENDING: 2, XLYES: 1, XLNO: 2, XLTOP: -4160 };

/* ================================================================ çalıştırıcı */
export class Makro {
  // secenek: { kitap, sayfa (etkin sayfa), girdiler: InputBox cevapları, bugun }
  constructor(kod, secenek) {
    this.kod = kod; this.yordamlar = ayristir(kod);
    this.k = secenek.kitap; this.etkin = secenek.sayfa || [...this.k.sayfalar.keys()][0];
    this.girdiler = [...(secenek.girdiler || [])]; this.bugun = secenek.bugun ?? 45900;
    this.cikti = []; this.adim = 0; this.yazilan = 0; this.secim = null; this.stiller = this.k.stiller || (this.k.stiller = new Map());
    this.hataDevam = false;
  }
  calistir(ad) {
    const ys = Object.values(this.yordamlar).filter(y => y.tur === 'SUB');
    const y = ad ? this.yordamlar[BUYUK(ad)] : ys[0];
    if (!y) throw new VbaHata(ad ? `"${ad}" adlı Sub yok` : 'Çalıştırılacak Sub yok', 1);
    try { this.cagir(y, []); }
    finally { this.k.hesapla(); }
    return { cikti: this.cikti, adim: this.adim, yazilan: this.yazilan };
  }
  sayac(no) { if (++this.adim > VBA_SINIR.adim) throw new VbaHata('Makro çok uzun sürdü (sonsuz döngü olabilir: döngü değişkeni artıyor mu, koşul bir gün yanlış oluyor mu?)', no); }
  yaz(metin, tur = 'msgbox') { if (this.cikti.length < VBA_SINIR.cikti) this.cikti.push({ tur, metin: String(metin) }); }

  cagir(y, argDegerleri) {
    const kapsam = { degisken: new Map(), with: [] };
    y.parametreler.forEach((p, i) => kapsam.degisken.set(BUYUK(p.ad), argDegerleri[i] !== undefined ? argDegerleri[i] : p.vars ? this.deger(p.vars, kapsam) : BOS));
    if (y.tur === 'FUNCTION') kapsam.degisken.set(BUYUK(y.ad), BOS);
    try { this.blok(y.govde, kapsam); }
    catch (e) { if (!(e instanceof Cikis && (e.tur === 'SUB' || e.tur === 'FUNCTION'))) throw e; }
    return y.tur === 'FUNCTION' ? kapsam.degisken.get(BUYUK(y.ad)) : BOS;
  }
  blok(ds, k) { for (const d of ds) this.deyim(d, k); }
  deyim(d, k) {
    this.sayac(d.no);
    try { return this.deyimIc(d, k); }
    catch (e) {
      if (e instanceof Cikis) throw e;
      if (this.hataDevam && !(e.message || '').startsWith('Makro çok uzun')) return; // On Error Resume Next
      if (e instanceof VbaHata) { if (e.satir == null) e.satir = d.no; throw e; }
      throw new VbaHata(e.message, d.no);
    }
  }
  deyimIc(d, k) {
    switch (d.t) {
      case 'bos': return;
      case 'dim': case 'redim':
        for (const v of d.liste) {
          const ad = BUYUK(v.ad);
          if (v.boyut) {
            const b = v.boyut.map(x => ({ alt: x.alt ? this.sayi(this.deger(x.alt, k)) : 0, ust: this.sayi(this.deger(x.ust, k)) }));
            const eski = k.degisken.get(ad);
            k.degisken.set(ad, yeniDizi(b, d.t === 'redim' && eski instanceof VDizi ? eski : null));
          } else if (d.t === 'dim' && !k.degisken.has(ad)) k.degisken.set(ad, BOS);
        }
        return;
      case 'const': k.degisken.set(BUYUK(d.ad), this.deger(d.e, k)); return;
      case 'atama': return this.ata(d.hedef, this.deger(d.e, k, d.set), k, d.set);
      case 'cagriD': { const v = this.deger(d.e, k, false, true); return; }
      case 'if': {
        for (const dal of d.dallar) if (this.mantik(this.deger(dal.k, k))) return this.blok(dal.g, k);
        if (d.degil) this.blok(d.degil, k); return;
      }
      case 'for': {
        const ad = BUYUK(d.d), bas = this.sayi(this.deger(d.bas, k)), son = this.sayi(this.deger(d.son, k)), adim = d.adim ? this.sayi(this.deger(d.adim, k)) : 1;
        if (adim === 0) throw new VbaHata('Step 0 sonsuz döngüdür', d.no);
        k.degisken.set(ad, bas);
        try {
          while (adim > 0 ? k.degisken.get(ad) <= son : k.degisken.get(ad) >= son) {
            this.sayac(d.no); this.blok(d.govde, k);
            k.degisken.set(ad, k.degisken.get(ad) + adim);
          }
        } catch (e) { if (!(e instanceof Cikis && e.tur === 'FOR')) throw e; }
        return;
      }
      case 'foreach': {
        const kume = this.deger(d.kume, k, true), ad = BUYUK(d.d);
        let ogeler;
        if (kume instanceof Aralik) { ogeler = []; for (let r = kume.r1; r <= kume.r2; r++) for (let c = kume.c1; c <= kume.c2; c++) ogeler.push(new Aralik(this, kume.sayfa, r, c)); }
        else if (kume instanceof VDizi) ogeler = kume.duz();
        else if (kume instanceof Nesne && kume.tur === 'sayfalar') ogeler = [...this.k.sayfalar.keys()].map(a => new Sayfa(this, a));
        else throw new VbaHata('For Each yalnız aralık, dizi ya da Worksheets üzerinde çalışır', d.no);
        if (ogeler.length > VBA_SINIR.hucre) throw new VbaHata('Aralık çok büyük; tam sütun (A:A) yerine veri olan aralığı verin', d.no);
        try { for (const o of ogeler) { this.sayac(d.no); k.degisken.set(ad, o); this.blok(d.govde, k); } }
        catch (e) { if (!(e instanceof Cikis && e.tur === 'FOR')) throw e; }
        return;
      }
      case 'do': {
        const kontrol = () => { if (!d.kosul) return true; const m = this.mantik(this.deger(d.kosul, k)); return d.tur === 'while' ? m : !m; };
        try {
          if (d.bas) while (kontrol()) { this.sayac(d.no); this.blok(d.govde, k); }
          else do { this.sayac(d.no); this.blok(d.govde, k); } while (kontrol());
        } catch (e) { if (!(e instanceof Cikis && e.tur === 'DO')) throw e; }
        return;
      }
      case 'select': {
        const v = this.deger(d.e, k);
        for (const durum of d.durumlar) {
          for (const kk of durum.kosullar) {
            const a = this.deger(kk.e, k);
            const ok = kk.o === 'to' ? karsi(v, a) >= 0 && karsi(v, this.deger(kk.e2, k)) <= 0 : karsilastirOp(kk.o, v, a);
            if (ok) return this.blok(durum.g, k);
          }
        }
        if (d.degil) this.blok(d.degil, k); return;
      }
      case 'with': { const n = this.deger(d.nesne, k, true); k.with.push(n); try { this.blok(d.govde, k); } finally { k.with.pop(); } return; }
      case 'exit': throw new Cikis(d.tur);
      case 'onerror': this.hataDevam = d.devam; return;
    }
    throw new VbaHata('Desteklenmeyen deyim', d.no);
  }

  /* ---------------- değerlendirme */
  // nesneIste: atama sağ tarafı Set ise ya da zincirin ortasındaysa nesne döner; değilse varsayılan özellik (.Value)
  deger(e, k, nesneIste = false, deyimMi = false) {
    switch (e.t) {
      case 'sabit': return e.v;
      case 'neg': return -this.sayi(this.deger(e.a, k));
      case 'not': { const v = this.deger(e.a, k); return typeof v === 'boolean' || v === BOS ? !this.mantik(v) : ~this.sayi(v); }
      case 'ikili': return this.ikili(e, k);
      case 'ad': { const v = this.adCoz(e.ad, [], k, e.no, deyimMi, false); return nesneIste ? v : this.varsayilan(v); }
      case 'uye': { const n = e.nesne.t === 'with' ? this.withNesne(k, e.no) : this.deger(e.nesne, k, true); const v = this.ozellik(n, e.ad, null, e.no, k); return nesneIste ? v : this.varsayilan(v); }
      case 'cagri': {
        const args = e.args.map(a => ({ ad: a.ad, v: a.e ? this.deger(a.e, k, true) : undefined }));
        let v;
        if (e.hedef.t === 'ad') v = this.adCoz(e.hedef.ad, args, k, e.no, deyimMi, true);
        else if (e.hedef.t === 'uye') { const n = e.hedef.nesne.t === 'with' ? this.withNesne(k, e.no) : this.deger(e.hedef.nesne, k, true); v = this.ozellik(n, e.hedef.ad, args, e.no, k); }
        else { const n = this.deger(e.hedef, k, true); v = this.varsayilanCagri(n, args, e.no); }
        return nesneIste ? v : this.varsayilan(v);
      }
    }
    throw new VbaHata('İfade anlaşılamadı', e.no);
  }
  withNesne(k, no) { if (!k.with.length) throw new VbaHata('Nokta ile başlayan ifade yalnız With bloğunda kullanılır', no); return k.with[k.with.length - 1]; }
  varsayilan(v) { if (v instanceof Aralik) return v.tek ? this.hucreOku(v.sayfa, v.r1, v.c1) : this.aralikDizi(v); return v; }
  varsayilanCagri(n, args, no) {
    if (n instanceof Aralik) return this.goreliHucre(n, args, no);
    if (n instanceof VDizi) return n.al(args.map(a => this.sayi(this.varsayilan(a.v))), no);
    throw new VbaHata('Bu nesne çağrılamaz', no);
  }
  ikili(e, k) {
    const o = e.o;
    if (o === 'AND' || o === 'OR' || o === 'XOR') {
      const a = this.deger(e.a, k), b = this.deger(e.b, k);
      if (typeof a === 'boolean' || typeof b === 'boolean' || a === BOS || b === BOS) { const x = this.mantik(a), y = this.mantik(b); return o === 'AND' ? x && y : o === 'OR' ? x || y : x !== y; }
      const x = this.sayi(a), y = this.sayi(b); return o === 'AND' ? x & y : o === 'OR' ? x | y : x ^ y;
    }
    if (o === 'IS') { const a = this.deger(e.a, k, true), b = this.deger(e.b, k, true); return a === b || (a == null && b == null); }
    const a = this.deger(e.a, k), b = this.deger(e.b, k);
    if (hataMi(a)) throw new VbaHata(`Hücrede hata değeri var (${HATA_TR[a.kod] || a.kod}); işlem yapılamaz (Tür uyuşmazlığı)`, e.no);
    if (hataMi(b)) throw new VbaHata(`Hücrede hata değeri var (${HATA_TR[b.kod] || b.kod}); işlem yapılamaz (Tür uyuşmazlığı)`, e.no);
    switch (o) {
      case '&': return this.metin(a) + this.metin(b);
      case '+': if (typeof a === 'string' && typeof b === 'string') return a + b; return this.sayi(a, e.no) + this.sayi(b, e.no);
      case '-': return this.sayi(a, e.no) - this.sayi(b, e.no);
      case '*': return this.sayi(a, e.no) * this.sayi(b, e.no);
      case '/': { const y = this.sayi(b, e.no); if (y === 0) throw new VbaHata('Sıfıra bölme (çalışma zamanı hatası 11)', e.no); return this.sayi(a, e.no) / y; }
      case '\\': { const y = bankaci(this.sayi(b, e.no)); if (y === 0) throw new VbaHata('Sıfıra bölme', e.no); return Math.trunc(bankaci(this.sayi(a, e.no)) / y); }
      case 'MOD': { const y = bankaci(this.sayi(b, e.no)); if (y === 0) throw new VbaHata('Sıfıra bölme', e.no); return bankaci(this.sayi(a, e.no)) % y; }
      case '^': return Math.pow(this.sayi(a, e.no), this.sayi(b, e.no));
      case 'LIKE': return likeRe(this.metin(b)).test(this.metin(a));
      default: return karsilastirOp(o, a, b);
    }
  }
  sayi(v, no) {
    if (typeof v === 'number') return v; if (typeof v === 'boolean') return v ? -1 : 0; if (v === BOS || v === null) return 0;
    if (typeof v === 'string') { const t = v.trim(); if (t === '') throw new VbaHata('Tür uyuşmazlığı: boş metin sayı değil', no); const n = Number(t.replace(',', '.')); if (Number.isFinite(n)) return n; throw new VbaHata(`Tür uyuşmazlığı: "${v}" sayı değil`, no); }
    if (hataMi(v)) throw new VbaHata('Tür uyuşmazlığı: hücrede hata değeri var', no);
    throw new VbaHata('Tür uyuşmazlığı', no);
  }
  metin(v) { if (v === BOS || v === null) return ''; if (typeof v === 'boolean') return v ? 'True' : 'False'; if (typeof v === 'number') return sayiMetni(v); if (hataMi(v)) return 'Error ' + v.kod; return String(v); }
  mantik(v) { if (typeof v === 'boolean') return v; if (v === BOS) return false; if (typeof v === 'string') { const b = BUYUK(v); if (b === 'TRUE' || b === 'DOĞRU') return true; if (b === 'FALSE' || b === 'YANLIŞ') return false; } return this.sayi(v) !== 0; }

  /* ---------------- hücre okuma/yazma */
  sayfaAd(s) { return s instanceof Sayfa ? s.ad : this.etkin; }
  hucreOku(sayfa, r, c) { const v = this.k.hucre(sayfa, r, c); return v == null ? BOS : v; }
  aralikDizi(a) { const v = []; for (let r = a.r1; r <= a.r2; r++) { const s = []; for (let c = a.c1; c <= a.c2; c++) s.push(this.hucreOku(a.sayfa, r, c)); v.push(s); } return VDizi.ikiBoyut(v); }
  hucreYaz(a, deger, tur = 'deger') {
    const say = (a.r2 - a.r1 + 1) * (a.c2 - a.c1 + 1);
    if ((this.yazilan += say) > VBA_SINIR.hucre) throw new VbaHata('Makro 300.000\'den fazla hücre yazdı. Sonsuz döngü olabilir (döngü değişkeni artıyor mu?) ya da tam sütun (A:A) gibi çok büyük bir aralık kullanılmış olabilir.');
    if (deger instanceof VDizi) { // Range("A1:B2").Value = dizi
      const d = deger.ikiBoyutlu();
      for (let r = a.r1; r <= a.r2; r++) for (let c = a.c1; c <= a.c2; c++) { const x = d[r - a.r1]?.[c - a.c1]; this.tekYaz(a.sayfa, r, c, x, tur); }
      return;
    }
    for (let r = a.r1; r <= a.r2; r++) for (let c = a.c1; c <= a.c2; c++) {
      // Çok hücreli aralığa tek formül: Excel her hücre için göreli kaydırır
      if ((tur === 'formul' || tur === 'formulYerel') && typeof deger === 'string' && deger.startsWith('=')) this.tekYaz(a.sayfa, r, c, kaydirA1(deger, r - a.r1, c - a.c1), tur);
      else if (tur === 'r1c1') this.tekYaz(a.sayfa, r, c, r1c1denA1(deger, r, c), 'formul');
      else this.tekYaz(a.sayfa, r, c, deger, tur);
    }
  }
  tekYaz(sayfa, r, c, v, tur) {
    if (v === BOS || v === null || v === '') { this.k.yaz(sayfa, { r, c }, null); return; }
    if (typeof v === 'string' && v.startsWith('=') && v.length > 1) {
      // .Value = "=SUM(...)" de formül olur (Excel gibi). .Formula İngilizce, .FormulaLocal Türkçe beklenir; motor ikisini de okur.
      this.k.yaz(sayfa, { r, c }, v); return;
    }
    if (typeof v === 'string' && tur !== 'metin') { // Excel metni sayıya çevirmeye çalışır (bölge ayarı TR)
      const t = v.trim(); if (/^-?\d+([.,]\d+)?$/.test(t) && !/^0\d/.test(t)) { this.k.yaz(sayfa, { r, c }, Number(t.replace(',', '.'))); return; }
    }
    if (hataMi(v) || typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string') { this.k.yaz(sayfa, { r, c }, v); return; }
    throw new VbaHata('Hücreye bu tür değer yazılamaz');
  }
  stil(a, ozellik, deger) {
    for (let r = a.r1; r <= a.r2; r++) for (let c = a.c1; c <= a.c2; c++) { const k = a.sayfa + '!' + r + ',' + c; const s = { ...(this.stiller.get(k) || {}) }; if (deger === null) delete s[ozellik]; else s[ozellik] = deger; this.stiller.set(k, s); }
  }
  stilOku(a, ozellik) { const s = this.stiller.get(a.sayfa + '!' + a.r1 + ',' + a.c1) || {}; return s[ozellik] ?? (ozellik === 'kalin' || ozellik === 'italik' ? false : ozellik === 'dolgu' ? XL.VBWHITE : ozellik === 'yaziRenk' ? 0 : 'General'); }
  goreliHucre(a, args, no) {
    const r = this.sayi(this.varsayilan(args[0]?.v), no); let c = args[1] ? args[1].v : 1;
    c = typeof c === 'string' ? harfSutun(c) : this.sayi(this.varsayilan(c), no);
    if (args.length === 1 && !a.tek) { const gen = a.c2 - a.c1 + 1, i = r - 1; return this.hucreKontrol(new Aralik(this, a.sayfa, a.r1 + Math.floor(i / gen), a.c1 + (i % gen)), no); }
    return this.hucreKontrol(new Aralik(this, a.sayfa, a.r1 + r - 1, a.c1 + c - 1), no);
  }
  hucreKontrol(a, no) { if (a.r1 < 1 || a.c1 < 1 || a.r2 > VBA_SINIR.satir || a.c2 > VBA_SINIR.sutun) throw new VbaHata('Uygulama tanımlı ya da nesne tanımlı hata (1004): sayfanın dışında bir hücre (satır ya da sütun 0 ya da eksi olabilir)', no); return a; }
  aralikMetni(sayfa, m, no) {
    const s = String(m).replace(/\$/g, '');
    if (/^[A-Z]+:[A-Z]+$/i.test(s)) { const [a, b] = s.split(':'); return new Aralik(this, sayfa, 1, harfSutun(a), VBA_SINIR.satir, harfSutun(b)); }
    if (/^\d+:\d+$/.test(s)) { const [a, b] = s.split(':').map(Number); return new Aralik(this, sayfa, a, 1, b, VBA_SINIR.sutun); }
    const x = s.includes(':') ? alanCoz(s) : (() => { const p = adresCoz(s); return p && { r1: p.r, c1: p.c, r2: p.r, c2: p.c }; })();
    if (!x) throw new VbaHata(`Geçersiz aralık: "${m}" (Range("A1") ya da Range("A1:B10") biçiminde yazın)`, no);
    return new Aralik(this, sayfa, x.r1, x.c1, x.r2, x.c2);
  }

  /* ---------------- adlar: değişken, sabit, işlev, nesne */
  adCoz(ad, args, k, no, deyimMi, parantezli) {
    const b = BUYUK(ad);
    if (k.degisken.has(b)) {
      const v = k.degisken.get(b);
      if (args.length && v instanceof VDizi) return v.al(args.map(a => this.sayi(this.varsayilan(a.v), no)), no);
      if (args.length && v instanceof Aralik) return this.goreliHucre(v, args, no);
      if (!args.length || !this.yordamlar[b]) return v;
    }
    if (this.yordamlar[b]) return this.cagir(this.yordamlar[b], args.map(a => this.varsayilan(a.v)));
    if (b in XL) return XL[b];
    const sayfa = this.etkin;
    switch (b) {
      case 'RANGE': {
        if (args.length === 2) { const a1 = args[0].v, a2 = args[1].v; const p = x => x instanceof Aralik ? x : this.aralikMetni(sayfa, x, no); const x = p(a1), y = p(a2); return new Aralik(this, x.sayfa, Math.min(x.r1, y.r1), Math.min(x.c1, y.c1), Math.max(x.r2, y.r2), Math.max(x.c2, y.c2)); }
        return this.aralikMetni(sayfa, this.varsayilan(args[0]?.v), no);
      }
      case 'CELLS': if (!args.length) return new Aralik(this, sayfa, 1, 1, VBA_SINIR.satir, VBA_SINIR.sutun); return this.goreliHucre(new Aralik(this, sayfa, 1, 1), args, no);
      case 'ROWS': return args.length ? this.satirSutun(new Aralik(this, sayfa, 1, 1, VBA_SINIR.satir, VBA_SINIR.sutun), 'ROWS', args, no) : new Nesne('satirlar', { a: new Aralik(this, sayfa, 1, 1, VBA_SINIR.satir, VBA_SINIR.sutun) });
      case 'COLUMNS': return args.length ? this.satirSutun(new Aralik(this, sayfa, 1, 1, VBA_SINIR.satir, VBA_SINIR.sutun), 'COLUMNS', args, no) : new Nesne('sutunlar', { a: new Aralik(this, sayfa, 1, 1, VBA_SINIR.satir, VBA_SINIR.sutun) });
      case 'ACTIVESHEET': return new Sayfa(this, this.etkin);
      case 'ACTIVECELL': return this.secim ? new Aralik(this, this.secim.sayfa, this.secim.r1, this.secim.c1) : new Aralik(this, sayfa, 1, 1);
      case 'SELECTION': return this.secim || new Aralik(this, sayfa, 1, 1);
      case 'WORKSHEETS': case 'SHEETS': return args.length ? this.sayfaBul(this.varsayilan(args[0].v), no) : new Nesne('sayfalar');
      case 'THISWORKBOOK': case 'ACTIVEWORKBOOK': return new Nesne('kitap');
      case 'APPLICATION': return new Nesne('uygulama');
      case 'WORKSHEETFUNCTION': return new Nesne('wsf');
      case 'DEBUG': return new Nesne('debug');
      case 'MSGBOX': { const m = this.metin(this.varsayilan(args[0]?.v)); this.yaz(m, 'msgbox'); const tur = args[1] ? this.sayi(this.varsayilan(args[1].v)) : 0; return (tur & 7) === 4 ? XL.VBYES : XL.VBOK; }
      case 'INPUTBOX': { const g = this.girdiler.shift(); this.yaz('InputBox: ' + this.metin(this.varsayilan(args[0]?.v)) + ' → ' + (g ?? ''), 'girdi'); return g ?? ''; }
    }
    if (YERLESIK[b]) return YERLESIK[b].call(this, args.map(a => this.varsayilan(a.v)), no);
    if (!parantezli && !deyimMi && !args.length) {
      // Option Explicit yokken tanımsız değişken Empty'dir (VBA davranışı)
      return BOS;
    }
    throw new VbaHata(`"${ad}" tanımlı değil (Sub/Function bulunamadı, ya da bu sürümde desteklenmiyor)`, no);
  }
  sayfaBul(ad, no) {
    if (typeof ad === 'number') { const a = [...this.k.sayfalar.keys()][ad - 1]; if (!a) throw new VbaHata('Alt simge aralık dışında (9): o sırada sayfa yok', no); return new Sayfa(this, a); }
    const s = this.k.sayfaBul(String(ad)); if (!s) throw new VbaHata(`Alt simge aralık dışında (9): "${ad}" adlı sayfa yok`, no);
    return new Sayfa(this, s.ad);
  }
  satirSutun(a, tur, args, no) {
    if (!args || !args.length) return new Nesne(tur === 'ROWS' ? 'satirlar' : 'sutunlar', { a });
    const i = this.varsayilan(args[0].v);
    if (tur === 'ROWS') { const r = typeof i === 'string' ? Number(i.split(':')[0]) : a.r1 + this.sayi(i) - 1; return new Aralik(this, a.sayfa, r, a.c1, typeof i === 'string' ? Number(i.split(':')[1] || r) : r, a.c2); }
    const c = typeof i === 'string' ? harfSutun(i.split(':')[0]) : a.c1 + this.sayi(i) - 1; return new Aralik(this, a.sayfa, a.r1, c, a.r2, typeof i === 'string' ? harfSutun(i.split(':')[1] || i.split(':')[0]) : c);
  }

  /* ---------------- özellik ve yöntemler */
  ozellik(n, adHam, args, no, k) {
    const ad = BUYUK(adHam), A = args || [];
    const arg = (i, adIsim) => { const x = A.find(a => a.ad && BUYUK(a.ad) === adIsim) || A.filter(a => !a.ad)[i]; return x ? x.v : undefined; };
    if (n instanceof Aralik) {
      const a = n;
      switch (ad) {
        case 'VALUE': case 'VALUE2': return a.tek ? this.hucreOku(a.sayfa, a.r1, a.c1) : this.aralikDizi(a);
        case 'TEXT': { const v = this.hucreOku(a.sayfa, a.r1, a.c1); const b = this.stilOku(a, 'sayiBicimi'); return typeof v === 'number' && b !== 'General' ? bicimle(v, b) : this.metin(typeof v === 'number' ? v : v); }
        case 'FORMULA': case 'FORMULALOCAL': { const ic = this.k.icerik(a.sayfa, a.r1, a.c1); return ic == null ? '' : String(ic); }
        case 'HASFORMULA': { const ic = this.k.icerik(a.sayfa, a.r1, a.c1); return typeof ic === 'string' && ic.startsWith('='); }
        case 'ROW': return a.r1;
        case 'COLUMN': return a.c1;
        case 'COUNT': return (a.r2 - a.r1 + 1) * (a.c2 - a.c1 + 1);
        case 'ADDRESS': { const mut = arg(0, 'ROWABSOLUTE'); return a.adres(mut !== false); }
        case 'ROWS': return this.satirSutun(a, 'ROWS', A, no);
        case 'COLUMNS': return this.satirSutun(a, 'COLUMNS', A, no);
        case 'CELLS': return A.length ? this.goreliHucre(a, A, no) : a;
        case 'RANGE': { const ic = this.aralikMetni(a.sayfa, this.varsayilan(arg(0)), no); return new Aralik(this, a.sayfa, a.r1 + ic.r1 - 1, a.c1 + ic.c1 - 1, a.r1 + ic.r2 - 1, a.c1 + ic.c2 - 1); }
        case 'OFFSET': { const dr = this.sayi(this.varsayilan(arg(0, 'ROWOFFSET') ?? 0)), dc = this.sayi(this.varsayilan(arg(1, 'COLUMNOFFSET') ?? 0)); return this.hucreKontrol(new Aralik(this, a.sayfa, a.r1 + dr, a.c1 + dc, a.r2 + dr, a.c2 + dc), no); }
        case 'RESIZE': { const r = arg(0, 'ROWSIZE'), c = arg(1, 'COLUMNSIZE'); return new Aralik(this, a.sayfa, a.r1, a.c1, a.r1 + (r === undefined ? a.r2 - a.r1 : this.sayi(this.varsayilan(r)) - 1), a.c1 + (c === undefined ? a.c2 - a.c1 : this.sayi(this.varsayilan(c)) - 1)); }
        case 'END': return this.son(a, this.sayi(this.varsayilan(arg(0))), no);
        case 'CURRENTREGION': return this.bolge(a);
        case 'ENTIREROW': return new Aralik(this, a.sayfa, a.r1, 1, a.r2, VBA_SINIR.sutun);
        case 'ENTIRECOLUMN': return new Aralik(this, a.sayfa, 1, a.c1, VBA_SINIR.satir, a.c2);
        case 'WORKSHEET': case 'PARENT': return new Sayfa(this, a.sayfa);
        case 'FONT': return new Nesne('yazi', { a });
        case 'INTERIOR': return new Nesne('dolgu', { a });
        case 'NUMBERFORMAT': case 'NUMBERFORMATLOCAL': return this.stilOku(a, 'sayiBicimi');
        case 'SELECT': case 'ACTIVATE': this.secim = a; this.etkin = a.sayfa; return BOS;
        case 'CLEARCONTENTS': this.hucreYaz(a, BOS); return BOS;
        case 'CLEAR': this.hucreYaz(a, BOS); for (const s of ['kalin', 'italik', 'dolgu', 'yaziRenk', 'sayiBicimi']) this.stil(a, s, null); return BOS;
        case 'CLEARFORMATS': for (const s of ['kalin', 'italik', 'dolgu', 'yaziRenk', 'sayiBicimi']) this.stil(a, s, null); return BOS;
        case 'COPY': {
          const hedef = arg(0, 'DESTINATION'); if (!(hedef instanceof Aralik)) { this.pano = a; return BOS; }
          return this.kopyala(a, hedef, 'tum');
        }
        case 'PASTESPECIAL': { if (!this.pano) throw new VbaHata('Önce .Copy ile kopyalayın', no); const tur = arg(0, 'PASTE'); return this.kopyala(this.pano, a, tur === XL.XLPASTEVALUES ? 'deger' : 'tum'); }
        case 'AUTOFILL': case 'FILLDOWN': {
          const hedef = ad === 'FILLDOWN' ? a : arg(0, 'DESTINATION'); if (!(hedef instanceof Aralik)) throw new VbaHata('AutoFill için Destination aralığı gerekir', no);
          const kaynakR = ad === 'FILLDOWN' ? a.r1 : a.r1;
          for (let c = hedef.c1; c <= hedef.c2; c++) {
            const ic = this.k.icerik(hedef.sayfa, kaynakR, c);
            for (let r = Math.max(hedef.r1, kaynakR + 1); r <= hedef.r2; r++) this.tekYaz(hedef.sayfa, r, c, typeof ic === 'string' && ic.startsWith('=') ? kaydirA1(ic, r - kaynakR, 0) : ic, 'deger');
            this.yazilan += hedef.r2 - hedef.r1;
          }
          return BOS;
        }
        case 'FORMULAR1C1': return a1denR1C1(String(this.k.icerik(a.sayfa, a.r1, a.c1) ?? ''), a.r1, a.c1);
        case 'SORT': {
          const anahtar = arg(0, 'KEY1'), duzen = arg(1, 'ORDER1') ?? XL.XLASCENDING, baslik = arg(2, 'HEADER');
          if (!(anahtar instanceof Aralik)) throw new VbaHata('Sort için Key1:=Range("…") gerekir', no);
          return this.sirala(a, anahtar.c1, duzen === XL.XLDESCENDING, baslik === XL.XLYES);
        }
        case 'REMOVEDUPLICATES': { const cols = arg(0, 'COLUMNS'), baslik = arg(1, 'HEADER'); return this.yinelenenSil(a, cols, baslik === XL.XLYES, no); }
        case 'SPECIALCELLS': {
          const tur = this.sayi(this.varsayilan(arg(0)));
          if (tur !== XL.XLCELLTYPEBLANKS) throw new VbaHata('SpecialCells yalnız xlCellTypeBlanks ile destekleniyor', no);
          const bos = []; for (let r = a.r1; r <= a.r2; r++) for (let c = a.c1; c <= a.c2; c++) if (this.k.hucre(a.sayfa, r, c) == null) bos.push([r, c]);
          if (!bos.length) throw new VbaHata('Hücre bulunamadı (1004)', no);
          return new Nesne('hucreListesi', { sayfa: a.sayfa, hucreler: bos });
        }
        case 'DELETE': throw new VbaHata('Satır/hücre silme bu sürümde desteklenmiyor; ClearContents kullanın', no);
        case 'NAME': return a.adres();
      }
      throw new VbaHata(`Range nesnesinde "${adHam}" bu sürümde desteklenmiyor`, no);
    }
    if (n instanceof Sayfa) {
      switch (ad) {
        case 'RANGE': { const a1 = arg(0), a2 = arg(1); const p = x => x instanceof Aralik ? x : this.aralikMetni(n.ad, this.varsayilan(x), no); if (a2 !== undefined) { const x = p(a1), y = p(a2); return new Aralik(this, n.ad, Math.min(x.r1, y.r1), Math.min(x.c1, y.c1), Math.max(x.r2, y.r2), Math.max(x.c2, y.c2)); } return p(a1); }
        case 'CELLS': return A.length ? this.goreliHucre(new Aralik(this, n.ad, 1, 1), A, no) : new Aralik(this, n.ad, 1, 1, VBA_SINIR.satir, VBA_SINIR.sutun);
        case 'ROWS': return this.satirSutun(new Aralik(this, n.ad, 1, 1, VBA_SINIR.satir, VBA_SINIR.sutun), 'ROWS', A, no);
        case 'COLUMNS': return this.satirSutun(new Aralik(this, n.ad, 1, 1, VBA_SINIR.satir, VBA_SINIR.sutun), 'COLUMNS', A, no);
        case 'NAME': return n.ad;
        case 'ACTIVATE': case 'SELECT': this.etkin = n.ad; return BOS;
        case 'USEDRANGE': { const s = this.k.sayfaBul(n.ad); const u = s.kullanilan(); return new Aralik(this, n.ad, 1, 1, Math.max(1, u.r), Math.max(1, u.c)); }
      }
      throw new VbaHata(`Worksheet nesnesinde "${adHam}" desteklenmiyor`, no);
    }
    if (n instanceof Nesne) {
      switch (n.tur) {
        case 'satirlar': case 'sutunlar': if (ad === 'COUNT') return n.tur === 'satirlar' ? n.a.r2 - n.a.r1 + 1 : n.a.c2 - n.a.c1 + 1; break;
        case 'yazi': if (ad === 'BOLD') return this.stilOku(n.a, 'kalin'); if (ad === 'ITALIC') return this.stilOku(n.a, 'italik'); if (ad === 'COLOR') return this.stilOku(n.a, 'yaziRenk'); break;
        case 'dolgu': if (ad === 'COLOR') return this.stilOku(n.a, 'dolgu'); if (ad === 'COLORINDEX') return XL.XLNONE; break;
        case 'debug': if (ad === 'PRINT') { this.yaz(A.map(x => this.metin(this.varsayilan(x.v))).join(' '), 'debug'); return BOS; } break;
        case 'sayfalar':
          if (ad === 'COUNT') return this.k.sayfalar.size;
          if (ad === 'ADD') { let i = 1; while (this.k.sayfaBul('Sayfa' + i)) i++; const s = this.k.sayfa('Sayfa' + i); this.etkin = s.ad; return new Sayfa(this, s.ad); }
          if (ad === 'ITEM') return this.sayfaBul(this.varsayilan(arg(0)), no);
          break;
        case 'kitap': if (ad === 'WORKSHEETS' || ad === 'SHEETS') return A.length ? this.sayfaBul(this.varsayilan(arg(0)), no) : new Nesne('sayfalar'); if (ad === 'NAME') return 'kesit-excel.xlsm'; break;
        case 'uygulama':
          if (ad === 'WORKSHEETFUNCTION') return new Nesne('wsf');
          if (ad === 'SCREENUPDATING' || ad === 'DISPLAYALERTS' || ad === 'ENABLEEVENTS' || ad === 'CALCULATION' || ad === 'STATUSBAR' || ad === 'CUTCOPYMODE') return true;
          if (ad === 'USERNAME') return 'Kesit';
          if (ad === 'INPUTBOX') return this.adCoz('INPUTBOX', A, k, no, false, true);
          if (ISLEVLER[ad]) return this.wsf(ad, A, no, true);
          break;
        case 'wsf': if (ISLEVLER[ad] || islevAdi(ad, ISLEVLER)) return this.wsf(islevAdi(ad, ISLEVLER) || ad, A, no, false); throw new VbaHata(`WorksheetFunction.${adHam} bulunamadı`, no);
        case 'hucreListesi':
          if (ad === 'COUNT') return n.hucreler.length;
          if (ad === 'VALUE') return BOS;
          break;
      }
    }
    if (n instanceof VDizi) throw new VbaHata('Dizinin özelliği yok; eleman için dizi(i) yazın', no);
    if (n === BOS || n === null) throw new VbaHata(`Nesne değişkeni ayarlanmamış (91): "${adHam}" boş bir nesnede çağrıldı (Set unutulmuş olabilir)`, no);
    throw new VbaHata(`"${adHam}" bu nesnede desteklenmiyor`, no);
  }
  // Atama: x = 5 / Range("A1").Value = 5 / .Font.Bold = True / dizi(i) = 3
  ata(hedef, deger, k, set) {
    if (hedef.t === 'ad') { const b = BUYUK(hedef.ad); if (!set && deger instanceof Aralik) deger = this.varsayilan(deger); if (!k.degisken.has(b) && this.yordamlar[b]?.tur !== 'FUNCTION' && (b === 'RANGE' || b === 'CELLS')) throw new VbaHata('Geçersiz atama', hedef.no); k.degisken.set(b, deger); return; }
    if (hedef.t === 'cagri' && hedef.hedef.t === 'ad' && k.degisken.get(BUYUK(hedef.hedef.ad)) instanceof VDizi) {
      const d = k.degisken.get(BUYUK(hedef.hedef.ad)); d.koy(hedef.args.map(a => this.sayi(this.deger(a.e, k), hedef.no)), this.varsayilan(deger), hedef.no); return;
    }
    // Range("A1") = 5, Cells(2,3) = "x"  → .Value
    if (hedef.t === 'cagri') { const n = this.deger(hedef, k, true); if (n instanceof Aralik) { this.hucreYaz(n, this.varsayilan(deger)); return; } throw new VbaHata('Bu ifadeye değer atanamaz', hedef.no); }
    if (hedef.t === 'uye') {
      const n = hedef.nesne.t === 'with' ? this.withNesne(k, hedef.no) : this.deger(hedef.nesne, k, true), ad = BUYUK(hedef.ad);
      const v = deger instanceof Aralik && !set ? this.varsayilan(deger) : deger;
      if (n instanceof Aralik) {
        switch (ad) {
          case 'VALUE': case 'VALUE2': return this.hucreYaz(n, v, 'deger');
          case 'FORMULA': return this.hucreYaz(n, v, 'formul');
          case 'FORMULALOCAL': return this.hucreYaz(n, v, 'formulYerel');
          case 'FORMULAR1C1': return this.hucreYaz(n, v, 'r1c1');
          case 'NUMBERFORMAT': case 'NUMBERFORMATLOCAL': return this.stil(n, 'sayiBicimi', String(v));
          case 'COLUMNWIDTH': case 'ROWHEIGHT': case 'HORIZONTALALIGNMENT': case 'WRAPTEXT': return; // görünüm; yok sayılır
        }
        throw new VbaHata(`Range.${hedef.ad} atanamaz ya da desteklenmiyor`, hedef.no);
      }
      if (n instanceof Nesne) {
        if (n.tur === 'yazi') { if (ad === 'BOLD') return this.stil(n.a, 'kalin', this.mantik(v)); if (ad === 'ITALIC') return this.stil(n.a, 'italik', this.mantik(v)); if (ad === 'COLOR') return this.stil(n.a, 'yaziRenk', this.sayi(v)); if (ad === 'SIZE' || ad === 'NAME') return; }
        if (n.tur === 'dolgu') { if (ad === 'COLOR') return this.stil(n.a, 'dolgu', this.sayi(v)); if (ad === 'COLORINDEX') return this.stil(n.a, 'dolgu', v === XL.XLNONE ? null : 65535); if (ad === 'PATTERN') return; }
        if (n.tur === 'uygulama') return; // ScreenUpdating = False vb.
        if (n.tur === 'hucreListesi' && (ad === 'VALUE' || ad === 'FORMULA' || ad === 'FORMULAR1C1')) { for (const [r, c] of n.hucreler) { const x = ad === 'FORMULAR1C1' ? r1c1denA1(v, r, c) : v; this.tekYaz(n.sayfa, r, c, x, 'deger'); } return; }
      }
      if (n instanceof Sayfa && ad === 'NAME') {
        const s = this.k.sayfaBul(n.ad), yeni = String(v);
        if (this.k.sayfaBul(yeni)) throw new VbaHata(`"${yeni}" adlı sayfa zaten var (1004)`, hedef.no);
        this.k.sayfalar.delete(s.ad); s.ad = yeni; this.k.sayfalar.set(yeni, s); if (this.etkin === n.ad) this.etkin = yeni; n.ad = yeni; return;
      }
      throw new VbaHata(`"${hedef.ad}" atanamaz ya da bu sürümde desteklenmiyor`, hedef.no);
    }
    throw new VbaHata('Geçersiz atama', hedef.no);
  }
  wsf(ad, A, no, uygulama) {
    const f = ISLEVLER[ad]; if (!f) throw new VbaHata(`${ad} işlevi bulunamadı`, no);
    // Aralık bağımsız değişkenleri motorun Bas nesnesine çevrilir
    const bag = { kitap: this.k, sayfa: this.k.sayfaBul(this.etkin), satir: 1, sutun: 1, adim: { n: 0 }, bugun: this.bugun, degisken: null };
    const dugum = v => v instanceof Aralik ? { t: 'ref', sayfa: v.sayfa, tip: 'alan', r1: v.r1, c1: v.c1, r2: Math.min(v.r2, this.k.sayfaBul(v.sayfa)?.kullanilan().r || v.r2), c2: Math.min(v.c2, Math.max(v.c1, this.k.sayfaBul(v.sayfa)?.kullanilan().c || v.c2)) }
      : v instanceof VDizi ? { t: 'dizi', v: v.ikiBoyutlu().map(r => r.map(x => x === BOS ? null : x)) } : v === BOS || v === null ? { t: 'bos' }
      : typeof v === 'number' ? { t: 'num', v } : typeof v === 'boolean' ? { t: 'bool', v } : { t: 'str', v: String(v) };
    const sonuc = this.k.formulDegerlendirAgac(this.etkin, { t: 'fn', ad, args: A.map(a => dugum(a.v)) });
    if (hataMi(sonuc)) { if (uygulama) return sonuc; throw new VbaHata(`WorksheetFunction.${EN_AD(ad)} hata verdi (${HATA_TR[sonuc.kod] || sonuc.kod}); 1004. Hatayı yakalamak için Application.${EN_AD(ad)} kullanın ya da sonucu kontrol edin`, no); }
    return sonuc instanceof Dizi ? VDizi.ikiBoyut(sonuc.v) : sonuc;
  }
  son(a, yon, no) {
    const s = this.k.sayfaBul(a.sayfa), u = s.kullanilan(); const dolu = (r, c) => this.k.hucre(a.sayfa, r, c) != null;
    let r = a.r1, c = a.c1;
    const ilerle = (dr, dc, sinir) => {
      const ilkDolu = dolu(r, c), sonraki = () => dolu(r + dr, c + dc);
      if (ilkDolu && inBounds(r + dr, c + dc) && sonraki()) { while (inBounds(r + dr, c + dc) && dolu(r + dr, c + dc)) { r += dr; c += dc; } }
      else { r += dr; c += dc; while (inBounds(r, c) && !dolu(r, c) && !sinir(r, c)) { r += dr; c += dc; } if (!inBounds(r, c)) { r -= dr; c -= dc; } }
    };
    const inBounds = (rr, cc) => rr >= 1 && cc >= 1 && rr <= VBA_SINIR.satir && cc <= VBA_SINIR.sutun;
    if (yon === XL.XLUP) { if (r > u.r + 1) { r = u.r + 1; } ilerle(-1, 0, (rr) => rr <= 1); }
    else if (yon === XL.XLDOWN) ilerle(1, 0, (rr) => rr > u.r);
    else if (yon === XL.XLTOLEFT) { if (c > u.c + 1) c = u.c + 1; ilerle(0, -1, (rr, cc) => cc <= 1); }
    else if (yon === XL.XLTORIGHT) ilerle(0, 1, (rr, cc) => cc > u.c);
    else throw new VbaHata('End için xlUp, xlDown, xlToLeft ya da xlToRight verin', no);
    // Boş alana düşünce Excel sayfanın kenarına gider
    if (yon === XL.XLDOWN && r > u.r && !dolu(r, c)) r = VBA_SINIR.satir;
    if (yon === XL.XLTORIGHT && c > u.c && !dolu(r, c)) c = VBA_SINIR.sutun;
    return new Aralik(this, a.sayfa, r, c);
  }
  bolge(a) {
    let r1 = a.r1, c1 = a.c1, r2 = a.r2, c2 = a.c2, degisti = true; const dolu = (r, c) => r >= 1 && c >= 1 && this.k.hucre(a.sayfa, r, c) != null;
    const satirDolu = (r, ca, cb) => { for (let c = ca; c <= cb; c++) if (dolu(r, c)) return true; return false; };
    const sutunDolu = (c, ra, rb) => { for (let r = ra; r <= rb; r++) if (dolu(r, c)) return true; return false; };
    let guv = 0;
    while (degisti && guv++ < 2000) { degisti = false;
      if (satirDolu(r1 - 1, c1 - 1, c2 + 1)) { r1--; degisti = true; } if (satirDolu(r2 + 1, c1 - 1, c2 + 1)) { r2++; degisti = true; }
      if (sutunDolu(c1 - 1, r1 - 1, r2 + 1)) { c1--; degisti = true; } if (sutunDolu(c2 + 1, r1 - 1, r2 + 1)) { c2++; degisti = true; } }
    return new Aralik(this, a.sayfa, Math.max(1, r1), Math.max(1, c1), r2, c2);
  }
  kopyala(k, h, tur) {
    const R = k.r2 - k.r1 + 1, C = k.c2 - k.c1 + 1;
    const ic = []; for (let r = 0; r < R; r++) { const s = []; for (let c = 0; c < C; c++) { const x = this.k.icerik(k.sayfa, k.r1 + r, k.c1 + c); s.push(tur === 'deger' ? this.k.hucre(k.sayfa, k.r1 + r, k.c1 + c) : x); } ic.push(s); }
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) { let x = ic[r][c]; if (tur === 'tum' && typeof x === 'string' && x.startsWith('=')) x = kaydirA1(x, h.r1 - k.r1, h.c1 - k.c1); this.tekYaz(h.sayfa, h.r1 + r, h.c1 + c, x == null ? BOS : x, 'deger'); }
    this.yazilan += R * C; return BOS;
  }
  sirala(a, anahtarSutun, azalan, baslik) {
    const r0 = baslik ? a.r1 + 1 : a.r1, satirlar = [];
    for (let r = r0; r <= a.r2; r++) { const s = []; for (let c = a.c1; c <= a.c2; c++) s.push(this.k.icerik(a.sayfa, r, c)); satirlar.push({ s, anahtar: this.k.hucre(a.sayfa, r, anahtarSutun) }); }
    satirlar.sort((p, q) => { const x = p.anahtar, y = q.anahtar; if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1; const c = karsi(x, y); return azalan ? -c : c; });
    satirlar.forEach((st, i) => st.s.forEach((v, j) => this.tekYaz(a.sayfa, r0 + i, a.c1 + j, v == null ? BOS : v, 'deger')));
    return BOS;
  }
  yinelenenSil(a, cols, baslik, no) {
    const sutunlar = cols instanceof VDizi ? cols.duz().map(x => this.sayi(x)) : [this.sayi(this.varsayilan(cols ?? 1))];
    const r0 = baslik ? a.r1 + 1 : a.r1, kalan = [], gor = new Set();
    for (let r = r0; r <= a.r2; r++) { const s = []; for (let c = a.c1; c <= a.c2; c++) s.push(this.k.icerik(a.sayfa, r, c)); const key = JSON.stringify(sutunlar.map(i => { const v = this.k.hucre(a.sayfa, r, a.c1 + i - 1); return typeof v === 'string' ? v.toLocaleLowerCase('tr') : v; })); if (!gor.has(key)) { gor.add(key); kalan.push(s); } }
    for (let r = r0; r <= a.r2; r++) for (let c = a.c1; c <= a.c2; c++) { const x = kalan[r - r0]?.[c - a.c1]; this.tekYaz(a.sayfa, r, c, x == null ? BOS : x, 'deger'); }
    return BOS;
  }
}
const EN_AD = ad => ad.charAt(0) + ad.slice(1).toLowerCase();

/* ================================================================ diziler */
class VDizi {
  constructor(boyutlar) { this.b = boyutlar; this.v = new Map(); }
  static ikiBoyut(v) { const d = new VDizi([{ alt: 1, ust: v.length }, { alt: 1, ust: v[0] ? v[0].length : 0 }]); v.forEach((s, i) => s.forEach((x, j) => d.v.set((i + 1) + ',' + (j + 1), x))); return d; }
  anahtar(i, no) { if (i.length !== this.b.length) throw new VbaHata(`Dizi ${this.b.length} boyutlu; ${i.length} indis verildi`, no); i.forEach((x, k) => { if (x < this.b[k].alt || x > this.b[k].ust) throw new VbaHata(`Alt simge aralık dışında (9): ${x}, sınır ${this.b[k].alt}–${this.b[k].ust}`, no); }); return i.map(Math.round).join(','); }
  al(i, no) { return this.v.get(this.anahtar(i, no)); }
  koy(i, x, no) { this.v.set(this.anahtar(i, no), x); }
  duz() { const out = []; const rec = (k, onek) => { if (k === this.b.length) { out.push(this.v.get(onek.join(','))); return; } for (let x = this.b[k].alt; x <= this.b[k].ust; x++) rec(k + 1, [...onek, x]); }; rec(0, []); return out; }
  ikiBoyutlu() { if (this.b.length === 1) return [Array.from({ length: this.b[0].ust - this.b[0].alt + 1 }, (_, j) => this.v.get(String(this.b[0].alt + j)))]; const out = []; for (let r = this.b[0].alt; r <= this.b[0].ust; r++) { const s = []; for (let c = this.b[1].alt; c <= this.b[1].ust; c++) s.push(this.v.get(r + ',' + c)); out.push(s); } return out; }
}
function yeniDizi(b, eski) { const d = new VDizi(b); if (b.reduce((t, x) => t * (x.ust - x.alt + 1), 1) > VBA_SINIR.hucre) throw new VbaHata('Dizi çok büyük'); if (eski) for (const [k, v] of eski.v) d.v.set(k, v); return d; }

/* ================================================================ yerleşik işlevler */
function bankaci(x) { const f = Math.floor(x), k = x - f; if (Math.abs(k - 0.5) < 1e-12) return f % 2 === 0 ? f : f + 1; return Math.round(x); }
function sayiMetni(v) { if (Number.isInteger(v)) return String(v); const s = String(+v.toPrecision(15)); return s.replace('.', ','); } // Türkçe bölge ayarında CStr virgüllüdür
function karsi(a, b) {
  if (a === BOS) a = typeof b === 'string' ? '' : 0; if (b === BOS) b = typeof a === 'string' ? '' : 0;
  if (typeof a === 'number' && typeof b === 'number') return a < b ? -1 : a > b ? 1 : 0;
  if (typeof a === 'boolean' && typeof b === 'boolean') return a === b ? 0 : a ? -1 : 1; // VBA'da True = -1
  if (typeof a === 'number' && typeof b === 'string') { const n = Number(b.replace(',', '.')); if (b.trim() !== '' && Number.isFinite(n)) return a < n ? -1 : a > n ? 1 : 0; return -1; }
  if (typeof a === 'string' && typeof b === 'number') return -karsi(b, a);
  const x = String(a), y = String(b); return x < y ? -1 : x > y ? 1 : 0; // VBA varsayılanı ikili karşılaştırma: büyük/küçük harf duyarlı (Option Compare Binary)
}
function karsilastirOp(o, a, b) { const c = karsi(a, b); return { '=': c === 0, '<>': c !== 0, '<': c < 0, '>': c > 0, '<=': c <= 0, '>=': c >= 0 }[o]; }
function likeRe(p) { return new RegExp('^' + p.replace(/[.+^${}()|\\]/g, '\\$&').replace(/\[!/g, '[^').replace(/\*/g, '.*').replace(/\?/g, '.').replace(/#/g, '\\d') + '$'); }
function vbaFormat(v, b, no) {
  if (b == null) return sayiMetni(v);
  const kod = String(b);
  const ad = { 'GENERAL NUMBER': '0,##########', 'CURRENCY': '#.##0,00 TL', 'FIXED': '0,00', 'STANDARD': '#.##0,00', 'PERCENT': '0,00%', 'SHORT DATE': 'gg.aa.yyyy', 'LONG DATE': 'gg aaaa yyyy gggg' }[kod.toUpperCase()];
  // VBA Format İngilizce kodlar kullanır (dd/mm/yyyy, #,##0.00); Kesit TR biçimleyicisine çevrilir
  const tr = ad || kod.replace(/d/g, 'g').replace(/m(?=[^:]*$)/g, 'a').replace(/y/g, 'y').replace(/h/g, 's').replace(/n/g, 'd').replace(/,(?=\d|#)/g, '§').replace(/\./g, ',').replace(/§/g, '.');
  if (typeof v !== 'number') { const n = Number(String(v).replace(',', '.')); if (!Number.isFinite(n)) return String(v ?? ''); v = n; }
  return bicimle(v, tr);
}
function a1denR1C1(f, r, c) {
  if (!f.startsWith('=')) return f;
  return f.replace(/(\$?)([A-Z]{1,3})(\$?)(\d+)(?![\w(])/g, (m, ac, col, ar, row) => {
    const cc = harfSutun(col), rr = Number(row);
    return 'R' + (ar ? rr : rr === r ? '' : `[${rr - r}]`) + 'C' + (ac ? cc : cc === c ? '' : `[${cc - c}]`);
  });
}
// R1C1 → A1: =RC[-4]*RC[-3]  (kaydedicinin yazdığı biçim)
export function r1c1denA1(f, r, c) {
  const s = String(f); if (!s.startsWith('=')) return s;
  // R[1]C[-2] göreli, R2C3 mutlak ($C$2), RC bu hücre. Dizgi içine dokunulmaz.
  return s.split(/("(?:[^"]|"")*")/).map((p, i) => i % 2 ? p : p.replace(/(?<![A-Za-z])R(\[-?\d+\]|\d+)?C(\[-?\d+\]|\d+)?(?![A-Za-z(])/g, (m, rs, cs) => {
    const rMut = rs != null && !rs.startsWith('['), cMut = cs != null && !cs.startsWith('[');
    const rr = rs == null ? r : rMut ? Number(rs) : r + Number(rs.slice(1, -1));
    const cc = cs == null ? c : cMut ? Number(cs) : c + Number(cs.slice(1, -1));
    return (cMut ? '$' : '') + sutunHarf(cc) + (rMut ? '$' : '') + rr;
  })).join('');
}
function kaydirA1(f, dr, dc) {
  // dizgi içini atlayarak göreli A1 başvurularını kaydır
  let out = '', i = 0; const s = String(f);
  while (i < s.length) {
    if (s[i] === '"') { const j = s.indexOf('"', i + 1); out += s.slice(i, j < 0 ? s.length : j + 1); i = j < 0 ? s.length : j + 1; continue; }
    const m = /^(\$?)([A-Z]{1,3})(\$?)(\d+)(?![\w(])/.exec(s.slice(i));
    if (m && !/[A-Za-zÇĞİÖŞÜçğıöşü_.!]/.test(s[i - 1] || '')) {
      const c = m[1] ? harfSutun(m[2]) : harfSutun(m[2]) + dc, r = m[3] ? Number(m[4]) : Number(m[4]) + dr;
      out += (m[1] || '') + sutunHarf(Math.max(1, c)) + (m[3] || '') + Math.max(1, r); i += m[0].length; continue;
    }
    out += s[i++];
  }
  return out;
}
const YERLESIK = {
  LEN([s]) { return this.metin(s).length; }, LEFT([s, n]) { return this.metin(s).slice(0, this.sayi(n)); }, RIGHT([s, n]) { const t = this.metin(s), k = this.sayi(n); return k <= 0 ? '' : t.slice(-k); },
  MID([s, b, n]) { const t = this.metin(s); return n === undefined ? t.slice(this.sayi(b) - 1) : t.substr(this.sayi(b) - 1, this.sayi(n)); },
  UCASE([s]) { return this.metin(s).toLocaleUpperCase('tr'); }, LCASE([s]) { return this.metin(s).toLocaleLowerCase('tr'); },
  TRIM([s]) { return this.metin(s).replace(/^ +| +$/g, ''); }, LTRIM([s]) { return this.metin(s).replace(/^ +/, ''); }, RTRIM([s]) { return this.metin(s).replace(/ +$/, ''); },
  INSTR(a) { let bas = 1, x, y; if (a.length >= 3 && typeof a[0] === 'number') [bas, x, y] = a; else [x, y] = a; const i = this.metin(x).indexOf(this.metin(y), this.sayi(bas) - 1); return i + 1; },
  REPLACE([s, e, y]) { return this.metin(s).split(this.metin(e)).join(this.metin(y)); },
  SPLIT([s, a]) { const p = this.metin(s).split(a === undefined ? ' ' : this.metin(a)); const d = new VDizi([{ alt: 0, ust: p.length - 1 }]); p.forEach((x, i) => d.v.set(String(i), x)); return d; },
  JOIN([d, a]) { return d.duz().map(x => this.metin(x)).join(a === undefined ? ' ' : this.metin(a)); },
  ARRAY(a) { const d = new VDizi([{ alt: 0, ust: a.length - 1 }]); a.forEach((x, i) => d.v.set(String(i), x)); return d; },
  LBOUND([d, k]) { return d.b[(k ? this.sayi(k) : 1) - 1].alt; }, UBOUND([d, k], no) { if (!(d instanceof VDizi)) throw new VbaHata('UBound bir dizi ister', no); return d.b[(k ? this.sayi(k) : 1) - 1].ust; },
  CSTR([v]) { return this.metin(v); }, CDBL([v]) { return this.sayi(v); }, CSNG([v]) { return this.sayi(v); }, CINT([v]) { return bankaci(this.sayi(v)); }, CLNG([v]) { return bankaci(this.sayi(v)); }, CBOOL([v]) { return this.mantik(v); },
  CDATE([v], no) { if (typeof v === 'number') return v; const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(String(v).trim()); if (!m) throw new VbaHata('Tür uyuşmazlığı: tarih değil', no); return seriden(+m[3], +m[2], +m[1]); },
  VAL([v]) { const m = /^\s*[-+]?\d*\.?\d+/.exec(this.metin(v)); return m ? Number(m[0]) : 0; },
  INT([v]) { return Math.floor(this.sayi(v)); }, FIX([v]) { return Math.trunc(this.sayi(v)); }, ABS([v]) { return Math.abs(this.sayi(v)); }, SQR([v]) { return Math.sqrt(this.sayi(v)); }, SGN([v]) { return Math.sign(this.sayi(v)); },
  // VBA Round bankacı yuvarlamasıdır (2,5 → 2); Excel'in YUVARLA'sı değil. Derste anlatılır.
  ROUND([v, d]) { const k = Math.pow(10, d ? this.sayi(d) : 0); return bankaci(Math.round(this.sayi(v) * k * 1e9) / 1e9) / k; },
  RND() { return 0.5; }, // denetimde tekrarlanabilirlik için sabit
  ISEMPTY([v]) { return v === BOS || v === null; }, ISNUMERIC([v]) { if (typeof v === 'number') return true; if (typeof v !== 'string' || v.trim() === '') return false; return Number.isFinite(Number(v.trim().replace(',', '.'))); },
  ISERROR([v]) { return hataMi(v); }, ISARRAY([v]) { return v instanceof VDizi; }, ISDATE([v]) { return typeof v === 'number' || /^\d{1,2}\.\d{1,2}\.\d{4}$/.test(this.metin(v).trim()); }, ISNULL([v]) { return v === null; },
  NOW() { return this.bugun + 0.5; }, DATE() { return this.bugun; }, TIME() { return 0.5; }, TIMER() { return 43200; },
  YEAR([v]) { return seriye(this.sayi(v)).y; }, MONTH([v]) { return seriye(this.sayi(v)).m; }, DAY([v]) { return seriye(this.sayi(v)).d; }, WEEKDAY([v, t]) { const g = seriye(this.sayi(v)).gs; const ilk = t ? this.sayi(t) : 1; return ((g - (ilk - 1) + 7) % 7) + 1; },
  DATESERIAL([y, m, d]) { return seriden(this.sayi(y), this.sayi(m), this.sayi(d)); },
  DATEADD([b, n, v]) { const x = this.sayi(v), k = this.sayi(n), t = String(b).toLowerCase(); if (t === 'd' || t === 'y' || t === 'w') return x + k; if (t === 'ww') return x + 7 * k; if (t === 'm' || t === 'q' || t === 'yyyy') { const z = seriye(x), ay = z.m + k * (t === 'm' ? 1 : t === 'q' ? 3 : 12); const yy = z.y + Math.floor((ay - 1) / 12), mm = ((ay - 1) % 12 + 12) % 12 + 1; return seriden(yy, mm, Math.min(z.d, new Date(Date.UTC(yy, mm, 0)).getUTCDate())); } throw new VbaHata('DateAdd aralığı: d, ww, m, q, yyyy'); },
  DATEDIFF([b, a, c]) { const x = this.sayi(a), y = this.sayi(c), t = String(b).toLowerCase(); if (t === 'd') return Math.floor(y) - Math.floor(x); if (t === 'm') { const p = seriye(x), q = seriye(y); return (q.y - p.y) * 12 + q.m - p.m; } if (t === 'yyyy') return seriye(y).y - seriye(x).y; if (t === 'ww') return Math.floor((Math.floor(y) - Math.floor(x)) / 7); throw new VbaHata('DateDiff aralığı: d, ww, m, yyyy'); },
  FORMAT([v, b], no) { return vbaFormat(v, b, no); },
  CHR([n]) { return String.fromCharCode(this.sayi(n)); }, ASC([s]) { return this.metin(s).charCodeAt(0); }, SPACE([n]) { return ' '.repeat(this.sayi(n)); }, STRING([n, c]) { return this.metin(c)[0].repeat(this.sayi(n)); },
  STRREVERSE([s]) { return [...this.metin(s)].reverse().join(''); }, STRCOMP([a, b, m]) { const x = this.metin(a), y = this.metin(b); const p = m === 1 ? x.toLocaleLowerCase('tr') : x, q = m === 1 ? y.toLocaleLowerCase('tr') : y; return p < q ? -1 : p > q ? 1 : 0; },
  RGB([r, g, b]) { return this.sayi(r) + this.sayi(g) * 256 + this.sayi(b) * 65536; },
  IIF([k, a, b]) { return this.mantik(k) ? a : b; },
  TYPENAME([v]) { return v === BOS ? 'Empty' : v === null ? 'Nothing' : typeof v === 'number' ? (Number.isInteger(v) ? 'Long' : 'Double') : typeof v === 'string' ? 'String' : typeof v === 'boolean' ? 'Boolean' : v instanceof Aralik ? 'Range' : v instanceof Sayfa ? 'Worksheet' : v instanceof VDizi ? 'Variant()' : hataMi(v) ? 'Error' : 'Object'; },
  CVERR([n]) { return new Hata({ 2007: '#DIV/0!', 2042: '#N/A', 2015: '#VALUE!' }[this.sayi(n)] || '#VALUE!'); },
};

/* ================================================================ dışa açılanlar */
export function makroCalistir(kod, kitap, { sayfa, alt, girdiler, bugun } = {}) {
  let m;
  try { m = new Makro(kod, { kitap, sayfa, girdiler, bugun }); }
  catch (e) { return { tamam: false, hata: { satir: e.satir ?? null, mesaj: 'Derleme hatası: ' + e.message }, cikti: [] }; }
  try { const r = m.calistir(alt); return { tamam: true, ...r, stiller: m.stiller, yordamlar: Object.values(m.yordamlar).map(y => ({ ad: y.ad, tur: y.tur })) }; }
  catch (e) { kitap.hesapla(); return { tamam: false, hata: { satir: e.satir ?? null, mesaj: e.message }, cikti: m.cikti, stiller: m.stiller }; }
}
export function yordamlariListele(kod) { try { return Object.values(ayristir(kod)).map(y => ({ ad: y.ad, tur: y.tur, satir: y.no })); } catch (e) { return { hata: { satir: e.satir, mesaj: e.message } }; } }
export { a1denR1C1, kaydirA1 };

// Gerçek Excel'e aktarmak için .bas dosyası. VBA düzenleyicisi Türkçe Windows'ta dosyayı Windows-1254 kod sayfasıyla okur;
// UTF-8 yazılırsa "ş" gibi harfler bozulur. Bu yüzden baytlar 1254'e çevrilir.
const CP1254 = { 'Ç': 0xC7, 'ç': 0xE7, 'Ğ': 0xD0, 'ğ': 0xF0, 'İ': 0xDD, 'ı': 0xFD, 'Ö': 0xD6, 'ö': 0xF6, 'Ş': 0xDE, 'ş': 0xFE, 'Ü': 0xDC, 'ü': 0xFC, 'â': 0xE2, 'Â': 0xC2, 'î': 0xEE, 'û': 0xFB, '€': 0x80, '–': 0x96, '—': 0x97, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '…': 0x85 };
export function basDosyasi(kod, modulAdi = 'KesitMakro') {
  const metin = `Attribute VB_Name = "${modulAdi}"\r\n` + kod.replace(/\r\n?/g, '\n').split('\n').join('\r\n') + (kod.endsWith('\n') ? '' : '\r\n');
  const out = []; let bozuk = 0;
  for (const ch of metin) { const k = ch.charCodeAt(0); if (k < 0x80) out.push(k); else if (CP1254[ch] != null) out.push(CP1254[ch]); else if (k >= 0xA0 && k <= 0xFF && !'ÐðÝýÞþ'.includes(ch)) out.push(k); else { out.push(0x3F); bozuk++; } }
  return { bayt: new Uint8Array(out), bozuk };
}
