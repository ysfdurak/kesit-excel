// Kesit Excel · koşullu biçimlendirme ve mini grafikler (sparkline).
// Kural türleri Excel'in Giriş > Koşullu Biçimlendirme menüsüyle aynıdır. Sonuç hücre başına bir "görünüm" nesnesidir;
// ızgara onu CSS sınıfı ve CSSOM ile çizer, denetçi de aynı nesneyi karşılaştırır.
import { alanCoz, adres, kaydir, hataMi, mantiga, karsilastir } from './formul.js';
import { kovala } from './grafik.js';

export const KURAL_TURLERI = {
  deger: 'Hücre değeri (büyüktür, küçüktür, arasında, eşittir, içerir)',
  ilkN: 'İlk/son N öğe ya da %N',
  ortalama: 'Ortalamanın üstü/altı',
  yinelenen: 'Yinelenen ya da benzersiz değerler',
  formul: 'Biçimlendirilecek hücreleri formülle belirle',
  veriCubugu: 'Veri çubukları',
  renkOlcegi: 'Renk ölçeği',
  simge: 'Simge kümesi (üç ok)',
};
export const STILLER = { kirmizi: 'Açık kırmızı dolgu, koyu kırmızı metin', sari: 'Sarı dolgu, koyu sarı metin', yesil: 'Yeşil dolgu, koyu yeşil metin', kalin: 'Kalın metin' };

function hucreler(kitap, sayfa, alan) {
  const a = alanCoz(alan); if (!a) throw new Error('Geçersiz aralık: ' + alan);
  const out = [];
  for (let r = a.r1; r <= a.r2; r++) for (let c = a.c1; c <= a.c2; c++) out.push({ r, c, v: kitap.hucre(sayfa, r, c) });
  return { a, out };
}
const sayilar = hs => hs.filter(h => typeof h.v === 'number');

// kural: { tur, alan, ... } → Map('r,c' → görünüm). Sonraki kural önceki vurguyu ezmez (Excel'de ilk kural öncelikli; "Doğruysa Durdur" yok).
export function kosulluUygula(kitap, sayfa, kurallar) {
  const gor = new Map();
  const yaz = (h, alanAd, deger) => { const k = h.r + ',' + h.c; const g = gor.get(k) || {}; if (alanAd === 'stil' && g.stil) return; g[alanAd] = deger; gor.set(k, g); };
  for (const k of kurallar) {
    const { a, out } = hucreler(kitap, sayfa, k.alan);
    const say = sayilar(out);
    switch (k.tur) {
      case 'deger': {
        const b = k.deger, b2 = k.deger2;
        const t = v => {
          if (v == null || hataMi(v)) return false;
          if (k.op === 'icerir') return typeof v === 'string' && v.toLocaleLowerCase('tr').includes(String(b).toLocaleLowerCase('tr'));
          const sayisal = typeof b === 'number';
          if (sayisal && typeof v !== 'number') return false;
          const cmp = typeof v === typeof b ? karsilastir(v, b) : NaN;
          return { '>': cmp > 0, '>=': cmp >= 0, '<': cmp < 0, '<=': cmp <= 0, '=': cmp === 0, '<>': cmp !== 0, arasinda: typeof v === 'number' && v >= Math.min(b, b2) && v <= Math.max(b, b2) }[k.op];
        };
        for (const h of out) if (t(h.v)) yaz(h, 'stil', k.stil || 'kirmizi');
        break;
      }
      case 'ilkN': {
        const s = say.slice().sort((p, q) => k.alt ? p.v - q.v : q.v - p.v);
        const adet = k.yuzde ? Math.max(1, Math.floor(say.length * k.n / 100)) : k.n;
        if (!s.length) break;
        const esik = s[Math.min(s.length, adet) - 1].v; // Excel: eşitlikte eşik değerindeki hepsi
        for (const h of say) if (k.alt ? h.v <= esik : h.v >= esik) yaz(h, 'stil', k.stil || 'yesil');
        break;
      }
      case 'ortalama': {
        if (!say.length) break; const ort = say.reduce((t, h) => t + h.v, 0) / say.length;
        for (const h of say) if (k.alt ? h.v < ort : h.v > ort) yaz(h, 'stil', k.stil || 'sari');
        break;
      }
      case 'yinelenen': {
        const anah = v => typeof v === 'string' ? 's' + v.toLocaleLowerCase('tr') : typeof v + String(v);
        const say2 = new Map(); for (const h of out) if (h.v != null && h.v !== '') say2.set(anah(h.v), (say2.get(anah(h.v)) || 0) + 1);
        for (const h of out) if (h.v != null && h.v !== '' && (k.benzersiz ? say2.get(anah(h.v)) === 1 : say2.get(anah(h.v)) > 1)) yaz(h, 'stil', k.stil || 'kirmizi');
        break;
      }
      case 'formul': {
        // Formül seçili alanın sol üst hücresine göre yazılır, her hücre için kaydırılır (göreli başvuru kurallarıyla)
        const f = String(k.formul || '').startsWith('=') ? k.formul : '=' + k.formul;
        for (const h of out) {
          const v = kitap.formulDegerlendir(sayfa, h.r, h.c, kaydir(f, h.r - a.r1, h.c - a.c1));
          const m = hataMi(v) ? false : mantiga(v);
          if (m === true) yaz(h, 'stil', k.stil || 'kirmizi');
        }
        break;
      }
      case 'veriCubugu': {
        if (!say.length) break;
        const mn = Math.min(0, ...say.map(h => h.v)), mx = Math.max(0, ...say.map(h => h.v)), aralik = mx - mn || 1;
        for (const h of say) yaz(h, 'cubuk', { bas: (Math.min(0, h.v) - mn) / aralik, oran: Math.abs(h.v) / aralik, negatif: h.v < 0 });
        break;
      }
      case 'renkOlcegi': {
        if (!say.length) break;
        const v = say.map(h => h.v).sort((p, q) => p - q), mn = v[0], mx = v[v.length - 1];
        const orta = k.uclu ? (k.ortaDeger ?? v[Math.floor((v.length - 1) / 2)]) : null;
        for (const h of say) {
          let t;
          if (k.uclu) t = h.v <= orta ? (orta === mn ? 0.5 : 0.5 * (h.v - mn) / (orta - mn)) : (mx === orta ? 0.5 : 0.5 + 0.5 * (h.v - orta) / (mx - orta));
          else t = mx === mn ? 0.5 : (h.v - mn) / (mx - mn);
          yaz(h, 'renk', { t: Math.round(t * 1000) / 1000, uclu: !!k.uclu, ters: !!k.ters });
        }
        break;
      }
      case 'simge': {
        if (!say.length) break;
        // Excel varsayılanı: yüzde eşikleri ≥%67 yukarı, ≥%33 yan, altı aşağı (min–max aralığına göre)
        const mn = Math.min(...say.map(h => h.v)), mx = Math.max(...say.map(h => h.v)), u = k.esikler || [0.67, 0.33];
        for (const h of say) { const t = mx === mn ? 1 : (h.v - mn) / (mx - mn); yaz(h, 'simge', t >= u[0] ? 'yukari' : t >= u[1] ? 'yan' : 'asagi'); }
        break;
      }
      default: throw new Error('Bilinmeyen kural türü: ' + k.tur);
    }
  }
  return gor;
}

// Mini grafik: { hucre: 'H2', alan: 'B2:G2', tur: 'cizgi'|'sutun'|'kazanc', yuksekNokta?, dusukNokta? } → küçük SVG
export function miniGrafik(kitap, sayfa, m, { genislik = 92, yukseklik = 22, bagimsiz = false } = {}) {
  const a = alanCoz(m.alan); const d = [];
  for (let r = a.r1; r <= a.r2; r++) for (let c = a.c1; c <= a.c2; c++) { const v = kitap.hucre(sayfa, r, c); d.push(typeof v === 'number' ? v : null); }
  const x = d.filter(v => v != null); if (!x.length) return '';
  const W = genislik, H = yukseklik, mn = m.tur === 'kazanc' ? -1 : Math.min(...x, m.tur === 'sutun' ? 0 : Infinity), mx = m.tur === 'kazanc' ? 1 : Math.max(...x, m.tur === 'sutun' ? 0 : -Infinity);
  const Y = v => H - 2 - (v - mn) / ((mx - mn) || 1) * (H - 4), adim = W / d.length;
  const renk = (cls, hex) => bagimsiz ? `fill="${hex}"` : `class="${cls}"`;
  let ic = '';
  if (m.tur === 'cizgi') {
    const pts = d.map((v, i) => v == null ? null : `${(i + 0.5) * adim},${Y(v)}`).filter(Boolean);
    ic = `<polyline points="${pts.join(' ')}" fill="none" stroke-width="1.6" ${bagimsiz ? 'stroke="#257de0"' : 'class="g-c0"'}/>`;
    const enY = Math.max(...x), enD = Math.min(...x);
    d.forEach((v, i) => { if (v == null) return; if ((m.yuksekNokta !== false && v === enY) || (m.dusukNokta !== false && v === enD)) ic += `<circle cx="${(i + 0.5) * adim}" cy="${Y(v)}" r="2.4" ${v === enY ? renk('g-artis', '#008a17') : renk('g-azalis', '#ec4647')}/>`; });
  } else {
    d.forEach((v, i) => {
      if (v == null) return;
      const vv = m.tur === 'kazanc' ? Math.sign(v) : v, y0 = Y(0), y1 = Y(vv);
      const neg = vv < 0;
      ic += `<rect x="${i * adim + 1}" y="${Math.min(y0, y1)}" width="${Math.max(1, adim - 2)}" height="${Math.max(1, Math.abs(y1 - y0))}" ${neg ? renk('g-azalis', '#ec4647') : renk(m.tur === 'kazanc' ? 'g-artis' : 'g-s0', m.tur === 'kazanc' ? '#008a17' : '#257de0')}/>`;
    });
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="mini" role="img" aria-label="Mini grafik ${m.alan}">${ic}</svg>`;
}

// Denetim: aynı veride ve gizli varyantta kuralın vurguladığı hücreler çözümle aynı mı?
export function gorunumOzeti(gor) {
  const ozet = {};
  for (const [k, g] of [...gor].sort()) ozet[k] = [g.stil || '', g.cubuk ? Math.round(g.cubuk.oran * 100) : '', g.renk ? Math.round(g.renk.t * 100) + (g.renk.uclu ? 'u' : '') : '', g.simge || ''].join('|');
  return ozet;
}
