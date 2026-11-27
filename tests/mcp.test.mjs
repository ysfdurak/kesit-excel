// MCP protokol testi: sunucuyu başlatır, sekiz aracı çağırır; web ile aynı motorun aynı sonucu verdiği ve izinli klasör koruması.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const req = createRequire(path.join(here, '../mcp/package.json'));
const { Client } = await import(pathToFileURL(req.resolve('@modelcontextprotocol/sdk/client/index.js')).href);
const { StdioClientTransport } = await import(pathToFileURL(req.resolve('@modelcontextprotocol/sdk/client/stdio.js')).href);

test('MCP: hesapla, çevir, işlev bilgisi, alıştırma getir/denetle; korumalar', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'kesit-excel-'));
  const client = new Client({ name: 'test', version: '1.0.0' });
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [path.join(here, '../mcp/server.mjs'), dir] }));
  const call = async (name, args) => { const r = await client.callTool({ name, arguments: args }); return { text: r.content[0].text, err: !!r.isError }; };
  try {
    assert.deepEqual((await client.listTools()).tools.map(x => x.name).sort(), ['alistirma_denetle', 'alistirma_getir', 'durum_cozumle', 'formul_cevir', 'formul_hesapla', 'grafik_ciz', 'islev_bilgisi', 'makro_calistir']);
    // Türkçe ve İngilizce yazım aynı sonucu verir
    const tr = JSON.parse((await call('formul_hesapla', { formul: '=ÇOKETOPLA(H2:H241;F2:F241;"Kitap";E2:E241;"Web")' })).text);
    const en = JSON.parse((await call('formul_hesapla', { formul: '=SUMIFS(H2:H241,F2:F241,"Kitap",E2:E241,"Web")' })).text);
    assert.equal(tr.sonuc, en.sonuc); assert.equal(tr.yazim, 'Türkçe'); assert.equal(en.yazim, 'İngilizce'); assert.deepEqual(tr.islevler, [{ tr: 'ÇOKETOPLA', en: 'SUMIFS' }]);
    // taşma
    const t = JSON.parse((await call('formul_hesapla', { formul: '=SIRALA(BENZERSİZ(F2:F241))' })).text);
    assert.equal(t.tasma.boyut, '7 satır × 1 sütun'); assert.equal(t.tasma.ilk50[0][0], 'Elektronik');
    // kendi verisi + hata açıklaması
    const v = JSON.parse((await call('formul_hesapla', { veri: [['Ad', 'Tutar'], ['a', '1.250,50'], ['b', '980']], formul: '=TOPLA(B2:B3)/0' })).text);
    assert.equal(v.sonuc.hata, '#BÖL/0!'); assert.match(v.sonuc.aciklama, /sıfıra/);
    const v2 = JSON.parse((await call('formul_hesapla', { veri: [['Ad', 'Tutar'], ['a', '1.250,50'], ['b', '980']], formul: '=TOPLA(B2:B3)' })).text);
    assert.equal(v2.sonuc, 2230.5);
    // CSV: izinli klasörde okunur, dışarısı reddedilir
    await writeFile(path.join(dir, 'bayi.csv'), '﻿Bayi;Tutar\r\nMerkez;"1.250,50"\r\nKızılay;980\r\n');
    const c = JSON.parse((await call('formul_hesapla', { csv_dosya: path.join(dir, 'bayi.csv'), formul: '=TOPLA(B2:B3)' })).text);
    assert.equal(c.sonuc, 2230.5);
    const dis = await call('formul_hesapla', { csv_dosya: '/etc/passwd', formul: '=1' }); assert.ok(dis.err); assert.match(dis.text, /İzinli klasörlerin dışı|Yalnız \.csv/);
    const bozuk = await call('formul_hesapla', { formul: '=TOPLA(1;2' }); assert.ok(bozuk.err); assert.match(bozuk.text, /parantez/);
    // çeviri
    assert.equal((await call('formul_cevir', { formul: '=EĞER(DÜŞEYARA(A2;$F$2:$G$9;2;YANLIŞ)>1,5;"evet";"hayır")', hedef: 'en' })).text, '=IF(VLOOKUP(A2,$F$2:$G$9,2,FALSE)>1.5,"evet","hayır")');
    // işlev bilgisi
    const ib = JSON.parse((await call('islev_bilgisi', { ad: 'vlookup' })).text);
    assert.equal(ib.tr, 'DÜŞEYARA'); assert.ok(ib.dersler.some(x => x.startsWith('m5-d1')));
    assert.match((await call('islev_bilgisi', { kategori: 'dizi' })).text, /FİLTRE \(FILTER\)/);
    // alıştırma getir: çözüm gizli, istenirse görünür
    const g = JSON.parse((await call('alistirma_getir', { ders: 'm4-d3', alistirma: 'a1' })).text);
    assert.equal(g.hedef, 'M2'); assert.match(g.cozum, /cozum_goster/); assert.equal(g.sutunlar[7], 'H Adet');
    const g2 = JSON.parse((await call('alistirma_getir', { ders: 'm4-d3', alistirma: 'a1', cozum_goster: true })).text);
    assert.match(g2.cozum, /^=ÇOKETOPLA/);
    assert.match((await call('alistirma_getir', { rol: 'finans' })).text, /Finans \/ bütçe/);
    // denetim: doğru, yanlış, elle yazılmış sayı (gizli denemede yakalanır)
    assert.equal(JSON.parse((await call('alistirma_denetle', { ders: 'm4-d3', alistirma: 'a1', formul: g2.cozum })).text).tamam, true);
    assert.equal(JSON.parse((await call('alistirma_denetle', { ders: 'm4-d3', alistirma: 'a1', formul: '=ETOPLA(D2:D241;"İstanbul";H2:H241)' })).text).tamam, false);
    const deger = JSON.parse((await call('formul_hesapla', { formul: '=TOPLA(H2:H241)', hucre: 'M2' })).text).sonuc;
    const sabit = JSON.parse((await call('alistirma_denetle', { ders: 'm2-d1', alistirma: 'a1', formul: '=' + deger })).text);
    assert.equal(sabit.tamam, false); assert.equal(sabit.gizliDenemedeYakalandi, true);
    // grafik: bağımsız SVG, renk gömülü, sınıf yok
    const gr = JSON.parse((await call('grafik_ciz', { sayfa: 'Hedef', alan: 'A1:D5', secenek: { tur: 'sutun', baslik: 'Hedefler' } })).text);
    assert.equal(gr.kategoriler, 4); assert.deepEqual(gr.seriler, ['Oca', 'Şub', 'Mar']); assert.match(gr.svg, /^<svg/); assert.match(gr.svg, /fill="#257de0"/); assert.doesNotMatch(gr.svg, /class="g-s/);
    const gp = JSON.parse((await call('grafik_ciz', { sayfa: 'Satışlar', pivot: { satir: 'Kategori', degerler: [{ alan: 'Adet', ozet: 'toplam' }] }, secenek: { tur: 'cubuk' } })).text);
    assert.equal(gp.kategoriler, 7);
    // makro: yalıtılmış kopyada çalışır, sonuç ve MsgBox döner; hata satırı bildirilir
    const mk = JSON.parse((await call('makro_calistir', { kod: 'Sub T()\n  Range("L2").Value = Range("H2").Value * 2\n  MsgBox Cells(Rows.Count, 1).End(xlUp).Row\nEnd Sub', oku: 'H2:L2' })).text);
    assert.equal(mk.tamam, true); assert.equal(mk.cikti[0].metin, '241'); assert.equal(mk.degerler[0][4], mk.degerler[0][0] * 2);
    const mh = JSON.parse((await call('makro_calistir', { kod: 'Sub T()\n  Dim x\n  x = 1 / 0\nEnd Sub' })).text);
    assert.equal(mh.tamam, false); assert.equal(mh.hata.satir, 3);
    // yeni alıştırma türleri
    const mg = JSON.parse((await call('alistirma_getir', { ders: 'm14-d2', alistirma: 'a1', cozum_goster: true })).text);
    assert.equal(JSON.parse((await call('alistirma_denetle', { ders: 'm14-d2', alistirma: 'a1', vba: mg.cozum })).text).tamam, true);
    const sabit241 = JSON.parse((await call('alistirma_denetle', { ders: 'm14-d2', alistirma: 'a1', vba: mg.cozum.replace(/son = [^\n]+\n/, 'son = 241\n') })).text);
    assert.equal(sabit241.tamam, false); assert.equal(sabit241.gizliDenemedeYakalandi, true);
    assert.equal(JSON.parse((await call('alistirma_denetle', { ders: 'm13-d1', alistirma: 'a2', grafik: { tur: 'sutun', alan: 'A1:D5', baslik: 'Hedefler' } })).text).tamam, true);
    assert.equal(JSON.parse((await call('alistirma_denetle', { ders: 'm13-d1', alistirma: 'a2', grafik: { tur: 'pasta', alan: 'A1:D5', baslik: 'x' } })).text).tamam, false);
    assert.equal(JSON.parse((await call('alistirma_denetle', { ders: 'm13-d4', alistirma: 'a2', kurallar: [{ tur: 'formul', alan: 'A2:D43', formul: '=$D2<$C2*0,9', stil: 'kirmizi' }] })).text).tamam, true);
    assert.equal(JSON.parse((await call('alistirma_denetle', { ders: 'm13-d3', alistirma: 'a1', pivot: { satir: 'Kategori', degerler: [{ alan: 'Adet', ozet: 'toplam' }], filtreler: [{ alan: 'Kanal', degerler: ['Mağaza'] }] }, grafik: { tur: 'cubuk' } })).text).tamam, true);
    assert.equal(JSON.parse((await call('alistirma_denetle', { ders: 'm14-d1', alistirma: 'a1', secim: 1 })).text).tamam, true);
    // kitap tasarımı ve durum çözümlemesi türleri
    const dn = (ders, alistirma, ek) => call('alistirma_denetle', { ders, alistirma, ...ek }).then(x => JSON.parse(x.text).tamam);
    assert.equal(await dn('m15-d3', 'a1', { dogrulama: [{ tur: 'liste', alan: 'C2:C31', kaynak: 'Web;Mobil;Mağaza' }] }), true);
    assert.equal(await dn('m15-d5', 'a1', { bicim_kodu: '#.##0,00 "₺"' }), true);
    assert.equal(await dn('m15-d6', 'a1', { hucre: 'E4' }), true);
    assert.equal(await dn('m15-d2', 'a1', { yeni_ad: { ad: 'Adetler', tanim: '=Satışlar[Adet]' } }), true);
    assert.equal(await dn('m16-d4', 'a1', { model: { hedefHucre: 'B10', hedefDeger: 150000, degisenHucre: 'B4' } }), true);
    assert.equal(await dn('m16-d7', 'a1', { model: { amac: 'B8', yon: 'min', degiskenler: 'B4:H4', kisitlar: [{ sol: 'B5:H5', op: '>=', sag: 'B6:H6' }, { sol: 'B4:H4', op: 'tamsayi' }] } }), true);
    assert.equal(await dn('m16-d7', 'a1', { model: { amac: 'B8', yon: 'min', degiskenler: 'B4:H4', kisitlar: [{ sol: 'B5:H5', op: '>=', sag: 'B6:H6' }] } }), false);
    assert.equal(await dn('m16-d1', 'a1', { formul: '=DEVRESEL_ÖDEME(B4/12;B5;-B3)' }), true);
    const ha = JSON.parse((await call('durum_cozumle', { tur: 'hedefAra', sayfa: 'Fiyat', model: { hedefHucre: 'B10', hedefDeger: 0, degisenHucre: 'B5' } })).text);
    assert.equal(ha.tamam, true); assert.ok(Math.abs(ha.deger - 395000 / 17) < 1e-3);
    const cz = JSON.parse((await call('durum_cozumle', { tur: 'cozucu', sayfa: 'Vardiya', model: { amac: 'B8', yon: 'min', degiskenler: 'B4:H4', kisitlar: [{ sol: 'B5:H5', op: '>=', sag: 'B6:H6' }, { sol: 'B4:H4', op: 'tamsayi' }] } })).text);
    assert.equal(cz.amac, 23);
    // pivot ve Power Query
    assert.equal(JSON.parse((await call('alistirma_denetle', { ders: 'm10-d1', alistirma: 'a1', pivot: { satir: 'Şehir', degerler: [{ alan: 'Adet', ozet: 'toplam' }] } })).text).tamam, true);
    const pq = JSON.parse((await call('alistirma_denetle', { ders: 'm11-d1', alistirma: 'a1', adimlar: [{ tip: 'ustSatirKaldir', n: 1 }, { tip: 'basligiYukselt' }, { tip: 'bosSatirKaldir' }] })).text);
    assert.equal(pq.tamam, true); assert.match(pq.m, /Table\.PromoteHeaders/);
    assert.ok((await call('alistirma_denetle', { ders: 'm10-d1', alistirma: 'a1', formul: '=1' })).err);
  } finally { await client.close(); }
});
