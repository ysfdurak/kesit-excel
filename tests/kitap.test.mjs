// Excel'de çalışma kitabı: her dersin .xlsx'i üretiliyor, zip geçerli, formüller İngilizce yazımla, çözümlerde Türkçe ad kalmıyor.
import test from 'node:test';
import assert from 'node:assert/strict';
import { DERSLER } from '../docs/icerik/dersler.js';
import { dersKitabi, tumKitap, ingilizceYazim } from '../docs/js/alistirma-kitabi.js';
import { xlsxDosyalari, zip } from '../docs/js/xlsx-yaz.js';
import { TR_EN } from '../docs/motor/formul.js';

// Zip'in merkez dizininden dosya adlarını okur ve her dosyayı açar (DEFLATE ya da STORE)
async function zipAc(b) {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let son = b.length - 22; while (dv.getUint32(son, true) !== 0x06054b50) son--;
  const n = dv.getUint16(son + 10, true); let p = dv.getUint32(son + 16, true); const out = {};
  for (let i = 0; i < n; i++) {
    const yontem = dv.getUint16(p + 10, true), boy = dv.getUint32(p + 20, true), adBoy = dv.getUint16(p + 28, true), ofs = dv.getUint32(p + 42, true);
    const ad = new TextDecoder().decode(b.subarray(p + 46, p + 46 + adBoy));
    const yAd = dv.getUint16(ofs + 26, true), yEk = dv.getUint16(ofs + 28, true), veri = b.subarray(ofs + 30 + yAd + yEk, ofs + 30 + yAd + yEk + boy);
    const acik = yontem === 8 ? new Uint8Array(await new Response(new Blob([veri]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()) : veri;
    out[ad] = new TextDecoder().decode(acik); p += 46 + adBoy + dv.getUint16(p + 30, true) + dv.getUint16(p + 32, true);
  }
  return out;
}

test('her dersin kitabı üretiliyor; Görevler önce, Çözümler en sonda; her alıştırma bir satır', () => {
  for (const d of DERSLER) {
    const k = dersKitabi(d);
    assert.equal(k.sayfalar[0].ad, 'Görevler', d.id); assert.equal(k.sayfalar.at(-1).ad, 'Çözümler', d.id);
    const adlar = k.sayfalar.map(s => s.ad); assert.equal(new Set(adlar).size, adlar.length, d.id + ': yinelenen sayfa adı');
    for (const ad of adlar) assert.ok(ad.length <= 31 && !/[\\/?*[\]:]/.test(ad), d.id + ': geçersiz sayfa adı ' + ad);
    const coz = k.sayfalar.at(-1).hucreler.filter(h => h.c === 1 && typeof h.v === 'number');
    assert.equal(coz.length, d.alistirmalar.length, d.id + ': çözüm satırı sayısı');
  }
});

test('zip geçerli ve xlsx parçaları yerinde (DEFLATE ile)', async () => {
  const d = DERSLER.find(x => x.id === 'm15-d2');
  const b = await zip(xlsxDosyalari(dersKitabi(d)));
  const f = await zipAc(b);
  for (const p of ['[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml', 'xl/styles.xml', 'xl/worksheets/sheet1.xml']) assert.ok(f[p], p);
  assert.match(f['xl/workbook.xml'], /<sheet name="Görevler"/);
  assert.match(f['xl/workbook.xml'], /<definedName name="Fiyatlar">/, 'tanımlı ad');
  assert.ok(Object.keys(f).some(k => k.startsWith('xl/tables/')), 'Excel Tablosu');
});

test('çalışma sayfası: hazırlık yazılı, hedef sarı, Türkçe formül İngilizceye çevrilmiş', () => {
  const k = dersKitabi(DERSLER.find(x => x.id === 'm22-d5'));
  const s = k.sayfalar.find(x => x.ad === 'Alıştırma 2');
  const h = a => s.hucreler.find(x => x.r === a[0] && x.c === a[1]);
  assert.equal(h([2, 14]).f, '=P2'); assert.equal(h([2, 16]).v, 'Giyim'); assert.equal(h([2, 13]).stil, 2);
  const k2 = dersKitabi(DERSLER.find(x => x.id === 'm9-d8'));
  assert.equal(k2.sayfalar.find(x => x.ad === 'Alıştırma 1').hucreler.find(x => x.r === 4 && x.c === 8).f, '=G4-0.01');
  // Taşan hazırlık formülü yazılmaz, yönergeye dönüşür
  const k3 = dersKitabi(DERSLER.find(x => x.id === 'm8-d8'));
  assert.match(k3.sayfalar[0].hucreler.filter(x => x.c === 6).map(x => x.v).join(' '), /M2 hücresine önce =BENZERSİZ/);
});

test('İngilizce çözümlerde Türkçe işlev adı ve _xlfn öneki kalmıyor; METNEÇEVİR kodu çevriliyor', () => {
  const tr = Object.keys(TR_EN).filter(k => k !== TR_EN[k] && /[^A-Z.]/.test(k));
  for (const d of DERSLER) for (const a of d.alistirmalar) {
    if (a.tur || typeof a.cozum !== 'string') continue;
    const en = ingilizceYazim(a.cozum);
    assert.ok(!/_xlfn/.test(en), d.id + ' ' + en);
    for (const t of tr) assert.ok(!new RegExp('(^|[^A-Za-zÇĞİÖŞÜçğıöşü.])' + t.replace('.', '\\.') + '\\(').test(en), `${d.id}/${a.id}: ${t} kaldı: ${en}`);
  }
  assert.equal(ingilizceYazim('=METNEÇEVİR(B2;"gg.aa.yyyy")'), '=TEXT(B2,"dd.mm.yyyy")');
  assert.equal(ingilizceYazim('=METNEÇEVİR(B2;"aaaa yyyy")'), '=TEXT(B2,"mmmm yyyy")');
});

test('tek alıştırma kitabı: bütün alıştırmalar ve veri sayfaları', () => {
  const k = tumKitap(DERSLER);
  const toplam = DERSLER.reduce((n, d) => n + d.alistirmalar.length, 0);
  const gorev = k.sayfalar[0].hucreler.filter(h => h.c === 3 && typeof h.v === 'number');
  assert.equal(gorev.length, toplam);
  assert.ok(k.sayfalar.some(s => s.ad === 'Satışlar' && s.tablo), 'Satışlar Excel Tablosu');
});
