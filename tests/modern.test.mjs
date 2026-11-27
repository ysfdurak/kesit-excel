// 0.4.0 motor eklemeleri: LAMBDA ailesi, GRUPLAÖLÇÜT/ÖZETÖLÇÜT, dizi biçimlendirme, regresyon, 3B başvuru,
// Gelişmiş Filtre ve yeni grafik türleri.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Kitap } from '../docs/motor/kitap.js';
import { gelismisFiltre } from '../docs/motor/veriaraclari.js';
import { grafikCiz, aralikVerisi, TURLER, grafikDenetle } from '../docs/motor/grafik.js';
import { kitapKur } from '../docs/motor/denetci.js';
import { SAYFALAR } from '../docs/icerik/sayfalar.js';

// Formülü A1'e yazıp taşan sonucu satır satır okur
function tasan(f, k = new Kitap(), sayfa = 'S') {
  if (!k.sayfaBul(sayfa)) k.sayfa(sayfa);
  k.yaz(sayfa, { r: 1, c: 1 }, f);
  const out = [];
  for (let r = 1; r <= 12; r++) { const s = []; for (let c = 1; c <= 6; c++) { const v = k.hucre(sayfa, r, c); s.push(v == null ? null : v.kod ?? (typeof v === 'number' ? Math.round(v * 1e9) / 1e9 : v)); } while (s.length && s[s.length - 1] == null) s.pop(); if (s.length) out.push(s); }
  return out;
}

test('LAMBDA: çağrı, ad, LET içinde, eta, parametre sayısı, hücrede #HESAP!', () => {
  assert.deepEqual(tasan('=LAMBDA(x;y;x*y)(6;7)'), [[42]]);
  assert.deepEqual(tasan('=LET(kare;LAMBDA(x;x*x);kare(9))'), [[81]]);
  assert.deepEqual(tasan('=LAMBDA(x;x)'), [['#CALC!']], 'çağrılmayan LAMBDA');
  assert.deepEqual(tasan('=LAMBDA(x;y;x+y)(1)'), [['#VALUE!']], 'eksik bağımsız değişken');
  const k = new Kitap(); k.sayfa('S'); k.adTanimla('KDVLİ', '=LAMBDA(tutar;tutar*1,2)');
  assert.deepEqual(tasan('=KDVLİ(100)', k), [[120]]);
  assert.deepEqual(tasan('=TOPLA(KDVLİ({10;20}))', k), [[36]], 'LAMBDA dizi alır');
  // Kapanış: LET değişkeni LAMBDA içinde görülür
  assert.deepEqual(tasan('=LET(oran;0,5;f;LAMBDA(x;x*oran);f(10))'), [[5]]);
});

test('MAP, BYROW, BYCOL, SCAN, REDUCE, MAKEARRAY', () => {
  assert.deepEqual(tasan('=MAP({1;2;3};{10;20;30};LAMBDA(a;b;a+b))'), [[11], [22], [33]]);
  assert.deepEqual(tasan('=BYROW({1,2;3,4};TOPLA)'), [[3], [7]], 'eta yazımı');
  assert.deepEqual(tasan('=BYCOL({1,2;3,4};LAMBDA(c;MAK(c)))'), [[3, 4]]);
  assert.deepEqual(tasan('=BYROW({1,2;3,4};LAMBDA(s;s*2))'), [['#CALC!'], ['#CALC!']], 'satır başına dizi döndürmek');
  assert.deepEqual(tasan('=SCAN(0;{1;2;3;4};LAMBDA(t;x;t+x))'), [[1], [3], [6], [10]]);
  assert.deepEqual(tasan('=SCAN(;{"a";"b"};LAMBDA(t;x;t&x))'), [['a'], ['ab']], 'başlangıç boş: metin birikimi');
  assert.deepEqual(tasan('=REDUCE(1;{1;2;3;4};LAMBDA(t;x;t*x))'), [[24]]);
  assert.deepEqual(tasan('=MAKEARRAY(2;3;LAMBDA(r;c;r*10+c))'), [[11, 12, 13], [21, 22, 23]]);
});

test('GRUPLAÖLÇÜT ve ÖZETÖLÇÜT: başlık, toplam, sıralama, ara toplam, filtre', () => {
  const k = new Kitap(); k.tablo('T', ['Bölge', 'Kanal', 'Adet'], [['B', 'Web', 5], ['A', 'Web', 2], ['B', 'Mağaza', 1], ['A', 'Mağaza', 4], ['C', 'Web', 3]]);
  k.sayfa('S');
  assert.deepEqual(tasan('=GRUPLAÖLÇÜT(T!A1:A6;T!C1:C6;TOPLA)', k), [['Bölge', 'Adet'], ['A', 6], ['B', 6], ['C', 3], ['Toplam', 15]], 'başlık kendiliğinden');
  assert.deepEqual(tasan('=GRUPLAÖLÇÜT(T!A2:A6;T!C2:C6;TOPLA;0;0;-2)', k), [['B', 6], ['A', 6], ['C', 3]], 'değere göre azalan, toplamsız');
  assert.deepEqual(tasan('=GRUPLAÖLÇÜT(T!A2:A6;T!C2:C6;TOPLA;0;1;1;T!B2:B6="Web")', k), [['A', 2], ['B', 5], ['C', 3], ['Toplam', 10]], 'filtre');
  assert.deepEqual(tasan('=GRUPLAÖLÇÜT(T!A2:B6;T!C2:C6;TOPLA;0;2)', k), [['A', 'Mağaza', 4], ['A', 'Web', 2], ['A', '', 6], ['B', 'Mağaza', 1], ['B', 'Web', 5], ['B', '', 6], ['C', 'Web', 3], ['C', '', 3], ['Toplam', '', 15]], 'ara toplam');
  assert.deepEqual(tasan('=ÖZETÖLÇÜT(T!A2:A6;T!B2:B6;T!C2:C6;TOPLA)', k), [['', 'Mağaza', 'Web', 'Toplam'], ['A', 4, 2, 6], ['B', 1, 5, 6], ['C', '', 3, 3], ['Toplam', 5, 10, 15]]);
});

test('Dizi biçimlendirme: SÜTUNA, SATIRA, SATIRSAR, SÜTUNSAR, GENİŞLET, YOKSAY', () => {
  assert.deepEqual(tasan('=SÜTUNA({1,2;3,4})'), [[1], [2], [3], [4]]);
  assert.deepEqual(tasan('=SÜTUNA({1,2;3,4};0;DOĞRU)'), [[1], [3], [2], [4]], 'sütun sütun');
  assert.deepEqual(tasan('=SATIRA({1;2;3})'), [[1, 2, 3]]);
  assert.deepEqual(tasan('=SATIRSAR({1;2;3;4;5};2;0)'), [[1, 2], [3, 4], [5, 0]]);
  assert.deepEqual(tasan('=SÜTUNSAR({1;2;3};2)'), [[1, 3], [2, '#N/A']]);
  assert.deepEqual(tasan('=GENİŞLET({1,2};2;3;"-")'), [[1, 2, '-'], ['-', '-', '-']]);
  assert.deepEqual(tasan('=SÜTUNA(EĞER({1,0;1,1}=1;{"a";"b"};YOKSAY());2)'), [['a'], ['b'], ['b']], 'formülle özetlemeyi kaldırma');
});

test('Regresyon ve sıklık LibreOffice/Excel değerleriyle aynı', () => {
  const y = '{2;4;7;8;11}', x = '{1;2;3;4;5}';
  assert.equal(tasan(`=EĞİM(${y};${x})`)[0][0], 2.2);
  assert.equal(tasan(`=KESMENOKTASI(${y};${x})`)[0][0], -0.2);
  assert.equal(tasan(`=TAHMİN.DOĞRUSAL(6;${y};${x})`)[0][0], 13);
  assert.equal(Math.round(tasan(`=KORELASYON(${y};${x})`)[0][0] * 1e6) / 1e6, 0.991837);
  assert.deepEqual(tasan(`=EĞİLİM(${y};${x};{6;7})`), [[13], [15.2]]);
  assert.deepEqual(tasan('=SIKLIK({1;5;7;9;12;5};{5;10})'), [[3], [2], [1]]);
  assert.deepEqual(tasan('=SIKLIK({1;5;7};{10;5})'), [[1], [2], [0]], 'sırasız kovalar kendi sırasında döner');
  assert.equal(tasan('=TOPLAMA(9;6;{1;#YOK;3})')[0][0], 4);
  assert.equal(tasan('=TOPLAMA(9;0;{1;#YOK;3})')[0][0], '#N/A', 'seçenek 0 hatayı atlamaz');
  assert.equal(tasan('=TOPLAMA(14;6;{1;#YOK;3;9};2)')[0][0], 3, 'BÜYÜK');
  assert.equal(tasan('=STDSAPMA.P({2;4;4;4;5;5;7;9})')[0][0], 2);
});

test('3B başvuru: sayfa aralığı, sıra, tırnaklı yazım, kaydırma', () => {
  const k = new Kitap(); for (const [s, v] of [['Ocak', 1], ['Şubat', 2], ['Mart', 4]]) { k.sayfa(s); k.yaz(s, { r: 2, c: 2 }, v); } k.sayfa('Özet');
  assert.deepEqual(tasan('=TOPLA(Ocak:Mart!B2)', k, 'Özet'), [[7]]);
  assert.deepEqual(tasan("=MAK('Şubat:Mart'!B2)", k, 'Özet'), [[4]]);
  assert.deepEqual(tasan('=TOPLA(Ocak:Yok!B2)', k, 'Özet'), [['#REF!']]);
});

test('Gelişmiş Filtre: VE/YA DA, ile başlar, = tam eşleşme, boş satır, benzersiz, başlık denetimi', () => {
  const k = new Kitap(); k.tablo('V', ['Şehir', 'Kanal', 'Adet'], [['İstanbul', 'Web', 3], ['İstanbul Avrupa', 'Web', 1], ['Ankara', 'Mağaza', 2], ['İzmir', 'Web', 2], ['Ankara', 'Mağaza', 2]]);
  const yaz = h => { for (const [a, v] of Object.entries(h)) k.yaz('V', a, v); };
  yaz({ F1: 'Kanal', G1: 'Adet', F2: 'Web', G2: '>=2' });
  assert.deepEqual(gelismisFiltre(k, 'V', 'A1:C6', 'F1:G2').satirNo, [2, 5], 'VE');
  yaz({ I1: 'Şehir', I2: 'İstanbul' });
  assert.deepEqual(gelismisFiltre(k, 'V', 'A1:C6', 'I1:I2').satirNo, [2, 3], 'düz metin ile başlar');
  yaz({ I2: '="=İstanbul"' }); // Excel'de de böyle yazılır: =İstanbul tek başına bir formüldür
  assert.deepEqual(gelismisFiltre(k, 'V', 'A1:C6', 'I1:I2').satirNo, [2], '= tam eşleşme');
  yaz({ I2: 'İzmir', I3: 'Ankara' });
  assert.deepEqual(gelismisFiltre(k, 'V', 'A1:C6', 'I1:I3').satirNo, [4, 5, 6], 'YA DA');
  const bos = gelismisFiltre(k, 'V', 'A1:C6', 'I1:I4');
  assert.equal(bos.satirlar.length, 5); assert.equal(bos.bosSatir, true, 'boş ölçüt satırı her kaydı geçirir');
  assert.deepEqual(gelismisFiltre(k, 'V', 'A1:C6', '', { benzersiz: true }).satirNo, [2, 3, 4, 5], 'benzersiz');
  yaz({ K1: 'Sehir', K2: 'İzmir' });
  assert.throws(() => gelismisFiltre(k, 'V', 'A1:C6', 'K1:K2'), /listede yok/);
});

test('Yeni grafik türleri geçerli SVG üretir; vurgu, hedef çizgisi ve iki düzeyli kategori', () => {
  const v = (k, ...s) => ({ kategoriler: k, seriler: s.map(([ad, d]) => ({ ad, degerler: d })) });
  const veriler = {
    pareto: v(['a', 'b', 'c'], ['Adet', [5, 20, 10]]), kelebek: v(['x', 'y'], ['A', [1, 2]], ['B', [3, 1]]), halter: v(['x', 'y'], ['2024', [1, 2]], ['2025', [3, 1]]),
    gunes: { ...v(['E › T', 'E › K', 'G › M'], ['Adet', [3, 2, 4]]), ustKategori: ['E', 'E', 'G'] }, madde: v(['İzmir'], ['Ger', [80]], ['Hedef', [90]], ['Kötü', [50]]),
    ibre: v(['Doluluk'], ['Ger', [78]], ['Hedef', [85]]), ilerleme: v(['a', 'b', 'c', 'd', 'e'], ['Ger', [45, 80, 120, 10, 60]], ['Hedef', [100, 100, 100, 100, 100]]), gantt: v(['t1', 't2'], ['Başlangıç', [45663, 45670]], ['Süre', [5, 8]]),
  };
  for (const [tur, veri] of Object.entries(veriler)) {
    assert.ok(TURLER[tur], tur);
    for (const bag of [true, false]) {
      const svg = grafikCiz(veri, { tur, baslik: 'B', bagimsiz: bag });
      assert.ok(svg.startsWith('<svg') && svg.endsWith('</svg>'), tur);
      assert.ok(!/NaN|undefined/.test(svg), tur + ': NaN ya da undefined');
      assert.ok(!/<[a-z]+\b[^>]*\sclass="[^"]*"[^>]*\sclass="/.test(svg), tur + ': çift class');
    }
  }
  // %100'ü geçen halka boş çizilmemeli (yayın başı ve sonu aynı noktaya düşüyordu)
  assert.match(grafikCiz(v(['a'], ['G', [120]], ['H', [100]]), { tur: 'ilerleme', bagimsiz: true }), /fill="#008a17"/);
  const sv = grafikCiz(v(['a', 'b', 'c'], ['Adet', [5, 20, 10]]), { tur: 'sutun', vurgu: 'enBuyuk', hedefCizgisi: 15, bagimsiz: true });
  assert.equal((sv.match(/fill-opacity="0.28"/g) || []).length, 2, 'vurgu: iki soluk çubuk');
  assert.match(sv, /Hedef 15/);
  const iki = aralikVerisi([['Kategori', 'Ürün', 'Adet'], ['E', 'Telefon', 3], ['E', 'Kulaklık', 2], ['G', 'Mont', 4]]);
  assert.deepEqual(iki.ustKategori, ['E', 'E', 'G']); assert.equal(iki.kategoriler[0], 'E › Telefon'); assert.equal(iki.seriler.length, 1);
  assert.equal(grafikDenetle({ vurgu: 'enBuyuk' }, sv && v(['a'], ['A', [1]]), { tur: 'sutun' }).tamam, false, 'vurgu kuralı');
  assert.equal(grafikDenetle({ hedefCizgisi: 6000 }, v(['a'], ['A', [1]]), { tur: 'cizgi', hedefCizgisi: 6000 }).tamam, true);
});

test('Model sayfaları: Mart sırası farklı, 3B toplam ve etiketli toplam ayrışır', () => {
  const k = kitapKur({ sayfa: 'Çeyrek' }, SAYFALAR);
  const toplam = k.formulDegerlendir('Çeyrek', 10, 2, '=TOPLA(Ocak:Mart!B2:B8)');
  assert.equal(toplam, [182, 240, 310, 75, 128, 96, 140, 165, 226, 284, 140, 117, 104, 133, 201, 258, 335, 88, 131, 112, 151].reduce((a, b) => a + b, 0));
  const konum = k.formulDegerlendir('Çeyrek', 2, 2, '=TOPLA(Ocak:Mart!B2)'), etiket = k.formulDegerlendir('Çeyrek', 2, 2, '=ETOPLA(Ocak!A:A;A2;Ocak!B:B)+ETOPLA(Şubat!A:A;A2;Şubat!B:B)+ETOPLA(Mart!A:A;A2;Mart!B:B)');
  assert.equal(etiket, 182 + 165 + 201); assert.notEqual(konum, etiket, '3B başvuru Mart\'ta yanlış satırı toplar');
});
