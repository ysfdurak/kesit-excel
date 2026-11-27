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

test('pivot gösterimleri: fark, % fark, değişen toplam, sıra; sıralama ve İlk N (Genel Toplam görünenleri toplar)', () => {
  const t = SAYFALAR['Satışlar'], ay = { satir: 'Tarih', grupla: { Tarih: 'ay' }, degerler: [{ alan: 'Adet', ozet: 'toplam' }] };
  const deger = pivot(t, ay).satirlar.slice(0, -1).map(r => r[1]);
  const fark = pivot(t, { ...ay, goster: 'fark' }).satirlar;
  assert.equal(fark[0][1], null, 'ilk ayın öncesi yok');
  assert.equal(fark[1][1], deger[1] - deger[0]);
  assert.equal(fark.at(-1)[1], null, 'Genel Toplam boş');
  assert.ok(Math.abs(pivot(t, { ...ay, goster: 'farkYuzde' }).satirlar[2][1] - (deger[2] / deger[1] - 1)) < 1e-12);
  const bir = pivot(t, { ...ay, goster: 'birikimli' }).satirlar;
  assert.equal(bir[deger.length - 1][1], deger.reduce((a, b) => a + b, 0), 'son ay = toplam');
  const sira = pivot(t, { satir: 'Kategori', degerler: [{ alan: 'Adet', ozet: 'toplam' }], goster: 'sira' }).satirlar.slice(0, -1).map(r => r[1]);
  assert.deepEqual([...sira].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7]);
  const ilk = pivot(t, { satir: 'Ürün', degerler: [{ alan: 'Adet', ozet: 'toplam' }], sirala: { gore: 'deger', yon: 'azalan' }, ilk: { n: 5 } });
  const vs = ilk.satirlar.slice(0, -1).map(r => r[1]);
  assert.ok(vs.length >= 5 && vs.every((v, i) => !i || v <= vs[i - 1]), 'azalan sıralı, en az 5');
  assert.equal(ilk.satirlar.at(-1)[1], vs.reduce((a, b) => a + b, 0), 'Genel Toplam yalnız görünenler');
  assert.throws(() => pivot(t, { degerler: [{ alan: 'Adet' }], goster: 'fark' }), /satır alanı/);
});

test('grafik: iki uç vurgu, renk eşiği ve waffle', () => {
  const v = { kategoriler: ['a', 'b', 'c', 'd'], seriler: [{ ad: 'X', degerler: [5, 20, 10, 2] }] };
  const iki = grafikCiz(v, { tur: 'sutun', vurgu: 'ikiUc', bagimsiz: true });
  assert.equal((iki.match(/fill-opacity="0.28"/g) || []).length, 2, 'iki uç dışındaki iki çubuk soluk');
  const es = grafikCiz(v, { tur: 'sutun', esik: 10, bagimsiz: true });
  assert.equal((es.match(/fill="#008a17"/g) || []).length, 2, 'eşik ve üstü yeşil');
  assert.equal((es.match(/fill="#ec4647"/g) || []).length, 2, 'eşiğin altı kırmızı');
  const w = grafikCiz({ kategoriler: ['Oran'], seriler: [{ ad: 'O', degerler: [0.37] }] }, { tur: 'waffle', bagimsiz: true });
  assert.equal((w.match(/<rect x=/g) || []).length, 100);
  assert.equal((w.match(/fill-opacity="0.16"/g) || []).length, 63, '37 dolu, 63 boş kare');
});
