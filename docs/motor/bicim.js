// Kesit Excel · özel sayı biçimi (Hücreleri Biçimlendir > Özel). Excel'in biçim kodu dilini uygular:
// en çok 4 bölüm (pozitif;negatif;sıfır;metin), koşul [>=1000], renk [Kırmızı], tırnaklı metin, \x, _x, *x,
// 0 # ? basamakları, binlik ayırıcı ve ölçekleme (#.##0. → bin), %, bilimsel E+00, @ metin yer tutucusu.
// Türkçe Excel'de kod Türkçe yazılır: binlik ".", ondalık ",". İngilizce kod (",", ".") da tanınır.
import { bicimle } from './tarih.js';

const RENKLER = {
  'SİYAH': '#000000', 'BLACK': '#000000', 'BEYAZ': '#ffffff', 'WHITE': '#ffffff', 'KIRMIZI': '#c00000', 'RED': '#c00000',
  'YEŞİL': '#008a17', 'GREEN': '#008a17', 'MAVİ': '#1f5fbf', 'BLUE': '#1f5fbf', 'SARI': '#b08800', 'YELLOW': '#b08800',
  'CAMGÖBEĞİ': '#008b8b', 'CYAN': '#008b8b', 'MACENTA': '#a0207a', 'MAGENTA': '#a0207a',
};
const trB = s => String(s).toLocaleUpperCase('tr');

// Kodu bölümlere ayırır; tırnak ve \ içindeki ; ayırıcı sayılmaz
function bolumler(kod) {
  const out = []; let cur = '', tirnak = false;
  for (let i = 0; i < kod.length; i++) {
    const ch = kod[i];
    if (ch === '"') tirnak = !tirnak;
    if (!tirnak && ch === '\\') { cur += ch + (kod[i + 1] ?? ''); i++; continue; }
    if (!tirnak && ch === ';') { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  return out;
}
// Köşeli parantezleri ayıklar: renk, koşul; geri kalan kod
function kosebasi(b) {
  let renk = null, kosul = null;
  const kalan = b.replace(/\[([^\]]*)\]/g, (m, ic) => {
    const t = trB(ic.trim());
    if (RENKLER[t]) { renk = RENKLER[t]; return ''; }
    if (/^(RENK|COLOR)\s*\d+$/.test(t)) { renk = '#555555'; return ''; }
    const k = /^(<=|>=|<>|<|>|=)\s*(-?[\d.,]+)$/.exec(ic.trim());
    if (k) { kosul = { op: k[1], v: Number(k[2].replace(',', '.')) }; return ''; }
    return m; // [$-41F], [h], [ss] gibi: tarih/saat koduna bırak
  });
  return { renk, kosul, kod: kalan };
}
const kosulTutar = (k, x) => ({ '<': x < k.v, '<=': x <= k.v, '>': x > k.v, '>=': x >= k.v, '=': x === k.v, '<>': x !== k.v })[k.op];

// Belirteçler: metin parçaları ve yer tutucular
function belirtecler(kod) {
  const t = [];
  for (let i = 0; i < kod.length; i++) {
    const ch = kod[i];
    if (ch === '"') { const j = kod.indexOf('"', i + 1); t.push({ m: kod.slice(i + 1, j < 0 ? kod.length : j) }); i = j < 0 ? kod.length : j; continue; }
    if (ch === '\\') { t.push({ m: kod[i + 1] ?? '' }); i++; continue; }
    if (ch === '_') { t.push({ m: ' ' }); i++; continue; }  // _) : ")" genişliğinde boşluk
    if (ch === '*') { i++; continue; }                        // *x : hücreyi x ile doldur (burada yok sayılır)
    if ('0#?'.includes(ch)) { t.push({ d: ch }); continue; }
    if (ch === '.' || ch === ',') { t.push({ a: ch }); continue; }
    if (ch === '%') { t.push({ yuzde: true, m: '%' }); continue; }
    if (ch === '@') { t.push({ metin: true }); continue; }
    if ((ch === 'E' || ch === 'e') && /[+-]/.test(kod[i + 1] || '')) { t.push({ us: kod[i + 1] }); i++; continue; }
    t.push({ m: ch });
  }
  return t;
}
// Dil: son ayırıcı ondalık mı? "#.##0,00" TR, "#,##0.00" EN. Tek ayırıcıda: ardından tam 3 basamak gelirse binliktir.
function dilBul(t, zorla) {
  if (zorla) return zorla;
  const ay = t.map((x, i) => x.a ? i : -1).filter(i => i >= 0);
  const ilkB = t.findIndex(x => x.d), sonB = t.length - 1 - [...t].reverse().findIndex(x => x.d);
  const ic = ay.filter(i => i > ilkB && i < sonB);
  if (!ic.length) return 'tr';
  const son = t[ic[ic.length - 1]].a, farkli = new Set(ic.map(i => t[i].a)).size > 1;
  if (farkli) return son === ',' ? 'tr' : 'en';
  const sonrasi = t.slice(ic[ic.length - 1] + 1).filter(x => x.d).length;
  const tamsayiKismi = t.slice(ic[ic.length - 1] + 1).findIndex(x => !x.d && !x.a);
  const n = tamsayiKismi < 0 ? sonrasi : t.slice(ic[ic.length - 1] + 1, ic[ic.length - 1] + 1 + tamsayiKismi).filter(x => x.d).length;
  if (n === 3 && ic.length >= 1 && t.slice(ilkB, ic[0]).filter(x => x.d).length <= 3 && /#/.test(t.slice(ilkB, ic[0]).map(x => x.d || '').join(''))) return son === '.' ? 'tr' : 'en';
  return son === ',' ? 'tr' : 'en';
}

function sayiYaz(x, t, dil) {
  const ONDA = dil === 'tr' ? ',' : '.', BIN = dil === 'tr' ? '.' : ',';
  const basamakIdx = t.map((z, i) => z.d ? i : -1).filter(i => i >= 0);
  if (!basamakIdx.length) return t.map(z => z.m ?? '').join('');
  const ilk = basamakIdx[0], son = basamakIdx[basamakIdx.length - 1];
  const usIdx = t.findIndex(z => z.us);
  // ondalık işareti: basamak bölgesindeki ONDA ayırıcısı
  let ondIdx = -1; for (let i = ilk; i <= son; i++) if (t[i].a === ONDA) { ondIdx = i; break; }
  // Ölçekleme: son basamaktan hemen sonra gelen binlik ayırıcıları (#.##0. → bin, #.##0.. → milyon; EN: #,##0,)
  // ve ondalık işaretinin hemen önündeki (arkasında basamak olmayan) ayırıcılar
  let olcek = 0, j = son + 1; const sonaEk = [];
  while (t[j] && t[j].a === BIN) { olcek++; sonaEk.push(j); j++; }
  if (ondIdx >= 0) for (let i = ondIdx - 1; i > ilk && t[i].a === BIN; i--) { olcek++; sonaEk.push(i); }
  const binlik = t.slice(ilk, ondIdx >= 0 ? ondIdx : son + 1).some((z, k, arr) => z.a === BIN && !sonaEk.includes(ilk + k) && arr.slice(k + 1).some(y => y.d));
  const tamD = t.slice(ilk, ondIdx >= 0 ? ondIdx : (usIdx >= 0 ? usIdx : son + 1)).filter(z => z.d).map(z => z.d);
  const ondD = ondIdx >= 0 ? t.slice(ondIdx + 1, usIdx >= 0 ? usIdx : son + 1).filter(z => z.d).map(z => z.d) : [];
  const yuzde = t.filter(z => z.yuzde).length;
  let v = Math.abs(x) * 100 ** yuzde / 1000 ** olcek;
  let usMetin = '';
  if (usIdx >= 0) {
    const usD = t.slice(usIdx + 1).filter(z => z.d).length || 2;
    let e = v === 0 ? 0 : Math.floor(Math.log10(v)); e -= Math.max(0, tamD.length - 1); v = v / 10 ** e;
    usMetin = 'E' + (e < 0 ? '-' : t[usIdx].us === '+' ? '+' : '') + String(Math.abs(e)).padStart(usD, '0');
  }
  const yuv = Number(v.toFixed(ondD.length));
  let [ta, oa = ''] = yuv.toFixed(ondD.length).split('.');
  // tamsayı: 0 zorunlu basamak sayısı kadar sıfırla doldur; # boşsa yazma
  const zorunlu = tamD.filter(d => d !== '#').length;
  if (ta === '0' && zorunlu === 0) ta = '';
  ta = ta.padStart(zorunlu, '0');
  if (tamD.includes('?')) ta = ta.padStart(tamD.length, ' ');
  if (binlik) ta = ta.replace(/\B(?=(\d{3})+(?!\d))/g, BIN);
  // ondalık: sondaki # sıfırları atılır, ? boşluk olur
  let od = oa.split('');
  for (let i = ondD.length - 1; i >= 0; i--) { if (od[i] !== '0') break; if (ondD[i] === '#') od.pop(); else if (ondD[i] === '?') od[i] = ' '; else break; }
  const ondMetin = ondIdx >= 0 ? ONDA + od.join('') : '';
  // çıktı: basamak bölgesinin yerine sayı, öncesi ve sonrası metin
  let once = '', sonra = '';
  for (let i = 0; i < ilk; i++) once += t[i].m ?? (t[i].a ?? '');
  if (usIdx >= 0) { /* bilimsel gösterimde üs kısmının basamakları yukarıda yazıldı */ }
  const bitis = usIdx >= 0 ? t.length : son + 1;
  for (let i = bitis; i < t.length; i++) if (!sonaEk.includes(i)) sonra += t[i].m ?? (t[i].a ?? '');
  if (usIdx >= 0) { /* üs bölgesi metne dahil edildi */ }
  return once + ta + ondMetin + usMetin + sonra;
}

// Ana işlev: { metin, renk }. Değer sayı değilse metin bölümü (4.) ya da olduğu gibi.
export function ozelBicim(deger, kod, { dil = null } = {}) {
  const b = bolumler(String(kod));
  if (typeof deger === 'boolean') return { metin: deger ? 'DOĞRU' : 'YANLIŞ', renk: null };
  if (typeof deger !== 'number') {
    const s = deger == null ? '' : String(deger);
    if (b.length >= 4 || (b.length === 1 && b[0].includes('@'))) { const k = kosebasi(b.length >= 4 ? b[3] : b[0]); return { metin: belirtecler(k.kod).map(z => z.metin ? s : (z.m ?? z.a ?? '')).join(''), renk: k.renk }; }
    return { metin: s, renk: null };
  }
  const ks = b.slice(0, 3).map(kosebasi);
  let sec, isaretEkle = false;
  if (ks.some(k => k.kosul)) {
    // Koşullu bölümler: ilk iki bölüm koşulludur, üçüncüsü diğerleri
    if (ks[0].kosul && kosulTutar(ks[0].kosul, deger)) sec = ks[0];
    else if (ks[1] && ks[1].kosul && kosulTutar(ks[1].kosul, deger)) sec = ks[1];
    else sec = ks[2] || (ks[1] && !ks[1].kosul ? ks[1] : null);
    if (!sec) return { metin: '#'.repeat(8), renk: null };
    isaretEkle = deger < 0 && !(ks[1] && sec === ks[1] && !ks[1].kosul);
  } else if (deger > 0 || ks.length === 1) { sec = ks[0]; isaretEkle = deger < 0; }
  else if (deger < 0) { sec = ks[1] || ks[0]; isaretEkle = !ks[1]; }
  else sec = ks[2] || ks[0];
  // Tarih/saat kodu ise tarih biçimleyicisine bırak
  const sade = sec.kod.replace(/"[^"]*"/g, '').replace(/\\./g, '');
  if (/[yYgGaAdDsShHmM]/.test(sade) && !/[0#?]/.test(sade.replace(/[yYgGaAdDsShHmM:\/.\- ]/g, ''))) return { metin: bicimle(deger, sec.kod), renk: sec.renk };
  if (/^genel$|^general$/i.test(sec.kod.trim())) return { metin: (isaretEkle ? '-' : '') + String(+Math.abs(deger).toPrecision(11)).replace('.', ','), renk: sec.renk };
  const t = belirtecler(sec.kod);
  let s = sayiYaz(deger, t, dilBul(t, dil));
  if (isaretEkle && /[1-9]/.test(s)) s = '-' + s;
  return { metin: s, renk: sec.renk };
}
