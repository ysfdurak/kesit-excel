// Kesit Excel · durum çözümlemesi (Veri > Durum Çözümlemesi): Hedef Ara, Veri Tablosu, Senaryo Yöneticisi ve Çözücü (Solver).
// Hepsi kitabın gerçek formülleriyle çalışır: değişen hücreye değer yazılır, kitap yeniden hesaplanır, sonuç okunur.
import { adresCoz, alanCoz, adres, hataMi } from './formul.js';

const sayi = v => typeof v === 'number' && Number.isFinite(v) ? v : NaN;
function hucreler(alan) {
  const a = alanCoz(alan.includes(':') ? alan : alan + ':' + alan); if (!a) throw new Error('Geçersiz alan: ' + alan);
  const o = []; for (let r = a.r1; r <= a.r2; r++) for (let c = a.c1; c <= a.c2; c++) o.push({ r, c }); return o;
}
// Değişen hücreleri geçici yazar, fn'i çalıştırır, eski içeriği geri koyar
function dene(kitap, sayfa, atamalar, fn) {
  const eski = atamalar.map(([p]) => [p, kitap.icerik(sayfa, p.r, p.c)]);
  for (const [p, v] of atamalar) kitap.yaz(sayfa, p, v);
  try { return fn(); } finally { for (const [p, v] of eski) kitap.yaz(sayfa, p, v); }
}
const oku = (kitap, sayfa, a) => { const p = typeof a === 'string' ? adresCoz(a) : a; return kitap.hucre(sayfa, p.r, p.c); };

/* ---------------------------------------------------------------- Hedef Ara */
// Excel: en çok 100 yineleme, en çok 0,001 değişim. Burada sekant + gerekirse aralık genişletip ikiye bölme.
export function hedefAra(kitap, sayfa, { hedefHucre, hedefDeger, degisenHucre }) {
  const ph = adresCoz(hedefHucre), pd = adresCoz(degisenHucre);
  if (!ph || !pd) return { tamam: false, mesaj: 'Hücre adreslerini B5 biçiminde yazın.' };
  const ic = kitap.icerik(sayfa, pd.r, pd.c);
  if (typeof ic === 'string' && ic.startsWith('=')) return { tamam: false, mesaj: 'Değişecek hücre formül içeremez; Hedef Ara bir sabit değeri değiştirir.' };
  const fh = kitap.icerik(sayfa, ph.r, ph.c);
  if (!(typeof fh === 'string' && fh.startsWith('='))) return { tamam: false, mesaj: 'Hedef hücre bir formül içermeli: Hedef Ara formülün sonucunu istenen değere getirir.' };
  const f = x => { kitap.yaz(sayfa, pd, x); kitap.hesapla(); return sayi(kitap.hucre(sayfa, ph.r, ph.c)) - hedefDeger; };
  const x0 = typeof ic === 'number' ? ic : 0;
  let adim = 0, x = x0, y = f(x), x1 = x0 === 0 ? 1 : x0 * 1.1, y1 = f(x1);
  const tol = Math.max(1e-9, Math.abs(hedefDeger) * 1e-12);
  try {
    for (; adim < 100; adim++) {
      if (Math.abs(y1) <= tol) { x = x1; y = y1; break; }
      if (!Number.isFinite(y) || !Number.isFinite(y1) || y1 === y) break;
      const x2 = x1 - y1 * (x1 - x) / (y1 - y);
      x = x1; y = y1; x1 = x2; y1 = f(x1);
    }
    if (!(Math.abs(y1) <= Math.max(tol, 1e-7 * Math.max(1, Math.abs(hedefDeger))))) {
      // aralık arama: x0 çevresinde işaret değişimi bul, sonra ikiye böl
      let lo = x0, hi = x0, flo = f(lo), bulundu = false, fhi;
      for (let k = 0, d = Math.max(1, Math.abs(x0)); k < 60 && !bulundu; k++, d *= 2) {
        for (const yon of [1, -1]) { hi = x0 + yon * d; fhi = f(hi); if (Number.isFinite(fhi) && Number.isFinite(flo) && flo * fhi <= 0) { bulundu = true; break; } }
      }
      if (!bulundu) { kitap.yaz(sayfa, pd, ic); kitap.hesapla(); return { tamam: false, mesaj: 'Çözüm bulunamadı: değişen hücre hangi değeri alırsa alsın hedef değere ulaşılamıyor.', adim }; }
      for (let k = 0; k < 200; k++) { const m = (lo + hi) / 2, fm = f(m); adim++; if (Math.abs(fm) <= 1e-9 || Math.abs(hi - lo) < 1e-12) { lo = hi = m; break; } if (flo * fm <= 0) hi = m; else { lo = m; flo = fm; } }
      x1 = (lo + hi) / 2; y1 = f(x1);
    }
  } catch (e) { kitap.yaz(sayfa, pd, ic); kitap.hesapla(); return { tamam: false, mesaj: e.message }; }
  // Excel de bulduğu değeri hücrede bırakır (İptal derse geri alır)
  kitap.yaz(sayfa, pd, x1); kitap.hesapla();
  return { tamam: true, deger: x1, sonuc: kitap.hucre(sayfa, ph.r, ph.c), adim, eski: ic };
}

/* ---------------------------------------------------------------- Veri Tablosu */
// Tek değişkenli: girisHucre'ye her değer yazılır, formulHucreler okunur. İki değişkenli: satır ve sütun girişi, tek formül.
export function veriTablosu(kitap, sayfa, { formulHucreler, girisHucre, degerler, satirGiris, sutunGiris, satirDegerleri, sutunDegerleri }) {
  if (satirGiris && sutunGiris) {
    const fh = adresCoz(formulHucreler[0]), ps = adresCoz(satirGiris), pc = adresCoz(sutunGiris);
    return sutunDegerleri.map(cv => satirDegerleri.map(rv => dene(kitap, sayfa, [[ps, rv], [pc, cv]], () => { kitap.hesapla(); return oku(kitap, sayfa, fh); })));
  }
  const pg = adresCoz(girisHucre), fs = formulHucreler.map(adresCoz);
  return degerler.map(v => dene(kitap, sayfa, [[pg, v]], () => { kitap.hesapla(); return fs.map(p => oku(kitap, sayfa, p)); }));
}

/* ---------------------------------------------------------------- Senaryo Yöneticisi */
// senaryolar: [{ ad, degerler: { B2: 0.18, B3: 1200 } }] → özet: her senaryoda sonuç hücreleri
export function senaryoOzeti(kitap, sayfa, senaryolar, sonucHucreler) {
  return senaryolar.map(s => ({ ad: s.ad, degerler: s.degerler, sonuclar: dene(kitap, sayfa, Object.entries(s.degerler).map(([a, v]) => [adresCoz(a), v]), () => { kitap.hesapla(); return Object.fromEntries(sonucHucreler.map(h => [h, oku(kitap, sayfa, h)])); }) }));
}

/* ---------------------------------------------------------------- Çözücü (doğrusal: Simplex LP, tamsayı: dal-sınır) */
const EPS = 1e-9;
// İki aşamalı simplex. max c·x, A x (<=,>=,=) b, x >= 0. Bland kuralı (döngüye girmez).
function simplex(c, A, ops, b) {
  const m = A.length, n = c.length;
  // b < 0 olan satırları çevir
  A = A.map(r => r.slice()); b = b.slice(); ops = ops.slice();
  for (let i = 0; i < m; i++) if (b[i] < 0) { A[i] = A[i].map(x => -x); b[i] = -b[i]; ops[i] = ops[i] === '<=' ? '>=' : ops[i] === '>=' ? '<=' : '='; }
  const gev = ops.map(o => o === '<=' ? 1 : o === '>=' ? -1 : 0), yapay = ops.map(o => o !== '<=');
  const nG = gev.filter(Boolean).length, nY = yapay.filter(Boolean).length, N = n + nG + nY;
  const T = [], taban = [];
  let gi = n, yi = n + nG;
  for (let i = 0; i < m; i++) {
    const r = new Array(N + 1).fill(0); for (let j = 0; j < n; j++) r[j] = A[i][j];
    if (gev[i]) { r[gi] = gev[i]; if (gev[i] === 1) taban[i] = gi; gi++; }
    if (yapay[i]) { r[yi] = 1; taban[i] = yi; yi++; }
    r[N] = b[i]; T.push(r);
  }
  const pivot = (pr, pc) => { const p = T[pr][pc]; T[pr] = T[pr].map(x => x / p); for (let i = 0; i < m; i++) if (i !== pr && Math.abs(T[i][pc]) > EPS) { const f = T[i][pc]; T[i] = T[i].map((x, j) => x - f * T[pr][j]); } taban[pr] = pc; };
  const coz = (amac, izinli) => {
    for (let it = 0; it < 5000; it++) {
      // indirgenmiş maliyet: z_j - c_j
      const z = j => taban.reduce((t, bj, i) => t + amac[bj] * T[i][j], 0) - amac[j];
      let pc = -1; for (let j = 0; j < N; j++) if (izinli(j) && z(j) < -EPS) { pc = j; break; }
      if (pc < 0) return 'optimal';
      let pr = -1, enk = Infinity;
      for (let i = 0; i < m; i++) if (T[i][pc] > EPS) { const o = T[i][N] / T[i][pc]; if (o < enk - EPS || (Math.abs(o - enk) <= EPS && taban[i] < taban[pr])) { enk = o; pr = i; } }
      if (pr < 0) return 'sinirsiz';
      pivot(pr, pc);
    }
    return 'yineleme';
  };
  if (nY) {
    const a1 = new Array(N).fill(0); for (let j = n + nG; j < N; j++) a1[j] = -1;
    coz(a1, () => true);
    const kalan = taban.reduce((t, bj, i) => t + (bj >= n + nG ? T[i][N] : 0), 0);
    if (kalan > 1e-7) return { durum: 'olurlu_degil' };
    // tabanda kalan yapay değişkenleri çıkar
    for (let i = 0; i < m; i++) if (taban[i] >= n + nG) { const pc = T[i].findIndex((x, j) => j < n + nG && Math.abs(x) > EPS); if (pc >= 0) pivot(i, pc); }
  }
  const a2 = new Array(N).fill(0); for (let j = 0; j < n; j++) a2[j] = c[j];
  const d = coz(a2, j => j < n + nG);
  if (d === 'sinirsiz') return { durum: 'sinirsiz' };
  const x = new Array(n).fill(0); taban.forEach((bj, i) => { if (bj < n) x[bj] = T[i][N]; });
  return { durum: d === 'optimal' ? 'optimal' : 'yineleme', x, z: c.reduce((t, cj, j) => t + cj * x[j], 0) };
}
function dalSinir(c, A, ops, b, tamsayi, derinlik = 0, enIyi = { z: -Infinity, x: null }, sayac = { n: 0 }) {
  if (++sayac.n > 2000) return enIyi;
  const r = simplex(c, A, ops, b);
  if (r.durum !== 'optimal' || r.z <= enIyi.z + 1e-9) return enIyi;
  const k = tamsayi.find(j => Math.abs(r.x[j] - Math.round(r.x[j])) > 1e-6);
  if (k == null) return { z: r.z, x: r.x.map((v, j) => tamsayi.includes(j) ? Math.round(v) : v) };
  const satir = j => c.map((_, i) => i === j ? 1 : 0);
  enIyi = dalSinir(c, [...A, satir(k)], [...ops, '<='], [...b, Math.floor(r.x[k])], tamsayi, derinlik + 1, enIyi, sayac);
  enIyi = dalSinir(c, [...A, satir(k)], [...ops, '>='], [...b, Math.ceil(r.x[k])], tamsayi, derinlik + 1, enIyi, sayac);
  return enIyi;
}

// model: { amac: 'E10', yon: 'maks'|'min'|'deger', hedef, degiskenler: 'B2:B4', kisitlar: [{ sol: 'E5', op: '<=', sag: '100' | 'F5' | sayı }, { sol: 'B2:B4', op: 'tamsayi' }], negatifDegil: true }
// Excel'deki "Simplex LP" yöntemi: model doğrusal olmalı. Doğrusallık sayısal olarak denetlenir.
export function cozucu(kitap, sayfa, model) {
  const vars = String(model.degiskenler).split(/[;,]/).flatMap(a => hucreler(a.trim().toUpperCase()));
  if (!vars.length) return { tamam: false, mesaj: 'Değişken hücre yok.' };
  if (vars.length > 40) return { tamam: false, mesaj: 'Bu sürüm en çok 40 değişkenle çalışır.' };
  for (const p of vars) { const ic = kitap.icerik(sayfa, p.r, p.c); if (typeof ic === 'string' && ic.startsWith('=')) return { tamam: false, mesaj: `${adres(p.r, p.c)} formül içeriyor; değişken hücreler sabit değer olmalı.` }; }
  const pa = adresCoz(String(model.amac).toUpperCase()); if (!pa) return { tamam: false, mesaj: 'Amaç hücresi geçersiz.' };
  const tamsayi = new Set(), ikili = new Set(), satirlar = [];
  for (const k of model.kisitlar || []) {
    const sol = hucreler(String(k.sol).toUpperCase());
    if (k.op === 'tamsayi' || k.op === 'ikili') { for (const p of sol) { const j = vars.findIndex(v => v.r === p.r && v.c === p.c); if (j < 0) return { tamam: false, mesaj: `${k.sol}: tamsayı kısıtı yalnız değişken hücrelere konur.` }; (k.op === 'ikili' ? ikili : tamsayi).add(j); } continue; }
    // sağ taraf: sayı, hücre ya da sol ile aynı boyda alan
    const sagH = typeof k.sag === 'string' && /^[A-Za-z]/.test(k.sag) ? hucreler(k.sag.toUpperCase()) : null;
    sol.forEach((p, i) => satirlar.push({ sol: p, op: k.op, sagSabit: sagH ? null : Number(String(k.sag).replace(',', '.')), sagH: sagH ? sagH[sagH.length === 1 ? 0 : i] : null }));
  }
  const eski = vars.map(p => kitap.icerik(sayfa, p.r, p.c));
  const deger = x => { vars.forEach((p, j) => kitap.yaz(sayfa, p, x[j])); kitap.hesapla(); const out = { z: sayi(kitap.hucre(sayfa, pa.r, pa.c)), g: satirlar.map(s => sayi(kitap.hucre(sayfa, s.sol.r, s.sol.c)) - (s.sagH ? sayi(kitap.hucre(sayfa, s.sagH.r, s.sagH.c)) : s.sagSabit)) }; return out; };
  const geriKoy = () => { vars.forEach((p, j) => kitap.yaz(sayfa, p, eski[j])); kitap.hesapla(); };
  try {
    // katsayılar: f(0) ve f(e_j) - f(0)
    const n = vars.length, sifir = new Array(n).fill(0), f0 = deger(sifir);
    if (!Number.isFinite(f0.z) || f0.g.some(x => !Number.isFinite(x))) { geriKoy(); return { tamam: false, mesaj: 'Amaç ya da kısıt hücresi sayı vermiyor (boş değişkenlerle hata oluşuyor olabilir).' }; }
    const cz = [], cg = satirlar.map(() => []);
    for (let j = 0; j < n; j++) { const e = sifir.slice(); e[j] = 1; const f = deger(e); cz.push(f.z - f0.z); f.g.forEach((g, i) => cg[i].push(g - f0.g[i])); }
    // doğrusallık denetimi: rastgele iki noktada tahmin = gerçek mi?
    for (const t of [vars.map((_, j) => 1.7 + j * 0.37), vars.map((_, j) => 3.1 - j * 0.53)]) {
      const f = deger(t), tz = f0.z + cz.reduce((s, cc, j) => s + cc * t[j], 0);
      const tg = f0.g.map((g, i) => g + cg[i].reduce((s, cc, j) => s + cc * t[j], 0));
      const yakin = (a, b) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a), Math.abs(b));
      if (!yakin(f.z, tz) || f.g.some((g, i) => !yakin(g, tg[i]))) { geriKoy(); return { tamam: false, mesaj: 'Model doğrusal değil: amaç ya da kısıt formüllerinde değişkenler birbiriyle çarpılıyor, bölünüyor ya da EĞER/YUVARLA gibi işlevlerden geçiyor. Excel bu durumda "Simplex LP koşulları sağlanmıyor" der; GRG Doğrusal Olmayan yöntemi gerekir.', dogrusalDegil: true }; }
    }
    // LP kur: max (ya da -min) c·x, g_i(x) = f0.g_i + cg_i·x  op 0
    const yon = model.yon || 'maks';
    let c = yon === 'min' ? cz.map(x => -x) : cz.slice();
    const A = [], ops = [], b = [];
    satirlar.forEach((s, i) => { A.push(cg[i]); ops.push(s.op === '=' ? '=' : s.op); b.push(-f0.g[i]); });
    if (yon === 'deger') { A.push(cz); ops.push('='); b.push(Number(model.hedef) - f0.z); c = cz.map(() => 0); }
    for (const j of ikili) { const r = sifir.slice(); r[j] = 1; A.push(r); ops.push('<='); b.push(1); tamsayi.add(j); }
    let sonuc;
    if (model.negatifDegil === false) {
      // serbest değişken: x = x⁺ - x⁻
      const c2 = [...c, ...c.map(x => -x)], A2 = A.map(r => [...r, ...r.map(x => -x)]);
      const r = simplex(c2, A2, ops, b);
      sonuc = r.durum === 'optimal' ? { z: r.z, x: r.x.slice(0, n).map((v, j) => v - r.x[n + j]) } : { durum: r.durum };
    } else if (tamsayi.size) {
      const r = dalSinir(c, A, ops, b, [...tamsayi]); sonuc = r.x ? r : { durum: 'olurlu_degil' };
    } else { const r = simplex(c, A, ops, b); sonuc = r.durum === 'optimal' ? r : { durum: r.durum }; }
    if (!sonuc.x) { geriKoy(); return { tamam: false, mesaj: sonuc.durum === 'sinirsiz' ? 'Amaç sınırsız büyüyor: bir kısıt eksik (ör. kapasite ya da talep sınırı).' : 'Bütün kısıtları aynı anda sağlayan bir çözüm yok (olurlu değil). Kısıtları gözden geçirin.' }; }
    const x = sonuc.x.map(v => Math.abs(v - Math.round(v)) < 1e-9 ? Math.round(v) : +v.toPrecision(12));
    const f = deger(x); // Excel de çözümü hücrelerde bırakır ("Çözücü Çözümünü Sakla")
    return { tamam: true, degerler: Object.fromEntries(vars.map((p, j) => [adres(p.r, p.c), x[j]])), amac: f.z, mesaj: 'Çözücü bir çözüm buldu. Tüm kısıtlamalar ve en iyi duruma getirme koşulları karşılandı.' };
  } catch (e) { geriKoy(); return { tamam: false, mesaj: e.message }; }
}
export { hataMi };
