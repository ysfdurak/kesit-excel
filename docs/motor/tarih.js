// Kesit Excel · tarih seri sayısı ve METNEÇEVİR (TEXT) biçim kodları.
// Excel 1900 tarih sistemi: 1 = 1 Ocak 1900; 60 = var olmayan 29 Şubat 1900 (Lotus 1-2-3'ten kalan hata);
// 1 Mart 1900'den sonra seri sayı = 30 Aralık 1899'dan bu yana geçen gün.

const GUN_MS = 86400000;
const TABAN = Date.UTC(1899, 11, 30);

export function seriden(y, m, d) {
  // Excel TARİH(y; m; d): ay ve gün taşmaları ileri/geri sarar. y < 1900 ise 1900 eklenir (0-1899 arası).
  if (y >= 0 && y < 1900) y += 1900;
  const t = Date.UTC(y, m - 1, 1) + (d - 1) * GUN_MS;
  let s = Math.round((t - TABAN) / GUN_MS);
  if (s < 61) s -= 1; // 1 Mart 1900 öncesi: sahte 29 Şubat yüzünden bir gün kayar
  if (y === 1900 && m === 2 && d === 29) return 60;
  return s;
}
export function seriye(s) {
  // seri sayı → { y, m, d, gs (haftanın günü, 0 = Pazar), saat, dakika, saniye }
  const gun = Math.floor(s), kesir = s - gun;
  let y, m, d, gs;
  if (gun === 60) { y = 1900; m = 2; d = 29; gs = 3; }
  else {
    const t = new Date(TABAN + (gun < 60 ? gun + 1 : gun) * GUN_MS);
    y = t.getUTCFullYear(); m = t.getUTCMonth() + 1; d = t.getUTCDate(); gs = t.getUTCDay();
    if (gun < 60) gs = (gs + 6) % 7; // 1900 öncesi kaymayı haftanın gününde de Excel gibi yap
  }
  let sn = Math.round(kesir * 86400);
  if (sn >= 86400) sn = 86399;
  return { y, m, d, gs, saat: Math.floor(sn / 3600), dakika: Math.floor(sn / 60) % 60, saniye: sn % 60 };
}
export const zaman = (h, mi, s) => ((h * 3600 + mi * 60 + s) % 86400 + 86400) % 86400 / 86400;
export const ayinSonGunu = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();

export const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
export const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

// Metin → tarih: gg.aa.yyyy, gg/aa/yyyy, yyyy-aa-gg (isteğe bağlı ss:dd[:ss])
export function metindenTarih(t) {
  const s = String(t).trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(s);
  if (m) return gecerli(+m[1], +m[2], +m[3]) ? seriden(+m[1], +m[2], +m[3]) + (m[4] ? zaman(+m[4], +m[5], +(m[6] || 0)) : 0) : null;
  m = /^(\d{1,2})[./](\d{1,2})[./](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(s);
  if (m) { let y = +m[3]; if (y < 100) y += y < 30 ? 2000 : 1900; return gecerli(y, +m[2], +m[1]) ? seriden(y, +m[2], +m[1]) + (m[4] ? zaman(+m[4], +m[5], +(m[6] || 0)) : 0) : null; }
  m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(s);
  if (m) return zaman(+m[1], +m[2], +(m[3] || 0));
  return null;
}
const gecerli = (y, m, d) => m >= 1 && m <= 12 && d >= 1 && d <= ayinSonGunu(y, m) && y >= 1900 && y <= 9999;

// Sayı biçimleme: Türkçe (nokta binlik, virgül ondalık)
export function trSayi(x, ondalik = null) {
  if (!Number.isFinite(x)) return String(x);
  if (ondalik == null) {
    // Genel biçim: 15 anlamlı basamak, gereksiz sıfırsız (Excel'in Genel biçimine yakın)
    if (x !== 0 && (Math.abs(x) >= 1e11 || Math.abs(x) < 1e-9)) return x.toExponential(5).replace('.', ',').replace(/e\+?/, 'E+').replace('E+-', 'E-');
    const s = String(+x.toPrecision(15));
    const [a, b] = s.split('.');
    return a + (b ? ',' + b : '');
  }
  const s = Math.abs(x).toFixed(ondalik), [a, b] = s.split('.');
  return (x < 0 && +s !== 0 ? '-' : '') + a.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (b ? ',' + b : '');
}

// METNEÇEVİR / TEXT biçim kodları. Türkçe Excel kodları (gg, aa, yyyy, ss, dd) ve İngilizce kodlar (dd, mm, yyyy, hh, mm) kabul edilir.
// Hangi dilin kodu olduğu: içinde g/a varsa Türkçe kabul edilir; "mm" saat ya da saniyeye komşuysa dakikadır.
export function bicimle(deger, kod) {
  const k = String(kod);
  if (typeof deger !== 'number') return String(deger ?? '');
  const tarihKodu = /[yYgGaAdDsShHmM]/.test(k.replace(/"[^"]*"/g, '').replace(/\[[^\]]*\]/g, '')) && !/^[#0.,%\s\-+()₺TL€$]*$/i.test(k.replace(/"[^"]*"/g, ''));
  if (tarihKodu && !/[0#]/.test(k.replace(/"[^"]*"/g, ''))) return tarihBicim(deger, k);
  return sayiBicim(deger, k);
}

function tarihBicim(s, kod) {
  const t = seriye(s), turkce = /[gGaA]/.test(kod.replace(/"[^"]*"/g, ''));
  const iki = n => String(n).padStart(2, '0');
  const tokenler = kod.match(/"[^"]*"|\\.|yyyy|yy|gggg|ggg|gg|g|dddd|ddd|dd|d|aaaa|aaa|aa|a|mmmm|mmm|mm|m|ss|s|hh|h|nn|AM\/PM|ÖÖ\/ÖS|./gi) || [];
  const out = [];
  for (let i = 0; i < tokenler.length; i++) {
    const tk = tokenler[i], lo = tk.toLowerCase();
    if (tk.startsWith('"')) { out.push(tk.slice(1, -1)); continue; }
    if (tk.startsWith('\\')) { out.push(tk.slice(1)); continue; }
    if (lo === 'yyyy') { out.push(String(t.y)); continue; }
    if (lo === 'yy') { out.push(iki(t.y % 100)); continue; }
    if (turkce) {
      if (lo === 'gggg') { out.push(GUNLER[t.gs]); continue; }
      if (lo === 'ggg') { out.push(GUNLER[t.gs].slice(0, 3)); continue; }
      if (lo === 'gg') { out.push(iki(t.d)); continue; }
      if (lo === 'g') { out.push(String(t.d)); continue; }
      if (lo === 'aaaa') { out.push(AYLAR[t.m - 1]); continue; }
      if (lo === 'aaa') { out.push(AYLAR[t.m - 1].slice(0, 3)); continue; }
      if (lo === 'aa') { out.push(iki(t.m)); continue; }
      if (lo === 'a') { out.push(String(t.m)); continue; }
      if (lo === 'ss') { out.push(iki(t.saat)); continue; }   // Türkçe: ss = saat
      if (lo === 'dd') { out.push(iki(t.dakika)); continue; } // Türkçe: dd = dakika
      if (lo === 'nn') { out.push(iki(t.saniye)); continue; }
    } else {
      if (lo === 'dddd') { out.push(GUNLER[t.gs]); continue; }
      if (lo === 'ddd') { out.push(GUNLER[t.gs].slice(0, 3)); continue; }
      if (lo === 'dd') { out.push(iki(t.d)); continue; }
      if (lo === 'd') { out.push(String(t.d)); continue; }
      const onceki = out.length ? tokenler.slice(0, i).reverse().find(x => /^[a-z]+$/i.test(x)) : '', sonraki = tokenler.slice(i + 1).find(x => /^[a-z]+$/i.test(x));
      const dakika = /^h+$/i.test(onceki || '') || /^s+$/i.test(sonraki || '');
      if (lo === 'mmmm') { out.push(AYLAR[t.m - 1]); continue; }
      if (lo === 'mmm') { out.push(AYLAR[t.m - 1].slice(0, 3)); continue; }
      if (lo === 'mm') { out.push(iki(dakika ? t.dakika : t.m)); continue; }
      if (lo === 'm') { out.push(String(dakika ? t.dakika : t.m)); continue; }
      if (lo === 'hh') { out.push(iki(t.saat)); continue; }
      if (lo === 'h') { out.push(String(t.saat)); continue; }
      if (lo === 'ss') { out.push(iki(t.saniye)); continue; }
      if (lo === 's') { out.push(String(t.saniye)); continue; }
    }
    out.push(tk);
  }
  return out.join('');
}

function sayiBicim(x, kod) {
  // Bölümler: pozitif;negatif;sıfır;metin
  const bolum = kod.split(/;(?=(?:[^"]*"[^"]*")*[^"]*$)/);
  let k = bolum[0], neg = false;
  if (x < 0 && bolum[1] != null) { k = bolum[1]; x = -x; neg = true; }
  else if (x === 0 && bolum[2] != null) k = bolum[2];
  k = k.replace(/\[[^\]]*\]/g, ''); // renk ve koşul ([Kırmızı], [>=1000]) metne çevirmede yok sayılır
  // Türkçe kodda virgül ondalık, nokta binlik; İngilizce kodda tersi. "0,00" Türkçe, "0.00" İngilizce.
  const sade = k.replace(/"[^"]*"/g, '');
  const yuzde = sade.includes('%');
  const v = yuzde ? x * 100 : x;
  let ondalikAyirici = ',', binlik = '.';
  const sonNokta = sade.lastIndexOf('.'), sonVirgul = sade.lastIndexOf(',');
  let ond = 0, binlikVar = false, enAzTam = 1, olcek = 1;
  const m = /([#0.,]+)/.exec(sade);
  if (m) {
    const g = m[1];
    // "#.##0" ve "#.##0," Türkçe binliktir (İngilizcede ondalık sonrası # anlamsız olurdu); "0.000" İngilizce üç ondalık.
    const enBinlik = /#,#{2}0(?![0#])/.test(g), trBinlik = /#\.#{2}0/.test(g);
    const eski = sonVirgul > sonNokta ? /,[0#]+$/.test(g) : (!/\.[0#]+$/.test(g) && /,/.test(g) && !/,[0#]{3}/.test(g));
    const trKod = enBinlik ? false : trBinlik ? true : eski;
    const dec = trKod ? ',' : '.', bin = trKod ? '.' : ',';
    // Kalıbın sonundaki her binlik ayırıcı 1000'e böler: #.##0. bin, #.##0.. milyon
    const olc = (g.match(new RegExp('\\' + bin + '+$')) || [''])[0].length;
    if (olc) { olcek = 1000 ** olc; }
    const [tamK, ondK] = g.replace(new RegExp('\\' + bin + '+$'), '').split(dec);
    ond = ondK ? (ondK.match(/[0#]/g) || []).length : 0;
    binlikVar = /[.,]/.test(tamK);
    enAzTam = (tamK.match(/0/g) || []).length; // "00000" → en az beş hane (176 → 00176); "#,00" → 0,5 için ",50"
  }
  let s = Math.abs(v / olcek).toFixed(ond);
  let [a, b] = s.split('.');
  if (a.length < enAzTam) a = a.padStart(enAzTam, '0');
  else if (enAzTam === 0 && a === '0') a = '';
  if (binlikVar) a = a.replace(/\B(?=(\d{3})+(?!\d))/g, binlik);
  const sayi = a + (b ? ondalikAyirici + b : '');
  // kod içindeki sayı kalıbını gerçek sayıyla değiştir, tırnaklı metinleri koru
  let out = '', yerlesti = false;
  for (const p of k.match(/"[^"]*"|[#0.,]+|./g) || []) {
    if (p.startsWith('"')) out += p.slice(1, -1);
    else if (/^[#0.,]+$/.test(p)) { if (!yerlesti) { out += sayi; yerlesti = true; } }
    else out += p;
  }
  if (!yerlesti) out = sayi + out;
  return ((v < 0 && !neg && +s !== 0) ? '-' : '') + out;
}
