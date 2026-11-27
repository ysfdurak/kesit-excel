// Kesit Excel · Özet Tablo (PivotTable) motoru.
// Girdi: { basliklar, satirlar, bicim? }  Yapı: { satir, sutun?, degerler:[{alan, ozet}], filtreler:[{alan, degerler}], grupla:{alan: 'yil'|'ceyrek'|'ay'}, goster }
// Çıktı: { basliklar, satirlar (2B, son satır Genel Toplam), hucreler: [{satirDeger, sutunDeger, alan}] } — hücre kaynağı eşdeğer formül üretmek için tutulur.
import { seriye, AYLAR } from './tarih.js';
import { karsilastir } from './formul.js';

export const OZETLER = {
  toplam: { tr: 'Toplam', excel: 'TOPLA' },
  say: { tr: 'Say', excel: 'BAĞ_DEĞ_DOLU_SAY' },
  ortalama: { tr: 'Ortalama', excel: 'ORTALAMA' },
  en_buyuk: { tr: 'En Büyük', excel: 'MAK' },
  en_kucuk: { tr: 'En Küçük', excel: 'MİN' },
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

export function pivot(tablo, yapi) {
  const B = tablo.basliklar, idx = ad => { const i = B.indexOf(ad); if (i < 0) throw new Error('Alan bulunamadı: ' + ad); return i; };
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
  const vi = degerler.map(d => ({ ...d, i: idx(d.alan), ozet: d.ozet || 'toplam' }));
  const kova = new Map();
  for (const r of rows) {
    const k = norm(anahtar(r, si, yapi.satir)) + '\u0001' + norm(anahtar(r, ci, yapi.sutun));
    if (!kova.has(k)) kova.set(k, []);
    kova.get(k).push(r);
  }
  const hesap = (filtre, d) => ozetle(rows.filter(filtre).map(r => r[d.i]), d.ozet);
  const hucre = (a, b, d) => {
    const ks = [];
    if (a === undefined && b === undefined) return ozetle(rows.map(r => r[d.i]), d.ozet);
    return hesap(r => (a === undefined || norm(anahtar(r, si, yapi.satir)) === norm(a)) && (b === undefined || norm(anahtar(r, ci, yapi.sutun)) === norm(b)), d);
  };
  const ad = d => OZETLER[d.ozet].tr + ' / ' + d.alan;
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
