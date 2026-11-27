// Kitap tasarımı, senaryo ve ileri pivot motorları: tablo ve ad başvuruları, DOLAYLI/KAYDIR, özel biçim, doğrulama,
// formül denetimi, Hedef Ara, Veri Tablosu, Çözücü, hesaplanmış alan ve ÖZETVERİAL.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Kitap } from '../docs/motor/kitap.js';
import { kaydir } from '../docs/motor/formul.js';
import { ozelBicim } from '../docs/motor/bicim.js';
import { dogrula, gecersizler, etkileyenler, etkilenenler, formulAdimlari } from '../docs/motor/dogrulama.js';
import { hedefAra, veriTablosu, cozucu, senaryoOzeti } from '../docs/motor/senaryo.js';
import { pivot, ayrinti, pivotYerlestir } from '../docs/motor/pivot.js';
import { kitapKur } from '../docs/motor/denetci.js';
import { SAYFALAR } from '../docs/icerik/sayfalar.js';

const kucuk = () => { const k = new Kitap(); k.tablo('S', ['Ad', 'Adet', 'Birim Fiyat'], [['a', 2, 10], ['b', 3, 20], ['c', 5, 1]]); return k; };
const hesap = (k, f, s = 'S', adr = 'E2') => { k.yaz(s, adr, f); k.hesapla(); const m = adr.match(/^([A-Z]+)(\d+)$/); return k.hucre(s, Number(m[2]), [...m[1]].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0)); };

test('yapılandırılmış başvuru ve adlar', () => {
  const k = kucuk(); k.adTanimla('KDV', '=0,2'); k.adTanimla('Adetler', '=S!$B$2:$B$4');
  assert.equal(hesap(k, '=TOPLA(S[Adet])'), 10);
  assert.equal(hesap(k, '=[@Adet]*[@[Birim Fiyat]]', 'S', 'D3'), 60);
  assert.equal(hesap(k, '=S[@Adet]*KDV', 'S', 'E2'), 0.4);
  assert.equal(hesap(k, '=TOPLA(Adetler)'), 10);
  assert.equal(hesap(k, '=SATIRSAY(S)'), 3);
  assert.equal(hesap(k, '=S[[#Başlıklar];[Adet]]'), 'Adet');
  assert.equal(hesap(k, '=TOPLA(S[[Adet]:[Birim Fiyat]])'), 41);
  assert.equal(hesap(k, '=YOK_AD+1').kod, '#NAME?');
  // Doldurma yapılandırılmış başvuruyu değiştirmez
  assert.equal(kaydir('=[@Adet]*B2', 3, 0), '=[@Adet]*B5');
  assert.throws(() => k.adTanimla('KDV 1', '=1')); assert.throws(() => k.adTanimla('KDV1', '=1'));
});
test('DOLAYLI, KAYDIR, ADRES', () => {
  const k = kucuk();
  assert.equal(hesap(k, '=TOPLA(DOLAYLI("B2:B"&4))'), 10);
  assert.equal(hesap(k, '=DOLAYLI("S!C3")'), 20);
  assert.equal(hesap(k, '=TOPLA(KAYDIR(B1;1;0;2;1))'), 5);
  assert.equal(hesap(k, '=TOPLA(KAYDIR(B1;BAĞ_DEĞ_SAY(B:B)-1;0;2;1))'), 8);
  assert.equal(hesap(k, '=ADRES(2;3)'), '$C$2'); assert.equal(hesap(k, '=ADRES(2;3;4)'), 'C2');
  assert.equal(hesap(k, '=DOLAYLI("ZZZ")').kod, '#REF!');
});
test('özel sayı biçimi', () => {
  const v = [[1234.5, '#.##0,00 "₺"', '1.234,50 ₺'], [-1250, '+#.##0;[Kırmızı]-#.##0;"—"', '-1.250'], [0, '+#.##0;[Kırmızı]-#.##0;"—"', '—'], [2450000, '#.##0,0.." Mn"', '2,5 Mn'],
    [0.125, '0,0%', '12,5%'], [5, '00000', '00005'], [1500, '[>=1000]#.##0,0."B";0', '1,5B'], ['Ali', '0;0;0;"Ad: "@', 'Ad: Ali'], [1234.5, '#,##0.00', '1,234.50'], [45658, 'gg.aa.yyyy', '01.01.2025']];
  for (const [d, kod, b] of v) assert.equal(ozelBicim(d, kod).metin, b, kod);
  assert.equal(ozelBicim(-5, '#.##0;[Kırmızı]-#.##0').renk, '#c00000');
});
test('veri doğrulama: liste, sayı, özel, bağımlı liste', () => {
  const k = kitapKur({ sayfa: 'Kayıt', adlar: { Elektronik: '=Listeler!$B$2:$B$5', Giyim: '=Listeler!$C$2:$C$5', Kitap: '=Listeler!$D$2:$D$4', Spor: '=Listeler!$E$2:$E$5' } }, SAYFALAR); k.hesapla();
  assert.deepEqual([...gecersizler(k, 'Kayıt', [{ tur: 'liste', alan: 'C2:C31', kaynak: 'Web;Mobil;Mağaza' }])].sort(), ['C13', 'C5']);
  assert.equal(gecersizler(k, 'Kayıt', [{ tur: 'tamSayi', alan: 'E2:E31', op: 'arasinda', d1: 1, d2: 50 }]).size, 3);
  assert.equal(dogrula(k, 'Kayıt', 5, 1, 9001, { tur: 'ozel', alan: 'A2:A31', formul: '=EĞERSAY($A$2:$A$31;A2)=1' }), false);
  assert.equal(dogrula(k, 'Kayıt', 5, 1, 9999, { tur: 'ozel', alan: 'A2:A31', formul: '=EĞERSAY($A$2:$A$31;A2)=1' }), true);
  assert.equal(gecersizler(k, 'Kayıt', [{ tur: 'liste', alan: 'G2:G31', kaynak: '=DOLAYLI(D2)' }]).size, 2);
  assert.equal(dogrula(k, 'Kayıt', 2, 2, 45901, { tur: 'tarih', alan: 'B2:B31', op: '<=', d1: '=BUGÜN()' }), false);
});
test('formül denetimi: etkileyen, etkilenen, adım adım', () => {
  const k = kitapKur({ sayfa: 'Denetim' }, SAYFALAR); k.hesapla();
  assert.deepEqual(etkileyenler(k, 'Denetim', 4, 5).map(x => x.metin), ['B4:C4']);
  assert.ok(etkilenenler(k, 'Denetim', 4, 5).some(x => x.r === 7 && x.c === 5));
  const a = formulAdimlari(k, 'Denetim', 4, 5);
  assert.equal(a[0].metin, '=TOPLA(B4:C4)'); assert.equal(a[a.length - 1].metin, '=499000');
  const e = formulAdimlari(k, 'Denetim', 11, 4); assert.equal(e[e.length - 1].metin, '=#SAYI/0!');
});
test('Hedef Ara, Veri Tablosu, Senaryo', () => {
  const k = kitapKur({ sayfa: 'Fiyat' }, SAYFALAR); k.hesapla();
  const r = hedefAra(k, 'Fiyat', { hedefHucre: 'B10', hedefDeger: 0, degisenHucre: 'B5' });
  assert.ok(r.tamam); assert.ok(Math.abs(k.hucre('Fiyat', 10, 2)) < 1e-6); assert.ok(Math.abs(r.deger - 395000 / 17) < 1e-6);
  assert.equal(hedefAra(k, 'Fiyat', { hedefHucre: 'B5', hedefDeger: 0, degisenHucre: 'B10' }).tamam, false);
  const kk = kitapKur({ sayfa: 'Kredi' }, SAYFALAR); kk.hesapla();
  const t = veriTablosu(kk, 'Kredi', { formulHucreler: ['B6'], satirGiris: 'B5', sutunGiris: 'B4', satirDegerleri: [12, 24], sutunDegerleri: [0.36] });
  assert.ok(Math.abs(t[0][1] - kk.hucre('Kredi', 6, 2)) < 1e-6);
  const o = senaryoOzeti(kk, 'Kredi', [{ ad: 'A', degerler: { B5: 12 } }], ['B6']); assert.ok(o[0].sonuclar.B6 > t[0][1]);
  assert.equal(kk.hucre('Kredi', 5, 2), 24, 'senaryo özeti modeli eski hâline döndürmeli');
});
test('Çözücü: doğrusal, tamsayı, olurlu değil, doğrusal değil', () => {
  const k = kitapKur({ sayfa: 'Vardiya' }, SAYFALAR); k.hesapla();
  const m = { amac: 'B8', yon: 'min', degiskenler: 'B4:H4', kisitlar: [{ sol: 'B5:H5', op: '>=', sag: 'B6:H6' }] };
  const lp = cozucu(k, 'Vardiya', m); assert.ok(lp.tamam); assert.ok(Math.abs(lp.amac - 67 / 3) < 1e-6, 'LP gevşetmesi 22,33');
  const ip = cozucu(kitapKur({ sayfa: 'Vardiya' }, SAYFALAR), 'Vardiya', { ...m, kisitlar: [...m.kisitlar, { sol: 'B4:H4', op: 'tamsayi' }] }); assert.equal(ip.amac, 23);
  const k2 = kitapKur({ sayfa: 'Üretim', hazirlik: { B15: '=B4*C4' } }, SAYFALAR); k2.hesapla();
  assert.equal(cozucu(k2, 'Üretim', { amac: 'B15', yon: 'maks', degiskenler: 'B4:D4', kisitlar: [{ sol: 'B4:D4', op: '<=', sag: 10 }] }).dogrusalDegil, true);
  assert.equal(cozucu(k2, 'Üretim', { amac: 'B14', yon: 'maks', degiskenler: 'B4:D4', kisitlar: [{ sol: 'B4', op: '>=', sag: 10 }, { sol: 'B4', op: '<=', sag: 5 }] }).tamam, false);
});
test('hesaplanmış alan, ayrıntı, ÖZETVERİAL', () => {
  const t = SAYFALAR['Bütçe'];
  const p = pivot(t, { satir: 'Kategori', degerler: [{ alan: 'Oran', ozet: 'toplam' }], hesaplananlar: [{ ad: 'Oran', formul: '=Gerçekleşen/Hedef' }], filtreler: [] });
  const e = t.satirlar.filter(r => r[0] === 'Elektronik'); assert.ok(Math.abs(p.satirlar[0][1] - e.reduce((s, r) => s + r[3], 0) / e.reduce((s, r) => s + r[2], 0)) < 1e-12);
  const s = SAYFALAR['Satışlar'];
  const pv = pivot(s, { satir: 'Şehir', sutun: 'Durum', degerler: [{ alan: 'Sipariş No', ozet: 'say' }], filtreler: [] });
  const i = pv.satirAnahtarlari.indexOf('Ankara'), j = pv.sutunlar.findIndex(x => x.b === 'İptal');
  assert.equal(ayrinti(s, pv, i, j).satirlar.length, pv.satirlar[i][j + 1]);
  const k = kitapKur({ sayfa: 'Satışlar' }, SAYFALAR);
  pivotYerlestir(k, 'Satışlar', 'N3', 'Satışlar', s, { satir: 'Kategori', sutun: 'Kanal', degerler: [{ alan: 'Adet', ozet: 'toplam' }], filtreler: [], grupla: {} });
  const bek = s.satirlar.filter(r => r[5] === 'Kitap' && r[4] === 'Web').reduce((x, r) => x + r[7], 0);
  assert.equal(hesap(k, '=ÖZETVERİAL("Adet";$N$3;"Kategori";"Kitap";"Kanal";"Web")', 'Satışlar', 'T3'), bek);
  assert.equal(hesap(k, '=ÖZETVERİAL("Adet";$N$3;"Kategori";"Yok")', 'Satışlar', 'T3').kod, '#REF!');
});
test('işlev rehberindeki her örnek motorda hatasız', async () => {
  const { ISLEV_BILGI } = await import('../docs/icerik/islev-bilgi.js');
  // Veritabanı işlevlerinin örnekleri ölçüt alanına bakar: N1:N2 (Kategori = Kitap) ve Q1:Q2 (Sipariş No = 176)
  const k = kitapKur({ sayfa: 'Satışlar', hazirlik: { N1: 'Kategori', N2: 'Kitap', Q1: 'Sipariş No', Q2: '=176' } }, SAYFALAR); k.hesapla();
  for (const b of ISLEV_BILGI) { if (b.en === 'GETPIVOTDATA') continue; const v = k.formulDegerlendir('Satışlar', 2, 20, b.ornek); assert.ok(!(v && v.kod), b.tr + ' ' + b.ornek + ' → ' + (v && v.kod)); }
});

test('pivot başlıkları Türkçe Excel gibi (gerçek Excel LTSC TR, 27.11.2026)', () => {
  const p = pivot(SAYFALAR['Satışlar'], { satir: 'Şehir', degerler: [{ alan: 'Adet', ozet: 'toplam' }, { alan: 'Birim Fiyat', ozet: 'ortalama' }, { alan: 'Birim Fiyat', ozet: 'en_buyuk' }, { alan: 'Birim Fiyat', ozet: 'en_kucuk' }], filtreler: [] });
  assert.deepEqual(p.basliklar.slice(1), ['Toplam Adet', 'Ortalama Birim Fiyat', 'Mak Birim Fiyat', 'Min Birim Fiyat']);
  assert.equal(p.satirlar.at(-1)[0], 'Genel Toplam');
  assert.ok(p.satirlar.some(r => r[0] === '(boş)'), 'boş şehir (boş) etiketiyle');
});
