// Görselleştirme ve makro motorları: grafik SVG'leri geçerli XML, koşullu biçim, pano KPI, ders örneklerindeki makrolar.
import test from 'node:test';
import assert from 'node:assert/strict';
import { grafikCiz, TURLER, pivotVerisi, aralikVerisi, kovala, ceyrekler } from '../docs/motor/grafik.js';
import { kosulluUygula, miniGrafik } from '../docs/motor/kosullu.js';
import { makroCalistir, basDosyasi, r1c1denA1 } from '../docs/motor/vba.js';
import { panoKpi } from '../docs/motor/denetci.js';
import { pivot } from '../docs/motor/pivot.js';
import { Kitap } from '../docs/motor/kitap.js';
import { SAYFALAR } from '../docs/icerik/sayfalar.js';
import { DERSLER } from '../docs/icerik/dersler.js';

const kitap = () => { const k = new Kitap({ bugun: 45900 }); for (const [ad, t] of Object.entries(SAYFALAR)) if (t.basliklar) k.tablo(ad, t.basliklar, t.satirlar); k.hesapla(); k.stiller = new Map(); return k; };
// Tarayıcı SVG'yi DOMParser ile XML olarak ayrıştırır: tek bir çift öznitelik bütün grafiği "parsererror" yapar.
function xmlDenetle(svg) {
  for (const m of svg.matchAll(/<([a-zA-Z]+)\b([^>]*?)\/?>/g)) {
    const ad = [...m[2].matchAll(/\s([a-zA-Z:-]+)=/g)].map(x => x[1]);
    assert.equal(new Set(ad).size, ad.length, 'çift öznitelik: ' + m[0].slice(0, 120));
  }
  assert.ok(!/<[^>]*<|&(?!amp;|lt;|gt;|quot;|#)/.test(svg.replace(/<title>[^<]*<\/title>/g, '')), 'kaçışlanmamış karakter');
  const ac = (svg.match(/<[a-zA-Z]+\b[^>]*>/g) || []).filter(t => !t.endsWith('/>')).length, kapa = (svg.match(/<\/[a-zA-Z]+>/g) || []).length;
  assert.equal(ac, kapa, 'açılan ve kapanan etiket sayısı');
}

test('her grafik türü, sınıf ve bağımsız kipte geçerli SVG üretir', () => {
  const veriler = [
    pivotVerisi(pivot(SAYFALAR['Satışlar'], { satir: 'Kategori', sutun: 'Kanal', degerler: [{ alan: 'Adet', ozet: 'toplam' }], filtreler: [], grupla: {}, goster: 'deger' })),
    pivotVerisi(pivot(SAYFALAR['Bütçe'], { satir: 'Ay', sutun: null, degerler: [{ alan: 'Hedef', ozet: 'toplam' }, { alan: 'Gerçekleşen', ozet: 'toplam' }], filtreler: [], grupla: {}, goster: 'deger' })),
    { kategoriler: ['A & B', '<x>', 'C'], seriler: [{ ad: 'S"1', degerler: [3, -1, 4] }, { ad: 'S2', degerler: [1, 5, null] }] },
  ];
  let n = 0;
  for (const v of veriler) for (const tur of Object.keys(TURLER)) for (const bagimsiz of [false, true]) for (const ek of [{}, { yigin: 'yigin', veriEtiketi: true, egilim: true, ikincilEksen: true, baslik: 'Başlık & <özel>' }]) {
    let svg; try { svg = grafikCiz(v, { tur, genislik: 380, yukseklik: 240, bagimsiz, ...ek }); } catch (e) { continue; } // veri o türe uymuyorsa açık hata verir
    xmlDenetle(svg); n++;
  }
  assert.ok(n > 150, 'yeterince grafik çizilmedi: ' + n);
});

test('aralık verisi: tarih sütunu seri olmaz, kategori olur', () => {
  const k = kitap();
  const v = aralikVerisi(k.degerler('Bütçe', { r1: 1, c1: 2, r2: 7, c2: 4 }), { bicimler: SAYFALAR['Bütçe'].bicim.slice(1, 4) });
  assert.equal(v.seriler.length, 2); assert.equal(v.kategoriler[0], 'Ocak 2024');
});
test('histogram kovası ve çeyrekler', () => {
  const k = kovala([1, 2, 2, 3, 3, 3, 4, 4, 5, 10]); assert.ok(k.length >= 2); assert.equal(k.reduce((t, x) => t + x.sayi, 0), 10);
  const c = ceyrekler([1, 2, 3, 4, 5, 6, 7, 8]); assert.equal(c.q2, 4.5); assert.equal(c.q1, 2.25);
});
test('koşullu biçim: formülle kural her satırda kendi satırına bakar', () => {
  const g = kosulluUygula(kitap(), 'Bütçe', [{ tur: 'formul', alan: 'A2:D43', formul: '=$D2<$C2*0,9', stil: 'kirmizi' }]);
  assert.equal(g.size, 8 * 4);
  const yanlis = kosulluUygula(kitap(), 'Bütçe', [{ tur: 'formul', alan: 'A2:D43', formul: '=D2<C2*0,9', stil: 'kirmizi' }]);
  assert.notEqual(yanlis.size, g.size, '$ işaretsiz kural farklı hücreleri boyamalı');
  const ilk = kosulluUygula(kitap(), 'Ürünler', [{ tur: 'ilkN', alan: 'F2:F41', n: 5, stil: 'yesil' }]); assert.equal(ilk.size, 5);
  const sv = miniGrafik(kitap(), 'Bütçe', { hucre: 'E2', alan: 'C2:C7', tur: 'cizgi' }); xmlDenetle(sv);
});
test('pano KPI dilimleyiciyle süzülür', () => {
  const t = SAYFALAR['Satışlar'];
  const tum = panoKpi(t, { alan: 'Sipariş No', ozet: 'say' }), web = panoKpi(t, { alan: 'Sipariş No', ozet: 'say' }, [{ alan: 'Kanal', degerler: ['Web'] }]);
  assert.equal(tum, 240); assert.ok(web > 0 && web < tum);
  assert.equal(web, t.satirlar.filter(r => r[4] === 'Web').length);
});
test('ders örneklerindeki makrolar hatasız çalışır', () => {
  let n = 0;
  for (const d of DERSLER) if (d.ornek?.tur === 'makro') { const r = makroCalistir(d.ornek.kod, kitap(), { sayfa: d.ornek.sayfa }); assert.ok(r.tamam, d.id + ': ' + r.hata?.mesaj); n++; }
  assert.ok(n >= 6);
});
test('kaydedici R1C1 ve .bas kod sayfası', () => {
  assert.equal(r1c1denA1('=RC[-4]*RC[-3]*(1-RC[-2])', 2, 12), '=H2*I2*(1-J2)');
  const { bayt, bozuk } = basDosyasi('Sub Ş()\n    MsgBox "ığüşöç"\nEnd Sub\n');
  assert.equal(bozuk, 0); assert.ok(bayt.includes(0xFD) && bayt.includes(0xF0) && bayt.includes(0xDE));
});
