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
