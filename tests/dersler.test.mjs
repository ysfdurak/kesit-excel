// Ders içeriği doğrulaması: her alıştırmanın çözümü denetçiden geçer; elle yazılmış sonuç (sabit) gizli varyantta yakalanır.
import test from 'node:test';
import assert from 'node:assert/strict';
import { DERSLER, MODULLER } from '../docs/icerik/dersler.js';
import { SAYFALAR } from '../docs/icerik/sayfalar.js';
import { formulDenetle, pivotDenetle, sorguDenetle } from '../docs/motor/denetci.js';
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
      const k = new Kitap({ bugun: 45900 });
      for (const [ad, t] of Object.entries(SAYFALAR)) if (t.basliklar) k.tablo(ad, t.basliklar, t.satirlar);
      for (const [a, v] of Object.entries(d.ornek.hazirlik || {})) k.yaz(d.ornek.sayfa, a, v);
      k.yaz(d.ornek.sayfa, d.ornek.hucre, d.ornek.formul); k.hesapla();
      const p = d.ornek.hucre.match(/^([A-Z]+)(\d+)$/); const c = [...p[1]].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
      const v = k.hucre(d.ornek.sayfa, Number(p[2]), c);
      assert.ok(!hataMi(v), `${d.id} örnek formül hata verdi: ${d.ornek.formul} → ${v && v.kod}`);
    }
    for (const a of d.alistirmalar) {
      const ad = `${d.id}/${a.id}`;
      if (a.tur === 'pivot') { const r = pivotDenetle(a, SAYFALAR, a.cozum); assert.ok(r.tamam, ad + ': ' + r.mesaj); continue; }
      if (a.tur === 'sorgu') { const r = sorguDenetle(a, SAYFALAR, a.cozum); assert.ok(r.tamam, ad + ': ' + r.mesaj); continue; }
      ayristir(a.cozum, ISLEVLER);
      // Çözüm ilk satırda boş olmayan bir kaynak hücreye bakmalı (yanlış satır numarası yazılmış alıştırmayı yakalar)
      {
        const k0 = new Kitap({ bugun: 45900 });
        for (const [s, t] of Object.entries(SAYFALAR)) { if (t.basliklar) k0.tablo(s, t.basliklar, t.satirlar); else t.satirlar.forEach((row, i) => row.forEach((v, j) => { if (v != null) k0.yaz(s, { r: i + 1, c: j + 1 }, v); })); }
        for (const [x, v] of Object.entries(a.hazirlik || {})) k0.yaz(a.sayfa, x, v);
        const ilk = a.hedef.split(':')[0], m = ilk.match(/^([A-Z]+)(\d+)$/), satir = Number(m[2]);
        const refs = [...a.cozum.matchAll(/(?<![A-Za-z!$:])\$?([A-Z]{1,2})\$?(\d+)(?![\d(:])/g)].filter(x => Number(x[2]) === satir);
        const doluVar = refs.some(x => { const c = [...x[1]].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0); return k0.hucre(a.sayfa, satir, c) != null; });
        if (refs.length && !a.bosKaynak) assert.ok(doluVar, `${d.id}/${a.id}: hedefin ilk satırındaki kaynak hücreler boş (${refs.map(x => x[0]).join(', ')})`);
      }
      const r = formulDenetle(a, SAYFALAR, a.cozum);
      assert.ok(r.tamam, ad + ': ' + r.mesaj);
      // Sonucu elle yazmak: tek hücreli alıştırmada görünen değerin sabiti gizli denemede yakalanmalı
      if (!a.hedef.includes(':') && !a.varyantsiz && !a.okunan) {
        const k = new Kitap({ bugun: 45900 });
        for (const [s, t] of Object.entries(SAYFALAR)) if (t.basliklar) k.tablo(s, t.basliklar, t.satirlar);
        for (const [x, v] of Object.entries(a.hazirlik || {})) k.yaz(a.sayfa, x, v);
        k.yaz(a.sayfa, a.hedef, a.cozum); k.hesapla();
        const p = a.hedef.match(/^([A-Z]+)(\d+)$/); const c = [...p[1]].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
        const v = k.hucre(a.sayfa, Number(p[2]), c);
        if (typeof v === 'number') {
          // Zorunlu işlev kuralı kaldırılarak yalnız gizli deneme sınanır
          const h = formulDenetle({ ...a, gerekli: undefined }, SAYFALAR, '=' + String(v).replace('.', ','));
          assert.equal(h.tamam, false, ad + ': sabit sonuç (' + v + ') gizli denemede yakalanmadı');
          assert.equal(h.gizli, true, ad + ': sabit sonuç görünür tabloda tutmalı, gizli denemede yakalanmalı (' + h.mesaj + ')');
        }
      }
    }
  });
}
