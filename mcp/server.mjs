#!/usr/bin/env node
// Kesit Excel MCP sunucusu (stdio, yerel). Web uygulamasıyla aynı motoru (docs/motor) kullanır; ağa çıkmaz, dosya yazmaz.
// Kullanım: node server.mjs <izinli klasör> [...]   (klasör verilmezse ev klasörü; yalnız formul_hesapla'nın CSV okuması için)
import os from 'node:os';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { Kitap, goster } from '../docs/motor/kitap.js';
import { cevir, ayristir, belirtec, hataMi, islevAdi, yazimBul, alanCoz, adresCoz, adres, EN_TR, HATA_TR, SINIR } from '../docs/motor/formul.js';
import { ISLEVLER } from '../docs/motor/islevler.js';
import { gelismisFiltreDenetle, formulDenetle, pivotDenetle, sorguDenetle, makroDenetle, grafikAlistirmaDenetle, grafikVerisiAl, kosulluDenetle, panoDenetle, dogrulamaDenetle, bicimDenetle, hucreBulDenetle, sayiDenetle, adDenetle, hedefAraDenetle, veriTablosuDenetle, cozucuDenetle, HATA_ACIKLAMA } from '../docs/motor/denetci.js';
import { cozucu, hedefAra } from '../docs/motor/senaryo.js';
import { ozelBicim } from '../docs/motor/bicim.js';
import { grafikCiz, TURLER } from '../docs/motor/grafik.js';
import { makroCalistir } from '../docs/motor/vba.js';
import { KURAL_TURLERI } from '../docs/motor/kosullu.js';
import { ISLEV_BILGI, KATEGORILER, islevBul } from '../docs/icerik/islev-bilgi.js';
import { DERSLER, MODULLER } from '../docs/icerik/dersler.js';
import { SAYFALAR } from '../docs/icerik/sayfalar.js';
import { ROLLER } from '../docs/icerik/ekler.js';

const SURUM = '0.4.0';
const ROOTS = (process.argv.slice(2).filter(a => !a.startsWith('--')).length ? process.argv.slice(2).filter(a => !a.startsWith('--')) : [os.homedir()]).map(r => path.resolve(r));
const inside = real => ROOTS.some(r => real === r || real.startsWith(r.endsWith(path.sep) ? r : r + path.sep));
const MAKS_CSV = 5 * 1024 * 1024, MAKS_HUCRE = 200000;
const text = s => ({ content: [{ type: 'text', text: s }] });
const hata = s => ({ content: [{ type: 'text', text: s }], isError: true });

async function okunacak(p) {
  let real; try { real = await fs.realpath(path.resolve(p)); } catch { throw new Error(`Dosya yok: ${p}`); }
  if (!inside(real)) throw new Error(`İzinli klasörlerin dışı okunmaz: ${p}. İzinli: ${ROOTS.join(', ')}`);
  const st = await fs.stat(real); if (!st.isFile()) throw new Error(`Dosya değil: ${p}`);
  if (!/\.(csv|txt|tsv)$/i.test(real)) throw new Error('Yalnız .csv, .tsv ya da .txt okunur');
  if (st.size > MAKS_CSV) throw new Error('Dosya 5 MB\'tan büyük');
  return real;
}
// CSV: ayırıcıyı ilk satırdan sezer (; , ya da sekme); tırnaklı alanları destekler. Hücre metni Türkçe girişe göre sayı/tarih olur.
function csvOku(metin) {
  const s = metin.replace(/^﻿/, ''); const ilk = s.split(/\r?\n/, 1)[0];
  const ay = [';', '\t', ','].sort((a, b) => ilk.split(b).length - ilk.split(a).length)[0];
  const satirlar = []; let r = [], alan = '', t = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (t) { if (c === '"') { if (s[i + 1] === '"') { alan += '"'; i++; } else t = false; } else alan += c; continue; }
    if (c === '"') t = true; else if (c === ay) { r.push(alan); alan = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && s[i + 1] === '\n') i++; r.push(alan); satirlar.push(r); r = []; alan = ''; } else alan += c;
  }
  if (alan !== '' || r.length) { r.push(alan); satirlar.push(r); }
  return satirlar.filter(x => x.some(v => v !== ''));
}
function kitapKur(ek) {
  const k = new Kitap({ bugun: 45900 });
  for (const [ad, t] of Object.entries(SAYFALAR)) {
    if (t.basliklar) k.tablo(ad, t.basliklar, t.satirlar);
    else { const s = k.sayfa(ad); t.satirlar.forEach((row, i) => row.forEach((v, j) => { if (v == null) return; if (typeof v === 'string' && v.startsWith('=')) k.yaz(ad, { r: i + 1, c: j + 1 }, v); else s.h.set((i + 1) + ',' + (j + 1), { v }); })); }
  }
  if (ek) { if (ek.satirlar.length * (ek.satirlar[0]?.length || 1) > MAKS_HUCRE) throw new Error('Veri 200.000 hücreden büyük'); ek.satirlar.forEach((row, i) => row.forEach((v, j) => { if (v !== '' && v != null) k.yazGiris(ek.ad, { r: i + 1, c: j + 1 }, String(v)); })); }
  k.hesapla(); return k;
}
const deger = v => v == null ? null : hataMi(v) ? { hata: HATA_TR[v.kod] || v.kod, aciklama: HATA_ACIKLAMA[v.kod] || null } : v;

const PIVOT = z.object({ satir: z.string().nullable().optional(), sutun: z.string().nullable().optional(), degerler: z.array(z.object({ alan: z.string(), ozet: z.enum(['toplam', 'say', 'ortalama', 'en_buyuk', 'en_kucuk']).optional() })).max(4).optional(),
      filtreler: z.array(z.object({ alan: z.string(), degerler: z.array(z.union([z.string(), z.number()])).max(100) })).max(3).optional(), grupla: z.record(z.string(), z.enum(['ay', 'ceyrek', 'yil'])).optional(),
      goster: z.enum(['deger', 'genelYuzde', 'satirYuzde', 'sutunYuzde']).optional() });
const GRAFIK_SECENEK = z.object({ tur: z.enum(Object.keys(TURLER)), baslik: z.string().max(120).optional(), yigin: z.enum(['yok', 'yigin', 'yuzde']).optional(), veriEtiketi: z.boolean().optional(),
  eksenMin: z.number().nullable().optional(), eksenMax: z.number().nullable().optional(), ikincilEksen: z.boolean().optional(), egilim: z.boolean().optional(), gosterge: z.enum(['alt', 'yok']).optional(),
  vurgu: z.enum(['yok', 'enBuyuk', 'enKucuk']).optional().describe('Sütun/çubukta en büyük ya da en küçük değeri renkli, ötekileri soluk göster'), hedefCizgisi: z.number().optional().describe('Kesikli hedef çizgisi değeri') });
const KURAL = z.object({ tur: z.enum(Object.keys(KURAL_TURLERI)), alan: z.string().regex(/^[A-Z]{1,3}\d+(:[A-Z]{1,3}\d+)?$/), op: z.enum(['>', '>=', '<', '<=', '=', '<>', 'arasinda', 'icerir']).optional(),
  deger: z.union([z.number(), z.string().max(200)]).optional(), deger2: z.number().optional(), n: z.number().int().min(1).max(1000).optional(), alt: z.boolean().optional(), yuzde: z.boolean().optional(),
  benzersiz: z.boolean().optional(), formul: z.string().max(500).optional(), stil: z.enum(['kirmizi', 'sari', 'yesil', 'kalin']).optional(), uclu: z.boolean().optional(), ters: z.boolean().optional() });

const pvTam = p => ({ satir: null, sutun: null, degerler: [], filtreler: [], grupla: {}, goster: 'deger', ...p });

const server = new McpServer({ name: 'kesit-excel', version: SURUM }, {
  instructions: 'Kesit Excel: Türkçe Excel formül motoru (179 işlev, Türkçe ve İngilizce adlar, dinamik diziler, LAMBDA) ve 100 derslik alıştırma seti (grafik, pano, VBA makro, veri doğrulama, finans, Hedef Ara, Çözücü, LAMBDA, Gelişmiş Filtre ve pano grafikleri dahil). ' +
    'Formülü Türkçe (=ETOPLA(A:A;"x";B:B)) ya da İngilizce (=SUMIF(A:A,"x",B:B)) yazabilirsiniz. Hazır sayfalar: ' + Object.keys(SAYFALAR).join(', ') + '. ' +
    'Kendi verinizi satırlar dizisi ya da izinli klasördeki CSV ile verin. grafik_ciz SVG metni döndürür, makro_calistir VBA\'yı yalıtılmış kopyada çalıştırır. Sunucu dosya yazmaz ve ağa çıkmaz.',
});

server.registerTool('formul_hesapla', {
  title: 'Formül hesapla',
  description: 'Bir Excel formülünü hesaplar. Hazır Kesit sayfalarına (Satışlar, Ürünler, Personel, İzinler, Teslimat, Bütçe, Tatiller...) ya da verdiğiniz veriye başvurabilir. Sonuç, taşan dizinin ilk 50 satırı, hata açıklaması ve kullanılan işlevler döner.',
  inputSchema: {
    formul: z.string().max(SINIR.uzunluk).describe('= ile başlayan formül, ör. =ÇOKETOPLA(Satışlar!H2:H241;Satışlar!F2:F241;"Kitap")'),
    sayfa: z.string().max(60).optional().describe('Formülün yazılacağı sayfa (göreli başvurular buna göre). Varsayılan: veri verildiyse Veri, yoksa Satışlar'),
    hucre: z.string().max(10).optional().describe('Formülün yazılacağı hücre (varsayılan: sayfanın sağındaki ilk boş sütunun 2. satırı)'),
    veri: z.array(z.array(z.union([z.string(), z.number(), z.boolean(), z.null()])).max(200)).max(5000).optional().describe('Kendi tablonuz: ilk satır başlık. "Veri" adlı sayfaya A1\'den yazılır. Metin değerler Türkçe girişe göre çevrilir ("1.250,5" sayı, "15.03.2025" tarih)'),
    csv_dosya: z.string().optional().describe('İzinli klasördeki CSV dosyası; "Veri" sayfasına yazılır'),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async ({ formul, sayfa, hucre, veri, csv_dosya }) => {
  try {
    if (!formul.startsWith('=')) return hata('Formül = ile başlamalı.');
    let ek = null;
    if (csv_dosya) ek = { ad: 'Veri', satirlar: csvOku(await fs.readFile(await okunacak(csv_dosya), 'utf8')) };
    else if (veri) ek = { ad: 'Veri', satirlar: veri };
    try { ayristir(formul, ISLEVLER); } catch (e) { return hata('Formül okunamadı: ' + e.message); }
    const k = kitapKur(ek);
    const sf = sayfa || (ek ? 'Veri' : 'Satışlar');
    if (!k.sayfaBul(sf)) return hata(`"${sf}" adında sayfa yok. Var olanlar: ${[...k.sayfalar.keys()].join(', ')}`);
    const hp = hucre ? adresCoz(hucre) : { r: 2, c: k.sayfaBul(sf).kullanilan().c + 2 };
    if (!hp) return hata('Geçersiz hücre: ' + hucre);
    k.yaz(sf, hp, formul); k.hesapla();
    const v = k.hucre(sf, hp.r, hp.c);
    let tasma = null;
    if (k.tasmaMi(sf, hp.r, hp.c + 1) || k.tasmaMi(sf, hp.r + 1, hp.c)) {
      let R = hp.r, C = hp.c; while (k.tasmaMi(sf, R + 1, hp.c) && R - hp.r < 5000) R++; while (k.tasmaMi(sf, hp.r, C + 1) && C - hp.c < 200) C++;
      tasma = { boyut: `${R - hp.r + 1} satır × ${C - hp.c + 1} sütun`, ilk50: k.degerler(sf, { r1: hp.r, c1: hp.c, r2: Math.min(R, hp.r + 49), c2: C }).map(r => r.map(deger)) };
    }
    const tk = belirtec(formul.slice(1));
    const islevler = [...new Set(tk.filter(t => t.t === 'fn').map(t => islevAdi(t.v, ISLEVLER)).filter(Boolean))];
    return text(JSON.stringify({ hucre: `${sf}!${adres(hp.r, hp.c)}`, sonuc: deger(v), gosterim: goster(v), tasma, yazim: yazimBul(formul.slice(1)) === 'tr' ? 'Türkçe' : 'İngilizce',
      islevler: islevler.map(e => ({ tr: EN_TR[e] || e, en: e })), formulHatasi: k.formulHatasi(sf, hp.r, hp.c) }, null, 1));
  } catch (e) { return hata(e.message); }
});

server.registerTool('formul_cevir', {
  title: 'Formülü Türkçe ↔ İngilizce çevir',
  description: 'Türkçe Excel formülünü İngilizceye (ya da tersine) çevirir: işlev adları, ayırıcı (; ↔ ,), ondalık (, ↔ .), DOĞRU/YANLIŞ ve hata adları. Kullanıcının boşlukları korunur.',
  inputSchema: { formul: z.string().max(SINIR.uzunluk), hedef: z.enum(['tr', 'en']).describe('tr: Türkçe Excel, en: İngilizce Excel') },
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async ({ formul, hedef }) => {
  try { const c = cevir(formul, hedef, ISLEVLER); ayristir(c, ISLEVLER); return text(c); }
  catch (e) { return hata('Çevrilemedi: ' + e.message); }
});

server.registerTool('islev_bilgisi', {
  title: 'İşlev bilgisi',
  description: 'Excel işlevinin Türkçe ve İngilizce adı, söz dizimi, açıklaması ve Satışlar verisiyle örneği. Ad verilmezse arama ya da kategori listesi döner.',
  inputSchema: { ad: z.string().max(60).optional().describe('Türkçe ya da İngilizce ad: DÜŞEYARA, VLOOKUP'), ara: z.string().max(60).optional().describe('Açıklamada ya da adda geçen sözcük'), kategori: z.enum(Object.keys(KATEGORILER)).optional() },
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async ({ ad, ara, kategori }) => {
  if (ad) { const b = islevBul(ad); if (!b) return hata(`"${ad}" bulunamadı. ara parametresiyle deneyin.`); const ders = DERSLER.filter(d => d.alistirmalar.some(a => typeof a.cozum === 'string' && a.cozum.includes(b.tr + '('))).map(d => `${d.id} ${d.baslik}`); return text(JSON.stringify({ ...b, dersler: ders }, null, 1)); }
  const q = (ara || '').toLocaleLowerCase('tr');
  const x = ISLEV_BILGI.filter(f => (!kategori || f.kategori === kategori) && (!q || (f.tr + ' ' + f.en + ' ' + f.aciklama).toLocaleLowerCase('tr').includes(q)));
  return text(x.slice(0, 40).map(f => `${f.tr} (${f.en}) · ${f.sozdizimi} · ${f.aciklama}`).join('\n') + (x.length > 40 ? `\n… ${x.length - 40} işlev daha` : '') || 'Eşleşen işlev yok.');
});

const dersOzet = d => `${d.id} · Modül ${MODULLER.find(m => m.id === d.modul).no} · ${d.baslik} (${d.sure} dk, ${d.alistirmalar.length} alıştırma)`;
server.registerTool('grafik_ciz', {
  title: 'Grafik çiz',
  description: 'Hazır bir sayfadan (aralık ya da özet tablo) Excel türü bir grafik çizer ve bağımsız SVG metni döndürür (renkler gömülü, renk körlüğüne göre denetlenmiş palet). Türler: ' + Object.entries(TURLER).map(([k, t]) => k + ' (' + t.ad + ')').join(', ') + '.',
  inputSchema: {
    sayfa: z.enum(Object.keys(SAYFALAR)), alan: z.string().regex(/^[A-Z]{1,3}\d+:[A-Z]{1,3}\d+$/).optional().describe('Veri aralığı, başlık satırıyla, ör. A1:D5'),
    pivot: PIVOT.optional().describe('Aralık yerine özet tablo yapısı (ham satırları özetleyip çizer)'), seriYonu: z.enum(['otomatik', 'sutun', 'satir']).optional(), tarih_seri: z.boolean().optional().describe('Tarih biçimli sütunları seri olarak al (Gantt başlangıç tarihi için)'),
    secenek: GRAFIK_SECENEK, tema: z.enum(['acik', 'koyu']).optional(), genislik: z.number().int().min(320).max(1600).optional(), yukseklik: z.number().int().min(200).max(1000).optional(),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async ({ sayfa, alan, pivot, seriYonu, tarih_seri, secenek, tema, genislik, yukseklik }) => {
  if (!alan && !pivot) return hata('alan ya da pivot verin.');
  try {
    const v = grafikVerisiAl(SAYFALAR, sayfa, pivot ? { pivot: pvTam(pivot) } : { alan, seriYonu, tarihSeri: tarih_seri || secenek.tur === 'gantt' });
    const svg = grafikCiz(v, { ...secenek, bagimsiz: true, tema: tema || 'acik', genislik: genislik || 800, yukseklik: yukseklik || 450 });
    return text(JSON.stringify({ kategoriler: v.kategoriler.length, seriler: v.seriler.map(s => s.ad), svg }, null, 1));
  } catch (e) { return hata(e.message); }
});

server.registerTool('makro_calistir', {
  title: 'VBA makrosu çalıştır',
  description: 'VBA kodunu Kesit\'in yorumlayıcısıyla hazır sayfaların yalıtılmış bir kopyasında çalıştırır (Range, Cells, End(xlUp), If, For, Select Case, With, Function, WorksheetFunction, MsgBox, biçim). Dosya, ağ ve Windows erişimi yoktur; adım ve hücre sınırı vardır. Çıktı: MsgBox/Debug.Print satırları, hata satırı ve istenen aralığın değerleri.',
  inputSchema: {
    kod: z.string().max(20000), sayfa: z.enum(Object.keys(SAYFALAR)).optional().describe('Etkin sayfa (varsayılan Satışlar)'), makro: z.string().max(80).optional().describe('Çalışacak Sub; yoksa ilk Sub'),
    oku: z.string().regex(/^[A-Z]{1,3}\d+(:[A-Z]{1,3}\d+)?$/).optional().describe('Sonucu dönecek aralık, ör. L1:L10 (en çok 500 hücre)'), girdiler: z.array(z.string().max(200)).max(20).optional().describe('InputBox cevapları sırayla'),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async ({ kod, sayfa, makro, oku, girdiler }) => {
  const s = sayfa || 'Satışlar', k = kitapKur(); k.stiller = new Map();
  const r = makroCalistir(kod, k, { sayfa: s, alt: makro, girdiler });
  let degerler;
  if (oku) { const a = alanCoz(oku.includes(':') ? oku : oku + ':' + oku); if ((a.r2 - a.r1 + 1) * (a.c2 - a.c1 + 1) > 500) return hata('oku en çok 500 hücre'); degerler = k.degerler(s, a).map(row => row.map(deger)); }
  return text(JSON.stringify({ tamam: r.tamam, hata: r.tamam ? null : r.hata, cikti: (r.cikti || []).slice(0, 200), yazilanHucre: r.yazilan ?? null, adim: r.adim ?? null, degerler }, null, 1));
});

server.registerTool('durum_cozumle', {
  title: 'Hedef Ara ya da Çözücü',
  description: 'Hazır model sayfalarında (Kredi, Fiyat, Üretim, Vardiya, Yatırım) ya da ek hücre değerleriyle Excel\'in Hedef Ara ve Çözücü (Simplex LP, tamsayı) araçlarını çalıştırır. Hedef Ara: {hedefHucre, hedefDeger, degisenHucre}. Çözücü: {amac, yon: maks|min, degiskenler: "B4:D4", kisitlar: [{sol, op: <=|>=|=|tamsayi|ikili, sag}]}. Doğrusal olmayan modeli reddeder.',
  inputSchema: {
    tur: z.enum(['hedefAra', 'cozucu']), sayfa: z.enum(Object.keys(SAYFALAR)), model: z.object({}).passthrough(),
    hucreler: z.record(z.string().regex(/^[A-Z]{1,3}\d+$/), z.union([z.number(), z.string().max(300)])).optional().describe('Çalıştırmadan önce yazılacak hücreler (girdi değerleri ya da Türkçe formül)'),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async ({ tur, sayfa, model, hucreler }) => {
  const k = kitapKur();
  if (hucreler) { if (Object.keys(hucreler).length > 200) return hata('En çok 200 hücre'); for (const [a, v] of Object.entries(hucreler)) k.yaz(sayfa, a, v); k.hesapla(); }
  const r = tur === 'hedefAra' ? hedefAra(k, sayfa, { ...model, hedefDeger: Number(model.hedefDeger) }) : cozucu(k, sayfa, model);
  return text(JSON.stringify(r, (key, v) => typeof v === 'number' ? +v.toPrecision(12) : v, 1));
});

server.registerTool('alistirma_getir', {
  title: 'Alıştırma getir',
  description: 'Kesit Excel derslerinden alıştırma getirir: soru, kullanılan sayfa ve sütunlar, hedef hücre ve ipuçları. Çözüm yalnız cozum_goster: true ile döner. Ders verilmezse ders listesi (ya da rolün sırası) döner.',
  inputSchema: {
    ders: z.string().regex(/^m\d{1,2}-d\d$/).optional().describe('Ders kimliği, ör. m4-d3'),
    alistirma: z.string().regex(/^a\d$/).optional().describe('Alıştırma kimliği (a1, a2…). Yoksa dersin ilk alıştırması'),
    rol: z.enum(ROLLER.map(r => r.id)).optional().describe('Ders verilmezse bu rolün sırası listelenir'),
    cozum_goster: z.boolean().optional(),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async ({ ders, alistirma, rol, cozum_goster }) => {
  if (!ders) { const r = ROLLER.find(x => x.id === rol); const ds = r ? r.dersler.map(id => DERSLER.find(d => d.id === id)) : DERSLER; return text((r ? `${r.ad}: ${r.neden}\n\n` : '') + ds.map(dersOzet).join('\n')); }
  const d = DERSLER.find(x => x.id === ders); if (!d) return hata('Ders yok: ' + ders);
  const a = alistirma ? d.alistirmalar.find(x => x.id === alistirma) : d.alistirmalar[0]; if (!a) return hata(`${ders} dersinde ${alistirma} yok. Var olanlar: ${d.alistirmalar.map(x => x.id).join(', ')}`);
  const t = SAYFALAR[a.sayfa];
  return text(JSON.stringify({ ders: dersOzet(d), ozet: d.ozet, alistirma: a.id, tur: a.tur || 'formul', soru: a.soru, sayfa: a.sayfa,
    sutunlar: t.basliklar ? t.basliklar.map((b, i) => `${String.fromCharCode(65 + i)} ${b}`) : 'başlık satırı yok (ham sayfa, A1\'den başlar)', satir: t.satirlar.length,
    hedef: a.hedef || null, secenekler: a.secenekler || undefined, okunan: a.okunan || undefined, baslangic: a.kaynak || a.baslangicKod || undefined, hazirlik: a.hazirlik || null, gerekli: a.gerekli ? a.gerekli.map(g => EN_TR[g] || g) : null, ipuclari: a.ipuclari || [],
    cozum: cozum_goster ? (a.tur === 'secmeli' ? a.dogru : a.cozum) : '(cozum_goster: true ile görünür)', denetim: 'alistirma_denetle ile denetleyin; cevap gizli bir varyant tabloda da denenir.' }, null, 1));
});

server.registerTool('alistirma_denetle', {
  title: 'Alıştırma denetle',
  description: 'Bir alıştırmanın cevabını Kesit Excel denetçisiyle denetler. Formül alıştırmalarında cevap hem görünen tabloda hem de sayıları değiştirilmiş gizli bir kopyada çözümle karşılaştırılır. Özet tablo alıştırmasında pivot yapısı, Power Query alıştırmasında adım listesi verilir.',
  inputSchema: {
    ders: z.string().regex(/^m\d{1,2}-d\d$/), alistirma: z.string().regex(/^a\d$/),
    formul: z.string().max(SINIR.uzunluk).optional().describe('Formül alıştırması için; alan hedeflerinde ilk hücrenin formülü'),
    pivot: PIVOT.optional().describe('Özet tablo ya da pivot grafik alıştırması için yapı'),
    grafik: GRAFIK_SECENEK.extend({ alan: z.string().regex(/^[A-Z]{1,3}\d+:[A-Z]{1,3}\d+$/).optional(), seriYonu: z.enum(['otomatik', 'sutun', 'satir']).optional() }).optional().describe('Grafik alıştırması: tür ve ayarlar; veri aralığı alan ile (ör. A1:D5). Pivot grafikte pivot ile birlikte verilir'),
    kurallar: z.array(KURAL).max(10).optional().describe('Koşullu biçim alıştırması için kural listesi'),
    pano: z.object({ baslik: z.string().max(120).optional(), dilimler: z.array(z.object({ alan: z.string() })).max(4).optional(), kpi: z.array(z.object({ alan: z.string(), ozet: z.enum(['toplam', 'ortalama', 'say', 'benzersiz']) })).max(4).optional(),
      grafikler: z.array(z.object({ tur: z.string(), yapi: PIVOT })).max(6).optional() }).optional().describe('Pano alıştırması'),
    vba: z.string().max(20000).optional().describe('Makro alıştırması için VBA kodu'),
    secim: z.number().int().min(0).max(9).optional().describe('Çoktan seçmeli soru için seçenek sırası (0\'dan)'),
    dogrulama: z.array(z.object({ tur: z.enum(['liste', 'tamSayi', 'ondalik', 'tarih', 'uzunluk', 'ozel']), alan: z.string().regex(/^[A-Z]{1,3}\d+(:[A-Z]{1,3}\d+)?$/), kaynak: z.string().max(500).optional(), op: z.string().max(14).optional(), d1: z.union([z.number(), z.string().max(200)]).optional(), d2: z.union([z.number(), z.string().max(200)]).optional(), formul: z.string().max(500).optional(), hataStili: z.enum(['durdur', 'uyari', 'bilgi']).optional() })).max(10).optional().describe('Veri doğrulama alıştırması için kurallar'),
    bicim_kodu: z.string().max(200).optional().describe('Özel sayı biçimi alıştırması: Türkçe biçim kodu, ör. #.##0,00 "₺"'),
    hucre: z.string().max(40).optional().describe('Formül denetimi alıştırması: hatalı hücre adres(ler)i'),
    sayi: z.number().optional().describe('Sayı cevaplı soru (ayrıntıya inme)'),
    yeni_ad: z.object({ ad: z.string().max(60), tanim: z.string().max(300) }).optional().describe('Ad tanımlama alıştırması (LAMBDA tanımı dahil: =LAMBDA(x;…))'),
    filtre: z.object({ liste: z.string().max(20), olcut: z.string().max(20).optional(), benzersiz: z.boolean().optional(), hucreler: z.record(z.string().regex(/^[A-Z]{1,3}\d+$/), z.union([z.string().max(200), z.number()])).optional() }).optional().describe('Gelişmiş Filtre alıştırması: liste ve ölçüt aralığı, benzersiz, ölçüt hücrelerine yazılanlar ({ M1: "Kanal", M2: "Web" })'),
    model: z.object({}).passthrough().optional().describe('Hedef Ara {hedefHucre, hedefDeger, degisenHucre}, Veri Tablosu {satirGiris, sutunGiris} ya da Çözücü {amac, yon, degiskenler, kisitlar:[{sol, op, sag}]}'),
    adimlar: z.array(z.object({ tip: z.string() }).passthrough()).max(40).optional().describe('Power Query alıştırması için adımlar, ör. [{ "tip": "ustSatirKaldir", "n": 1 }, { "tip": "basligiYukselt" }]'),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async ({ ders, alistirma, formul, pivot, adimlar, grafik, kurallar, pano, vba, secim, dogrulama, bicim_kodu, hucre, sayi, yeni_ad, filtre, model }) => {
  const d = DERSLER.find(x => x.id === ders); const a = d && d.alistirmalar.find(x => x.id === alistirma);
  if (!a) return hata(`${ders}/${alistirma} bulunamadı.`);
  let r;
  if (a.tur === 'pivot') { if (!pivot) return hata('Bu bir özet tablo alıştırması: pivot parametresi gerekli.'); r = pivotDenetle(a, SAYFALAR, pivot); }
  else if (a.tur === 'sorgu') { if (!adimlar) return hata('Bu bir Power Query alıştırması: adimlar parametresi gerekli.'); r = sorguDenetle(a, SAYFALAR, adimlar); }
  else if (a.tur === 'grafik') { if (!grafik) return hata('Bu bir grafik alıştırması: grafik parametresi gerekli (tur, alan, baslik…).'); const { alan, seriYonu, ...secenek } = grafik; r = grafikAlistirmaDenetle(a, SAYFALAR, { kaynak: a.kaynakSabit ? a.kaynak : { alan: alan || a.kaynak?.alan, seriYonu }, secenek }); }
  else if (a.tur === 'pivotGrafik') { if (!pivot || !grafik) return hata('Pivot grafik alıştırması: pivot ve grafik parametreleri gerekli.'); r = pivotDenetle({ ...a, cozum: a.cozum.yapi }, SAYFALAR, pvTam(pivot)); if (r.tamam) r = grafikAlistirmaDenetle({ ...a, cozum: {} }, SAYFALAR, { kaynak: { pivot: pvTam(pivot) }, secenek: grafik }); }
  else if (a.tur === 'kosullu') { if (!kurallar) return hata('Koşullu biçim alıştırması: kurallar parametresi gerekli.'); r = kosulluDenetle(a, SAYFALAR, kurallar); }
  else if (a.tur === 'pano') { if (!pano) return hata('Pano alıştırması: pano parametresi gerekli.'); r = panoDenetle(a, SAYFALAR, { ...pano, grafikler: (pano.grafikler || []).map(g => ({ ...g, yapi: pvTam(g.yapi) })) }); }
  else if (a.tur === 'makro') { if (!vba) return hata('Makro alıştırması: vba parametresi gerekli.'); r = makroDenetle(a, SAYFALAR, vba); }
  else if (a.tur === 'dogrulama') { if (!dogrulama) return hata('Veri doğrulama alıştırması: dogrulama parametresi gerekli.'); r = dogrulamaDenetle(a, SAYFALAR, dogrulama); }
  else if (a.tur === 'bicim') { if (bicim_kodu == null) return hata('Özel biçim alıştırması: bicim_kodu gerekli.'); r = bicimDenetle(a, SAYFALAR, bicim_kodu); }
  else if (a.tur === 'hucreBul') { if (!hucre) return hata('Formül denetimi alıştırması: hucre gerekli.'); r = hucreBulDenetle(a, hucre); }
  else if (a.tur === 'sayi') { if (sayi == null) return hata('Sayı cevaplı soru: sayi gerekli.'); r = sayiDenetle(a, SAYFALAR, String(sayi)); }
  else if (a.tur === 'gelismisFiltre') { if (!filtre) return hata('Gelişmiş Filtre alıştırması: filtre {liste, olcut, hucreler, benzersiz} gerekli. Ölçüt alanı: ' + a.bolge); r = gelismisFiltreDenetle(a, SAYFALAR, { olcut: '', hucreler: {}, ...filtre }); }
  else if (a.tur === 'ad') { if (!yeni_ad) return hata('Ad tanımlama alıştırması: yeni_ad {ad, tanim} gerekli.'); r = adDenetle(a, SAYFALAR, yeni_ad); }
  else if (['hedefAra', 'veriTablosu', 'cozucu'].includes(a.tur)) { if (!model) return hata('Bu alıştırma model parametresi ister.'); r = ({ hedefAra: hedefAraDenetle, veriTablosu: veriTablosuDenetle, cozucu: cozucuDenetle })[a.tur](a, SAYFALAR, model); }
  else if (a.tur === 'secmeli') { if (secim == null) return hata('Çoktan seçmeli soru: secim parametresi gerekli. Seçenekler: ' + a.secenekler.map((x, i) => i + ') ' + x).join(' | ')); r = secim === a.dogru ? { tamam: true, mesaj: 'Doğru. ' + a.aciklama } : { tamam: false, mesaj: a.yanlisAciklama?.[secim] || 'Bu seçenek değil.' }; }
  else { if (!formul) return hata('Bu bir formül alıştırması: formul parametresi gerekli.'); r = formulDenetle(a, SAYFALAR, formul); }
  return text(JSON.stringify({ tamam: r.tamam, mesaj: r.mesaj, gizliDenemedeYakalandi: !!r.gizli, ipucu: r.tamam ? null : r.ipucu || null, notlar: r.notlar || [], m: r.m || undefined }, null, 1));
});

await server.connect(new StdioServerTransport());
