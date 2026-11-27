// tests/vakalar.json'daki formülleri motorla hesaplar, JSON olarak basar (LibreOffice karşılaştırması için)
import { readFileSync } from 'node:fs';
import { Kitap } from '../docs/motor/kitap.js';
import { hataMi } from '../docs/motor/formul.js';
const V = JSON.parse(readFileSync(new URL('../tests/vakalar.json', import.meta.url)));
const k = new Kitap({ bugun: 45900 });
k.tablo('Veri', V.veri.basliklar, V.veri.satirlar);
for (const [a, v] of Object.entries(V.veri.ek || {})) k.yaz('Veri', a, v); // ölçüt alanları
const tum = [...V.lo, ...V.elle.map(x => x[0])];
tum.forEach((f, i) => k.yaz('Veri', { r: 1 + i, c: 10 }, f)); // J sütunu
k.hesapla();
const out = tum.map((f, i) => { const v = k.hucre('Veri', 1 + i, 10); return hataMi(v) ? { hata: v.kod } : v; });
process.stdout.write(JSON.stringify(out));
