// Kesit Excel · formül motoru çekirdeği: değer türleri, belirteç, ayrıştırıcı, değerlendirici.
// eval kullanılmaz; formül bir ağaca çevrilir ve ağaç gezilerek hesaplanır.
// Türkçe yazım (; ayırıcı, virgül ondalık) ve İngilizce yazım (, ayırıcı, nokta ondalık) kabul edilir;
// işlevler Türkçe ya da İngilizce adla yazılabilir. İç adlar İngilizcedir.
import { metindenTarih } from './tarih.js';

export class Hata { constructor(kod) { this.kod = kod; } toString() { return this.kod; } }
export const H = {
  NA: new Hata('#N/A'), DEGER: new Hata('#VALUE!'), BOL0: new Hata('#DIV/0!'), AD: new Hata('#NAME?'), BASV: new Hata('#REF!'),
  SAYI: new Hata('#NUM!'), TASMA: new Hata('#SPILL!'), HESAP: new Hata('#CALC!'), BOS: new Hata('#NULL!'), DONGU: new Hata('#CIRC'),
};
export const HATA_TR = { '#N/A': '#YOK', '#VALUE!': '#DEĞER!', '#DIV/0!': '#BÖL/0!', '#NAME?': '#AD?', '#REF!': '#BAŞV!', '#NUM!': '#SAYI!', '#SPILL!': '#TAŞMA!', '#CALC!': '#HESAP!', '#NULL!': '#BOŞ!', '#CIRC': '#DÖNGÜ' };
const TR_HATA = Object.fromEntries(Object.entries(HATA_TR).map(([e, t]) => [t, e]));
export const hataMi = v => v instanceof Hata;

// Dizi: iki boyutlu değerler (dinamik dizi, aralık değeri)
export class Dizi {
  constructor(v) { this.v = v; }
  get satir() { return this.v.length; }
  get sutun() { return this.v.length ? this.v[0].length : 0; }
  al(r, c) { const s = this.v[this.satir === 1 ? 0 : r]; return s ? (s[this.sutun === 1 ? 0 : c]) : undefined; }
}
// LAMBDA değeri: parametre adları, gövde ağacı, tanımlandığı andaki değişkenler (kapanış).
// yerlesik doluysa "eta" biçimidir: BYROW(A2:C5;TOPLA) gibi işlev adının kendisi.
export class Lambda {
  constructor(params, govde, kapsam, yerlesik = null, secimli = null) { this.params = params; this.govde = govde; this.kapsam = kapsam; this.yerlesik = yerlesik; this.secimli = secimli; }
  toString() { return '#CALC!'; }
}
// Başvuru: sayfa + dikdörtgen (1 tabanlı satır ve sütun)
export class Bas {
  constructor(sayfa, r1, c1, r2, c2) { this.sayfa = sayfa; this.r1 = Math.min(r1, r2); this.c1 = Math.min(c1, c2); this.r2 = Math.max(r1, r2); this.c2 = Math.max(c1, c2); }
  get satir() { return this.r2 - this.r1 + 1; }
  get sutun() { return this.c2 - this.c1 + 1; }
  get tek() { return this.r1 === this.r2 && this.c1 === this.c2; }
}

export const SINIR = { uzunluk: 4000, derinlik: 64, hucreDizi: 200000, adim: 5_000_000 };

/* ---------------------------------------------------------------- adres yardımcıları */
export function sutunHarf(c) { let s = ''; while (c > 0) { const r = (c - 1) % 26; s = String.fromCharCode(65 + r) + s; c = Math.floor((c - 1) / 26); } return s; }
export function harfSutun(h) { let n = 0; for (const ch of h.toUpperCase()) n = n * 26 + ch.charCodeAt(0) - 64; return n; }
export function adres(r, c) { return sutunHarf(c) + r; }
export function adresCoz(a) { const m = /^\$?([A-Za-z]{1,3})\$?(\d+)$/.exec(String(a).trim()); return m ? { r: +m[2], c: harfSutun(m[1]) } : null; }
export function alanCoz(a) {
  const [x, y] = String(a).split(':'), p = adresCoz(x), q = y ? adresCoz(y) : p;
  return p && q ? { r1: Math.min(p.r, q.r), c1: Math.min(p.c, q.c), r2: Math.max(p.r, q.r), c2: Math.max(p.c, q.c) } : null;
}

/* ---------------------------------------------------------------- işlev adları */
// Türkçe → İngilizce (iç ad). Türkçe Excel'in resmî adları; birkaç eski/alternatif yazım da kabul edilir.
export const TR_EN = {
  'TOPLA': 'SUM', 'ORTALAMA': 'AVERAGE', 'MAK': 'MAX', 'MİN': 'MIN', 'BAĞ_DEĞ_SAY': 'COUNT', 'BAĞ_DEĞ_DOLU_SAY': 'COUNTA', 'BOŞLUKSAY': 'COUNTBLANK',
  'YUVARLA': 'ROUND', 'YUKARIYUVARLA': 'ROUNDUP', 'AŞAĞIYUVARLA': 'ROUNDDOWN', 'TAMSAYI': 'INT', 'MOD': 'MOD', 'MUTLAK': 'ABS', 'KAREKÖK': 'SQRT',
  'KUVVET': 'POWER', 'ÇARPIM': 'PRODUCT', 'ORTANCA': 'MEDIAN', 'ENÇOK_OLAN.TEK': 'MODE.SNGL', 'BÜYÜK': 'LARGE', 'KÜÇÜK': 'SMALL', 'RANK.EŞİT': 'RANK.EQ', 'SIRA': 'RANK',
  'TOPLA.ÇARPIM': 'SUMPRODUCT', 'ALTTOPLAM': 'SUBTOTAL', 'TAVANAYUVARLA.MATEMATİK': 'CEILING.MATH', 'TABANAYUVARLA.MATEMATİK': 'FLOOR.MATH', 'KYUVARLA': 'MROUND', 'NSAT': 'TRUNC',
  'İŞARET': 'SIGN', 'STDSAPMA.S': 'STDEV.S', 'VAR.S': 'VAR.S', 'YÜZDEBİRLİK.DHL': 'PERCENTILE.INC', 'DÖRTTEBİRLİK.DHL': 'QUARTILE.INC', 'PI': 'PI',
  'EĞER': 'IF', 'ÇOKEĞER': 'IFS', 'VE': 'AND', 'YADA': 'OR', 'DEĞİL': 'NOT', 'ÖZELVEYA': 'XOR', 'EĞERHATA': 'IFERROR', 'EĞERYOKSA': 'IFNA', 'İLKEŞLEŞEN': 'SWITCH',
  'DOĞRU': 'TRUE', 'YANLIŞ': 'FALSE', 'EBOŞSA': 'ISBLANK', 'ESAYIYSA': 'ISNUMBER', 'EMETİNSE': 'ISTEXT', 'EHATALIYSA': 'ISERROR', 'EYOKSA': 'ISNA', 'ÇİFTMİ': 'ISEVEN', 'TEKMİ': 'ISODD',
  'EĞERSAY': 'COUNTIF', 'ÇOKEĞERSAY': 'COUNTIFS', 'ETOPLA': 'SUMIF', 'ÇOKETOPLA': 'SUMIFS', 'EĞERORTALAMA': 'AVERAGEIF', 'ORTALAMAEĞER': 'AVERAGEIF', 'ÇOKEĞERORTALAMA': 'AVERAGEIFS',
  'MAKEĞER': 'MAXIFS', 'MİNEĞER': 'MINIFS', 'ÇOKEĞERMAK': 'MAXIFS', 'ÇOKEĞERMİN': 'MINIFS',
  'DÜŞEYARA': 'VLOOKUP', 'YATAYARA': 'HLOOKUP', 'İNDİS': 'INDEX', 'KAÇINCI': 'MATCH', 'ÇAPRAZARA': 'XLOOKUP', 'ÇAPRAZEŞLEŞTİR': 'XMATCH', 'ELEMAN': 'CHOOSE', 'SEÇ': 'CHOOSE',
  'SATIR': 'ROW', 'SÜTUN': 'COLUMN', 'SATIRSAY': 'ROWS', 'SÜTUNSAY': 'COLUMNS',
  'SOLDAN': 'LEFT', 'SAĞDAN': 'RIGHT', 'PARÇAAL': 'MID', 'UZUNLUK': 'LEN', 'BUL': 'FIND', 'MBUL': 'SEARCH', 'KIRP': 'TRIM', 'TEMİZ': 'CLEAN', 'BÜYÜKHARF': 'UPPER',
  'KÜÇÜKHARF': 'LOWER', 'YAZIM.DÜZENİ': 'PROPER', 'YAZIMDÜZENİ': 'PROPER', 'YERİNEKOY': 'SUBSTITUTE', 'DEĞİŞTİR': 'REPLACE', 'YİNELE': 'REPT', 'BİRLEŞTİR': 'CONCATENATE',
  'ARALIKBİRLEŞTİR': 'CONCAT', 'METİNBİRLEŞTİR': 'TEXTJOIN', 'METNEÇEVİR': 'TEXT', 'SAYIYAÇEVİR': 'VALUE', 'SAYIDEĞERİ': 'NUMBERVALUE', 'ÖZDEŞ': 'EXACT', 'ÖNCEKİMETİN': 'TEXTBEFORE',
  'SONRAKİMETİN': 'TEXTAFTER', 'METİNBÖL': 'TEXTSPLIT', 'DAMGA': 'CHAR', 'KOD': 'CODE',
  'TARİH': 'DATE', 'YIL': 'YEAR', 'AY': 'MONTH', 'GÜN': 'DAY', 'BUGÜN': 'TODAY', 'ŞİMDİ': 'NOW', 'ZAMAN': 'TIME', 'SAAT': 'HOUR', 'DAKİKA': 'MINUTE', 'SANİYE': 'SECOND',
  'HAFTANINGÜNÜ': 'WEEKDAY', 'HAFTASAY': 'WEEKNUM', 'ISOHAFTASAY': 'ISOWEEKNUM', 'SERİTARİH': 'EDATE', 'SERİAY': 'EOMONTH', 'İŞGÜNÜ': 'WORKDAY', 'İŞGÜNÜ.ULUSL': 'WORKDAY.INTL',
  'TAMİŞGÜNÜ': 'NETWORKDAYS', 'TAMİŞGÜNÜ.ULUSL': 'NETWORKDAYS.INTL', 'ETARİHLİ': 'DATEDIF', 'TARİHSAYISI': 'DATEVALUE', 'GÜNSAY': 'DAYS', 'YILORAN': 'YEARFRAC',
  'LAMBDA': 'LAMBDA', 'MAP': 'MAP', 'BYROW': 'BYROW', 'BYCOL': 'BYCOL', 'SCAN': 'SCAN', 'REDUCE': 'REDUCE', 'MAKEARRAY': 'MAKEARRAY',
  'GRUPLAÖLÇÜT': 'GROUPBY', 'ÖZETÖLÇÜT': 'PIVOTBY', 'SÜTUNA': 'TOCOL', 'SATIRA': 'TOROW', 'SATIRSAR': 'WRAPROWS', 'SÜTUNSAR': 'WRAPCOLS', 'GENİŞLET': 'EXPAND',
  'S_SAYI_ÜRET': 'RAND', 'RASTGELEARADA': 'RANDBETWEEN', 'RASGDİZİ': 'RANDARRAY',
  'EĞİM': 'SLOPE', 'KESMENOKTASI': 'INTERCEPT', 'KORELASYON': 'CORREL', 'RKARE': 'RSQ', 'TAHMİN.DOĞRUSAL': 'FORECAST.LINEAR', 'TAHMİN': 'FORECAST', 'EĞİLİM': 'TREND',
  'SIKLIK': 'FREQUENCY', 'YOKSAY': 'NA', 'NORMİFADEDEĞİŞTİR': 'REGEXREPLACE', 'KÖPRÜ': 'HYPERLINK', 'FORMÜLMETNİ': 'FORMULATEXT', 'ÇARPIKLIK': 'SKEW', 'BASIKLIK': 'KURT', 'NORMİFADEAYIKLA': 'REGEXEXTRACT', 'TOPLAMA': 'AGGREGATE', 'STDSAPMA.P': 'STDEV.P',
  'FİLTRE': 'FILTER', 'BENZERSİZ': 'UNIQUE', 'SIRALA': 'SORT', 'SIRALAÖLÇÜT': 'SORTBY', 'SIRALI': 'SEQUENCE', 'LET': 'LET', 'AL': 'TAKE', 'BIRAK': 'DROP',
  'DÜŞEYYIĞ': 'VSTACK', 'YATAYYIĞ': 'HSTACK', 'SÜTUNSEÇ': 'CHOOSECOLS', 'SATIRSEÇ': 'CHOOSEROWS',
  'DOLAYLI': 'INDIRECT', 'KAYDIR': 'OFFSET', 'ADRES': 'ADDRESS', 'ÖZETVERİAL': 'GETPIVOTDATA',
  'DEVRESEL_ÖDEME': 'PMT', 'FAİZTUTARI': 'IPMT', 'ANA_PARA_ÖDEMESİ': 'PPMT', 'TAKSİT_SAYISI': 'NPER', 'BD': 'PV', 'GD': 'FV', 'FAİZ_ORANI': 'RATE',
  'NBD': 'NPV', 'İÇ_VERİM_ORANI': 'IRR', 'ANBD': 'XNPV', 'AİÇVERİMORANI': 'XIRR', 'DA': 'SLN', 'ÇİFTAZALANBAKİYE': 'DDB', 'AZALANBAKİYE': 'DB', 'ETKİN': 'EFFECT', 'NOMİNAL': 'NOMINAL',
};
export const EN_TR = {};
for (const [tr, en] of Object.entries(TR_EN)) if (!EN_TR[en]) EN_TR[en] = tr;
EN_TR.AVERAGEIF = 'EĞERORTALAMA'; EN_TR.CHOOSE = 'ELEMAN'; EN_TR.PROPER = 'YAZIM.DÜZENİ'; EN_TR.MAXIFS = 'ÇOKEĞERMAK'; EN_TR.MINIFS = 'ÇOKEĞERMİN';

const trBuyuk = s => s.toLocaleUpperCase('tr');
export function islevAdi(ad, islevler) {
  let a = String(ad).replace(/^_xlfn\.|^_xlws\./i, '');
  const tr = trBuyuk(a);
  if (TR_EN[tr]) return TR_EN[tr];
  const en = a.toUpperCase();
  if (islevler[en]) return en;
  // "İ" ile yazılmış İngilizce ad (Türkçe klavye): SUMİF → SUMIF
  const en2 = tr.replace(/İ/g, 'I');
  if (islevler[en2]) return en2;
  return null;
}

/* ---------------------------------------------------------------- belirteç */
export function yazimBul(f) {
  // Türkçe yazım: dizgi dışında ; varsa. Yoksa virgül ayırıcı, nokta ondalık sayılır.
  // Dizi sabitlerinin içi ({1,2;3,4}) her iki yazımda da aynı kuralla yazıldığı için sayılmaz.
  const dis = String(f).replace(/"(?:[^"]|"")*"/g, '').replace(/\{[^}]*\}/g, '');
  if (dis.includes(';')) return 'tr';
  // ; yoksa işlev adına bak: =NSAT(-7,9) Türkçedir (-7,9 tek sayı), =TRUNC(-7,9) İngilizcedir (iki bağımsız değişken)
  if (/DOĞRU|YANLIŞ/i.test(dis)) return 'tr';
  // Parantez dışında virgül İngilizce yazımda anlamsızdır; =$D2<$C2*0,9 Türkçe ondalıktır
  { let d = 0; for (const ch of dis) { if (ch === '(') d++; else if (ch === ')') d--; else if (ch === ',' && d === 0) return 'tr'; } }
  for (const m of dis.matchAll(/([A-Za-zÇĞİÖŞÜçğıöşü_][A-Za-zÇĞİÖŞÜçğıöşü0-9_.]*)\s*\(/g)) {
    const ad = m[1].toLocaleUpperCase('tr');
    if (TR_EN[ad] && TR_EN[ad] !== ad) return 'tr';
  }
  return 'en';
}
const AD_HARF = /[A-Za-zÇĞİÖŞÜçğıöşü_\\]/;
// Dizi sabiti: ; satır ayırır. Sütun ayırıcı iki yazımla tanınır:
//   Kesit/İngilizce yazım  {1,2;3,4}      , sütun, ondalık nokta
//   Türkçe bölge ayarı     {1\2;3,5\4}   \ sütun, ondalık virgül (Windows bölge ayarı Türkçe olan Excel böyle ister;
//                                            27.11.2026'da İngilizce arayüzlü, Türkçe bölgeli Excel'de denendi)
// Sabitin içinde (tırnak dışında) \ varsa Türkçe yazım kabul edilir.
function diziSabiti(s, bas) {
  let i = bas + 1; const satirlar = [[]];
  let tr = false;
  for (let j = i, tirnak = false; j < s.length; j++) { if (s[j] === '"') tirnak = !tirnak; else if (!tirnak && s[j] === '}') break; else if (!tirnak && s[j] === '\\') { tr = true; break; } }
  const oge = () => {
    while (s[i] === ' ') i++;
    if (tr) { const t = /^-?\d+,\d+/.exec(s.slice(i)); if (t) { i += t[0].length; return Number(t[0].replace(',', '.')); } }
    if (s[i] === '"') { let j = i + 1, v = ''; for (;;) { if (j >= s.length) throw new Error('Kapanmamış tırnak'); if (s[j] === '"') { if (s[j + 1] === '"') { v += '"'; j += 2; continue; } break; } v += s[j++]; } i = j + 1; return v; }
    const m = /^(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|TRUE|FALSE|DOĞRU|YANLIŞ|#[A-ZÇĞİÖŞÜ/0!?]+[!?]?)/i.exec(s.slice(i));
    if (!m) throw new Error('Dizi sabitinde yalnız sayı, metin, mantıksal ya da hata olabilir');
    i += m[0].length;
    const b = m[0].toLocaleUpperCase('tr');
    if (b === 'TRUE' || b === 'DOĞRU') return true;
    if (b === 'FALSE' || b === 'YANLIŞ') return false;
    if (b[0] === '#') return new Hata(TR_HATA[b] || b);
    return Number(m[0]);
  };
  for (;;) {
    satirlar[satirlar.length - 1].push(oge());
    while (s[i] === ' ') i++;
    const c = s[i++];
    if (c === '}') break;
    if (c === (tr ? '\\' : ',')) continue;
    if (c === ';') { satirlar.push([]); continue; }
    throw new Error('Dizi sabiti kapanmadı: } bekleniyor');
  }
  if (satirlar.some(r => r.length !== satirlar[0].length)) throw new Error('Dizi sabitinin satırları eşit uzunlukta olmalı');
  return { v: satirlar, son: i };
}
export function belirtec(f, yazim = yazimBul(f)) {
  const s = String(f), out = [], ayirici = yazim === 'tr' ? ';' : ',', ondalik = yazim === 'tr' ? ',' : '.';
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (ch === '"') {
      let j = i + 1, v = '';
      for (;;) { if (j >= s.length) throw new Error('Kapanmamış tırnak'); if (s[j] === '"') { if (s[j + 1] === '"') { v += '"'; j += 2; continue; } break; } v += s[j++]; }
      out.push({ t: 'str', v, bas: i, son: j + 1 }); i = j + 1; continue;
    }
    if (ch === '#') {
      const m = /^#(?:YOK|N\/A|DEĞER!|VALUE!|BÖL\/0!|DIV\/0!|AD\?|NAME\?|BAŞV!|REF!|SAYI!|NUM!|TAŞMA!|SPILL!|HESAP!|CALC!|BOŞ!|NULL!)/i.exec(s.slice(i));
      if (!m) throw new Error('Tanınmayan hata değeri');
      const k = trBuyuk(m[0]); out.push({ t: 'err', v: TR_HATA[k] || k.toUpperCase(), bas: i, son: i + m[0].length }); i += m[0].length; continue;
    }
    if (ch === "'") {
      let j = i + 1, ad = '';
      for (;;) { if (j >= s.length) throw new Error('Kapanmamış sayfa adı'); if (s[j] === "'") { if (s[j + 1] === "'") { ad += "'"; j += 2; continue; } break; } ad += s[j++]; }
      if (s[j + 1] !== '!') throw new Error('Sayfa adından sonra ! bekleniyor');
      const r = basvuruOku(s, j + 2); if (!r) throw new Error('Sayfa adından sonra başvuru bekleniyor');
      const uc = ad.split(':');
      const ts = s[r.son] === '#'; out.push({ ...r.tk, sayfa: uc[0], ...(uc.length === 2 ? { sayfa2: uc[1] } : {}), ...(ts ? { tasan: true } : {}), bas: j + 2, son: r.son + (ts ? 1 : 0) }); i = r.son + (ts ? 1 : 0); continue;
    }
    // satır başvurusu (1:5) ya da sayı
    if (/[0-9$]/.test(ch) || ch === ondalik) {
      const rr = /^\$?\d+:\$?\d+/.test(s.slice(i)) ? basvuruOku(s, i) : null;
      if (rr) { out.push({ ...rr.tk, bas: i, son: rr.son }); i = rr.son; continue; }
      const sm = new RegExp('^(?:\\d+(?:\\' + ondalik + '\\d+)?|\\' + ondalik + '\\d+)(?:[eE][+-]?\\d+)?').exec(s.slice(i));
      if (sm && ch !== '$') { out.push({ t: 'num', v: Number(sm[0].replace(ondalik, '.')), bas: i, son: i + sm[0].length }); i += sm[0].length; continue; }
    }
    // başvuru ya da ad
    if (ch === '$' || /[A-Za-z]/.test(ch) || AD_HARF.test(ch)) {
      const r = basvuruOku(s, i);
      if (r && !/[(\wÇĞİÖŞÜçğıöşü.!]/.test(s[r.son] || '')) { const ts = s[r.son] === '#'; out.push({ ...r.tk, ...(ts ? { tasan: true } : {}), bas: i, son: r.son + (ts ? 1 : 0) }); i = r.son + (ts ? 1 : 0); continue; }
      const m = /^[A-Za-zÇĞİÖŞÜçğıöşü_\\][\wÇĞİÖŞÜçğıöşü.]*/.exec(s.slice(i));
      if (m) {
        const ad = m[0], j = i + ad.length;
        const m3 = s[j] === ':' ? /^:([A-Za-zÇĞİÖŞÜçğıöşü_][\wÇĞİÖŞÜçğıöşü.]*)!/.exec(s.slice(j)) : null;
        if (m3) { const k3 = j + m3[0].length, r4 = basvuruOku(s, k3); if (!r4) throw new Error('Sayfa adından sonra başvuru bekleniyor'); out.push({ ...r4.tk, sayfa: ad, sayfa2: m3[1], bas: k3, son: r4.son }); i = r4.son; continue; }
        if (s[j] === '!') { const r2 = basvuruOku(s, j + 1); if (!r2) throw new Error('Sayfa adından sonra başvuru bekleniyor'); { const ts = s[r2.son] === '#'; out.push({ ...r2.tk, sayfa: ad, ...(ts ? { tasan: true } : {}), bas: j + 1, son: r2.son + (ts ? 1 : 0) }); i = r2.son + (ts ? 1 : 0); } continue; }
        if (s[j] === '[') { const r3 = koseliOku(s, j); out.push({ t: 'tref', tablo: ad, ...r3.tk, bas: i, son: r3.son }); i = r3.son; continue; }
        let k = j; while (/\s/.test(s[k] || '')) k++;
        if (s[k] === '(') { out.push({ t: 'fn', v: ad, bas: i, son: j }); i = j; continue; }
        const b = trBuyuk(ad);
        if (b === 'DOĞRU' || b === 'TRUE') { out.push({ t: 'bool', v: true, bas: i, son: j }); i = j; continue; }
        if (b === 'YANLIŞ' || b === 'FALSE') { out.push({ t: 'bool', v: false, bas: i, son: j }); i = j; continue; }
        out.push({ t: 'ad', v: ad, bas: i, son: j }); i = j; continue;
      }
    }
    const iki = s.slice(i, i + 2);
    if (['<>', '<=', '>='].includes(iki)) { out.push({ t: 'op', v: iki, bas: i, son: i + 2 }); i += 2; continue; }
    if ('+-*/^&=<>%'.includes(ch)) { out.push({ t: 'op', v: ch, bas: i, son: i + 1 }); i++; continue; }
    if (ch === '(' || ch === ')') { out.push({ t: ch, bas: i, son: i + 1 }); i++; continue; }
    if (ch === ayirici) { out.push({ t: 'sep', bas: i, son: i + 1 }); i++; continue; }
    if (ch === ',' || ch === ';') throw new Error(yazim === 'tr' ? 'Türkçe yazımda bağımsız değişkenler ; ile ayrılır' : 'Ayırıcı karışık: ; ve , birlikte');
    if (ch === '[') { const r3 = koseliOku(s, i); out.push({ t: 'tref', tablo: null, ...r3.tk, bas: i, son: r3.son }); i = r3.son; continue; }
    if (ch === '{') { const d = diziSabiti(s, i); out.push({ t: 'dizi', v: d.v, bas: i, son: d.son }); i = d.son; continue; }
    throw new Error(`Beklenmeyen karakter: ${ch}`);
  }
  return out;
}
// Yapılandırılmış başvuru: Tablo[Sütun], Tablo[@Sütun], Tablo[@[Birim Fiyat]], Tablo[#Başlıklar], Tablo[[#Tümü];[Adet]], Tablo[[Adet]:[İndirim]], [@Adet]
const OZEL_TABLO = { '#BAŞLIKLAR': 'baslik', '#HEADERS': 'baslik', '#VERİ': 'veri', '#DATA': 'veri', '#TÜMÜ': 'tumu', '#ALL': 'tumu', '#TOPLAMLAR': 'toplam', '#TOTALS': 'toplam', '#BU SATIR': 'bu', '#THIS ROW': 'bu' };
function koseliOku(s, i) {
  // s[i] === '[' ; eşleşen ']' bulunur (iç içe bir düzey)
  let d = 0, j = i;
  for (; j < s.length; j++) { if (s[j] === "'" ) { j++; continue; } if (s[j] === '[') d++; else if (s[j] === ']') { d--; if (!d) break; } }
  if (d) throw new Error('Kapanmamış köşeli parantez');
  const ic = s.slice(i + 1, j), out = { satirlik: false, ozel: 'veri', s1: null, s2: null };
  const parcalar = ic.startsWith('[') || /^@\[/.test(ic) ? [...ic.matchAll(/(@?)\[([^\]]*)\]|(:)/g)] : null;
  if (!parcalar) {
    if (ic.startsWith('@')) { out.satirlik = true; out.s1 = ic.slice(1).trim(); }
    else if (ic.startsWith('#')) out.ozel = OZEL_TABLO[trBuyuk(ic.trim())] || 'veri';
    else out.s1 = ic.trim() || null;
  } else {
    let aralik = false;
    for (const m of parcalar) {
      if (m[3]) { aralik = true; continue; }
      const x = m[2].trim();
      if (m[1]) out.satirlik = true;
      if (x.startsWith('#')) { const o = OZEL_TABLO[trBuyuk(x)]; if (o === 'bu') out.satirlik = true; else if (o) out.ozel = o; continue; }
      if (aralik && out.s1 != null) out.s2 = x; else out.s1 = x;
    }
  }
  return { tk: out, son: j + 1 };
}
function basvuruOku(s, i) {
  const rest = s.slice(i);
  let m = /^(\$?)([A-Za-z]{1,3})(\$?)(\d+)(?::(\$?)([A-Za-z]{1,3})(\$?)(\d+))?/.exec(rest);
  if (m && +m[4] >= 1 && +m[4] <= 1048576 && harfSutun(m[2]) <= 16384) {
    const tk = { t: 'ref', tip: m[5] !== undefined ? 'alan' : 'hucre', c1: harfSutun(m[2]), r1: +m[4], ac1: !!m[1], ar1: !!m[3] };
    if (m[5] !== undefined) Object.assign(tk, { c2: harfSutun(m[6]), r2: +m[8], ac2: !!m[5], ar2: !!m[7] }); else Object.assign(tk, { c2: tk.c1, r2: tk.r1, ac2: tk.ac1, ar2: tk.ar1 });
    return { tk, son: i + m[0].length };
  }
  m = /^(\$?)([A-Za-z]{1,3}):(\$?)([A-Za-z]{1,3})(?![\w(])/.exec(rest);
  if (m) return { tk: { t: 'ref', tip: 'sutun', c1: harfSutun(m[2]), c2: harfSutun(m[4]), ac1: !!m[1], ac2: !!m[3], r1: 1, r2: 1048576 }, son: i + m[0].length };
  m = /^(\$?)(\d+):(\$?)(\d+)/.exec(rest);
  if (m) return { tk: { t: 'ref', tip: 'satir', r1: +m[2], r2: +m[4], ar1: !!m[1], ar2: !!m[3], c1: 1, c2: 16384 }, son: i + m[0].length };
  return null;
}

/* ---------------------------------------------------------------- ayrıştırıcı */
// Öncelik (Excel): : > tekli - > % > ^ > * / > + - > & > karşılaştırma
const IKILI = { '=': 1, '<>': 1, '<': 1, '>': 1, '<=': 1, '>=': 1, '&': 2, '+': 3, '-': 3, '*': 4, '/': 4, '^': 5 };
export function ayristir(formul, islevler) {
  let f = String(formul);
  if (f.length > SINIR.uzunluk) throw new Error('Formül çok uzun');
  if (f.startsWith('=')) f = f.slice(1);
  const tk = belirtec(f);
  let p = 0, derinlik = 0;
  const bak = () => tk[p], al = () => tk[p++];
  function ifade(min = 0) {
    let sol = tekli();
    for (;;) {
      const t = bak();
      if (!t || t.t !== 'op' || !(t.v in IKILI)) break;
      const o = IKILI[t.v]; if (o < min) break;
      al();
      const sag = ifade(o + 1); // tümü soldan birleşir; ^ dahil: Excel'de 2^3^2 = 64
      sol = { t: 'op', op: t.v, a: sol, b: sag };
    }
    return sol;
  }
  function tekli() {
    const t = bak();
    if (t && t.t === 'op' && (t.v === '-' || t.v === '+')) { al(); const a = tekli(); return t.v === '-' ? { t: 'neg', a } : a; }
    let n = birincil();
    while (bak() && bak().t === 'op' && bak().v === '%') { al(); n = { t: 'pct', a: n }; }
    return n;
  }
  function argumanlar() {
    const args = [];
    if (bak() && bak().t === ')') { al(); return args; }
    for (;;) {
      if (bak() && (bak().t === 'sep' || bak().t === ')')) args.push({ t: 'bos' }); else args.push(ifade());
      const n = al(); if (!n) throw new Error('Kapanmamış parantez');
      if (n.t === ')') return args;
      if (n.t !== 'sep') throw new Error('Bağımsız değişkenler arasında ayırıcı bekleniyor');
    }
  }
  function birincil() {
    const t = al();
    if (!t) throw new Error('Formül eksik bitti');
    if (t.t === 'num' || t.t === 'str' || t.t === 'bool' || t.t === 'err') return { t: t.t, v: t.v };
    if (t.t === 'ref') return { ...t };
    if (t.t === 'dizi') return { t: 'dizi', v: t.v };
    if (t.t === 'ad') return { t: 'ad', v: t.v };
    if (t.t === 'tref') return { ...t };
    if (t.t === '(') { const e = ifade(); if (!bak() || bak().t !== ')') throw new Error('Kapanmamış parantez'); al(); return e; }
    if (t.t === 'fn') {
      if (++derinlik > SINIR.derinlik) throw new Error('İç içe işlev sınırı (64) aşıldı');
      const ad = islevAdi(t.v, islevler);
      al(); // (
      const args = [];
      if (bak() && bak().t === ')') al();
      else for (;;) {
        if (bak() && (bak().t === 'sep' || bak().t === ')')) args.push({ t: 'bos' });
        else args.push(ifade());
        const n = al();
        if (!n) throw new Error('Kapanmamış parantez');
        if (n.t === ')') break;
        if (n.t !== 'sep') throw new Error('Bağımsız değişkenler arasında ayırıcı bekleniyor');
      }
      derinlik--;
      let dugum = { t: 'fn', ad, yazilan: t.v, args };
      while (bak() && bak().t === '(') { al(); dugum = { t: 'cagir', f: dugum, args: argumanlar() }; }
      return dugum;
    }
    if (t.t === ')') throw new Error('Fazla kapanan parantez');
    if (t.t === 'sep') throw new Error('Yersiz ayırıcı');
    throw new Error(`Beklenmeyen ${t.v || t.t}`);
  }
  const agac = ifade();
  if (p < tk.length) throw new Error(tk[p].t === ')' ? 'Fazla kapanan parantez' : 'Formülün sonunda fazladan bir şey var');
  return agac;
}

/* ---------------------------------------------------------------- değer dönüşümleri */
export function sayiMetin(s) {
  // Metni sayıya çevirmeyi dene: Türkçe (1.234,5) ya da sade (1234.5), yüzde, tarih. Olmazsa null.
  const t = String(s).trim();
  if (t === '') return null;
  let m = /^([+-]?)(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+))?(%?)$/.exec(t);
  if (m) { const v = Number(m[2].replace(/\./g, '') + (m[3] ? '.' + m[3] : '')) * (m[1] === '-' ? -1 : 1); return m[4] ? v / 100 : v; }
  m = /^([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)(%?)$/.exec(t);
  if (m) { const v = Number(m[1]); return m[2] ? v / 100 : v; }
  const d = metindenTarih(t);
  return d == null ? null : d;
}
export function sayiya(v) {
  if (hataMi(v)) return v;
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'string') { const n = sayiMetin(v); return n == null ? H.DEGER : n; }
  return H.DEGER;
}
export function metne(v) {
  if (hataMi(v)) return v;
  if (v == null) return '';
  if (typeof v === 'boolean') return v ? 'DOĞRU' : 'YANLIŞ';
  if (typeof v === 'number') return sayiGenel(v);
  return String(v);
}
// Sayının metne dönüşü (& ile birleştirme gibi): Türkçe Excel'de ondalık ayırıcı virgüldür.
export function sayiGenel(x) { if (!Number.isFinite(x)) return '#NUM!'; const s = String(+x.toPrecision(15)); return s.replace('.', ','); }
export function mantiga(v) {
  if (hataMi(v)) return v;
  if (v == null) return false;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') { const b = trBuyuk(v); if (b === 'DOĞRU' || b === 'TRUE') return true; if (b === 'YANLIŞ' || b === 'FALSE') return false; return H.DEGER; }
  return H.DEGER;
}
const tur = v => v == null ? 0 : typeof v === 'number' ? 1 : typeof v === 'string' ? 2 : typeof v === 'boolean' ? 3 : 4;
// Excel karşılaştırması: sayı < metin < mantıksal; metin büyük/küçük harf duyarsız; boş = 0 ya da "".
export function karsilastir(a, b) {
  if (a == null) a = typeof b === 'string' ? '' : typeof b === 'boolean' ? false : 0;
  if (b == null) b = typeof a === 'string' ? '' : typeof a === 'boolean' ? false : 0;
  const ta = tur(a), tb = tur(b);
  if (ta !== tb) return ta < tb ? -1 : 1;
  if (ta === 2) { const x = trBuyuk(a), y = trBuyuk(b); return x === y ? 0 : x.localeCompare(y, 'tr') < 0 ? -1 : 1; }
  if (ta === 3) return a === b ? 0 : a ? 1 : -1;
  return a === b ? 0 : a < b ? -1 : 1;
}

/* ---------------------------------------------------------------- değerlendirici */
// bag: { kitap, sayfa, satir, sutun, degisken: Map, bugun, adim: { n } }
export function degerlendir(agac, bag) {
  if (++bag.adim.n > SINIR.adim) throw Object.assign(new Error('Hesap çok uzun sürdü'), { kod: '#CALC!' });
  switch (agac.t) {
    case 'num': case 'str': case 'bool': return agac.v;
    case 'dizi': return new Dizi(agac.v.map(r => r.slice()));
    case 'err': return new Hata(agac.v);
    case 'bos': return null;
    case 'ref': {
      const sayfa = agac.sayfa ? bag.kitap.sayfaBul(agac.sayfa) : bag.sayfa;
      if (!sayfa) return H.BASV;
      if (agac.sayfa2) return ucBoyutlu(agac, bag);
      // Taşma başvurusu (M2#): çapa hücresi hesaplanır, taştığı alan başvuru olarak döner; taşmıyorsa #BAŞV!
      if (agac.tasan) {
        const v = bag.kitap.hucre(sayfa.ad, agac.r1, agac.c1), b = bag.kitap.tasmaBoyut && bag.kitap.tasmaBoyut.get(sayfa.ad + '!' + agac.r1 + ',' + agac.c1);
        if (!b) return hataMi(v) ? v : H.BASV;
        return new Bas(sayfa.ad, agac.r1, agac.c1, agac.r1 + b.R - 1, agac.c1 + b.C - 1);
      }
      let { r1, r2, c1, c2 } = agac;
      if (agac.tip === 'sutun' || agac.tip === 'satir') { const s = sayfa.kullanilan(); if (agac.tip === 'sutun') { r1 = 1; r2 = Math.max(1, s.r); } else { c1 = 1; c2 = Math.max(1, s.c); } }
      return new Bas(sayfa.ad, r1, c1, r2, c2);
    }
    case 'ad': {
      const ad = trBuyuk(agac.v);
      if (bag.degisken && bag.degisken.has(ad)) return bag.degisken.get(ad);
      // Ad Yöneticisi'ndeki ad ya da tablo adı (tablo adı tek başına veri gövdesidir)
      if (bag.kitap.adDegeri) { const v = bag.kitap.adDegeri(ad, bag); if (v !== undefined) return v; }
      // "Eta" biçimi: işlev adı tek başına bir LAMBDA gibi geçirilir (BYROW(A2:C5;TOPLA))
      const en = islevAdi(agac.v, bag.kitap.islevler);
      if (en && !bag.kitap.islevler[en].tembel) return new Lambda(null, null, null, en);
      return H.AD;
    }
    case 'cagir': {
      const f = coz(degerlendir(agac.f, bag), bag);
      if (!(f instanceof Lambda)) return hataMi(f) ? f : H.DEGER;
      return lambdaCagir(f, agac.args.map(a => coz(degerlendir(a, bag), bag)), bag);
    }
    case 'tref': return bag.kitap.tabloBasvuru ? bag.kitap.tabloBasvuru(agac, bag) : H.BASV;
    case 'neg': return islemTekli(degerlendir(agac.a, bag), bag, x => -x);
    case 'pct': return islemTekli(degerlendir(agac.a, bag), bag, x => x / 100);
    case 'op': return islemIkili(agac.op, degerlendir(agac.a, bag), degerlendir(agac.b, bag), bag);
    case 'fn': {
      if (!agac.ad) {
        // Ad Yöneticisi'nde ya da LET'te tanımlı LAMBDA: =KDVLİ(B2)
        const b = trBuyuk(agac.yazilan || '');
        let L = bag.degisken ? bag.degisken.get(b) : undefined;
        if (L === undefined && bag.kitap.adDegeri) L = bag.kitap.adDegeri(b, bag);
        if (L instanceof Lambda) return lambdaCagir(L, agac.args.map(a => coz(degerlendir(a, bag), bag)), bag);
        return H.AD;
      }
      const f = bag.kitap.islevler[agac.ad];
      if (!f) return H.AD;
      if (f.tembel) return f.fn(agac.args, bag);
      const args = agac.args.map(a => degerlendir(a, bag));
      return f.fn(args, bag);
    }
  }
  return H.DEGER;
}

// LAMBDA çağrısı: parametreler kapanışa eklenir; parametre sayısı tutmazsa #DEĞER! (Excel gibi)
export const ATLANAN = '\u0000atlanan';
export function lambdaCagir(L, args, bag) {
  if (L.yerlesik) { const f = bag.kitap.islevler[L.yerlesik]; return f.fn(args, bag); }
  // Köşeli parantezli parametre ([b]) isteğe bağlıdır; verilmezse boş gelir ve ISOMITTED(b) DOĞRU döner
  const secimli = L.secimli || new Set();
  if (args.length > L.params.length) return H.DEGER;
  for (let i = args.length; i < L.params.length; i++) if (!secimli.has(L.params[i])) return H.DEGER;
  bag.lambdaDerinlik = (bag.lambdaDerinlik || 0) + 1;
  if (bag.lambdaDerinlik > 256) { bag.lambdaDerinlik--; return H.SAYI; } // çok derin özyineleme: Excel #SAYI!
  const onceki = bag.degisken, yeni = new Map(L.kapsam || []);
  const atlanan = new Set();
  L.params.forEach((p, i) => { const v = i < args.length ? args[i] : null; if (secimli.has(p) && (i >= args.length || v == null)) atlanan.add(p); yeni.set(p, v); });
  yeni.set(ATLANAN, atlanan);
  bag.degisken = yeni;
  try { return degerlendir(L.govde, bag); } finally { bag.degisken = onceki; bag.lambdaDerinlik--; }
}
// 3B başvuru (Ocak:Mart!B2): iki sayfa arasındaki (kitaptaki sırayla) her sayfanın aynı alanı alt alta dizilir.
// TOPLA, ORTALAMA, MAK gibi işlevler bu diziyi Excel'in 3B başvurusu gibi toplar.
function ucBoyutlu(agac, bag) {
  const adlar = [...bag.kitap.sayfalar.keys()], b = x => trBuyuk(x);
  const i1 = adlar.findIndex(a => b(a) === b(agac.sayfa)), i2 = adlar.findIndex(a => b(a) === b(agac.sayfa2));
  if (i1 < 0 || i2 < 0) return H.BASV;
  const out = [];
  for (let i = Math.min(i1, i2); i <= Math.max(i1, i2); i++) {
    const v = coz(new Bas(adlar[i], agac.r1, agac.c1, agac.r2, agac.c2), bag);
    if (v instanceof Dizi) out.push(...v.v); else out.push([v]);
  }
  return new Dizi(out);
}
// Başvuruyu değere çevir: tek hücre → değer, alan → Dizi
export function coz(v, bag) {
  if (v instanceof Bas) {
    if (v.tek) return bag.kitap.hucre(v.sayfa, v.r1, v.c1);
    if (v.satir * v.sutun > SINIR.hucreDizi) return H.HESAP;
    const out = [];
    for (let r = v.r1; r <= v.r2; r++) { const s = []; for (let c = v.c1; c <= v.c2; c++) s.push(bag.kitap.hucre(v.sayfa, r, c)); out.push(s); }
    return new Dizi(out);
  }
  return v;
}
function islemTekli(v, bag, f) {
  v = coz(v, bag);
  if (v instanceof Dizi) return new Dizi(v.v.map(s => s.map(x => { const n = sayiya(x); return hataMi(n) ? n : f(n); })));
  const n = sayiya(v); return hataMi(n) ? n : f(n);
}
export function islemIkili(op, a, b, bag) {
  a = coz(a, bag); b = coz(b, bag);
  if (a instanceof Dizi || b instanceof Dizi) {
    const A = a instanceof Dizi ? a : new Dizi([[a]]), B = b instanceof Dizi ? b : new Dizi([[b]]);
    const R = Math.max(A.satir, B.satir), C = Math.max(A.sutun, B.sutun);
    if (R * C > SINIR.hucreDizi) return H.HESAP;
    const out = [];
    for (let r = 0; r < R; r++) { const s = []; for (let c = 0; c < C; c++) {
      const x = (A.satir === 1 || r < A.satir) && (A.sutun === 1 || c < A.sutun) ? A.al(r, c) : H.NA;
      const y = (B.satir === 1 || r < B.satir) && (B.sutun === 1 || c < B.sutun) ? B.al(r, c) : H.NA;
      s.push(tekIslem(op, x, y));
    } out.push(s); }
    return new Dizi(out);
  }
  return tekIslem(op, a, b);
}
function tekIslem(op, a, b) {
  if (hataMi(a)) return a; if (hataMi(b)) return b;
  if (op === '&') return metne(a) + metne(b);
  if (['=', '<>', '<', '>', '<=', '>='].includes(op)) {
    const k = karsilastir(a, b);
    return op === '=' ? k === 0 : op === '<>' ? k !== 0 : op === '<' ? k < 0 : op === '>' ? k > 0 : op === '<=' ? k <= 0 : k >= 0;
  }
  const x = sayiya(a), y = sayiya(b);
  if (hataMi(x)) return x; if (hataMi(y)) return y;
  let r;
  switch (op) {
    case '+': r = x + y; break; case '-': r = x - y; break; case '*': r = x * y; break;
    case '/': if (y === 0) return H.BOL0; r = x / y; break;
    case '^': if (x === 0 && y < 0) return H.BOL0; r = Math.pow(x, y); break;
  }
  return Number.isFinite(r) ? r : H.SAYI;
}

/* ---------------------------------------------------------------- doldurma: göreli başvuruları kaydır */
// Formül metnini korur, yalnız başvuruları kaydırır. $ olan yön kaymaz. Taşan başvuru #BAŞV! olur.
export function kaydir(formul, dr, dc) {
  const f = String(formul), basta = f.startsWith('=');
  const g = basta ? f.slice(1) : f;
  let tk; try { tk = belirtec(g); } catch { return f; }
  let out = '', i = 0;
  for (const t of tk) {
    if (t.t !== 'ref') continue;
    out += g.slice(i, t.bas);
    const yeni = { ...t };
    const k = (a, v, d) => a ? v : v + d;
    if (t.tip !== 'satir') { yeni.c1 = k(t.ac1, t.c1, dc); yeni.c2 = k(t.ac2, t.c2, dc); }
    if (t.tip !== 'sutun') { yeni.r1 = k(t.ar1, t.r1, dr); yeni.r2 = k(t.ar2, t.r2, dr); }
    const bozuk = yeni.c1 < 1 || yeni.c2 < 1 || yeni.r1 < 1 || yeni.r2 < 1;
    out += bozuk ? '#BAŞV!' : refMetin(yeni) + (t.tasan ? '#' : '');
    i = t.son;
  }
  out += g.slice(i);
  return (basta ? '=' : '') + out;
}

// Formülü Türkçe ya da İngilizce yazıma çevir (işlev adları, ayırıcı, ondalık, mantıksal değerler).
export function cevir(formul, hedef, islevler) {
  // Kullanıcının boşluklarını ve düzenini koru: yalnız değişen belirteçleri yerinde değiştir
  const f = String(formul), basta = f.startsWith('=');
  const g = basta ? f.slice(1) : f, kaynak = yazimBul(g);
  const tk = belirtec(g, kaynak), ay = hedef === 'tr' ? ';' : ',';
  let out = '', son = 0;
  for (const t of tk) {
    let yeni = null;
    switch (t.t) {
      case 'num': { if (kaynak === hedef) break; const ham = g.slice(t.bas, t.son); yeni = hedef === 'tr' ? ham.replace('.', ',') : ham.replace(',', '.'); break; }
      case 'bool': yeni = hedef === 'tr' ? (t.v ? 'DOĞRU' : 'YANLIŞ') : (t.v ? 'TRUE' : 'FALSE'); break;
      case 'err': yeni = hedef === 'tr' ? (HATA_TR[t.v] || t.v) : t.v; break;
      case 'fn': { const en = islevAdi(t.v, islevler); if (en) yeni = hedef === 'tr' ? (EN_TR[en] || en) : en; break; }
      case 'sep': if (kaynak !== hedef) yeni = ay; break;
    }
    if (yeni == null || t.bas == null) continue;
    out += g.slice(son, t.bas) + yeni; son = t.son;
  }
  return (basta ? '=' : '') + out + g.slice(son);
}
function refMetin(t) {
  const d = (a, x) => (a ? '$' : '') + x;
  if (t.tip === 'sutun') return d(t.ac1, sutunHarf(t.c1)) + ':' + d(t.ac2, sutunHarf(t.c2));
  if (t.tip === 'satir') return d(t.ar1, t.r1) + ':' + d(t.ar2, t.r2);
  const a = d(t.ac1, sutunHarf(t.c1)) + d(t.ar1, t.r1);
  return t.tip === 'alan' ? a + ':' + d(t.ac2, sutunHarf(t.c2)) + d(t.ar2, t.r2) : a;
}
