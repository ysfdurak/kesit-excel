// Kesit Excel · Veri araçları: Gelişmiş Filtre (Veri > Sırala ve Filtre Uygula > Gelişmiş).
// Ölçüt alanı: ilk satır liste başlıklarının kopyası; aynı satırdaki ölçütler VE, alt alta satırlar YA DA.
// Excel'in iki inceliği aynen uygulanır: düz metin ölçütü "ile başlar" demektir (Ank → Ankara),
// ölçüt alanına boş bir satır alınırsa o satır her kaydı eşler ve filtre hiçbir şeyi elemez.
import { alanCoz, hataMi } from './formul.js';
import { olcut } from './islevler.js';

const trB = s => String(s ?? '').trim().toLocaleUpperCase('tr');

export function gelismisFiltre(kitap, sayfa, listeAlan, olcutAlan, { benzersiz = false } = {}) {
  const la = alanCoz(String(listeAlan || '').replace(/\$/g, '')), oa = alanCoz(String(olcutAlan || '').replace(/\$/g, ''));
  if (!la) throw new Error('Liste aralığını A1:G241 biçiminde yazın.');
  const liste = kitap.degerler(sayfa, la), basliklar = liste[0].map(x => String(x ?? ''));
  let gruplar = [[]]; // ölçüt yoksa her satır geçer
  if (oa) {
    const o = kitap.degerler(sayfa, oa);
    if (o.length < 2) throw new Error('Ölçüt aralığı en az iki satır olmalı: başlık satırı ve altında ölçüt.');
    const sutunlar = o[0].map(b => { if (b == null || b === '') return -1; const i = basliklar.findIndex(x => trB(x) === trB(b)); if (i < 0) throw new Error(`Ölçüt başlığı "${b}" listede yok. Başlıklar liste başlıklarıyla aynı yazılmalı (en iyisi kopyalayıp yapıştırın).`); return i; });
    gruplar = o.slice(1).map(sat => sat.map((v, j) => (v == null || v === '' || sutunlar[j] < 0) ? null : { s: sutunlar[j], f: kosul(v) }).filter(Boolean));
  }
  const satirlar = [], satirNo = [], gorulen = new Set();
  liste.slice(1).forEach((sat, i) => {
    if (!gruplar.some(g => g.every(k => k.f(sat[k.s])))) return;
    if (benzersiz) { const a = JSON.stringify(sat.map(x => hataMi(x) ? x.kod : typeof x === 'string' ? trB(x) : x)); if (gorulen.has(a)) return; gorulen.add(a); }
    satirlar.push(sat); satirNo.push(la.r1 + 1 + i);
  });
  return { basliklar, satirlar, satirNo, bosSatir: gruplar.some(g => !g.length) && oa != null };
}
// Gelişmiş filtrede düz metin "ile başlar"; = ile başlayan tam eşleşme ister. Sayı, tarih ve karşılaştırmalar EĞERSAY gibi.
function kosul(v) {
  if (typeof v !== 'string') return olcut(v);
  if (/^(<>|>=|<=|<|>)/.test(v)) return olcut(v);
  if (v.startsWith('=')) return olcut(v);
  return olcut('=' + v + '*');
}

// Birleştir (Veri > Birleştir): birden çok aralığı tek tabloda özetler.
// Etiket kullanılmazsa konuma göre (3B başvuru gibi): aralıkların aynı hücreleri toplanır.
// "Sol sütun" işaretliyse satırlar ilk sütundaki etikete göre, "Üst satır" işaretliyse sütunlar başlığa göre eşleşir; bir kaynakta olmayan etiket de eklenir.
const BIRLESTIR_ISLEV = {
  TOPLA: x => x.reduce((t, v) => t + v, 0), ORTALAMA: x => x.length ? x.reduce((t, v) => t + v, 0) / x.length : null,
  SAY: x => x.length, MAK: x => x.length ? Math.max(...x) : null, 'MİN': x => x.length ? Math.min(...x) : null,
};
export const BIRLESTIR_ISLEVLERI = Object.keys(BIRLESTIR_ISLEV);
export function birlestir(kitap, kaynaklar, { islev = 'TOPLA', solSutun = false, ustSatir = false } = {}) {
  const f = BIRLESTIR_ISLEV[islev]; if (!f) throw new Error('Bilinmeyen işlev: ' + islev);
  if (!kaynaklar.length) throw new Error('En az bir başvuru ekleyin (ör. Ocak!A1:C8).');
  const tablolar = kaynaklar.map(k => {
    const m = /^'?([^'!]+)'?!(\$?[A-Z]+\$?\d+:\$?[A-Z]+\$?\d+)$/i.exec(String(k).trim());
    if (!m) throw new Error(`"${k}" başvurusu Sayfa!A1:C8 biçiminde olmalı.`);
    if (!kitap.sayfaBul(m[1])) throw new Error(`"${m[1]}" sayfası yok.`);
    return kitap.degerler(m[1], alanCoz(m[2].replace(/\$/g, '')));
  });
  const anahtar = v => String(v ?? '').trim().toLocaleUpperCase('tr');
  const satirEt = [], sutunEt = [], hucre = new Map();
  const ekle = (liste, ad) => { const a = anahtar(ad); let i = liste.findIndex(x => anahtar(x) === a); if (i < 0) { liste.push(ad); i = liste.length - 1; } return i; };
  for (const t of tablolar) {
    const bas = ustSatir ? 1 : 0, sol = solSutun ? 1 : 0;
    for (let r = bas; r < t.length; r++) for (let c = sol; c < t[r].length; c++) {
      const ri = solSutun ? ekle(satirEt, t[r][0]) : r - bas, ci = ustSatir ? ekle(sutunEt, t[0][c]) : c - sol;
      const v = t[r][c], k = ri + ',' + ci;
      if (!hucre.has(k)) hucre.set(k, []);
      if (typeof v === 'number') hucre.get(k).push(v);
    }
  }
  const R = solSutun ? satirEt.length : Math.max(...tablolar.map(t => t.length - (ustSatir ? 1 : 0)));
  const C = ustSatir ? sutunEt.length : Math.max(...tablolar.map(t => Math.max(...t.map(s => s.length)) - (solSutun ? 1 : 0)));
  const satirlar = Array.from({ length: R }, (_, r) => [...(solSutun ? [satirEt[r]] : []), ...Array.from({ length: C }, (_, c) => { const x = hucre.get(r + ',' + c); return x && x.length ? f(x) : null; })]);
  const basliklar = ustSatir ? [...(solSutun ? [''] : []), ...sutunEt] : null;
  return { basliklar, satirlar };
}
