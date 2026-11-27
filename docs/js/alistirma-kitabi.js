// Kesit Excel · alıştırmaları gerçek Excel'de çalışmak için .xlsx kitabı üretir (tarayıcıda, indirme anında).
// Ders kitabı: Görevler + her alıştırma için hazırlığı yapılmış çalışma sayfası + başvurulan veri sayfaları + Çözümler (en sonda).
// Tek kitap: Görevler (bütün dersler) + bütün veri sayfaları (Excel Tablosu olarak) + Çözümler.
// Formüller dosyaya İngilizce yazımla yazılır (Excel dosyası böyle saklar); Türkçe Excel açınca Türkçe gösterir.
import { SAYFALAR } from '../icerik/sayfalar.js';
import { MODULLER } from '../icerik/dersler.js';
import { cevir, alanCoz, hataMi, kaydir } from '../motor/formul.js';
import { ISLEVLER } from '../motor/islevler.js';
import { kitapKur } from '../motor/denetci.js';

import { xlsx, STIL } from './xlsx-yaz.js';

// Kesit'in Türkçe biçim kodu → Excel dosyasındaki (İngilizce) kod
const BICIM = { 'gg.aa.yyyy': 'dd.mm.yyyy', 'gg.aa.yyyy gggg': 'dd.mm.yyyy dddd', 'gg.aa.yyyy ss:dd': 'dd.mm.yyyy hh:mm', 'ss:dd': 'hh:mm', 'aaaa yyyy': 'mmmm yyyy', 'aaa yyyy': 'mmm yyyy', 'gg.aa': 'dd.mm', '#.##0,00': '#,##0.00', '#.##0': '#,##0', '0%': '0%', '0,0%': '0.0%', '%0,0': '0.0%' };
const enBicim = k => k ? (BICIM[k] || null) : null;
// Excel 2010 sonrası işlevler dosyada _xlfn. önekiyle saklanır; önek olmazsa Excel #AD? gösterir.
const YENI = ['NUMBERVALUE', 'WORKDAY.INTL', 'NETWORKDAYS.INTL', 'FORMULATEXT', 'XLOOKUP', 'XMATCH', 'FILTER', 'UNIQUE', 'SORT', 'SORTBY', 'SEQUENCE', 'LET', 'LAMBDA', 'TEXTJOIN', 'CONCAT', 'IFS', 'SWITCH', 'MAXIFS', 'MINIFS', 'IFNA', 'XOR', 'TEXTBEFORE', 'TEXTAFTER', 'TEXTSPLIT', 'VSTACK', 'HSTACK', 'CHOOSECOLS', 'CHOOSEROWS', 'TAKE', 'DROP', 'TOCOL', 'TOROW', 'WRAPROWS', 'WRAPCOLS', 'EXPAND', 'RANDARRAY', 'ISOWEEKNUM', 'DAYS', 'STDEV.S', 'STDEV.P', 'VAR.S', 'RANK.EQ', 'PERCENTILE.INC', 'QUARTILE.INC', 'CEILING.MATH', 'FLOOR.MATH', 'MODE.SNGL', 'AGGREGATE', 'FORECAST.LINEAR', 'GROUPBY', 'PIVOTBY', 'TRIMRANGE', 'PERCENTOF', 'REGEXTEST', 'REGEXEXTRACT', 'REGEXREPLACE'];
const onekRe = new RegExp('(?<![A-Za-z_.])(' + YENI.map(x => x.replace('.', '\\.')).join('|') + ')\\(', 'g');
export const ingilizce = f => cevir(f, 'en', ISLEVLER).replace(onekRe, '_xlfn.$1(');
// İngilizce Excel'de TEXT'in biçim kodu da İngilizcedir (gg.aa.yyyy → dd.mm.yyyy, 0,0 → 0.0). Dosyaya yazılan formüllerde
// kod Türkçe kalır: kitap Türkçe Excel içindir. Bu dönüşüm yalnız Çözümler sayfasındaki İngilizce yazım içindir.
const tarihKoduEn = k => k.replace(/g{4}|g{3}|gg|g|a{4}|a{3}|aa|ss|yyyy|yy/g, t => ({ gggg: 'dddd', ggg: 'ddd', gg: 'dd', g: 'd', aaaa: 'mmmm', aaa: 'mmm', aa: 'mm', ss: 'hh', yyyy: 'yyyy', yy: 'yy' }[t]));
const sayiKoduEn = k => k.replace(/[.,]/g, c => c === '.' ? ',' : '.');
const biçimKoduEn = k => /[gGaAyY]/.test(k.replace(/"[^"]*"/g, '')) ? tarihKoduEn(k) : sayiKoduEn(k);
export const ingilizceYazim = f => ingilizce(f).replace(/_xlfn\./g, '').replace(/TEXT\(((?:[^(),]|\([^()]*\))+),"([^"]*)"\)/g, (m, x, k) => `TEXT(${x},"${biçimKoduEn(k)}")`);

const TUR_AD = { secmeli: 'Seçmeli', pivot: 'Özet tablo', sorgu: 'Power Query', grafik: 'Grafik', pivotGrafik: 'Özet grafik', kosullu: 'Koşullu biçim', pano: 'Pano', dogrulama: 'Veri doğrulama', bicim: 'Sayı biçimi', hucreBul: 'Hücre bul', sayi: 'Sayı', ad: 'Ad tanımla', hedefAra: 'Hedef Ara', veriTablosu: 'Veri Tablosu', birlestir: 'Birleştir', gelismisFiltre: 'Gelişmiş Filtre', cozucu: 'Çözücü', makro: 'Makro' };
const metinKisa = s => String(s || '').replace(/\*\*/g, '').replace(/`/g, '');

/* ---------------------------------------------------------------- veri sayfası */
function veriSayfasi(ad, t, { tablo = false, sayfaAdi = ad } = {}) {
  const hucreler = [], genislik = {};
  const basliklar = t.basliklar; // ham sayfada da başlık satırı vardır; yalnız Excel Tablosu yapılmaz
  let r = 1;
  if (basliklar) { basliklar.forEach((b, j) => hucreler.push({ r: 1, c: j + 1, v: b, stil: STIL.baslik })); r = 2; }
  const bicim = t.bicim || [];
  t.satirlar.forEach((sat, i) => sat.forEach((v, j) => {
    if (v == null || v === '') return;
    const h = { r: r + i, c: j + 1 };
    if (typeof v === 'string' && v.startsWith('=')) { try { h.f = ingilizce(v); } catch { h.v = v; } } else h.v = v;
    const b = enBicim(bicim[j]); if (b) h.bicim = b;
    hucreler.push(h);
  }));
  const sutun = Math.max(basliklar ? basliklar.length : 0, ...t.satirlar.map(s => s.length));
  for (let j = 1; j <= sutun; j++) {
    const uz = Math.max(8, ...[basliklar?.[j - 1], ...t.satirlar.slice(0, 60).map(s => s[j - 1])].map(v => v == null ? 0 : String(v).length));
    genislik[j] = Math.min(40, uz + (bicim[j - 1] ? 5 : 3));
  }
  const s = { ad: sayfaAdi.slice(0, 31), hucreler, genislik, dondur: !!basliklar };
  if (tablo && basliklar && !t.ham && t.satirlar.length) s.tablo = { ad: ad.replace(/\s+/g, '_'), r1: 1, c1: 1, r2: t.satirlar.length + 1, c2: basliklar.length, basliklar };
  return s;
}

/* ---------------------------------------------------------------- alıştırma bilgisi */
const hedefMetni = a => {
  if (!a.hedef) return '';
  if (a.okunan) return `${a.hedef} (sonuç ${a.okunan} alanına taşar)`;
  if (!a.hedef.includes(':')) return a.hedef;
  const ilk = a.hedef.split(':')[0];
  return a.ikiYon ? `${a.hedef} (${ilk}'ye yazıp sağa ve aşağı doldurun)` : `${a.hedef} (${ilk}'ye yazıp aşağı doldurun)`;
};
const hazirlikMetni = h => Object.entries(h || {}).map(([k, v]) => `${k} = ${v == null ? '(boş)' : typeof v === 'number' ? String(v).replace('.', ',') : v}`).join('; ');
// Başvurulan başka sayfalar: Ürünler!B2, 'Müşteri ham'!A1, Tatiller!$A$2
function basvurulanSayfalar(a) {
  const metin = [a.cozum, a.cevapFormul, ...Object.values(a.hazirlik || {}), ...Object.values(a.adlar || {})].filter(x => typeof x === 'string').join(' ');
  const ad = new Set(a.varyantSayfalar || []);
  for (const m of metin.matchAll(/'([^']+)'!|([A-Za-zÇĞİÖŞÜçğıöşü_][\wÇĞİÖŞÜçğıöşü ]*?)!/g)) { const n = (m[1] || m[2] || '').trim(); if (SAYFALAR[n]) ad.add(n); }
  return [...ad];
}
// Alıştırmanın ilk hedef hücresindeki beklenen değer (motorla)
function beklenen(a) {
  if (a.tur || !a.cozum || !a.hedef || typeof a.cozum !== 'string') return null;
  try {
    const durum = a.durumlar && a.durumlar[0] ? { ...a, hazirlik: { ...(a.hazirlik || {}), ...a.durumlar[0] } } : a;
    const k = kitapKur(durum, SAYFALAR), al = alanCoz(a.hedef.includes(':') ? a.hedef : a.hedef + ':' + a.hedef);
    const n = a.hedef.includes(':') ? al.r2 - al.r1 + 1 : 1, m = a.ikiYon ? al.c2 - al.c1 + 1 : 1;
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) k.yaz(a.sayfa, { r: al.r1 + i, c: al.c1 + j }, kaydir(a.cozum, i, j));
    k.hesapla();
    const v = k.hucre(a.sayfa, al.r1, al.c1);
    return hataMi(v) ? v.kod : v;
  } catch { return null; }
}
function cozumMetni(a) {
  if (a.tur === 'secmeli') return { tr: a.secenekler[a.dogru], aciklama: a.aciklama };
  if (a.tur === 'sayi') return { tr: a.cevapFormul, aciklama: a.aciklama || '' };
  if (a.tur === 'bicim') return { tr: a.cozum, aciklama: 'Hücreleri Biçimlendir > Sayı > İsteğe uyarlanmış' };
  if (a.tur === 'hucreBul') return { tr: a.dogru.join(', '), aciklama: a.aciklama || '' };
  if (!a.tur && typeof a.cozum === 'string') return { tr: a.cozum, en: (() => { try { return ingilizceYazim(a.cozum); } catch { return ''; } })(), aciklama: '' };
  return { tr: '', aciklama: 'Bu alıştırma Kesit\'te etkileşimli denetlenir; çözüm adımları oradaki ipuçlarında.' };
}

/* ---------------------------------------------------------------- çalışma sayfası (hazırlığı yapılmış kopya) */
function calismaSayfasi(a, ad) {
  const t = SAYFALAR[a.sayfa]; if (!t) return { sayfa: null, notlar: [] };
  const s = veriSayfasi(a.sayfa, t, { sayfaAdi: ad });
  const notlar = [];
  const yerler = new Map(s.hucreler.map(h => [h.r + ',' + h.c, h]));
  const koy = (r, c, ek) => { const k = r + ',' + c; const h = yerler.get(k) || { r, c }; Object.assign(h, ek); if (!yerler.has(k)) { yerler.set(k, h); s.hucreler.push(h); } };
  const hz = { ...(a.hazirlik || {}), ...((a.durumlar && a.durumlar[0]) || {}) };
  let kk = null;
  for (const [adr, v] of Object.entries(hz)) {
    const m = /^([A-Z]+)(\d+)$/.exec(adr); if (!m) continue;
    const c = [...m[1]].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0), r = Number(m[2]);
    if (v == null) { koy(r, c, { v: null, f: undefined }); continue; }
    if (typeof v === 'string' && v.startsWith('=')) {
      // Taşan formül (BENZERSİZ gibi) dosyaya düz formül olarak yazılırsa Excel @ ekleyip tek değer gösterir: yönergeye çevrilir
      kk = kk || (() => { const k = kitapKur({ sayfa: a.sayfa, hazirlik: hz }, SAYFALAR); k.hesapla(); return k; })();
      if (kk.tasmaMi(a.sayfa, r + 1, c) || kk.tasmaMi(a.sayfa, r, c + 1)) { notlar.push(`${adr} hücresine önce ${v} yazın`); continue; }
      try { koy(r, c, { f: ingilizce(v), v: undefined }); } catch { koy(r, c, { v }); }
    } else koy(r, c, { v, f: undefined });
    if (!s.genislik[c] || s.genislik[c] < 12) s.genislik[c] = Math.max(s.genislik[c] || 0, Math.min(30, String(v).length + 3));
  }
  // Hedef hücreler sarı
  if (a.hedef) {
    const al = alanCoz((a.hedef.includes(':') ? a.hedef : a.hedef + ':' + a.hedef));
    for (let r = al.r1; r <= al.r2; r++) for (let c = al.c1; c <= al.c2; c++) { const b = enBicim(a.bicim); koy(r, c, { stil: STIL.hedef, ...(b ? { bicim: b } : {}) }); s.genislik[c] = Math.max(s.genislik[c] || 0, 12); }
  }
  return { sayfa: s, notlar };
}

function gorevSatirlari(d, alistirmalar, sayfaAdlari) {
  return alistirmalar.map((a, i) => [i + 1, TUR_AD[a.tur] || 'Formül', metinKisa(a.soru) + (a.tur === 'secmeli' ? '\n' + a.secenekler.map((x, j) => `${'ABCD'[j]}) ${x}`).join('\n') : ''), sayfaAdlari[i] || (a.sayfa || ''), hedefMetni(a), '', (a.ipuclari || [])[0] || '']);
}

function tabloSayfasi(ad, ust, basliklar, satirlar, genislikler) {
  const hucreler = []; let r = 1;
  for (const [metin, stil] of ust) { hucreler.push({ r, c: 1, v: metin, stil }); r++; }
  if (ust.length) r++;
  basliklar.forEach((b, j) => hucreler.push({ r, c: j + 1, v: b, stil: STIL.baslik }));
  satirlar.forEach((s, i) => s.forEach((v, j) => { if (v !== '' && v != null) hucreler.push({ r: r + 1 + i, c: j + 1, v, stil: typeof v === 'string' && v.length > 40 ? STIL.kaydir : 0 }); }));
  return { ad, hucreler, genislik: Object.fromEntries(genislikler.map((w, j) => [j + 1, w])) };
}

const tabloluMu = a => !!a.tabloGerekli || (typeof a.cozum === 'string' && /[A-Za-zÇĞİÖŞÜçğıöşü_]\[|^=?\[@|\[@/.test(a.cozum));
// Tanımlı adlar (Fiyatlar, KDV_Orani…) kitaba eklenir; LAMBDA adları Excel'de elle tanımlanır (dosya biçimi farklı)
function adEkle(a, adlar, notlar) {
  for (const [ad, tanim] of Object.entries(a.adlar || {})) {
    if (adlar.some(x => x.ad === ad)) continue;
    if (/LAMBDA/i.test(tanim)) { notlar.push(`Formüller > Ad Yöneticisi'nde ${ad} adını ${tanim} olarak tanımlayın`); continue; }
    try { adlar.push({ ad, tanim: ingilizce(tanim).replace(/^=/, '') }); } catch { notlar.push(`${ad} adını ${tanim} olarak tanımlayın`); }
  }
}
function hedefBoya(s, a) {
  if (!a.hedef) return;
  const al = alanCoz(a.hedef.includes(':') ? a.hedef : a.hedef + ':' + a.hedef), yer = new Map(s.hucreler.map(h => [h.r + ',' + h.c, h]));
  for (let r = al.r1; r <= al.r2; r++) for (let c = al.c1; c <= al.c2; c++) { const h = yer.get(r + ',' + c); if (h) h.stil = STIL.hedef; else s.hucreler.push({ r, c, stil: STIL.hedef }); s.genislik[c] = Math.max(s.genislik[c] || 0, 12); }
}

/* ---------------------------------------------------------------- ders kitabı */
export function dersKitabi(d) {
  const modul = MODULLER.find(m => m.id === d.modul);
  const sayfalar = [], sayfaAdlari = [], notlar = [], adlar = [], notlarAd = [], hedefIsaret = [];
  const referans = new Set();
  d.alistirmalar.forEach((a, i) => {
    if (!a.sayfa || !SAYFALAR[a.sayfa] || a.tur === 'secmeli') { sayfaAdlari.push(''); notlar.push(''); return; }
    basvurulanSayfalar(a).forEach(x => referans.add(x));
    adEkle(a, adlar, notlarAd);
    // Yapılandırılmış başvuru (Satışlar[Adet]) Excel Tablosu ister: alıştırma asıl sayfada (tablolu) çözülür
    if (tabloluMu(a)) { referans.add(a.sayfa); hedefIsaret.push(a); sayfaAdlari.push(a.sayfa); notlar.push(notlarAd.splice(0).join('; ')); return; }
    const ad = `Alıştırma ${i + 1}`;
    const { sayfa, notlar: n } = calismaSayfasi(a, ad);
    sayfalar.push(sayfa); sayfaAdlari.push(ad); notlar.push([...n, ...notlarAd.splice(0)].join('; '));
  });
  const gorev = gorevSatirlari(d, d.alistirmalar, sayfaAdlari).map((s, i) => { s[5] = notlar[i]; return s; });
  const ust = [[`Kesit Excel · Modül ${modul.no}.${d.id.split('-d')[1]} · ${d.baslik}`, STIL.buyuk], [metinKisa(d.ozet), 0],
    ['Her alıştırmanın kendi sayfası var; sarı hücreler hedeftir. Formülü sarı alanın ilk hücresine yazın. Çözümler en sondaki sayfada.', 0],
    ['Formüller Türkçe Excel yazımıyla verilmiştir (; ayırıcı). İngilizce Excel kullanıyorsanız Çözümler sayfasındaki İngilizce yazıma bakın.', 0]];
  const gorevSayfa = tabloSayfasi('Görevler', ust, ['No', 'Tür', 'Görev', 'Çalışma sayfası', 'Hedef', 'Hazırlık', 'İpucu'], gorev, [5, 12, 70, 16, 30, 30, 40]);
  const refSayfalar = [...referans].filter(x => SAYFALAR[x]).map(x => {
    const s = veriSayfasi(x, SAYFALAR[x], { tablo: true });
    for (const a of hedefIsaret.filter(a => a.sayfa === x)) hedefBoya(s, a);
    return s;
  });
  const coz = d.alistirmalar.map((a, i) => { const c = cozumMetni(a); const b = beklenen(a); return [i + 1, c.tr || '', c.en || '', b == null ? '' : b, c.aciklama || '']; });
  const cozSayfa = tabloSayfasi('Çözümler', [['Çözümler: önce kendiniz deneyin.', STIL.kalin]], ['No', 'Çözüm (Türkçe Excel)', 'İngilizce Excel', 'Beklenen ilk sonuç', 'Açıklama'], coz, [5, 60, 60, 18, 60]);
  return { baslik: `Kesit Excel · ${d.baslik}`, sayfalar: [gorevSayfa, ...sayfalar, ...refSayfalar, cozSayfa], adlar };
}

/* ---------------------------------------------------------------- tek kitap: bütün alıştırmalar */
export function tumKitap(dersler) {
  const gorev = [], coz = [];
  for (const d of dersler) {
    const m = MODULLER.find(x => x.id === d.modul), no = `${m.no}.${d.id.split('-d')[1]}`;
    d.alistirmalar.forEach((a, i) => {
      gorev.push([no, d.baslik, i + 1, TUR_AD[a.tur] || 'Formül', metinKisa(a.soru) + (a.tur === 'secmeli' ? '\n' + a.secenekler.map((x, j) => `${'ABCD'[j]}) ${x}`).join('\n') : ''), a.tur === 'secmeli' ? '' : (a.sayfa || ''), hedefMetni(a), hazirlikMetni({ ...(a.hazirlik || {}), ...((a.durumlar && a.durumlar[0]) || {}) }), (a.ipuclari || [])[0] || '']);
      const c = cozumMetni(a);
      coz.push([no, i + 1, c.tr || '', c.en || '', c.aciklama || '']);
    });
  }
  const ust = [['Kesit Excel · Alıştırma kitabı', STIL.buyuk], [`${dersler.length} ders, ${gorev.length} alıştırma. Veri sayfaları Kesit'tekinin aynısıdır ve Excel Tablosudur.`, 0],
    ['Bir alıştırmayı çözmek için: Hazırlık sütunundaki değerleri o sayfaya yazın, formülü Hedef hücreye yazın, sonra Çözümler sayfasıyla karşılaştırın. Sonraki alıştırmadan önce yazdıklarınızı silin (Ctrl+Z ya da hücreleri temizleyin).', 0],
    ['Her ders için hazırlığı yapılmış ayrı bir kitabı da dersin altından indirebilirsiniz.', 0]];
  const gorevSayfa = tabloSayfasi('Görevler', ust, ['Ders', 'Ders adı', 'No', 'Tür', 'Görev', 'Sayfa', 'Hedef', 'Hazırlık', 'İpucu'], gorev, [7, 30, 5, 12, 70, 14, 28, 40, 40]);
  gorevSayfa.dondur = false;
  const veri = Object.entries(SAYFALAR).map(([ad, t]) => veriSayfasi(ad, t, { tablo: true }));
  const cozSayfa = tabloSayfasi('Çözümler', [['Çözümler: önce kendiniz deneyin.', STIL.kalin]], ['Ders', 'No', 'Çözüm (Türkçe Excel)', 'İngilizce Excel', 'Açıklama'], coz, [7, 5, 60, 60, 60]);
  return { baslik: 'Kesit Excel · Alıştırma kitabı', sayfalar: [gorevSayfa, ...veri, cozSayfa] };
}

export async function kitapBaytlari(kitap) { return xlsx(kitap); }
export function dosyaAdi(d) { return `kesit-excel-${d.id}.xlsx`; }
