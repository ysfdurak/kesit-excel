// Alıştırma çözümlerini hesaplatıp ilk değerleri gösterir (hata, boş, hep aynı sonuç gibi sorunları gözle yakalamak için).
// Kullanım: node tools/cozum_kontrol.mjs "^m22"   (ders kimliği deseni)
import { kitapKur } from '../docs/motor/denetci.js';
import { SAYFALAR } from '../docs/icerik/sayfalar.js';
import { DERSLER } from '../docs/icerik/dersler.js';
import { alanCoz, hataMi, kaydir } from '../docs/motor/formul.js';
const desen = new RegExp(process.argv[2] || '.');
const g = v => hataMi(v) ? v.kod : v == null ? '∅' : typeof v === 'number' ? +v.toFixed(4) : JSON.stringify(v);
for (const d of DERSLER) if (desen.test(d.id)) for (const a of d.alistirmalar) {
  if (a.tur) continue;
  const k = kitapKur(a, SAYFALAR); const al0 = alanCoz(a.hedef.includes(':') ? a.hedef : a.hedef + ':' + a.hedef); const al = a.okunan ? alanCoz(a.okunan) : al0;
  if (a.hedef.includes(':')) { const m = a.ikiYon ? al0.c2 - al0.c1 + 1 : 1; for (let i = 0; i <= al0.r2 - al0.r1; i++) for (let j = 0; j < m; j++) k.yaz(a.sayfa, { r: al0.r1 + i, c: al0.c1 + j }, kaydir(a.cozum, i, j)); }
  else k.yaz(a.sayfa, a.hedef, a.cozum);
  k.hesapla();
  const vals = []; let hata = 0, bos = 0;
  for (let r = al.r1; r <= al.r2; r++) for (let c = al.c1; c <= al.c2; c++) { const v = k.hucre(a.sayfa, r, c); if (hataMi(v)) hata++; if (v == null || v === '') bos++; if (vals.length < 4) vals.push(g(v)); }
  console.log(`${d.id}/${a.id}`.padEnd(10), (hata ? `HATA:${hata} ` : '') + (bos ? `boş:${bos} ` : ''), vals.join(' | '));
}
