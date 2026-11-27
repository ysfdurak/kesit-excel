// Kesit Excel · grafik motoru. Veriyi (aralık ya da pivot) seri/kategoriye çevirir, Excel'in grafik türlerini SVG olarak çizer.
// Tarayıcıda renkler CSS sınıflarıyla (açık/koyu tema), bağımsız çıktıda (MCP, indirme) gömülü renklerle verilir.
// Satır içi stil yok: CSP style-src 'self' ile uyumlu.
import { hataMi, alanCoz } from './formul.js';
import { trSayi, bicimle } from './tarih.js';

export const TURLER = {
  sutun: { ad: 'Sütun', aile: 'karsilastirma', yigin: true, ne: 'Kategoriler arası karşılaştırma; az sayıda kategori, kısa adlar' },
  cubuk: { ad: 'Çubuk', aile: 'karsilastirma', yigin: true, ne: 'Uzun kategori adları ya da çok kategori; sıralı listeler (en çok satanlar)' },
  cizgi: { ad: 'Çizgi', aile: 'zaman', yigin: true, ne: 'Zaman içindeki değişim; eşit aralıklı dönemler' },
  alan: { ad: 'Alan', aile: 'zaman', yigin: true, ne: 'Zaman içinde toplam ve parçaların katkısı (yığılmış)' },
  pasta: { ad: 'Pasta', aile: 'parca', ne: 'Bir bütünün 2–5 parçası; tek seri, toplam anlamlı' },
  halka: { ad: 'Halka', aile: 'parca', ne: 'Pasta ile aynı iş; ortada toplamı yazmak için yer' },
  dagilim: { ad: 'Dağılım (XY)', aile: 'iliski', ne: 'İki sayısal değişken arasındaki ilişki' },
  kabarcik: { ad: 'Kabarcık', aile: 'iliski', ne: 'Dağılıma üçüncü bir büyüklük (kabarcık alanı)' },
  birlesik: { ad: 'Birleşik (sütun + çizgi)', aile: 'karsilastirma', ne: 'Gerçekleşen sütun, hedef çizgi; aynı birimde iki ölçü' },
  selale: { ad: 'Şelale', aile: 'parca', ne: 'Başlangıçtan sonuca artı ve eksi katkılar (bütçe köprüsü)' },
  histogram: { ad: 'Histogram', aile: 'dagilim', ne: 'Tek sayısal değişkenin dağılımı; aralıklara düşen sayı' },
  kutu: { ad: 'Kutu ve bıyık', aile: 'dagilim', ne: 'Gruplar arası dağılım: ortanca, çeyrekler, uç değerler' },
  agac: { ad: 'Ağaç haritası', aile: 'parca', ne: 'Çok parçalı bütün; alan büyüklüğü gösterir' },
  huni: { ad: 'Huni', aile: 'akis', ne: 'Aşamalar boyunca azalan sayı (başvuru → işe alım)' },
  radar: { ad: 'Radar', aile: 'karsilastirma', ne: 'Birkaç ölçüt üzerinde profil karşılaştırma; az seri, az ölçüt' },
  pareto: { ad: 'Pareto', aile: 'karsilastirma', ne: 'Nedenler büyükten küçüğe, üstünde birikimli yüzde çizgisi; sorunun %80\'ini yapan az sayıda nedeni gösterir' },
  kelebek: { ad: 'Kelebek (tornado)', aile: 'karsilastirma', ne: 'İki grubun aynı ölçütlerde karşılaştırması; biri sola, biri sağa' },
  halter: { ad: 'Halter (önce–sonra)', aile: 'karsilastirma', ne: 'Her kategoride iki değer arasındaki fark (geçen yıl–bu yıl, hedef–gerçek)' },
  gunes: { ad: 'Güneş patlaması', aile: 'parca', ne: 'İki düzeyli bütün: iç halka üst kırılım, dış halka alt kırılım' },
  madde: { ad: 'Madde (hedef–gerçek)', aile: 'hedef', ne: 'Gerçekleşen çubuk, hedef çizgi, arkada kötü–orta–iyi bantları; göstergenin dar alandaki karşılığı' },
  ibre: { ad: 'İbre (hız göstergesi)', aile: 'hedef', ne: 'Tek bir sayının hedefe göre durumu; çok yer kaplar, bir panoda en çok bir tane' },
  ilerleme: { ad: 'İlerleme halkası', aile: 'hedef', ne: 'Hedefin yüzde kaçına ulaşıldı; ortada büyük yüzde' },
  gantt: { ad: 'Gantt', aile: 'zaman', ne: 'Görevlerin başlangıç ve süresi takvim üzerinde (proje planı)' },
};
// Doğrulanmış kategorik palet (dataviz referans paleti; sıra sabit, döngü yok). Koyu tema ayrı tonlar.
export const PALET = { acik: ['#257de0', '#f47230', '#00b894', '#f2a600', '#ee7fac', '#008a17', '#6a4ce2', '#ec4647'], koyu: ['#338ced', '#e76624', '#00a888', '#d28e05', '#e24d8b', '#0aac23', '#9887ef', '#eb6263'] };
const YUZEY = { acik: '#ffffff', koyu: '#131c17' }, MUREKKEP = { acik: '#14201a', koyu: '#e4eee8' }, IKINCIL = { acik: '#55645b', koyu: '#a3b4aa' }, IZGARA = { acik: '#e3e9e5', koyu: '#2a3730' };
const SEMA = { artis: '#008a17', azalis: '#ec4647', toplam: '#7a8580' };

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const n = x => Math.round(x * 10) / 10;

/* ---------------------------------------------------------------- veri */
// Aralıktan seri/kategori: ilk satır metinse başlık, ilk sütun metin/tarihse kategori. Yön otomatik: satırdan çok sütun varsa seriler satırda.
export function aralikVerisi(degerler, { seriYonu = 'otomatik', bicimler = [], tarihSeri = false } = {}) {
  const v = degerler.map(r => r.map(x => (x == null || hataMi(x)) ? null : x));
  if (!v.length || !v[0].length) throw new Error('Aralık boş');
  const sayiMi = x => typeof x === 'number';
  const baslikSatiri = v[0].some(x => typeof x === 'string') && v.length > 1;
  const govde = baslikSatiri ? v.slice(1) : v;
  const ilkSutunKat = govde.length && govde.every(r => r[0] == null || !sayiMi(r[0]) || /g|a|y/.test(bicimler[0] || '')) && v[0].length > 1;
  const kb = bicimler[0] || '';
  const katEtiket = x => typeof x === 'number' && /gg|aa|yy/.test(kb) ? bicimle(x, /aaaa|aaa/.test(kb) ? kb : 'gg.aa.yyyy') : x == null ? '' : String(x);
  let kategoriler = govde.map((r, i) => ilkSutunKat ? katEtiket(r[0]) : String(i + 1));
  // İki düzeyli kategori: ilk iki sütun da metinse (Kategori, Ürün) → "Kategori › Ürün"; güneş patlaması iç halkayı üst düzeyden kurar
  const ikiDuzey = ilkSutunKat && v[0].length > 2 && govde.length && govde.every(r => r[1] == null || typeof r[1] === 'string');
  let ustKategori = null;
  if (ikiDuzey) { ustKategori = govde.map(r => katEtiket(r[0])); kategoriler = govde.map(r => katEtiket(r[0]) + ' › ' + (r[1] ?? '')); }
  const sut0 = ilkSutunKat ? (ikiDuzey ? 2 : 1) : 0;
  let seriler = [];
  const tarihSutunu = c => /gg|aa|yy/.test(bicimler[c] || '');
  for (let c = sut0; c < v[0].length; c++) if (!tarihSutunu(c) || c === 0 || tarihSeri) seriler.push({ ad: baslikSatiri ? String(v[0][c] ?? 'Seri ' + (c + 1)) : 'Seri ' + (c - sut0 + 1), degerler: govde.map(r => sayiMi(r[c]) ? r[c] : null) });
  seriler = seriler.filter(s => s.degerler.some(x => x != null));
  const yon = seriYonu === 'otomatik' ? (seriler.length > kategoriler.length && kategoriler.length <= 12 ? 'satir' : 'sutun') : seriYonu;
  if (yon === 'satir' && seriler.length) {
    const yeniKat = seriler.map(s => s.ad);
    seriler = kategoriler.map((k, i) => ({ ad: k, degerler: seriler.map(s => s.degerler[i]) }));
    kategoriler = yeniKat; ustKategori = null;
  }
  return { kategoriler, seriler, yon, ...(ustKategori ? { ustKategori } : {}), ...(tarihSeri ? { tarihSeri: true } : {}) };
}
// Pivot sonucundan (Genel Toplam satır/sütunu hariç)
export function pivotVerisi(p) {
  const satirlar = p.satirlar.slice(0, -1), son = p.yapi.sutun ? -1 : undefined;
  const basliklar = p.basliklar.slice(1, son);
  return { kategoriler: satirlar.map(r => String(r[0])), seriler: basliklar.map((b, j) => ({ ad: String(b), degerler: satirlar.map(r => typeof r[j + 1] === 'number' ? r[j + 1] : null) })), yon: 'sutun', yuzde: p.yuzde };
}

/* ---------------------------------------------------------------- ölçek ve biçim */
export function guzelOlcek(min, max, hedef = 5) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 1, adim: 0.2, cizgiler: [0, 0.2, 0.4, 0.6, 0.8, 1] };
  if (min === max) { if (min === 0) max = 1; else if (min > 0) min = 0; else max = 0; }
  const ham = (max - min) / hedef, us = Math.pow(10, Math.floor(Math.log10(ham))), k = ham / us;
  const adim = (k <= 1 ? 1 : k <= 2 ? 2 : k <= 2.5 ? 2.5 : k <= 5 ? 5 : 10) * us;
  const a = Math.floor(min / adim + 1e-9) * adim, b = Math.ceil(max / adim - 1e-9) * adim;
  const cizgiler = []; for (let x = a; x <= b + adim / 2; x += adim) cizgiler.push(Math.round(x / adim) * adim);
  return { min: a, max: b, adim, cizgiler };
}
export function kisaSayi(x, yuzde = false) {
  if (x == null || !Number.isFinite(x)) return '';
  if (yuzde) return trSayi(x * 100, Math.abs(x) < 0.1 && x !== 0 ? 1 : 0) + ' %';
  const a = Math.abs(x);
  if (a >= 1e9) return trSayi(x / 1e9, 1) + ' Mr';
  if (a >= 1e6) return trSayi(x / 1e6, 1) + ' Mn';
  if (a >= 1e4) return trSayi(x / 1e3, 0) + ' B';
  return trSayi(Math.round(x * 100) / 100);
}

/* ---------------------------------------------------------------- SVG yardımcıları */
function ciziciKur(s) {
  const tema = s.tema === 'koyu' ? 'koyu' : 'acik', bag = !!s.bagimsiz;
  // Bağımsız: gömülü renk; tarayıcı: sınıf (CSS değişkenleri temaya göre)
  const dolgu = i => bag ? `fill="${PALET[tema][i % 8]}"` : `class="g-s${i % 8}"`;
  const cizgi = i => bag ? `stroke="${PALET[tema][i % 8]}"` : `class="g-c${i % 8}"`;
  const metin = (ikincil = false) => bag ? `fill="${ikincil ? IKINCIL[tema] : MUREKKEP[tema]}"` : `class="${ikincil ? 'g-m2' : 'g-m'}"`;
  const yuzey = bag ? YUZEY[tema] : 'var(--surface)';
  const izgara = bag ? `stroke="${IZGARA[tema]}"` : 'class="g-iz"';
  const sema = k => bag ? `fill="${SEMA[k]}"` : `class="g-${k}"`;
  return { dolgu, cizgi, metin, yuzey, yuzeyAttr: bag ? `stroke="${YUZEY[tema]}"` : 'class="g-yz"', izgara, sema, bag, tema };
}
const yaz = (x, y, t, attr = '', boy = 12, hiza = 'middle') => `<text x="${n(x)}" y="${n(y)}" font-size="${boy}" text-anchor="${hiza}" ${attr}>${esc(t)}</text>`;
const baslikYaz = (s, W, c) => s.baslik ? yaz(W / 2, 22, s.baslik, c.metin() + ' font-weight="700"', 15) : '';
// Taban çizgisine bağlı, uç kısmı 4 px yuvarlatılmış çubuk (dataviz: veri ucu yuvarlak, taban düz)
function cubukYolu(x, y, w, h, yon = 'yukari', r = 4) {
  if (w <= 0 || h <= 0) return '';
  const rr = Math.min(r, w / 2, h / 2);
  if (yon === 'yukari') return `M${n(x)},${n(y + h)}V${n(y + rr)}Q${n(x)},${n(y)} ${n(x + rr)},${n(y)}H${n(x + w - rr)}Q${n(x + w)},${n(y)} ${n(x + w)},${n(y + rr)}V${n(y + h)}Z`;
  if (yon === 'asagi') return `M${n(x)},${n(y)}V${n(y + h - rr)}Q${n(x)},${n(y + h)} ${n(x + rr)},${n(y + h)}H${n(x + w - rr)}Q${n(x + w)},${n(y + h)} ${n(x + w)},${n(y + h - rr)}V${n(y)}Z`;
  if (yon === 'sag') return `M${n(x)},${n(y)}H${n(x + w - rr)}Q${n(x + w)},${n(y)} ${n(x + w)},${n(y + rr)}V${n(y + h - rr)}Q${n(x + w)},${n(y + h)} ${n(x + w - rr)},${n(y + h)}H${n(x)}Z`;
  return `M${n(x + w)},${n(y)}H${n(x + rr)}Q${n(x)},${n(y)} ${n(x)},${n(y + rr)}V${n(y + h - rr)}Q${n(x)},${n(y + h)} ${n(x + rr)},${n(y + h)}H${n(x + w)}Z`;
}
const ipucu = t => `<title>${esc(t)}</title>`;
function gosterge(seriler, W, H, c, konum = 'alt', ozelRenk = null) {
  if (konum === 'yok' || seriler.length < 2) return '';
  // Önce satırlara böl, sonra yukarıdan aşağı yerleştir (son satır en altta)
  const satirlar = [[]]; let x = 16;
  seriler.forEach((sr, i) => { const ad = String(sr.ad).slice(0, 28), w = 18 + ad.length * 6.6; if (x + w > W - 8 && satirlar[satirlar.length - 1].length) { satirlar.push([]); x = 16; } satirlar[satirlar.length - 1].push({ i, ad, x }); x += w + 10; });
  let out = '';
  satirlar.forEach((st, r) => { const y = H - 12 - (satirlar.length - 1 - r) * 18; for (const o of st) out += `<rect x="${o.x}" y="${y - 9}" width="10" height="10" rx="2" ${ozelRenk ? ozelRenk(o.i) : c.dolgu(o.i)}/>` + yaz(o.x + 14, y, o.ad, c.metin(true), 11.5, 'start'); });
  return `<g class="g-gosterge">${out}</g>`;
}
function gostergeYuksekligi(seriler, W, konum) { if (konum === 'yok' || seriler.length < 2) return 0; let x = 16, satir = 1; for (const s of seriler) { const w = 18 + String(s.ad).slice(0, 28).length * 6.6 + 10; if (x + w > W - 8) { satir++; x = 16; } x += w; } return satir * 18 + 8; }

/* ---------------------------------------------------------------- eksenli grafikler */
function eksenli(veri, s, c, W, H) {
  const tur = s.tur, yatay = tur === 'cubuk', yigin = s.yigin || 'yok';
  const seriler = veri.seriler, K = veri.kategoriler.length;
  const ust = s.baslik ? 38 : 14, alt = 34 + gostergeYuksekligi(seriler, W, s.gosterge) + (s.eksenBasligi?.x ? 16 : 0);
  const solEtiket = yatay ? Math.min(150, 12 + Math.max(...veri.kategoriler.map(k => String(k).length)) * 6.4) : 52 + (s.eksenBasligi?.y ? 16 : 0);
  const ikinci = tur === 'birlesik' && s.ikincilEksen && seriler.length > 1;
  const sag = ikinci ? 56 : 16;
  const px = solEtiket, py = ust, pw = W - px - sag, ph = H - ust - alt;
  // değer aralığı
  let deg = [], ikinciDeg = [];
  const yuzdeTop = i => seriler.reduce((t, sr) => t + Math.abs(sr.degerler[i] ?? 0), 0);
  if (yigin === 'yigin') for (let i = 0; i < K; i++) { let p = 0, ng = 0; for (const sr of seriler) { const v = sr.degerler[i] ?? 0; if (v >= 0) p += v; else ng += v; } deg.push(p, ng); }
  else if (yigin === 'yuzde') deg = [0, 1];
  else seriler.forEach((sr, j) => (ikinci && j > 0 ? ikinciDeg : deg).push(...sr.degerler.filter(v => v != null)));
  if (s.hedefCizgisi != null && Number.isFinite(+s.hedefCizgisi)) deg.push(+s.hedefCizgisi);
  let mn = Math.min(0, ...deg), mx = Math.max(0, ...deg);
  // Sütun/çubuk/alan sıfırdan başlar (aksi yanıltır); çizgide kullanıcı isterse eksenMin verir
  if ((tur === 'cizgi') && s.eksenMin == null && deg.length) { const dmn = Math.min(...deg); if (dmn > 0 && dmn > (Math.max(...deg) - dmn) * 2) mn = dmn * 0.9; }
  if (s.eksenMin != null) mn = s.eksenMin; if (s.eksenMax != null) mx = s.eksenMax;
  const o = guzelOlcek(mn, mx, Math.max(3, Math.round((yatay ? pw : ph) / 60)));
  if (s.eksenMin != null) o.min = s.eksenMin;
  const o2 = ikinci ? guzelOlcek(Math.min(0, ...ikinciDeg), Math.max(0, ...ikinciDeg), o.cizgiler.length - 1) : null;
  const yd = (v, ol = o) => yatay ? px + (v - ol.min) / (ol.max - ol.min) * pw : py + ph - (v - ol.min) / (ol.max - ol.min) * ph;
  const yuzdeMi = yigin === 'yuzde' || veri.yuzde;
  let svg = '';
  // ızgara ve değer ekseni
  for (const t of o.cizgiler) {
    if (t < o.min - 1e-9 || t > o.max + 1e-9) continue;
    if (yatay) svg += `<line x1="${n(yd(t))}" x2="${n(yd(t))}" y1="${py}" y2="${py + ph}" ${c.izgara}/>` + yaz(yd(t), py + ph + 16, kisaSayi(t, yuzdeMi), c.metin(true), 11);
    else svg += `<line x1="${px}" x2="${px + pw}" y1="${n(yd(t))}" y2="${n(yd(t))}" ${c.izgara}/>` + yaz(px - 6, yd(t) + 4, kisaSayi(t, yuzdeMi), c.metin(true), 11, 'end');
  }
  if (o2) for (const t of o2.cizgiler) svg += yaz(px + pw + 6, yd(t, o2) + 4, kisaSayi(t), c.metin(true), 11, 'start');
  // kategori ekseni
  const bant = (yatay ? ph : pw) / Math.max(1, K);
  const etiketAtla = yatay ? 1 : Math.max(1, Math.ceil(K * 46 / pw));
  veri.kategoriler.forEach((k, i) => {
    if (i % etiketAtla) return;
    const m = (yatay ? py : px) + bant * (i + 0.5);
    const t = String(k); const kisa = t.length > (yatay ? 24 : Math.max(4, Math.floor(bant * etiketAtla / 6.5))) ? t.slice(0, yatay ? 23 : Math.max(3, Math.floor(bant * etiketAtla / 6.5) - 1)) + '…' : t;
    svg += yatay ? yaz(px - 6, m + 4, kisa, c.metin(true), 11.5, 'end') : yaz(m, py + ph + 16, kisa, c.metin(true), 11.5);
  });
  const sifir = yd(Math.max(o.min, Math.min(0, o.max)));
  // çubuklar
  const cubukSerileri = tur === 'birlesik' ? [0] : (tur === 'sutun' || tur === 'cubuk') ? seriler.map((_, j) => j) : [];
  // Vurgu: tek seride en büyük ya da en küçük çubuk renkli, ötekiler soluk (göz ilk oraya gitsin)
  let vurguI = -1;
  if (s.vurgu && s.vurgu !== 'yok' && seriler.length === 1) { const d = seriler[0].degerler; d.forEach((v, i) => { if (v == null) return; if (vurguI < 0 || (s.vurgu === 'enBuyuk' ? v > d[vurguI] : v < d[vurguI])) vurguI = i; }); }
  if (cubukSerileri.length) {
    const grup = yigin === 'yok' ? cubukSerileri.length : 1, ic = bant * 0.72, w = Math.max(1, ic / grup - 2);
    for (let i = 0; i < K; i++) {
      let pozitif = 0, negatif = 0; const top = yuzdeTop(i) || 1;
      cubukSerileri.forEach((j, gi) => {
        let v = seriler[j].degerler[i]; if (v == null) return;
        if (yigin === 'yuzde') v = Math.abs(v) / top;
        let a, b;
        if (yigin === 'yok') { a = 0; b = v; } else if (v >= 0) { a = pozitif; b = pozitif + v; pozitif = b; } else { a = negatif; b = negatif + v; negatif = b; }
        const bas = (yatay ? py : px) + bant * i + (bant - ic) / 2 + (yigin === 'yok' ? gi * (w + 2) : 0);
        const p1 = yd(a), p2 = yd(b), etiket = `${veri.kategoriler[i]} · ${seriler[j].ad}: ${yuzdeMi ? kisaSayi(v, true) : trSayi(seriler[j].degerler[i])}`;
        const ucMu = yigin === 'yok' || (v >= 0 ? b === pozitif : b === negatif);
        const bosluk = yigin === 'yok' ? 0 : 1; // yığında parçalar arası 2 px yüzey boşluğu
        let d;
        if (yatay) { const x0 = Math.min(p1, p2) + (v >= 0 ? bosluk : 0), ww = Math.abs(p2 - p1) - bosluk; d = ucMu ? cubukYolu(x0, bas, ww, w, v >= 0 ? 'sag' : 'sol') : `M${n(x0)},${n(bas)}h${n(ww)}v${n(w)}h${n(-ww)}Z`; }
        else { const y0 = Math.min(p1, p2), hh = Math.abs(p2 - p1) - bosluk; d = ucMu ? cubukYolu(bas, v >= 0 ? y0 : y0 + bosluk, w, hh, v >= 0 ? 'yukari' : 'asagi') : `M${n(bas)},${n(y0)}h${n(w)}v${n(hh)}h${n(-w)}Z`; }
        if (d) svg += `<path d="${d}" ${c.dolgu(j)}${vurguI >= 0 && i !== vurguI ? ' fill-opacity="0.28"' : ''} data-k="${i}" data-s="${j}">${ipucu(etiket)}</path>`;
        if (vurguI === i && !s.veriEtiketi) svg += yatay ? yaz(Math.max(p1, p2) + 4, bas + w / 2 + 4, kisaSayi(v), c.metin() + ' font-weight="700"', 11, 'start') : yaz(bas + w / 2, Math.min(p1, p2) - 5, kisaSayi(v), c.metin() + ' font-weight="700"', 11);
        if (s.veriEtiketi && yigin === 'yok') svg += yatay ? yaz(Math.max(p1, p2) + 4, bas + w / 2 + 4, kisaSayi(v, yuzdeMi), c.metin(), 10.5, 'start') : yaz(bas + w / 2, Math.min(p1, p2) - 4, kisaSayi(v, yuzdeMi), c.metin(), 10.5);
      });
    }
  }
  // çizgi ve alan
  const cizgiSerileri = tur === 'birlesik' ? seriler.map((_, j) => j).slice(1) : (tur === 'cizgi' || tur === 'alan') ? seriler.map((_, j) => j) : [];
  if (cizgiSerileri.length) {
    const birikim = new Array(K).fill(0);
    const katmanlar = [];
    for (const j of cizgiSerileri) {
      const ol = ikinci && j > 0 ? o2 : o;
      const noktalar = seriler[j].degerler.map((v, i) => {
        if (v == null) return null;
        let a = 0, b = v; const top = yuzdeTop(i) || 1;
        if (yigin === 'yigin' && tur !== 'birlesik') { a = birikim[i]; b = a + v; birikim[i] = b; }
        if (yigin === 'yuzde' && tur !== 'birlesik') { a = birikim[i]; b = a + Math.abs(v) / top; birikim[i] = b; }
        return { x: px + bant * (i + 0.5), y: yd(b, ol), y0: yd(a, ol), v, i };
      });
      katmanlar.push({ j, noktalar });
    }
    for (const { j, noktalar } of (tur === 'alan' ? [...katmanlar].reverse() : katmanlar)) {
      const pts = noktalar.filter(Boolean);
      if (!pts.length) continue;
      if (tur === 'alan') {
        const ust = pts.map(p => `${n(p.x)},${n(p.y)}`).join(' L'), alt0 = [...pts].reverse().map(p => `${n(p.x)},${n(yigin === 'yok' ? sifir : p.y0)}`).join(' L');
        svg += `<path d="M${ust} L${alt0} Z" ${c.dolgu(j)} opacity="${yigin === 'yok' ? 0.28 : 0.85}"/>`;
      }
      // boşluklarda çizgi kesilir (Excel: boş hücre = boşluk)
      let d = '', onceki = null;
      noktalar.forEach(p => { if (!p) { onceki = null; return; } d += (onceki ? 'L' : 'M') + `${n(p.x)},${n(p.y)}`; onceki = p; });
      svg += `<path d="${d}" fill="none" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" ${c.cizgi(j)}/>`;
      if (pts.length <= 24) for (const p of pts) svg += `<circle cx="${n(p.x)}" cy="${n(p.y)}" r="4" ${c.dolgu(j)} stroke-width="2" ${c.yuzeyAttr}>${ipucu(`${veri.kategoriler[p.i]} · ${seriler[j].ad}: ${trSayi(p.v)}`)}</circle>`;
      if (s.veriEtiketi) { const son = pts[pts.length - 1]; svg += yaz(son.x, son.y - 9, kisaSayi(son.v), c.metin(), 10.5); }
    }
  }
  // hedef çizgisi: kesikli, sağ uçta etiket
  if (s.hedefCizgisi != null && Number.isFinite(+s.hedefCizgisi)) {
    const t = yd(+s.hedefCizgisi), et = 'Hedef ' + kisaSayi(+s.hedefCizgisi);
    svg += yatay ? `<line x1="${n(t)}" x2="${n(t)}" y1="${py}" y2="${py + ph}" stroke-width="2" stroke-dasharray="6 4" ${c.metin().replace('fill', 'stroke').replace('g-m"', 'g-hedef"')}/>` + yaz(t, py - 4, et, c.metin(), 11)
      : `<line x1="${px}" x2="${px + pw}" y1="${n(t)}" y2="${n(t)}" stroke-width="2" stroke-dasharray="6 4" ${c.metin().replace('fill', 'stroke').replace('g-m"', 'g-hedef"')}/>` + yaz(px + pw - 2, t - 6, et, c.metin(), 11, 'end');
  }
  // eksen çizgisi ve başlıklar
  svg += yatay ? `<line x1="${n(sifir)}" x2="${n(sifir)}" y1="${py}" y2="${py + ph}" ${c.metin(true).replace('fill', 'stroke').replace('g-m2', 'g-eks')}/>` : `<line x1="${px}" x2="${px + pw}" y1="${n(sifir)}" y2="${n(sifir)}" ${c.metin(true).replace('fill', 'stroke').replace('g-m2', 'g-eks')}/>`;
  if (s.eksenBasligi?.y) svg += `<text transform="translate(14,${n(py + ph / 2)}) rotate(-90)" font-size="11.5" text-anchor="middle" ${c.metin(true)}>${esc(s.eksenBasligi.y)}</text>`;
  if (s.eksenBasligi?.x) svg += yaz(px + pw / 2, py + ph + 32, s.eksenBasligi.x, c.metin(true), 11.5);
  return svg + gosterge(seriler, W, H, c, s.gosterge);
}

/* ---------------------------------------------------------------- pasta ve halka */
function pasta(veri, s, c, W, H, halka) {
  const sr = veri.seriler[0]; if (!sr) return '';
  const dilimler = veri.kategoriler.map((k, i) => ({ k, v: Math.max(0, sr.degerler[i] ?? 0), i })).filter(d => d.v > 0);
  const top = dilimler.reduce((t, d) => t + d.v, 0) || 1;
  const ust = s.baslik ? 34 : 10, altG = gostergeYuksekligi(dilimler.map(d => ({ ad: d.k })), W, s.gosterge ?? 'alt');
  const R = Math.max(30, Math.min(W / 2 - 90, (H - ust - altG) / 2 - 16)), cx = W / 2, cy = ust + (H - ust - altG) / 2;
  let a = -Math.PI / 2, svg = '';
  for (const d of dilimler) {
    const b = a + d.v / top * Math.PI * 2, buyuk = b - a > Math.PI ? 1 : 0;
    const p = (r, t) => `${n(cx + r * Math.cos(t))},${n(cy + r * Math.sin(t))}`;
    const ic = halka ? R * 0.58 : 0;
    const yol = dilimler.length === 1 ? (halka ? `M${p(R, 0)}A${R},${R} 0 1 1 ${p(R, Math.PI)}A${R},${R} 0 1 1 ${p(R, 0)}M${p(ic, 0)}A${ic},${ic} 0 1 0 ${p(ic, Math.PI)}A${ic},${ic} 0 1 0 ${p(ic, 0)}Z` : `M${p(R, 0)}A${R},${R} 0 1 1 ${p(R, Math.PI)}A${R},${R} 0 1 1 ${p(R, 0)}Z`)
      : halka ? `M${p(R, a)}A${R},${R} 0 ${buyuk} 1 ${p(R, b)}L${p(ic, b)}A${ic},${ic} 0 ${buyuk} 0 ${p(ic, a)}Z` : `M${n(cx)},${n(cy)}L${p(R, a)}A${R},${R} 0 ${buyuk} 1 ${p(R, b)}Z`;
    svg += `<path d="${yol}" ${c.dolgu(d.i)} stroke-width="2" ${c.yuzeyAttr} fill-rule="evenodd">${ipucu(`${d.k}: ${trSayi(d.v)} (${trSayi(d.v / top * 100, 1)} %)`)}</path>`;
    const orta = (a + b) / 2, oran = d.v / top;
    if (oran >= 0.04) { const e = R + 14; svg += yaz(cx + e * Math.cos(orta), cy + e * Math.sin(orta) + 4, (s.veriEtiketi === false ? '' : trSayi(oran * 100, 0) + ' %'), c.metin(), 11, Math.cos(orta) > 0.2 ? 'start' : Math.cos(orta) < -0.2 ? 'end' : 'middle'); }
    a = b;
  }
  if (halka) svg += yaz(cx, cy + 2, kisaSayi(top), c.metin() + ' font-weight="700"', 18) + yaz(cx, cy + 18, 'toplam', c.metin(true), 11);
  return svg + gosterge(dilimler.map(d => ({ ad: d.k })), W, H, c, s.gosterge ?? 'alt', i => c.dolgu(dilimler[i].i));
}

/* ---------------------------------------------------------------- dağılım ve kabarcık */
function dagilim(veri, s, c, W, H, kabarcik) {
  // veri.seriler[0] X, [1] Y, [2] boyut (kabarcık); ya da seri.x verilmiş
  const xs = veri.seriler[0]?.degerler || [], ys = veri.seriler[1]?.degerler || [], bs = kabarcik ? veri.seriler[2]?.degerler || [] : [];
  const nokta = xs.map((x, i) => ({ x, y: ys[i], b: bs[i], k: veri.kategoriler[i] })).filter(p => p.x != null && p.y != null);
  const ust = s.baslik ? 38 : 14, alt = 40, px = 60, py = ust, pw = W - px - 20, ph = H - ust - alt;
  const xmn = Math.min(...nokta.map(p => p.x)), xmx = Math.max(...nokta.map(p => p.x)), pay = kabarcik ? (xmx - xmn) * 0.08 : 0;
  const ox = guzelOlcek(xmn - pay, xmx + pay, 6), oy = guzelOlcek(Math.min(0, ...nokta.map(p => p.y)), Math.max(...nokta.map(p => p.y)), 5);
  if (s.eksenMin != null) oy.min = s.eksenMin;
  const X = v => px + (v - ox.min) / (ox.max - ox.min) * pw, Y = v => py + ph - (v - oy.min) / (oy.max - oy.min) * ph;
  let svg = '';
  for (const t of oy.cizgiler) svg += `<line x1="${px}" x2="${px + pw}" y1="${n(Y(t))}" y2="${n(Y(t))}" ${c.izgara}/>` + yaz(px - 6, Y(t) + 4, kisaSayi(t), c.metin(true), 11, 'end');
  for (const t of ox.cizgiler) svg += yaz(X(t), py + ph + 16, kisaSayi(t), c.metin(true), 11);
  const bmax = Math.max(1, ...nokta.map(p => p.b || 0));
  for (const p of nokta) {
    const r = kabarcik ? 4 + Math.sqrt(Math.max(0, p.b || 0) / bmax) * 16 : 4.5;
    svg += `<circle cx="${n(X(p.x))}" cy="${n(Y(p.y))}" r="${n(r)}" ${c.dolgu(0)} ${kabarcik ? 'fill-opacity="0.55"' : ''} stroke-width="${kabarcik ? 1 : 2}" ${c.yuzeyAttr}>${ipucu(`${p.k}: ${veri.seriler[0].ad} ${trSayi(p.x)}, ${veri.seriler[1].ad} ${trSayi(p.y)}${kabarcik ? `, ${veri.seriler[2]?.ad} ${trSayi(p.b)}` : ''}`)}</circle>`;
  }
  // eğilim çizgisi (en küçük kareler) isteğe bağlı
  if (s.egilim && nokta.length > 2) {
    const mx = nokta.reduce((t, p) => t + p.x, 0) / nokta.length, my = nokta.reduce((t, p) => t + p.y, 0) / nokta.length;
    const b = nokta.reduce((t, p) => t + (p.x - mx) * (p.y - my), 0) / (nokta.reduce((t, p) => t + (p.x - mx) ** 2, 0) || 1), a = my - b * mx;
    svg += `<line x1="${n(X(ox.min))}" y1="${n(Y(a + b * ox.min))}" x2="${n(X(ox.max))}" y2="${n(Y(a + b * ox.max))}" stroke-width="2" stroke-dasharray="6 4" ${c.cizgi(1)}/>`;
  }
  svg += yaz(px + pw / 2, H - 6, s.eksenBasligi?.x || veri.seriler[0]?.ad || '', c.metin(true), 11.5);
  svg += `<text transform="translate(14,${n(py + ph / 2)}) rotate(-90)" font-size="11.5" text-anchor="middle" ${c.metin(true)}>${esc(s.eksenBasligi?.y || veri.seriler[1]?.ad || '')}</text>`;
  return svg;
}

/* ---------------------------------------------------------------- şelale */
function selale(veri, s, c, W, H) {
  const sr = veri.seriler[0]; const K = veri.kategoriler.length;
  const toplamMi = i => (s.toplamlar || []).includes(i) || /^(genel )?toplam$|^sonuç$|^başlangıç$/i.test(String(veri.kategoriler[i]).trim());
  let birikim = 0; const parca = [];
  for (let i = 0; i < K; i++) { const v = sr.degerler[i] ?? 0; if (toplamMi(i)) { parca.push({ a: 0, b: i === 0 ? v : birikim, t: 'toplam', v: i === 0 ? v : birikim }); if (i === 0) birikim = v; } else { parca.push({ a: birikim, b: birikim + v, t: v >= 0 ? 'artis' : 'azalis', v }); birikim += v; } }
  const ust = s.baslik ? 38 : 14, alt = 52, px = 56, py = ust, pw = W - px - 16, ph = H - ust - alt;
  const o = guzelOlcek(Math.min(0, ...parca.map(p => Math.min(p.a, p.b))), Math.max(...parca.map(p => Math.max(p.a, p.b))), 5);
  const Y = v => py + ph - (v - o.min) / (o.max - o.min) * ph, bant = pw / K, w = bant * 0.66;
  let svg = '';
  for (const t of o.cizgiler) svg += `<line x1="${px}" x2="${px + pw}" y1="${n(Y(t))}" y2="${n(Y(t))}" ${c.izgara}/>` + yaz(px - 6, Y(t) + 4, kisaSayi(t), c.metin(true), 11, 'end');
  parca.forEach((p, i) => {
    const x = px + bant * i + (bant - w) / 2, y1 = Y(Math.max(p.a, p.b)), y2 = Y(Math.min(p.a, p.b));
    svg += `<rect x="${n(x)}" y="${n(y1)}" width="${n(w)}" height="${n(Math.max(1, y2 - y1))}" rx="2" ${c.sema(p.t)}>${ipucu(`${veri.kategoriler[i]}: ${trSayi(p.v)}`)}</rect>`;
    if (i < K - 1) svg += `<line x1="${n(x + w)}" x2="${n(x + bant)}" y1="${n(Y(p.b))}" y2="${n(Y(p.b))}" stroke-dasharray="3 3" ${c.izgara}/>`;
    svg += yaz(x + w / 2, y1 - 5, (p.t === 'azalis' ? '−' : p.t === 'artis' ? '+' : '') + kisaSayi(Math.abs(p.v)), c.metin(), 10.5);
    svg += yaz(x + w / 2, py + ph + 16, String(veri.kategoriler[i]).slice(0, Math.max(4, Math.floor(bant / 6.5))), c.metin(true), 11);
  });
  const lej = [['artis', 'Artış'], ['azalis', 'Azalış'], ['toplam', 'Toplam']];
  lej.forEach(([k, ad], j) => { svg += `<rect x="${16 + j * 90}" y="${H - 21}" width="10" height="10" rx="2" ${c.sema(k)}/>` + yaz(30 + j * 90, H - 12, ad, c.metin(true), 11.5, 'start'); });
  return svg;
}

/* ---------------------------------------------------------------- histogram ve kutu */
export function kovala(degerler, genislik = null) {
  const x = degerler.filter(v => typeof v === 'number').sort((a, b) => a - b); if (!x.length) return [];
  const nn = x.length, mn = x[0], mx = x[nn - 1];
  // Excel'in otomatik kovası Scott kuralıdır: 3,5·σ / n^(1/3)
  const ort = x.reduce((t, v) => t + v, 0) / nn, sd = Math.sqrt(x.reduce((t, v) => t + (v - ort) ** 2, 0) / Math.max(1, nn - 1));
  let g = genislik || (sd > 0 ? 3.5 * sd / Math.cbrt(nn) : 1);
  if (mx - mn > 0 && (mx - mn) / g > 60) g = (mx - mn) / 60;
  const k = Math.max(1, Math.ceil((mx - mn) / g + 1e-9));
  const kovalar = Array.from({ length: k }, (_, i) => ({ alt: mn + i * g, ust: mn + (i + 1) * g, sayi: 0 }));
  for (const v of x) { const i = Math.min(k - 1, Math.floor((v - mn) / g)); kovalar[i].sayi++; }
  return kovalar;
}
function histogram(veri, s, c, W, H) {
  const kov = kovala(veri.seriler[0]?.degerler || [], s.kova);
  const v2 = { kategoriler: kov.map((k, i) => (i === 0 ? '[' : '(') + kisaSayi(k.alt) + '–' + kisaSayi(k.ust) + ']'), seriler: [{ ad: 'Sayı', degerler: kov.map(k => k.sayi) }] };
  return eksenli(v2, { ...s, tur: 'sutun', gosterge: 'yok', eksenBasligi: s.eksenBasligi || { y: 'Sayı', x: veri.seriler[0]?.ad } }, c, W, H);
}
export function ceyrekler(degerler) {
  const x = degerler.filter(v => typeof v === 'number').sort((a, b) => a - b); if (!x.length) return null;
  // Excel kutu grafiği varsayılanı "dışlayıcı ortanca"dır: DÖRTTEBİRLİK.HRC ile aynı
  const q = p => { const h = (x.length + 1) * p - 1; const i = Math.max(0, Math.min(x.length - 1, Math.floor(h))); const j = Math.min(x.length - 1, i + 1); return x[i] + (x[j] - x[i]) * Math.max(0, Math.min(1, h - Math.floor(h))); };
  const q1 = q(0.25), q2 = q(0.5), q3 = q(0.75), iqr = q3 - q1;
  const icler = x.filter(v => v >= q1 - 1.5 * iqr && v <= q3 + 1.5 * iqr);
  return { q1, q2, q3, alt: Math.min(...icler), ust: Math.max(...icler), uclar: x.filter(v => v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr), ort: x.reduce((t, v) => t + v, 0) / x.length, n: x.length };
}
function kutu(veri, s, c, W, H) {
  const gruplar = veri.seriler.map(sr => ({ ad: sr.ad, q: ceyrekler(sr.degerler) })).filter(g => g.q);
  const ust = s.baslik ? 38 : 14, alt = 30, px = 56, py = ust, pw = W - px - 16, ph = H - ust - alt;
  const o = guzelOlcek(Math.min(0, ...gruplar.flatMap(g => [g.q.alt, ...g.q.uclar])), Math.max(...gruplar.flatMap(g => [g.q.ust, ...g.q.uclar])), 5);
  const Y = v => py + ph - (v - o.min) / (o.max - o.min) * ph, bant = pw / gruplar.length, w = Math.min(70, bant * 0.5);
  let svg = '';
  for (const t of o.cizgiler) svg += `<line x1="${px}" x2="${px + pw}" y1="${n(Y(t))}" y2="${n(Y(t))}" ${c.izgara}/>` + yaz(px - 6, Y(t) + 4, kisaSayi(t), c.metin(true), 11, 'end');
  gruplar.forEach((g, i) => {
    const m = px + bant * (i + 0.5), q = g.q, renk = c.cizgi(i);
    svg += `<line x1="${n(m)}" x2="${n(m)}" y1="${n(Y(q.ust))}" y2="${n(Y(q.alt))}" stroke-width="1.5" ${renk}/>`;
    svg += `<rect x="${n(m - w / 2)}" y="${n(Y(q.q3))}" width="${n(w)}" height="${n(Math.max(1, Y(q.q1) - Y(q.q3)))}" rx="3" ${c.dolgu(i)} fill-opacity="0.3" stroke-width="2" ${renk}>${ipucu(`${g.ad}: ortanca ${trSayi(q.q2)}, Ç1 ${trSayi(q.q1)}, Ç3 ${trSayi(q.q3)}, n=${q.n}`)}</rect>`;
    svg += `<line x1="${n(m - w / 2)}" x2="${n(m + w / 2)}" y1="${n(Y(q.q2))}" y2="${n(Y(q.q2))}" stroke-width="2.5" ${renk}/>`;
    for (const u of [q.alt, q.ust]) svg += `<line x1="${n(m - w / 4)}" x2="${n(m + w / 4)}" y1="${n(Y(u))}" y2="${n(Y(u))}" stroke-width="1.5" ${renk}/>`;
    svg += `<text x="${n(m)}" y="${n(Y(q.ort) + 4)}" font-size="12" text-anchor="middle" ${c.metin()}>×</text>`;
    for (const u of q.uclar) svg += `<circle cx="${n(m)}" cy="${n(Y(u))}" r="3.5" fill="none" stroke-width="1.5" ${renk}>${ipucu(`${g.ad}: uç değer ${trSayi(u)}`)}</circle>`;
    svg += yaz(m, py + ph + 16, g.ad, c.metin(true), 11.5);
  });
  return svg;
}

/* ---------------------------------------------------------------- ağaç haritası (squarified) */
export function karelestir(ogeler, x, y, w, h) {
  const top = ogeler.reduce((t, o) => t + o.v, 0); if (!top) return [];
  const olcek = (w * h) / top; const kalan = ogeler.map(o => ({ ...o, a: o.v * olcek })).sort((p, q) => q.a - p.a);
  const out = [];
  let r = { x, y, w, h };
  const kotu = (satir, uzun) => { const s = satir.reduce((t, o) => t + o.a, 0); const mx = Math.max(...satir.map(o => o.a)), mn = Math.min(...satir.map(o => o.a)); return Math.max(uzun * uzun * mx / (s * s), (s * s) / (uzun * uzun * mn)); };
  while (kalan.length) {
    const kisa = Math.min(r.w, r.h); let satir = [kalan.shift()];
    while (kalan.length && kotu([...satir, kalan[0]], kisa) <= kotu(satir, kisa)) satir.push(kalan.shift());
    const s = satir.reduce((t, o) => t + o.a, 0);
    if (r.w >= r.h) { const ww = s / r.h; let yy = r.y; for (const o of satir) { const hh = o.a / ww; out.push({ ...o, x: r.x, y: yy, w: ww, h: hh }); yy += hh; } r = { x: r.x + ww, y: r.y, w: r.w - ww, h: r.h }; }
    else { const hh = s / r.w; let xx = r.x; for (const o of satir) { const ww = o.a / hh; out.push({ ...o, x: xx, y: r.y, w: ww, h: hh }); xx += ww; } r = { x: r.x, y: r.y + hh, w: r.w, h: r.h - hh }; }
  }
  return out;
}
function agac(veri, s, c, W, H) {
  const sr = veri.seriler[0]; const ust = s.baslik ? 36 : 8;
  const kutular = karelestir(veri.kategoriler.map((k, i) => ({ k, v: Math.max(0, sr.degerler[i] ?? 0), i })).filter(o => o.v > 0), 8, ust, W - 16, H - ust - 8);
  const top = kutular.reduce((t, o) => t + o.v, 0);
  return kutular.map(o => `<rect x="${n(o.x + 1)}" y="${n(o.y + 1)}" width="${n(Math.max(0, o.w - 2))}" height="${n(Math.max(0, o.h - 2))}" rx="4" ${c.dolgu(o.i)}>${ipucu(`${o.k}: ${trSayi(o.v)} (${trSayi(o.v / top * 100, 1)} %)`)}</rect>` +
    (o.w > 54 && o.h > 30 ? `<text x="${n(o.x + 8)}" y="${n(o.y + 18)}" font-size="12" font-weight="700" ${c.bag ? 'fill="#ffffff"' : 'class="g-ic"'}>${esc(String(o.k).slice(0, Math.floor(o.w / 7.5)))}</text><text x="${n(o.x + 8)}" y="${n(o.y + 33)}" font-size="11" ${c.bag ? 'fill="#ffffff"' : 'class="g-ic"'}>${esc(kisaSayi(o.v))}</text>` : '')).join('');
}

/* ---------------------------------------------------------------- huni ve radar */
function huni(veri, s, c, W, H) {
  const sr = veri.seriler[0], K = veri.kategoriler.length, ust = s.baslik ? 38 : 12, satir = (H - ust - 10) / K, mx = Math.max(...sr.degerler.map(v => v ?? 0)) || 1;
  const etiketGen = Math.min(160, 12 + Math.max(...veri.kategoriler.map(k => String(k).length)) * 6.6), alan = W - etiketGen - 70, orta = etiketGen + alan / 2;
  let svg = '';
  veri.kategoriler.forEach((k, i) => {
    const v = sr.degerler[i] ?? 0, w = Math.max(2, v / mx * alan), y = ust + i * satir;
    svg += `<rect x="${n(orta - w / 2)}" y="${n(y + 2)}" width="${n(w)}" height="${n(satir - 4)}" rx="4" ${c.dolgu(0)}>${ipucu(`${k}: ${trSayi(v)}`)}</rect>`;
    svg += yaz(etiketGen - 8, y + satir / 2 + 4, k, c.metin(true), 11.5, 'end');
    const once = i ? sr.degerler[0] : null;
    svg += yaz(orta + w / 2 + 6, y + satir / 2 + 4, kisaSayi(v) + (i && once ? ` (${trSayi(v / once * 100, 0)} %)` : ''), c.metin(), 11, 'start');
  });
  return svg;
}
function radar(veri, s, c, W, H) {
  const K = veri.kategoriler.length; if (K < 3) return yaz(W / 2, H / 2, 'Radar için en az 3 ölçüt gerekir', c.metin(true), 13);
  const ust = s.baslik ? 34 : 8, altG = gostergeYuksekligi(veri.seriler, W, s.gosterge), R = Math.min(W / 2 - 80, (H - ust - altG) / 2 - 20), cx = W / 2, cy = ust + (H - ust - altG) / 2;
  const o = guzelOlcek(0, Math.max(...veri.seriler.flatMap(sr => sr.degerler.map(v => v ?? 0))), 4);
  const P = (i, v) => { const a = -Math.PI / 2 + i * 2 * Math.PI / K, r = v / o.max * R; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  let svg = '';
  for (const t of o.cizgiler.slice(1)) svg += `<polygon points="${Array.from({ length: K }, (_, i) => P(i, t).map(n).join(',')).join(' ')}" fill="none" ${c.izgara}/>`;
  veri.kategoriler.forEach((k, i) => { const [x, y] = P(i, o.max); svg += `<line x1="${cx}" y1="${n(cy)}" x2="${n(x)}" y2="${n(y)}" ${c.izgara}/>`; const [lx, ly] = P(i, o.max * 1.12); svg += yaz(lx, ly + 4, String(k).slice(0, 18), c.metin(true), 11, lx > cx + 5 ? 'start' : lx < cx - 5 ? 'end' : 'middle'); });
  veri.seriler.forEach((sr, j) => {
    const pts = sr.degerler.map((v, i) => P(i, v ?? 0).map(n).join(',')).join(' ');
    svg += `<polygon points="${pts}" ${c.dolgu(j)} fill-opacity="0.18" stroke-width="2" ${c.cizgi(j)}/>`;
    sr.degerler.forEach((v, i) => { const [x, y] = P(i, v ?? 0); svg += `<circle cx="${n(x)}" cy="${n(y)}" r="3.5" ${c.dolgu(j)}>${ipucu(`${sr.ad} · ${veri.kategoriler[i]}: ${trSayi(v ?? 0)}`)}</circle>`; });
  });
  return svg + gosterge(veri.seriler, W, H, c, s.gosterge);
}


/* ---------------------------------------------------------------- pano grafikleri: pareto, kelebek, halter, güneş, madde, ibre, ilerleme, gantt */
// Ortak: soldan kategori etiketli yatay satırlar
function satirDuzeni(veri, s, W, H, sagBosluk = 16, solEk = 0) {
  const ust = s.baslik ? 40 : 14, alt = 28 + gostergeYuksekligi(veri.seriler, W, s.gosterge);
  const sol = Math.min(170, 14 + Math.max(...veri.kategoriler.map(k => String(k).length)) * 6.4) + solEk;
  const K = veri.kategoriler.length, bant = (H - ust - alt) / Math.max(1, K);
  return { ust, alt, sol, K, bant, pw: W - sol - sagBosluk, ph: H - ust - alt };
}
function pareto(veri, s, c, W, H) {
  const sr = veri.seriler[0];
  const sirali = veri.kategoriler.map((k, i) => ({ k, v: Math.max(0, sr.degerler[i] ?? 0) })).sort((a, b) => b.v - a.v);
  const top = sirali.reduce((t, x) => t + x.v, 0) || 1; let bir = 0;
  sirali.forEach(x => { bir += x.v; x.p = bir / top; });
  const ust = s.baslik ? 40 : 16, alt = 30 + gostergeYuksekligi([{ ad: sr.ad }, { ad: 'Birikimli %' }], W, s.gosterge), px = 56, sag = 52, pw = W - px - sag, ph = H - ust - alt, K = sirali.length, bant = pw / Math.max(1, K);
  const o = guzelOlcek(0, sirali[0]?.v || 1, Math.max(3, Math.round(ph / 60)));
  const yd = v => ust + ph - (v - o.min) / (o.max - o.min) * ph, yp = p => ust + ph - p * ph;
  let svg = '';
  for (const t of o.cizgiler) svg += `<line x1="${px}" x2="${px + pw}" y1="${n(yd(t))}" y2="${n(yd(t))}" ${c.izgara}/>` + yaz(px - 6, yd(t) + 4, kisaSayi(t), c.metin(true), 11, 'end');
  for (const p of [0, 0.2, 0.4, 0.6, 0.8, 1]) svg += yaz(px + pw + 6, yp(p) + 4, trSayi(p * 100, 0) + ' %', c.metin(true), 11, 'start');
  // %80 eşiği
  svg += `<line x1="${px}" x2="${px + pw}" y1="${n(yp(0.8))}" y2="${n(yp(0.8))}" stroke-dasharray="4 4" ${c.metin(true).replace('fill', 'stroke').replace('g-m2', 'g-eks')}/>`;
  const esik = sirali.findIndex(x => x.p >= 0.8 - 1e-9);
  const etiketAtla = Math.max(1, Math.ceil(K * 46 / pw));
  sirali.forEach((x, i) => {
    const w = bant * 0.72, bx = px + bant * i + (bant - w) / 2;
    svg += `<path d="${cubukYolu(bx, yd(x.v), w, yd(0) - yd(x.v))}" ${c.dolgu(0)}${i > esik ? ' fill-opacity="0.35"' : ''}>${ipucu(`${x.k}: ${trSayi(x.v)} · birikimli ${trSayi(x.p * 100, 1)} %`)}</path>`;
    if (!(i % etiketAtla)) { const t = String(x.k), m = Math.max(3, Math.floor(bant * etiketAtla / 6.5)); svg += yaz(px + bant * (i + 0.5), ust + ph + 16, t.length > m ? t.slice(0, m - 1) + '…' : t, c.metin(true), 11.5); }
  });
  const d = sirali.map((x, i) => `${i ? 'L' : 'M'}${n(px + bant * (i + 0.5))},${n(yp(x.p))}`).join('');
  svg += `<path d="${d}" fill="none" stroke-width="2" ${c.cizgi(1)}/>`;
  sirali.forEach((x, i) => { svg += `<circle cx="${n(px + bant * (i + 0.5))}" cy="${n(yp(x.p))}" r="4" ${c.dolgu(1)} stroke-width="2" ${c.yuzeyAttr}>${ipucu(`Birikimli: ${trSayi(x.p * 100, 1)} %`)}</circle>`; });
  svg += `<line x1="${px}" x2="${px + pw}" y1="${n(yd(0))}" y2="${n(yd(0))}" ${c.metin(true).replace('fill', 'stroke').replace('g-m2', 'g-eks')}/>`;
  return svg + gosterge([{ ad: sr.ad }, { ad: 'Birikimli %' }], W, H, c, s.gosterge);
}
function kelebek(veri, s, c, W, H) {
  const [a, b] = veri.seriler; if (!b) return yaz(W / 2, H / 2, 'Kelebek grafik iki seri ister (sol ve sağ).', c.metin(true), 13);
  const ust = s.baslik ? 56 : 30, alt = 12, K = veri.kategoriler.length, bant = (H - ust - alt) / Math.max(1, K);
  const orta = W / 2, etiket = Math.min(130, 16 + Math.max(...veri.kategoriler.map(k => String(k).length)) * 6.4), yarim = (W - etiket) / 2 - 16;
  const mx = Math.max(...a.degerler.map(v => Math.abs(v ?? 0)), ...b.degerler.map(v => Math.abs(v ?? 0))) || 1;
  let svg = yaz(orta - etiket / 2 - 4, ust - 10, a.ad, c.metin() + ' font-weight="700"', 12, 'end') + yaz(orta + etiket / 2 + 4, ust - 10, b.ad, c.metin() + ' font-weight="700"', 12, 'start');
  veri.kategoriler.forEach((k, i) => {
    const y = ust + bant * i, h = Math.max(2, bant * 0.66), y0 = y + (bant - h) / 2;
    const va = Math.abs(a.degerler[i] ?? 0), vb = Math.abs(b.degerler[i] ?? 0), wa = va / mx * yarim, wb = vb / mx * yarim;
    svg += `<path d="${cubukYolu(orta - etiket / 2 - wa, y0, wa, h, 'sol')}" ${c.dolgu(0)}>${ipucu(`${k} · ${a.ad}: ${trSayi(va)}`)}</path>`;
    svg += `<path d="${cubukYolu(orta + etiket / 2, y0, wb, h, 'sag')}" ${c.dolgu(1)}>${ipucu(`${k} · ${b.ad}: ${trSayi(vb)}`)}</path>`;
    svg += yaz(orta, y + bant / 2 + 4, String(k).slice(0, 20), c.metin(true), 11.5);
    if (bant >= 16) { svg += yaz(orta - etiket / 2 - wa - 4, y + bant / 2 + 4, kisaSayi(va), c.metin(), 10.5, 'end') + yaz(orta + etiket / 2 + wb + 4, y + bant / 2 + 4, kisaSayi(vb), c.metin(), 10.5, 'start'); }
  });
  return svg;
}
function halter(veri, s, c, W, H) {
  const [a, b] = veri.seriler; if (!b) return yaz(W / 2, H / 2, 'Halter grafik iki seri ister (önce ve sonra).', c.metin(true), 13);
  const d = satirDuzeni(veri, s, W, H, 24), deg = [...a.degerler, ...b.degerler].filter(v => v != null);
  const o = guzelOlcek(Math.min(0, ...deg), Math.max(...deg), Math.max(3, Math.round(d.pw / 90)));
  const xd = v => d.sol + (v - o.min) / (o.max - o.min) * d.pw;
  let svg = '';
  for (const t of o.cizgiler) svg += `<line x1="${n(xd(t))}" x2="${n(xd(t))}" y1="${d.ust}" y2="${d.ust + d.ph}" ${c.izgara}/>` + yaz(xd(t), d.ust + d.ph + 16, kisaSayi(t), c.metin(true), 11);
  veri.kategoriler.forEach((k, i) => {
    const y = d.ust + d.bant * (i + 0.5), va = a.degerler[i], vb = b.degerler[i];
    svg += yaz(d.sol - 8, y + 4, String(k).slice(0, 24), c.metin(true), 11.5, 'end');
    if (va != null && vb != null) svg += `<line x1="${n(xd(va))}" x2="${n(xd(vb))}" y1="${n(y)}" y2="${n(y)}" stroke-width="3" ${c.metin(true).replace('fill', 'stroke').replace('g-m2', 'g-eks')}/>`;
    if (va != null) svg += `<circle cx="${n(xd(va))}" cy="${n(y)}" r="6" ${c.dolgu(0)} stroke-width="2" ${c.yuzeyAttr}>${ipucu(`${k} · ${a.ad}: ${trSayi(va)}`)}</circle>`;
    if (vb != null) svg += `<circle cx="${n(xd(vb))}" cy="${n(y)}" r="6" ${c.dolgu(1)} stroke-width="2" ${c.yuzeyAttr}>${ipucu(`${k} · ${b.ad}: ${trSayi(vb)} (fark ${trSayi(vb - (va ?? 0))})`)}</circle>`;
  });
  return svg + gosterge([a, b], W, H, c, s.gosterge);
}
function yay(cx, cy, r1, r2, a1, a2) {
  // a: radyan, 0 = saat 12, saat yönünde
  const p = (r, a) => [cx + r * Math.sin(a), cy - r * Math.cos(a)], buyuk = a2 - a1 > Math.PI ? 1 : 0;
  const [x1, y1] = p(r2, a1), [x2, y2] = p(r2, a2), [x3, y3] = p(r1, a2), [x4, y4] = p(r1, a1);
  return `M${n(x1)},${n(y1)}A${r2},${r2} 0 ${buyuk} 1 ${n(x2)},${n(y2)}L${n(x3)},${n(y3)}A${r1},${r1} 0 ${buyuk} 0 ${n(x4)},${n(y4)}Z`;
}
function gunes(veri, s, c, W, H) {
  const sr = veri.seriler[0], ust = s.baslik ? 34 : 8, R = Math.min(W - 180, H - ust - 12) / 2, cx = R + 20, cy = ust + (H - ust) / 2;
  const ogeler = veri.kategoriler.map((k, i) => ({ k, ustK: veri.ustKategori ? veri.ustKategori[i] : k, alt: veri.ustKategori ? String(k).split(' › ').slice(1).join(' › ') : null, v: Math.max(0, sr.degerler[i] ?? 0) })).filter(o => o.v > 0);
  const top = ogeler.reduce((t, o) => t + o.v, 0) || 1;
  const ustler = []; for (const o of ogeler) { let u = ustler.find(x => x.k === o.ustK); if (!u) ustler.push(u = { k: o.ustK, v: 0, cocuk: [] }); u.v += o.v; u.cocuk.push(o); }
  ustler.sort((a, b) => b.v - a.v);
  let svg = '', a = 0;
  const ikiHalka = !!veri.ustKategori, r0 = R * 0.3, r1 = ikiHalka ? R * 0.62 : R;
  ustler.forEach((u, i) => {
    const a2 = a + u.v / top * 2 * Math.PI;
    svg += `<path d="${yay(cx, cy, r0, r1, a, a2 - 0.004)}" ${c.dolgu(i)} stroke-width="2" ${c.yuzeyAttr}>${ipucu(`${u.k}: ${trSayi(u.v)} (${trSayi(u.v / top * 100, 1)} %)`)}</path>`;
    if (ikiHalka) { let b = a; u.cocuk.sort((x, y) => y.v - x.v).forEach((o, j) => { const b2 = b + o.v / top * 2 * Math.PI; svg += `<path d="${yay(cx, cy, r1 + 2, R, b, b2 - 0.004)}" ${c.dolgu(i)} fill-opacity="${0.75 - (j % 3) * 0.18}" stroke-width="2" ${c.yuzeyAttr}>${ipucu(`${u.k} › ${o.alt}: ${trSayi(o.v)} (${trSayi(o.v / top * 100, 1)} %)`)}</path>`; b = b2; }); }
    a = a2;
  });
  svg += yaz(cx, cy + 5, kisaSayi(top), c.metin() + ' font-weight="700"', 15);
  // sağda gösterge: üst kırılımlar ve payları
  ustler.slice(0, 12).forEach((u, i) => { const y = ust + 16 + i * 20; svg += `<rect x="${n(cx + R + 24)}" y="${y - 9}" width="10" height="10" rx="2" ${c.dolgu(i)}/>` + yaz(cx + R + 40, y, `${String(u.k).slice(0, 16)} · ${trSayi(u.v / top * 100, 0)} %`, c.metin(true), 11.5, 'start'); });
  return svg;
}
// Madde grafiği (Stephen Few): seri 1 gerçekleşen, seri 2 hedef, seri 3+ bant üst sınırları (kötü, orta…)
function madde(veri, s, c, W, H) {
  const [ger, hed, ...bantlar] = veri.seriler;
  const d = satirDuzeni({ ...veri, seriler: [] }, s, W, H, 56);
  const tum = [...veri.seriler.flatMap(x => x.degerler)].filter(v => v != null);
  const o = guzelOlcek(0, Math.max(...tum, 0) || 1, Math.max(3, Math.round(d.pw / 90)));
  const xd = v => d.sol + (v - o.min) / (o.max - o.min) * d.pw;
  let svg = '';
  for (const t of o.cizgiler) svg += yaz(xd(t), d.ust + d.ph + 16, kisaSayi(t), c.metin(true), 11);
  veri.kategoriler.forEach((k, i) => {
    const y = d.ust + d.bant * i, h = Math.min(30, d.bant * 0.7), y0 = y + (d.bant - h) / 2;
    svg += yaz(d.sol - 8, y + d.bant / 2 + 4, String(k).slice(0, 24), c.metin(true), 11.5, 'end');
    // bantlar: koyudan açığa (en kötü bant en koyu gri); bant yoksa tek açık iz
    const sinirlar = bantlar.map(b => b.degerler[i]).filter(v => v != null).sort((p, q) => p - q);
    const kat = [...sinirlar, o.max]; let onceki = 0;
    kat.forEach((sn, j) => { const ton = kat.length === 1 ? 0.12 : 0.34 - j * (0.24 / Math.max(1, kat.length - 1)); svg += `<rect x="${n(xd(onceki))}" y="${n(y0)}" width="${n(Math.max(0, xd(sn) - xd(onceki)))}" height="${n(h)}" ${c.metin(true)} fill-opacity="${n(ton * 100) / 100}">${ipucu(j < sinirlar.length ? `Bant ${j + 1}: ${kisaSayi(onceki)}–${kisaSayi(sn)}` : '')}</rect>`; onceki = sn; });
    const g = ger?.degerler[i];
    if (g != null) svg += `<path d="${cubukYolu(xd(0), y0 + h * 0.32, xd(g) - xd(0), h * 0.36, 'sag', 3)}" ${c.dolgu(0)}>${ipucu(`${k} · ${ger.ad}: ${trSayi(g)}${hed && hed.degerler[i] != null ? ` · hedefin ${trSayi(g / hed.degerler[i] * 100, 1)} %'i` : ''}`)}</path>`;
    const hv = hed?.degerler[i];
    if (hv != null) svg += `<line x1="${n(xd(hv))}" x2="${n(xd(hv))}" y1="${n(y0 + 2)}" y2="${n(y0 + h - 2)}" stroke-width="3" ${c.metin().replace('fill', 'stroke').replace('g-m"', 'g-hedef"')}>${ipucu(`${hed.ad}: ${trSayi(hv)}`)}</line>`;
    if (g != null && hv) svg += yaz(W - 6, y + d.bant / 2 + 4, trSayi(g / hv * 100, 0) + ' %', c.metin() + ' font-weight="700"', 11.5, 'end');
  });
  return svg;
}
function ibre(veri, s, c, W, H) {
  const v = veri.seriler[0]?.degerler[0] ?? 0, hedef = veri.seriler[1]?.degerler[0];
  const mx = s.eksenMax ?? (hedef != null ? guzelOlcek(0, Math.max(v, hedef) * 1.1).max : guzelOlcek(0, v).max);
  const ust = s.baslik ? 40 : 14, R = Math.min(W / 2 - 30, H - ust - 72), cx = W / 2, cy = ust + R + 6;
  const aci = x => -Math.PI / 2 + Math.max(0, Math.min(1, x / mx)) * Math.PI;
  let svg = `<path d="${yay(cx, cy, R * 0.68, R, -Math.PI / 2, Math.PI / 2)}" ${c.metin(true)} fill-opacity="0.14"/>`;
  svg += `<path d="${yay(cx, cy, R * 0.68, R, -Math.PI / 2, aci(v))}" ${c.dolgu(0)}>${ipucu(`${veri.kategoriler[0] ?? ''}: ${trSayi(v)}`)}</path>`;
  if (hedef != null) { const a = aci(hedef); svg += `<line x1="${n(cx + R * 0.62 * Math.sin(a))}" y1="${n(cy - R * 0.62 * Math.cos(a))}" x2="${n(cx + (R + 6) * Math.sin(a))}" y2="${n(cy - (R + 6) * Math.cos(a))}" stroke-width="3" ${c.metin().replace('fill', 'stroke').replace('g-m"', 'g-hedef"')}>${ipucu('Hedef: ' + trSayi(hedef))}</line>`; }
  const a = aci(v); svg += `<line x1="${cx}" y1="${cy}" x2="${n(cx + R * 0.9 * Math.sin(a))}" y2="${n(cy - R * 0.9 * Math.cos(a))}" stroke-width="3" stroke-linecap="round" ${c.metin().replace('fill', 'stroke').replace('g-m"', 'g-eks"')}/><circle cx="${cx}" cy="${cy}" r="6" ${c.metin()}/>`;
  svg += yaz(cx, cy + 30, kisaSayi(v), c.metin() + ' font-weight="700"', 22) + yaz(cx - R * 0.84, cy + 16, '0', c.metin(true), 11) + yaz(cx + R * 0.84, cy + 16, kisaSayi(mx), c.metin(true), 11);
  if (hedef != null) svg += yaz(cx, cy + 48, `Hedef ${kisaSayi(hedef)} · ${trSayi(v / hedef * 100, 0)} %`, c.metin(true), 12);
  return svg;
}
function ilerleme(veri, s, c, W, H) {
  // En çok 6 halka; dar ekranda 3'lü, genişte 6'ya kadar tek sıra
  const [ger, hed] = veri.seriler, K = Math.min(6, veri.kategoriler.length), ust = s.baslik ? 36 : 8;
  const sutun = Math.min(K, W < 520 ? 3 : 6), sira = Math.ceil(K / sutun), hucre = W / sutun, yuk = (H - ust) / sira;
  const R = Math.max(18, Math.min(hucre / 2 - 12, (yuk - 30) / 2));
  let svg = '';
  for (let i = 0; i < K; i++) {
    const g = ger.degerler[i] ?? 0, h = hed ? hed.degerler[i] : null, oran = h ? g / h : g, cx = hucre * (i % sutun + 0.5), cy = ust + yuk * Math.floor(i / sutun) + R + 4;
    svg += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R * 0.84)}" fill="none" stroke-width="${n(R * 0.3)}" ${c.metin(true).replace('fill', 'stroke').replace('g-m2', 'g-eks')} stroke-opacity="0.14"/>`;
    const oo = Math.max(0, Math.min(1, oran));
    // Tam halkada yayın başı ve sonu aynı noktaya düşer, SVG çizmez: iki yarım yay olarak çizilir
    const halkaYolu = oo <= 0.5 ? yay(cx, cy, R * 0.69, R * 0.99, 0, oo * 2 * Math.PI) : yay(cx, cy, R * 0.69, R * 0.99, 0, Math.PI) + yay(cx, cy, R * 0.69, R * 0.99, Math.PI - 0.001, oo * 2 * Math.PI);
    if (oo > 0) svg += `<path d="${halkaYolu}" ${oran >= 1 ? c.sema('artis') : c.dolgu(0)}>${ipucu(`${veri.kategoriler[i]}: ${trSayi(g)}${h ? ' / ' + trSayi(h) : ''}`)}</path>`;
    svg += yaz(cx, cy + 7, trSayi(oran * 100, 0) + ' %', c.metin() + ' font-weight="700"', Math.max(14, R * 0.36));
    svg += yaz(cx, cy + R + 18, String(veri.kategoriler[i]).slice(0, 18), c.metin(true), 12);
  }
  return svg;
}
// Gantt: seri 1 başlangıç (tarih ya da gün), seri 2 süre (gün); yığılmış çubuğun görünmez ilk parçası Excel'deki yöntemin aynısı
function gantt(veri, s, c, W, H) {
  const [bas, sure] = veri.seriler; if (!sure) return yaz(W / 2, H / 2, 'Gantt iki seri ister: başlangıç ve süre (gün).', c.metin(true), 13);
  const d = satirDuzeni({ ...veri, seriler: [] }, s, W, H, 20);
  const bs = bas.degerler.filter(v => v != null), bitis = bas.degerler.map((v, i) => (v ?? 0) + (sure.degerler[i] ?? 0));
  const mn = s.eksenMin ?? Math.min(...bs), mx = Math.max(...bitis), tarihMi = mn > 20000;
  const xd = v => d.sol + (v - mn) / Math.max(1, mx - mn) * d.pw;
  const adim = Math.max(1, Math.ceil((mx - mn) / Math.max(3, Math.round(d.pw / 70)) / 7) * 7);
  let svg = '';
  for (let t = mn; t <= mx + 0.01; t += adim) svg += `<line x1="${n(xd(t))}" x2="${n(xd(t))}" y1="${d.ust}" y2="${d.ust + d.ph}" ${c.izgara}/>` + yaz(xd(t), d.ust + d.ph + 16, tarihMi ? bicimle(t, 'gg.aa') : trSayi(t), c.metin(true), 11);
  veri.kategoriler.forEach((k, i) => {
    const b = bas.degerler[i], su = sure.degerler[i]; const y = d.ust + d.bant * i, h = Math.min(22, d.bant * 0.66), y0 = y + (d.bant - h) / 2;
    svg += yaz(d.sol - 8, y + d.bant / 2 + 4, String(k).slice(0, 26), c.metin(true), 11.5, 'end');
    if (b != null && su != null) svg += `<path d="${cubukYolu(xd(b), y0, Math.max(2, xd(b + su) - xd(b)), h, 'sag', 3)}" ${c.dolgu(0)}>${ipucu(`${k}: ${tarihMi ? bicimle(b, 'gg.aa.yyyy') : trSayi(b)} başlar, ${trSayi(su)} gün${tarihMi ? ', ' + bicimle(b + su - 1, 'gg.aa.yyyy') + ' biter' : ''}`)}</path>`;
  });
  return svg;
}

/* ---------------------------------------------------------------- giriş noktası */
// Sınıf kipinde bir öğe hem dolgu hem çizgi sınıfı alabilir (class="g-s0" ... class="g-yz"); XML'de çift öznitelik geçersizdir, birleştirilir.
function sinifBirlestir(svg) {
  return svg.replace(/<[a-zA-Z]+\b[^>]*>/g, t => { const m = t.match(/\sclass="[^"]*"/g); if (!m || m.length < 2) return t; const birlesik = ' class="' + m.map(x => x.slice(8, -1)).join(' ') + '"'; let ilk = true; return t.replace(/\sclass="[^"]*"/g, () => { if (ilk) { ilk = false; return birlesik; } return ''; }); });
}
export function grafikCiz(veri, secenek = {}) { return sinifBirlestir(grafikCizHam(veri, secenek)); }
function grafikCizHam(veri, secenek = {}) {
  const s = { tur: 'sutun', genislik: 640, yukseklik: 360, gosterge: 'alt', yigin: 'yok', ...secenek };
  if (!TURLER[s.tur]) throw new Error('Bilinmeyen grafik türü: ' + s.tur);
  if (!veri || !veri.seriler || !veri.seriler.length) throw new Error('Grafikte gösterilecek sayı yok. Aralıkta en az bir sayısal sütun olmalı.');
  const W = s.genislik, H = s.yukseklik, c = ciziciKur(s);
  let govde;
  switch (s.tur) {
    case 'pasta': govde = pasta(veri, s, c, W, H, false); break;
    case 'halka': govde = pasta(veri, s, c, W, H, true); break;
    case 'dagilim': govde = dagilim(veri, s, c, W, H, false); break;
    case 'kabarcik': govde = dagilim(veri, s, c, W, H, true); break;
    case 'selale': govde = selale(veri, s, c, W, H); break;
    case 'histogram': govde = histogram(veri, s, c, W, H); break;
    case 'kutu': govde = kutu(veri, s, c, W, H); break;
    case 'agac': govde = agac(veri, s, c, W, H); break;
    case 'huni': govde = huni(veri, s, c, W, H); break;
    case 'radar': govde = radar(veri, s, c, W, H); break;
    case 'pareto': govde = pareto(veri, s, c, W, H); break;
    case 'kelebek': govde = kelebek(veri, s, c, W, H); break;
    case 'halter': govde = halter(veri, s, c, W, H); break;
    case 'gunes': govde = gunes(veri, s, c, W, H); break;
    case 'madde': govde = madde(veri, s, c, W, H); break;
    case 'ibre': govde = ibre(veri, s, c, W, H); break;
    case 'ilerleme': govde = ilerleme(veri, s, c, W, H); break;
    case 'gantt': govde = gantt(veri, s, c, W, H); break;
    default: govde = eksenli(veri, s, c, W, H);
  }
  const arka = c.bag ? `<rect width="${W}" height="${H}" fill="${YUZEY[c.tema]}"/>` : '';
  const yazi = `font-family="IBM Plex Sans, Segoe UI, sans-serif"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc((s.baslik || TURLER[s.tur].ad + ' grafiği') + ': ' + veri.seriler.map(x => x.ad).join(', '))}" ${yazi} class="grafik">${arka}${baslikYaz(s, W, c)}${govde}</svg>`;
}

// Grafiğin tablo görünümü (erişilebilirlik ve "sayılar nereden geldi?")
export function grafikTablosu(veri) {
  return { basliklar: ['', ...veri.seriler.map(s => s.ad)], satirlar: veri.kategoriler.map((k, i) => [k, ...veri.seriler.map(s => s.degerler[i])]) };
}

// Grafik denetimi: kuralları ve veriyi karşılaştırır. kural: { turler:[...], yigin?, sifirdanBasla?, enCokDilim?, baslikGerekli?, seriSayisi?, siraliAzalan?, veriEtiketiYok? }
export function grafikDenetle(kural, veri, secenek, beklenenVeri) {
  const hatalar = [];
  const t = secenek.tur;
  if (kural.turler && !kural.turler.includes(t)) hatalar.push(kural.turNeden || `Bu soru için ${TURLER[t]?.ad || t} uygun değil. ${kural.turler.map(x => TURLER[x].ad).join(' ya da ')} deneyin.`);
  if (kural.yigin && (secenek.yigin || 'yok') !== kural.yigin) hatalar.push({ yok: 'Yığın kapalı olmalı: seriler yan yana karşılaştırılıyor.', yigin: 'Seriler üst üste (yığılmış) olmalı: toplam ve parçalar birlikte görünsün.', yuzde: '%100 yığılmış seçin: her kategoride pay görünsün.' }[kural.yigin]);
  if (kural.sifirdanBasla && secenek.eksenMin != null && secenek.eksenMin !== 0) hatalar.push('Sütun ve çubuk grafikte değer ekseni 0\'dan başlamalı; yoksa küçük farklar büyük görünür (yanıltıcı eksen).');
  if (kural.enCokDilim && (t === 'pasta' || t === 'halka') && veri.kategoriler.length > kural.enCokDilim) hatalar.push(`Pastada ${veri.kategoriler.length} dilim var; ${kural.enCokDilim}'ten fazla dilim okunmaz. Çubuk grafiğe geçin ya da küçükleri "Diğer"de toplayın.`);
  if (kural.baslikGerekli && !String(secenek.baslik || '').trim()) hatalar.push('Grafiğin bir başlığı olmalı: ne gösterdiğini tek cümleyle söyleyin.');
  if (kural.ikincilEksenYok && secenek.ikincilEksen) hatalar.push('İkincil eksen iki farklı ölçeği üst üste bindirir ve kesişme noktası anlamsızdır. Aynı birimdeki ölçüleri tek eksende gösterin, farklı birimleri iki ayrı grafikte.');
  if (kural.veriEtiketiYok && secenek.veriEtiketi && veri.kategoriler.length > 8) hatalar.push('Her noktaya sayı yazmak grafiği kalabalıklaştırır; çok noktalı grafikte veri etiketlerini kapatın.');
  if (kural.siraliAzalan) { const d = veri.seriler[0]?.degerler || []; if (d.some((v, i) => i && (v ?? 0) > (d[i - 1] ?? 0) + 1e-9)) hatalar.push('Çubuklar büyükten küçüğe sıralı olmalı; sıralı liste en büyüğü ilk bakışta gösterir (kaynağı ya da pivotu sıralayın).'); }
  if (kural.vurgu && (secenek.vurgu || 'yok') !== kural.vurgu) hatalar.push(kural.vurguNeden || { enBuyuk: 'En büyük değeri vurgulayın (Vurgu: En büyük); ötekiler soluk kalsın, göz ilk oraya gitsin.', enKucuk: 'En küçük değeri vurgulayın (Vurgu: En küçük).', yok: 'Vurguyu kapatın.' }[kural.vurgu]);
  if (kural.hedefCizgisi != null && !(secenek.hedefCizgisi != null && Math.abs(+secenek.hedefCizgisi - kural.hedefCizgisi) < 1e-6)) hatalar.push(kural.hedefNeden || `Grafiğe ${trSayi(kural.hedefCizgisi)} değerinde hedef çizgisi ekleyin (Hedef çizgisi kutusu).`);
  if (kural.seriSayisi && veri.seriler.length !== kural.seriSayisi) hatalar.push(`Grafikte ${veri.seriler.length} seri var, ${kural.seriSayisi} bekleniyor. Veri aralığını ya da seri yönünü (satır/sütun) kontrol edin.`);
  if (beklenenVeri) {
    const kisa = v => v.seriler.map(s => s.ad + ':' + s.degerler.map(x => x == null ? '' : Math.round(x * 1e6) / 1e6).join(',')).join('|') + '#' + v.kategoriler.join(',');
    if (kisa(veri) !== kisa(beklenenVeri)) {
      const ks = veri.kategoriler.length, kb = beklenenVeri.kategoriler.length;
      hatalar.push(ks !== kb ? `Grafikte ${ks} kategori var, ${kb} bekleniyor. Veri aralığına başlık satırını ve tüm satırları alın.` : veri.seriler.length !== beklenenVeri.seriler.length ? `Seri sayısı farklı (${veri.seriler.length}, beklenen ${beklenenVeri.seriler.length}). Seri yönünü değiştirmeyi deneyin.` : 'Grafiğin verisi beklenenden farklı: aralığı ya da seçilen sütunları kontrol edin.');
    }
  }
  return hatalar.length ? { tamam: false, mesaj: hatalar[0], hatalar } : { tamam: true, mesaj: 'Doğru. Grafik türü, verisi ve ayarları soruya uygun.' };
}
