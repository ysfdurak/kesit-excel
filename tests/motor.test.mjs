import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Kitap, goster } from '../docs/motor/kitap.js';
import { cevir, kaydir, ayristir, hataMi, SINIR } from '../docs/motor/formul.js';
import { ISLEVLER } from '../docs/motor/islevler.js';

const V = JSON.parse(readFileSync(new URL('./vakalar.json', import.meta.url)));
function kitap() { const k = new Kitap({ bugun: 45900 }); k.tablo('Veri', V.veri.basliklar, V.veri.satirlar); return k; }
function hesap(k, f, adr = 'J1') { k.yaz('Veri', adr, f); k.hesapla(); const p = adr.match(/^([A-Z]+)(\d+)$/); return k.hucre('Veri', Number(p[2]), p[1].charCodeAt(0) - 64); }

test('Türkçe ve İngilizce yazım aynı sonucu verir (tüm vakalar)', () => {
  const k = kitap();
  for (const f of [...V.lo, ...V.elle.map(x => x[0])]) {
    const tr = cevir(f, 'tr', ISLEVLER);
    const a = hesap(k, f), b = hesap(k, tr);
    if (hataMi(a)) assert.equal(b.kod, a.kod, f + ' ⇄ ' + tr);
    else assert.deepEqual(b, a, f + ' ⇄ ' + tr);
    assert.equal(cevir(tr, 'en', ISLEVLER), f, 'geri çeviri: ' + tr);
  }
});

test('kaydir göreli başvuruyu kaydırır, mutlak olanı tutar', () => {
  assert.equal(kaydir('=C2*$D$1+TOPLA(A$1:A2)+Sayfa2!B3', 3, 0), '=C5*$D$1+TOPLA(A$1:A5)+Sayfa2!B6');
  assert.equal(kaydir('=B2+$B2+B$2', 0, 2), '=D2+$B2+D$2');
  assert.equal(kaydir('=A1', -1, 0), '=#BAŞV!');
  assert.equal(kaydir('="A1"&A1', 1, 0), '="A1"&A2', 'dizgi içi dokunulmaz');
  assert.equal(kaydir('=TOPLA(C:C)', 5, 0), '=TOPLA(C:C)', 'tam sütun satırla kaymaz');
});

test('doldur aşağı doldurmayı taklit eder', () => {
  const k = kitap();
  k.doldur('Veri', 'G2', '=C2*D2', 8);
  k.hesapla();
  assert.equal(k.icerik('Veri', 5, 7), '=C5*D5');
  assert.equal(k.hucre('Veri', 2, 7), 3897);
  assert.equal(k.hucre('Veri', 9, 7), 0, 'boş adet 0 sayılır');
});

test('çeviri kullanıcının düzenini korur', () => {
  assert.equal(cevir('=EĞER( A1 > 1,5 ; "a;b" ; YANLIŞ )', 'en', ISLEVLER), '=IF( A1 > 1.5 , "a;b" , FALSE )');
  assert.equal(cevir('=topla(a1:a3)', 'en', ISLEVLER), '=SUM(a1:a3)');
  assert.equal(cevir('=SUM(1,2)', 'en', ISLEVLER), '=SUM(1,2)', 'zaten hedef yazımda');
});

test('taşma: boş alana yayılır, engel varsa #TAŞMA!', () => {
  const k = kitap();
  k.yaz('Veri', 'L1', '=SIRALA(BENZERSİZ(B2:B9))'); k.hesapla();
  assert.deepEqual(k.degerler('Veri', 'L1:L3').map(r => r[0]), ['Elektronik', 'Kirtasiye', 'Moda']);
  assert.equal(k.tasmaMi('Veri', 2, 12), true);
  k.yaz('Veri', 'L3', 'engel'); k.hesapla();
  assert.equal(goster(k.hucre('Veri', 1, 12)), '#TAŞMA!');
  k.yaz('Veri', 'L3', null); k.yaz('Veri', 'M1', '=TOPLA(L1:L3)&"|"&BAĞ_DEĞ_DOLU_SAY(L1:L5)'); k.hesapla();
  assert.equal(k.hucre('Veri', 1, 13), '0|3', 'taşan hücreler okunabilir');
});

test('döngüsel başvuru ve bozuk formül çökertmez', () => {
  const k = kitap();
  k.yaz('Veri', 'L1', '=L2+1'); k.yaz('Veri', 'L2', '=L1+1'); k.hesapla();
  assert.equal(goster(k.hucre('Veri', 1, 12)), '#DÖNGÜ');
  k.yaz('Veri', 'L3', '=TOPLA(1;2'); k.hesapla();
  assert.equal(goster(k.hucre('Veri', 3, 12)), '#FORMÜL');
  assert.match(k.formulHatasi('Veri', 3, 12), /parantez/);
  for (const f of ['=1+', '=TOPLA(1;;', '=A1:', '=)', '="ab', '=1,2,3;4', '=BİLİNMEYEN(1)', '={1,2;3}']) {
    k.yaz('Veri', 'L4', f); k.hesapla();
    const v = k.hucre('Veri', 4, 12);
    assert.ok(hataMi(v), f + ' hata vermeli');
  }
});

test('sınırlar: uzun formül, derin iç içe, büyük dizi', () => {
  assert.throws(() => ayristir('=' + '1+'.repeat(SINIR.uzunluk) + '1', ISLEVLER));
  assert.throws(() => ayristir('=' + 'ABS('.repeat(70) + '1' + ')'.repeat(70), ISLEVLER), /64/);
  const k = kitap();
  assert.equal(goster(hesap(k, '=TOPLA(SIRALI(1000;1000))')), '#SAYI!');
});

test('Türkçe karakter ve büyük/küçük harf', () => {
  const k = kitap();
  assert.equal(hesap(k, '=BÜYÜKHARF("istanbul ılgaz")'), 'İSTANBUL ILGAZ');
  assert.equal(hesap(k, '=KÜÇÜKHARF("İZMİR IŞIK")'), 'izmir ışık');
  assert.equal(hesap(k, '=YAZIM.DÜZENİ("ışık ilgaz")'), 'Işık İlgaz');
  assert.equal(hesap(k, '=EĞERSAY(B2:B9;"moda")'), 3, 'ölçüt harf duyarsız');
  assert.equal(hesap(k, '=topla(c2:c3)'), 4798, 'küçük harfle yazılan işlev');
});

test('değer girişi Türkçe biçimi tanır', () => {
  const k = new Kitap();
  k.yazGiris('S', 'A1', '1.234,5'); k.yazGiris('S', 'A2', '15.03.2025'); k.yazGiris('S', 'A3', 'doğru'); k.yazGiris('S', 'A4', '12%');
  assert.deepEqual([1, 2, 3, 4].map(r => k.hucre('S', r, 1)), [1234.5, 45731, true, 0.12]);
});

test('dizi sabiti: Türkçe bölge yazımı (\\ sütun, virgüllü ondalık) da tanınır', () => {
  const k = kitap();
  assert.equal(hesap(k, '=SÜTUNSAY({1\\2\\3})'), 3);
  assert.equal(hesap(k, '=TOPLA({1,5\\2;3\\4})'), 10.5);
  assert.equal(hesap(k, '=SÜTUNSAY({1,2,3})'), 3, 'Kesit yazımı bozulmadı');
  assert.equal(hesap(k, '=SATIRSAY({"a\\b";"c"})'), 2, 'tırnak içindeki \\ ayırıcı sayılmaz');
});

test('Türkçe Excel adları (gerçek Excel LTSC TR ile karşılaştırıldı, 27.11.2026)', () => {
  const k = kitap();
  assert.ok(Math.abs(hesap(k, '=Pİ()') - Math.PI) < 1e-12, 'Pİ noktalı İ ile');
  assert.equal(cevir('=PI()', 'tr', ISLEVLER), '=Pİ()');
  assert.equal(cevir('=RANK(1,A1:A3)', 'tr', ISLEVLER), '=RANK(1;A1:A3)', 'RANK Türkçede de RANK');
  for (const yok of ['=SIRA(1;A1:A3)', '=SEÇ(1;2;3)', '=MAKEĞER(A1:A3;A1:A3;1)']) assert.equal(hesap(k, yok).kod, '#NAME?', yok + ' Excel\'de #AD?');
  assert.equal(goster(hesap(k, '=1/0')), '#SAYI/0!');
  assert.equal(hesap(k, '=ESAYIYSA(#SAYI/0!)'), false);
  assert.equal(cevir('=TRIMMEAN(A1:A5,0.2)', 'tr', ISLEVLER), '=KIRPORTALAMA(A1:A5;0,2)');
});

test('Excel 365 Türkçe adları (Türkçe web Excel, 27.11.2026)', () => {
  assert.equal(cevir('=REGEXTEST(A1,"a")', 'tr', ISLEVLER), '=NORMİFADESINA(A1;"a")');
  assert.equal(cevir('=MAKEARRAY(2,2,LAMBDA(r,c,r))', 'tr', ISLEVLER), '=DİZİOLUŞTUR(2;2;LAMBDA(r;c;r))');
  assert.equal(cevir('=TRIMRANGE(A1:A9)', 'tr', ISLEVLER), '=KIRPARALIĞI(A1:A9)');
  assert.equal(cevir('=PERCENTOF(1,4)', 'tr', ISLEVLER), '=PERCENTOF(1;4)', 'Türkçede de İngilizce adla');
  assert.equal(cevir('=WRAPCOLS(A1:A4,2)', 'tr', ISLEVLER), '=SÜTUNSAR(A1:A4;2)', 'SÜTUNKAYDIR değil');
});

test('METNEÇEVİR sayı kodları: sıfır doldurma, Türkçe binlik, ölçekleme, renk yok sayılır', async () => {
  const { bicimle } = await import('../docs/motor/tarih.js');
  const v = [[176, '00000', '00176'], [1234567, '#.##0', '1.234.567'], [1234567, '#.##0.', '1.235'], [2450000, '#.##0,0.." Mn"', '2,5 Mn'],
    [1500, '#,##0', '1.500'], [1234.5, '#,##0.00', '1.234,50'], [3.14159, '0.000', '3,142'], [-1234, '#.##0;[Kırmızı]-#.##0', '-1.234'], [0.5, '#,00', ',50']];
  for (const [x, k, b] of v) assert.equal(bicimle(x, k), b, k);
});

test('özel biçim: basamak arasına metin (telefon, vergi no)', async () => {
  const { ozelBicim } = await import('../docs/motor/bicim.js');
  assert.equal(ozelBicim(5321234567, '0 (000) 000 00 00').metin, '0 (532) 123 45 67');
  assert.equal(ozelBicim(1234567890, '000 000 00 00').metin, '123 456 78 90');
  assert.equal(ozelBicim(42, '"No: "000').metin, 'No: 042');
});
