// Ders içeriği doğrulaması: her alıştırmanın çözümü denetçiden geçer; elle yazılmış sonuç (sabit) gizli varyantta yakalanır.
import test from 'node:test';
import assert from 'node:assert/strict';
import { DERSLER, MODULLER } from '../docs/icerik/dersler.js';
import { SAYFALAR } from '../docs/icerik/sayfalar.js';
import { formulDenetle, pivotDenetle, sorguDenetle, makroDenetle, grafikAlistirmaDenetle, kosulluDenetle, panoDenetle, dogrulamaDenetle, bicimDenetle, hucreBulDenetle, sayiDenetle, hedefAraDenetle, veriTablosuDenetle, cozucuDenetle, adDenetle, kitapKur } from '../docs/motor/denetci.js';
import { Kitap } from '../docs/motor/kitap.js';
import { ayristir, hataMi } from '../docs/motor/formul.js';
import { ISLEVLER } from '../docs/motor/islevler.js';

test('modül ve ders yapısı', () => {
  const ids = new Set();
  for (const d of DERSLER) {
    assert.ok(!ids.has(d.id), 'yinelenen id ' + d.id); ids.add(d.id);
    assert.ok(MODULLER.find(m => m.id === d.modul), d.id + ' modülü yok');
    for (const k of ['baslik', 'ozet', 'hedefler', 'anlatim', 'alistirmalar', 'sikHata', 'mulakat']) assert.ok(d[k], d.id + ' ' + k + ' eksik');
    assert.ok(d.alistirmalar.length >= 1, d.id);
  }
});

for (const d of DERSLER) {
  test(`${d.id} ${d.baslik}`, () => {
    if (d.ornek && d.ornek.formul) {
      // Arayüzle aynı kitap: model sayfaları, adlar, yerleşik özet tablolar
      const k = kitapKur({ sayfa: d.ornek.sayfa, hazirlik: d.ornek.hazirlik, adlar: d.ornek.adlar, pivotlar: d.ornek.pivotlar }, SAYFALAR);
      for (const [a, f] of Object.entries(d.ornek.formuller || {})) k.yaz(d.ornek.sayfa, a, f);
      k.yaz(d.ornek.sayfa, d.ornek.hucre, d.ornek.formul); k.hesapla();
      const p = d.ornek.hucre.match(/^([A-Z]+)(\d+)$/); const c = [...p[1]].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
      const v = k.hucre(d.ornek.sayfa, Number(p[2]), c);
      assert.ok(!hataMi(v), `${d.id} örnek formül hata verdi: ${d.ornek.formul} → ${v && v.kod}`);
    }
    for (const a of d.alistirmalar) {
      const ad = `${d.id}/${a.id}`;
      if (a.tur === 'pivot') { const r = pivotDenetle(a, SAYFALAR, a.cozum); assert.ok(r.tamam, ad + ': ' + r.mesaj); continue; }
      if (a.tur === 'sorgu') { const r = sorguDenetle(a, SAYFALAR, a.cozum); assert.ok(r.tamam, ad + ': ' + r.mesaj); continue; }
      if (a.tur === 'secmeli') { assert.ok(Number.isInteger(a.dogru) && a.dogru >= 0 && a.dogru < a.secenekler.length, ad + ': doğru seçenek yok'); assert.ok(a.aciklama, ad + ': açıklama yok'); continue; }
      if (a.tur === 'grafik') {
        assert.ok(grafikAlistirmaDenetle(a, SAYFALAR, a.cozum).tamam, ad + ': çözüm geçmedi');
        // Başlangıç ayarı (soru) çözüm değildir: öğrenci hiçbir şey değiştirmeden geçememeli
        const b = grafikAlistirmaDenetle(a, SAYFALAR, { kaynak: a.kaynak, secenek: a.secenek || {} });
        assert.equal(b.tamam, false, ad + ': başlangıç ayarı denetimden geçiyor'); continue;
      }
      if (a.tur === 'pivotGrafik') {
        assert.ok(pivotDenetle({ ...a, cozum: a.cozum.yapi }, SAYFALAR, a.cozum.yapi).tamam, ad + ': özet tablo');
        assert.ok(grafikAlistirmaDenetle({ ...a, cozum: {} }, SAYFALAR, { kaynak: { pivot: a.cozum.yapi }, secenek: a.cozum.secenek }).tamam, ad + ': grafik'); continue;
      }
      if (a.tur === 'kosullu') {
        assert.ok(kosulluDenetle(a, SAYFALAR, a.cozum).tamam, ad + ': çözüm geçmedi');
        assert.equal(kosulluDenetle(a, SAYFALAR, []).tamam, false, ad); continue;
      }
      if (a.tur === 'pano') {
        assert.ok(panoDenetle(a, SAYFALAR, a.cozum).tamam, ad + ': ' + panoDenetle(a, SAYFALAR, a.cozum).mesaj);
        assert.equal(panoDenetle(a, SAYFALAR, a.baslangic).tamam, false, ad + ': boş pano geçiyor'); continue;
      }
      if (a.tur === 'dogrulama') {
        assert.ok(dogrulamaDenetle(a, SAYFALAR, a.cozum).tamam, ad + ': ' + dogrulamaDenetle(a, SAYFALAR, a.cozum).mesaj);
        assert.equal(dogrulamaDenetle(a, SAYFALAR, []).tamam, false, ad);
        // Kural gerçekten bir şey yakalamalı: ya mevcut veride geçersiz hücre var ya da bir deneme reddediliyor
        continue;
      }
      if (a.tur === 'bicim') { assert.ok(bicimDenetle(a, SAYFALAR, a.cozum).tamam, ad); assert.equal(bicimDenetle(a, SAYFALAR, 'Genel').tamam, false, ad + ': Genel biçim geçiyor'); continue; }
      if (a.tur === 'hucreBul') { assert.ok(hucreBulDenetle(a, a.dogru.join(',')).tamam, ad); assert.equal(hucreBulDenetle(a, 'A1').tamam, false, ad); continue; }
      if (a.tur === 'sayi') { const k = kitapKur(a, SAYFALAR); const v = k.formulDegerlendir(a.sayfa, 1, 1, a.cevapFormul); assert.ok(typeof v === 'number' && v > 0, ad + ': cevap formülü sayı vermiyor'); assert.ok(sayiDenetle(a, SAYFALAR, String(v)).tamam, ad); assert.equal(sayiDenetle(a, SAYFALAR, String(v + 1)).tamam, false, ad); continue; }
      if (a.tur === 'ad') { assert.ok(adDenetle(a, SAYFALAR, a.cozum).tamam, ad + ': ' + adDenetle(a, SAYFALAR, a.cozum).mesaj); assert.equal(adDenetle(a, SAYFALAR, { ad: a.cozum.ad, tanim: '=A1:A2' }).tamam, false, ad); assert.equal(adDenetle(a, SAYFALAR, { ad: 'KDV 1', tanim: a.cozum.tanim }).tamam, false, ad + ': boşluklu ad geçiyor'); continue; }
      if (a.tur === 'hedefAra') { const r = hedefAraDenetle(a, SAYFALAR, a.cozum); assert.ok(r.tamam, ad + ': ' + r.mesaj); assert.equal(hedefAraDenetle(a, SAYFALAR, { ...a.cozum, hedefHucre: a.cozum.degisenHucre, degisenHucre: a.cozum.hedefHucre }).tamam, false, ad); continue; }
      if (a.tur === 'veriTablosu') { assert.ok(veriTablosuDenetle(a, SAYFALAR, { satirGiris: a.cozum.satirGiris, sutunGiris: a.cozum.sutunGiris }).tamam, ad); assert.equal(veriTablosuDenetle(a, SAYFALAR, { satirGiris: a.cozum.sutunGiris, sutunGiris: a.cozum.satirGiris }).tamam, false, ad + ': ters giriş geçiyor'); continue; }
      if (a.tur === 'cozucu') {
        const r = cozucuDenetle(a, SAYFALAR, a.cozum); assert.ok(r.tamam, ad + ': ' + r.mesaj);
        if (a.baslangic) assert.equal(cozucuDenetle(a, SAYFALAR, a.baslangic).tamam, false, ad + ': kısıtsız model geçiyor');
        const tamsiz = { ...a.cozum, kisitlar: a.cozum.kisitlar.filter(k => k.op !== 'tamsayi') };
        if (tamsiz.kisitlar.length < a.cozum.kisitlar.length) assert.equal(cozucuDenetle(a, SAYFALAR, tamsiz).tamam, false, ad + ': tamsayı kısıtı olmadan geçiyor');
        continue;
      }
      if (a.tur === 'makro') {
        const r = makroDenetle(a, SAYFALAR, a.cozum); assert.ok(r.tamam, ad + ': ' + r.mesaj);
        if (a.yanlis) { const y = makroDenetle(a, SAYFALAR, a.yanlis); assert.equal(y.tamam, false, ad + ': sabit son satırlı makro yakalanmadı'); assert.equal(y.gizli, true, ad + ': görünen tabloda tutmalı, gizli kopyada yakalanmalı'); }
        assert.equal(makroDenetle(a, SAYFALAR, 'Sub Bos()\nEnd Sub').tamam, false, ad + ': boş makro geçiyor'); continue;
      }
      ayristir(a.cozum, ISLEVLER);
      // Çözüm ilk satırda boş olmayan bir kaynak hücreye bakmalı (yanlış satır numarası yazılmış alıştırmayı yakalar)
      {
        const k0 = kitapKur(a, SAYFALAR); k0.hesapla();
        const ilk = a.hedef.split(':')[0], m = ilk.match(/^([A-Z]+)(\d+)$/), satir = Number(m[2]);
        const refs = [...a.cozum.matchAll(/(?<![A-Za-z!$:])\$?([A-Z]{1,2})\$?(\d+)(?![\d(:])/g)].filter(x => Number(x[2]) === satir);
        const doluVar = refs.some(x => { const c = [...x[1]].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0); return k0.hucre(a.sayfa, satir, c) != null; });
        if (refs.length && !a.bosKaynak) assert.ok(doluVar, `${d.id}/${a.id}: hedefin ilk satırındaki kaynak hücreler boş (${refs.map(x => x[0]).join(', ')})`);
      }
      const r = formulDenetle(a, SAYFALAR, a.cozum);
      assert.ok(r.tamam, ad + ': ' + r.mesaj);
      // Sonucu elle yazmak: tek hücreli alıştırmada görünen değerin sabiti gizli denemede yakalanmalı
      if (!a.hedef.includes(':') && !a.varyantsiz && !a.okunan) {
        const k = kitapKur(a, SAYFALAR);
        k.yaz(a.sayfa, a.hedef, a.cozum); k.hesapla();
        const p = a.hedef.match(/^([A-Z]+)(\d+)$/); const c = [...p[1]].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
        const v = k.hucre(a.sayfa, Number(p[2]), c);
        if (typeof v === 'number') {
          // Zorunlu işlev kuralı kaldırılarak yalnız gizli deneme sınanır
          const h = formulDenetle({ ...a, gerekli: undefined, tabloGerekli: undefined, adKullan: undefined }, SAYFALAR, '=' + String(v).replace('.', ','));
          assert.equal(h.tamam, false, ad + ': sabit sonuç (' + v + ') gizli denemede yakalanmadı');
          // Model (ham) sayfalarda gizli kopya yok: sabit sonucu denetimin farklı girdi durumları yakalar
          if (a.durumlar) assert.ok(/iken/.test(h.mesaj), ad + ': sabit sonuç başka bir girdi durumunda yakalanmalı (' + h.mesaj + ')');
          else assert.equal(h.gizli, true, ad + ': sabit sonuç görünür tabloda tutmalı, gizli denemede yakalanmalı (' + h.mesaj + ')');
        }
      }
    }
  });
}
