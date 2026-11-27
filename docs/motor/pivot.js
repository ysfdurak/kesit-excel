// Kesit Excel · Özet Tablo (PivotTable) motoru.
// Girdi: { basliklar, satirlar, bicim? }  Yapı: { satir, sutun?, degerler:[{alan, ozet}], filtreler:[{alan, degerler}], grupla:{alan: 'yil'|'ceyrek'|'ay'}, goster }
// Çıktı: { basliklar, satirlar (2B, son satır Genel Toplam), hucreler: [{satirDeger, sutunDeger, alan}] } — hücre kaynağı eşdeğer formül üretmek için tutulur.
import { seriye, AYLAR } from './tarih.js';
import { karsilastir, ayristir, degerlendir, coz, hataMi, H, Bas } from './formul.js';
import { ISLEVLER, pivotKancaKur } from './islevler.js';

export const OZETLER = {
  toplam: { tr: 'Toplam', baslik: 'Toplam', excel: 'TOPLA' },
  say: { tr: 'Say', baslik: 'Say', excel: 'BAĞ_DEĞ_DOLU_SAY' },
  ortalama: { tr: 'Ortalama', baslik: 'Ortalama', excel: 'ORTALAMA' },
  en_buyuk: { tr: 'En Büyük', baslik: 'Mak', excel: 'MAK' },
  en_kucuk: { tr: 'En Küçük', baslik: 'Min', excel: 'MİN' },
};
export const GOSTER = { deger: 'Değer', genelYuzde: 'Genel toplamın %', satirYuzde: 'Satır toplamının %', sutunYuzde: 'Sütun toplamının %' };

const trK = s => String(s).toLocaleLowerCase('tr');
function grupDegeri(v, tur) {
  if (typeof v !== 'number' || !tur) return v;
  const t = seriye(v);
  if (tur === 'yil') return t.y;
  if (tur === 'ceyrek') return t.y + ' Ç' + Math.ceil(t.m / 3);
  if (tur === 'ay') return t.y + '-' + String(t.m).padStart(2, '0');
  return v;
}
export function grupEtiketi(g, tur) {
  if (tur === 'ay' && typeof g === 'string' && /^\d{4}-\d{2}$/.test(g)) return AYLAR[Number(g.slice(5)) - 1] + ' ' + g.slice(0, 4);
  return g;
}
function ozetle(xs, ozet) {
  if (ozet === 'say') return xs.filter(x => x != null && x !== '').length;
  const n = xs.filter(x => typeof x === 'number');
  if (ozet === 'toplam') return n.reduce((a, b) => a + b, 0);
  if (!n.length) return null;
  if (ozet === 'ortalama') return n.reduce((a, b) => a + b, 0) / n.length;
  if (ozet === 'en_buyuk') return Math.max(...n);
  if (ozet === 'en_kucuk') return Math.min(...n);
  return null;
}
const sirala = xs => xs.sort((a, b) => (a == null) - (b == null) || (typeof a === typeof b ? karsilastir(a, b) : typeof a === 'number' ? -1 : 1));

// Hesaplanmış alan (Özet Tablo Analizi > Alanlar, Öğeler ve Kümeler > Hesaplanmış Alan).
// Excel'deki gibi formül, her hücrede alanların TOPLAMI üzerinden hesaplanır: ='Birim Fiyat'*Adet → TOPLA(Fiyat) × TOPLA(Adet).
// Satır satır çarpımın toplamı değildir; bu, dersin öğrettiği tuzaktır.
export function hesaplanmisAlanDerle(formul, basliklar) {
  let f = String(formul).trim(); if (!f.startsWith('=')) f = '=' + f;
  const kullanilan = [], yer = new Map();
  const ad = i => 'ALAN' + i + 'X';
  // 'Tırnaklı alan' ve çıplak alan adları (uzundan kısaya) yer tutucuyla değişir; dizgi sabitlerine dokunulmaz
  const parcalar = f.split(/("(?:[^"]|"")*")/);
  const sirali = basliklar.map((b, i) => [b, i]).sort((a, b) => b[0].length - a[0].length);
  for (let k = 0; k < parcalar.length; k += 2) {
    let p = parcalar[k];
    p = p.replace(/'([^']+)'/g, (m, a) => { const i = basliklar.findIndex(b => b.toLocaleLowerCase('tr') === a.toLocaleLowerCase('tr')); if (i < 0) throw new Error('Alan bulunamadı: ' + a); yer.set(i, ad(i)); return ad(i); });
    for (const [b, i] of sirali) {
      if (/\s/.test(b)) continue;
      const re = new RegExp('(^|[^\\wÇĞİÖŞÜçğıöşü])(' + b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?![\\wÇĞİÖŞÜçğıöşü(])', 'giu');
      p = p.replace(re, (m, on) => { yer.set(i, ad(i)); return on + ad(i); });
    }
    parcalar[k] = p;
  }
  for (const i of yer.keys()) kullanilan.push(i);
  const agac = ayristir(parcalar.join(''), ISLEVLER);
  return { agac, kullanilan };
}
function hesaplanmisDeger(derli, satirlar) {
  const degisken = new Map();
  for (const i of derli.kullanilan) degisken.set('ALAN' + i + 'X', satirlar.reduce((t, r) => t + (typeof r[i] === 'number' ? r[i] : 0), 0));
  try { const v = coz(degerlendir(derli.agac, { kitap: { islevler: ISLEVLER }, sayfa: null, satir: 1, sutun: 1, adim: { n: 0 }, bugun: null, degisken }), {}); return v; }
  catch { return H.DEGER; }
}

export function pivot(tablo, yapi) {
  const hesaplanan = new Map((yapi.hesaplananlar || []).map(h => [h.ad, h]));
  const B = tablo.basliklar, idx = ad => { const i = B.indexOf(ad); if (i < 0 && hesaplanan.has(ad)) return -1; if (i < 0) throw new Error('Alan bulunamadı: ' + ad); return i; };
  const g = yapi.grupla || {};
  const degerler = (yapi.degerler || []).filter(d => d && d.alan);
  if (!yapi.satir && !yapi.sutun && !degerler.length) throw new Error('En az bir alan seçin');
  if (yapi.sutun && degerler.length > 1) throw new Error('Sütun alanı varken tek değer alanı kullanılır');
  let rows = tablo.satirlar;
  for (const f of yapi.filtreler || []) {
    if (!f.degerler || !f.degerler.length) continue;
    const i = idx(f.alan), izin = new Set(f.degerler.map(v => typeof v === 'string' ? trK(v) : v));
    rows = rows.filter(r => izin.has(typeof grupDegeri(r[i], g[f.alan]) === 'string' ? trK(grupDegeri(r[i], g[f.alan])) : grupDegeri(r[i], g[f.alan])));
  }
  const si = yapi.satir ? idx(yapi.satir) : -1, ci = yapi.sutun ? idx(yapi.sutun) : -1;
  const anahtar = (r, i, alan) => i < 0 ? '' : grupDegeri(r[i], g[alan]);
  const norm = v => typeof v === 'string' ? trK(v).trim() : v;
  // Excel aynı metni büyük/küçük harften bağımsız tek öğe sayar; ilk görülen yazım kullanılır
  const etiket = new Map();
  const satirAnah = [], sutunAnah = [];
  for (const r of rows) {
    const a = anahtar(r, si, yapi.satir), b = anahtar(r, ci, yapi.sutun);
    if (!etiket.has('s' + norm(a))) { etiket.set('s' + norm(a), a); satirAnah.push(a); }
    if (!etiket.has('c' + norm(b))) { etiket.set('c' + norm(b), b); sutunAnah.push(b); }
  }
  sirala(satirAnah); sirala(sutunAnah);
  const vi = degerler.map(d => ({ ...d, i: idx(d.alan), ozet: hesaplanan.has(d.alan) ? 'toplam' : (d.ozet || 'toplam'), derli: hesaplanan.has(d.alan) ? hesaplanmisAlanDerle(hesaplanan.get(d.alan).formul, B) : null }));
  const kova = new Map();
  for (const r of rows) {
    const k = norm(anahtar(r, si, yapi.satir)) + '\u0001' + norm(anahtar(r, ci, yapi.sutun));
    if (!kova.has(k)) kova.set(k, []);
    kova.get(k).push(r);
  }
  const hesap = (filtre, d) => d.derli ? hesaplanmisDeger(d.derli, rows.filter(filtre)) : ozetle(rows.filter(filtre).map(r => r[d.i]), d.ozet);
  const hucre = (a, b, d) => {
    if (a === undefined && b === undefined) return d.derli ? hesaplanmisDeger(d.derli, rows) : ozetle(rows.map(r => r[d.i]), d.ozet);
    return hesap(r => (a === undefined || norm(anahtar(r, si, yapi.satir)) === norm(a)) && (b === undefined || norm(anahtar(r, ci, yapi.sutun)) === norm(b)), d);
  };
  // Başlık Türkçe Excel'deki gibi: "Toplam Adet", "Mak Birim Fiyat" (gerçek Excel'de denendi, 27.11.2026)
  const ad = d => d.derli ? 'Toplam ' + d.alan : OZETLER[d.ozet].baslik + ' ' + d.alan;
  const basliklar = [yapi.satir ? (g[yapi.satir] ? yapi.satir + ' (' + { yil: 'yıl', ceyrek: 'çeyrek', ay: 'ay' }[g[yapi.satir]] + ')' : yapi.satir) : ''];
  const sutunlar = []; // { b (sütun değeri | undefined), d }
  if (yapi.sutun) { for (const b of sutunAnah) sutunlar.push({ b, d: vi[0] }); sutunlar.push({ b: undefined, d: vi[0], toplam: true }); }
  else for (const d of vi) sutunlar.push({ b: undefined, d });
  for (const s of sutunlar) basliklar.push(s.toplam ? 'Genel Toplam' : yapi.sutun ? (s.b == null || s.b === '' ? '(boş)' : grupEtiketi(s.b, g[yapi.sutun])) : ad(s.d));
  const ham = [];
  const satirListe = yapi.satir ? satirAnah : [];
  for (const a of satirListe) ham.push({ a, v: sutunlar.map(s => hucre(a, s.b, s.d)) });
  const toplam = { a: undefined, v: sutunlar.map(s => hucre(undefined, s.b, s.d)) };
  // Gösterim: yüzde dönüşümleri (yalnız toplam/say için anlamlıdır)
  const goster = yapi.goster || 'deger';
  const genel = sutunlar.map((s, j) => yapi.sutun ? toplam.v[toplam.v.length - 1] : toplam.v[j]);
  const donustur = (satir, j) => {
    const v = satir.v[j]; if (v == null || goster === 'deger') return v;
    if (goster === 'genelYuzde') return genel[j] ? v / genel[j] : null;
    if (goster === 'sutunYuzde') return toplam.v[j] ? v / toplam.v[j] : null;
    if (goster === 'satirYuzde') { const t = yapi.sutun ? satir.v[satir.v.length - 1] : v; return t ? v / t : null; }
    return v;
  };
  const etiketle = (v, alan) => v == null || v === '' ? '(boş)' : grupEtiketi(v, g[alan]);
  const satirlar = ham.map(s => [etiketle(s.a, yapi.satir), ...s.v.map((_, j) => donustur(s, j))]);
  satirlar.push(['Genel Toplam', ...toplam.v.map((_, j) => donustur(toplam, j))]);
  return { basliklar, satirlar, yuzde: goster !== 'deger', sutunlar, satirAnahtarlari: satirListe, yapi };
}

// Ayrıntıya inme (pivot hücresine çift tık): o sayıyı oluşturan kaynak satırlar, Excel'de yeni sayfaya dökülür
export function ayrinti(tablo, sonuc, satirNo, sutunNo) {
  const y = sonuc.yapi, g = y.grupla || {}, B = tablo.basliklar, s = sonuc.sutunlar[sutunNo];
  const norm = v => typeof v === 'string' ? trK(v).trim() : v;
  const filtreli = (yapi) => {
    let rows = tablo.satirlar;
    for (const f of yapi.filtreler || []) { if (!f.degerler || !f.degerler.length) continue; const i = B.indexOf(f.alan), izin = new Set(f.degerler.map(norm)); rows = rows.filter(r => izin.has(norm(grupDegeri(r[i], g[f.alan])))); }
    return rows;
  };
  let rows = filtreli(y);
  if (y.satir && satirNo < sonuc.satirAnahtarlari.length) { const i = B.indexOf(y.satir), a = norm(sonuc.satirAnahtarlari[satirNo]); rows = rows.filter(r => norm(grupDegeri(r[i], g[y.satir])) === a); }
  if (y.sutun && s && s.b !== undefined) { const i = B.indexOf(y.sutun), b = norm(s.b); rows = rows.filter(r => norm(grupDegeri(r[i], g[y.sutun])) === b); }
  return { basliklar: B, satirlar: rows };
}

// Özet tabloyu kitaba yerleştirir (Excel'de pivot bir sayfada durur) ve ÖZETVERİAL için kaydeder
export function pivotYerlestir(kitap, sayfaAd, sol, kaynakSayfa, tablo, yapi) {
  const p = pivot(tablo, yapi), [c0, r0] = [sol.replace(/\d+/g, ''), Number(sol.replace(/\D+/g, ''))];
  let c1 = 0; for (const ch of c0.toUpperCase()) c1 = c1 * 26 + ch.charCodeAt(0) - 64;
  const yaz = (r, c, v) => kitap.yaz(sayfaAd, { r, c }, v == null ? null : v);
  p.basliklar.forEach((b, j) => yaz(r0, c1 + j, b || 'Satır Etiketleri'));
  p.satirlar.forEach((row, i) => row.forEach((v, j) => yaz(r0 + 1 + i, c1 + j, hataMi(v) ? null : v)));
  kitap.pivotlar = kitap.pivotlar || [];
  kitap.pivotlar = kitap.pivotlar.filter(x => !(x.sayfa === sayfaAd && x.r1 === r0 && x.c1 === c1));
  kitap.pivotlar.push({ sayfa: sayfaAd, r1: r0, c1, r2: r0 + p.satirlar.length, c2: c1 + p.basliklar.length - 1, kaynakSayfa, tablo, yapi });
  return p;
}
// ÖZETVERİAL(veri_alanı; pivot_tablo; [alan1; öğe1; …])
pivotKancaKur((kitap, veriAlani, bas, ciftler) => {
  const pv = (kitap.pivotlar || []).find(x => x.sayfa.toLocaleLowerCase('tr') === String(bas.sayfa).toLocaleLowerCase('tr') && bas.r1 >= x.r1 && bas.r1 <= x.r2 && bas.c1 >= x.c1 && bas.c1 <= x.c2);
  if (!pv) return H.BASV;
  const y = pv.yapi, t = pv.tablo, B = t.basliklar, g = y.grupla || {};
  const ad = String(veriAlani).replace(/^(toplam|say|ortalama|en büyük|en küçük)\s*\/\s*/i, '').trim().toLocaleLowerCase('tr');
  const d = (y.degerler || []).find(x => x.alan && x.alan.toLocaleLowerCase('tr') === ad);
  if (!d) return H.BASV;
  let rows = t.satirlar;
  for (const f of y.filtreler || []) { if (!f.degerler || !f.degerler.length) continue; const i = B.indexOf(f.alan), izin = new Set(f.degerler.map(v => typeof v === 'string' ? trK(v) : v)); rows = rows.filter(r => izin.has(typeof r[i] === 'string' ? trK(r[i]) : r[i])); }
  for (let k = 0; k + 1 < ciftler.length; k += 2) {
    const alan = String(ciftler[k]), oge = ciftler[k + 1];
    if (![y.satir, y.sutun].filter(Boolean).some(a => a.toLocaleLowerCase('tr') === alan.toLocaleLowerCase('tr'))) return H.BASV;
    const i = B.findIndex(b => b.toLocaleLowerCase('tr') === alan.toLocaleLowerCase('tr')), tur = g[B[i]];
    const hedef = typeof oge === 'string' ? trK(oge) : oge;
    const once = rows.length;
    rows = rows.filter(r => { const v = grupDegeri(r[i], tur); return (typeof v === 'string' ? trK(v) : v) === hedef || (tur === 'ay' && typeof oge === 'string' && trK(grupEtiketi(v, tur)) === hedef); });
    if (!rows.length && once) return H.BASV;
  }
  const hs = (y.hesaplananlar || []).find(h => h.ad === d.alan);
  if (hs) return hesaplanmisDeger(hesaplanmisAlanDerle(hs.formul, B), rows);
  const v = ozetle(rows.map(r => r[B.indexOf(d.alan)]), d.ozet || 'toplam');
  return v == null ? H.BASV : v;
});

// Bir pivot hücresinin eşdeğer formülü: öğrenci "bu sayı nereden geldi?" sorusunu formülle görür.
// Tarih gruplaması için ay/yıl aralık koşulu yazılır.
export function esdegerFormul(sonuc, satirNo, sutunNo, sayfaAd, tablo) {
  const y = sonuc.yapi, s = sonuc.sutunlar[sutunNo]; if (!s) return null;
  const harf = i => { let n = i + 1, o = ''; while (n) { const m = (n - 1) % 26; o = String.fromCharCode(65 + m) + o; n = Math.floor((n - 1) / 26); } return o; };
  const son = tablo.satirlar.length + 1;
  const aralik = alan => { const i = tablo.basliklar.indexOf(alan); return `${sayfaAd}!$${harf(i)}$2:$${harf(i)}$${son}`; };
  const kosul = [];
  const ekle = (alan, deger) => {
    const tur = (y.grupla || {})[alan];
    if (tur === 'ay' && typeof deger === 'string') { const [yy, mm] = deger.split('-').map(Number); kosul.push([aralik(alan), `">="&TARİH(${yy};${mm};1)`], [aralik(alan), `"<"&TARİH(${yy};${mm + 1};1)`]); }
    else if (tur === 'yil') kosul.push([aralik(alan), `">="&TARİH(${deger};1;1)`], [aralik(alan), `"<"&TARİH(${deger + 1};1;1)`]);
    else if (tur === 'ceyrek') { const [yy, q] = String(deger).split(' Ç').map(Number); kosul.push([aralik(alan), `">="&TARİH(${yy};${(q - 1) * 3 + 1};1)`], [aralik(alan), `"<"&TARİH(${yy};${q * 3 + 1};1)`]); }
    else kosul.push([aralik(alan), typeof deger === 'number' ? String(deger) : '"' + String(deger).replace(/"/g, '""') + '"']);
  };
  for (const f of y.filtreler || []) if (f.degerler && f.degerler.length === 1) ekle(f.alan, f.degerler[0]);
  if (satirNo < sonuc.satirAnahtarlari.length) ekle(y.satir, sonuc.satirAnahtarlari[satirNo]);
  if (s.b !== undefined) ekle(y.sutun, s.b);
  const d = s.d, deg = aralik(d.alan);
  const k = kosul.map(([a, b]) => a + '; ' + b).join('; ');
  const coklu = (y.filtreler || []).some(f => f.degerler && f.degerler.length > 1);
  let f;
  if (d.ozet === 'toplam') f = kosul.length ? `=ÇOKETOPLA(${deg}; ${k})` : `=TOPLA(${deg})`;
  else if (d.ozet === 'say') f = kosul.length ? `=ÇOKEĞERSAY(${kosul.map(([a, b]) => a + '; ' + b).join('; ')})` : `=BAĞ_DEĞ_DOLU_SAY(${deg})`;
  else if (d.ozet === 'ortalama') f = kosul.length ? `=ÇOKEĞERORTALAMA(${deg}; ${k})` : `=ORTALAMA(${deg})`;
  else if (d.ozet === 'en_buyuk') f = kosul.length ? `=ÇOKEĞERMAK(${deg}; ${k})` : `=MAK(${deg})`;
  else f = kosul.length ? `=ÇOKEĞERMİN(${deg}; ${k})` : `=MİN(${deg})`;
  return { formul: f, not: coklu ? 'Çok değerli filtre formüle tek tek koşul olarak eklenmez; her değer için ayrı formül toplanır.' : null };
}
