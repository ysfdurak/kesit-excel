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
import { formulDenetle, pivotDenetle, sorguDenetle, HATA_ACIKLAMA } from '../docs/motor/denetci.js';
import { ISLEV_BILGI, KATEGORILER, islevBul } from '../docs/icerik/islev-bilgi.js';
import { DERSLER, MODULLER } from '../docs/icerik/dersler.js';
import { SAYFALAR } from '../docs/icerik/sayfalar.js';
import { ROLLER } from '../docs/icerik/ekler.js';

const SURUM = '0.1.0';
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
    else { const s = k.sayfa(ad); t.satirlar.forEach((row, i) => row.forEach((v, j) => { if (v != null) s.h.set((i + 1) + ',' + (j + 1), { v }); })); }
  }
  if (ek) { if (ek.satirlar.length * (ek.satirlar[0]?.length || 1) > MAKS_HUCRE) throw new Error('Veri 200.000 hücreden büyük'); ek.satirlar.forEach((row, i) => row.forEach((v, j) => { if (v !== '' && v != null) k.yazGiris(ek.ad, { r: i + 1, c: j + 1 }, String(v)); })); }
  k.hesapla(); return k;
}
const deger = v => v == null ? null : hataMi(v) ? { hata: HATA_TR[v.kod] || v.kod, aciklama: HATA_ACIKLAMA[v.kod] || null } : v;

const server = new McpServer({ name: 'kesit-excel', version: SURUM }, {
  instructions: 'Kesit Excel: Türkçe Excel formül motoru (131 işlev, Türkçe ve İngilizce adlar, dinamik diziler) ve 48 derslik alıştırma seti. ' +
    'Formülü Türkçe (=ETOPLA(A:A;"x";B:B)) ya da İngilizce (=SUMIF(A:A,"x",B:B)) yazabilirsiniz. Hazır sayfalar: ' + Object.keys(SAYFALAR).join(', ') + '. ' +
    'Kendi verinizi satırlar dizisi ya da izinli klasördeki CSV ile verin. Sunucu dosya yazmaz ve ağa çıkmaz.',
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
    hedef: a.hedef || null, hazirlik: a.hazirlik || null, gerekli: a.gerekli ? a.gerekli.map(g => EN_TR[g] || g) : null, ipuclari: a.ipuclari || [],
    cozum: cozum_goster ? a.cozum : '(cozum_goster: true ile görünür)', denetim: 'alistirma_denetle ile denetleyin; cevap gizli bir varyant tabloda da denenir.' }, null, 1));
});

server.registerTool('alistirma_denetle', {
  title: 'Alıştırma denetle',
  description: 'Bir alıştırmanın cevabını Kesit Excel denetçisiyle denetler. Formül alıştırmalarında cevap hem görünen tabloda hem de sayıları değiştirilmiş gizli bir kopyada çözümle karşılaştırılır. Özet tablo alıştırmasında pivot yapısı, Power Query alıştırmasında adım listesi verilir.',
  inputSchema: {
    ders: z.string().regex(/^m\d{1,2}-d\d$/), alistirma: z.string().regex(/^a\d$/),
    formul: z.string().max(SINIR.uzunluk).optional().describe('Formül alıştırması için; alan hedeflerinde ilk hücrenin formülü'),
    pivot: z.object({ satir: z.string().nullable().optional(), sutun: z.string().nullable().optional(), degerler: z.array(z.object({ alan: z.string(), ozet: z.enum(['toplam', 'say', 'ortalama', 'en_buyuk', 'en_kucuk']).optional() })).max(4).optional(),
      filtreler: z.array(z.object({ alan: z.string(), degerler: z.array(z.union([z.string(), z.number()])).max(100) })).max(3).optional(), grupla: z.record(z.string(), z.enum(['ay', 'ceyrek', 'yil'])).optional(),
      goster: z.enum(['deger', 'genelYuzde', 'satirYuzde', 'sutunYuzde']).optional() }).optional().describe('Özet tablo alıştırması için yapı'),
    adimlar: z.array(z.object({ tip: z.string() }).passthrough()).max(40).optional().describe('Power Query alıştırması için adımlar, ör. [{ "tip": "ustSatirKaldir", "n": 1 }, { "tip": "basligiYukselt" }]'),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async ({ ders, alistirma, formul, pivot, adimlar }) => {
  const d = DERSLER.find(x => x.id === ders); const a = d && d.alistirmalar.find(x => x.id === alistirma);
  if (!a) return hata(`${ders}/${alistirma} bulunamadı.`);
  let r;
  if (a.tur === 'pivot') { if (!pivot) return hata('Bu bir özet tablo alıştırması: pivot parametresi gerekli.'); r = pivotDenetle(a, SAYFALAR, pivot); }
  else if (a.tur === 'sorgu') { if (!adimlar) return hata('Bu bir Power Query alıştırması: adimlar parametresi gerekli.'); r = sorguDenetle(a, SAYFALAR, adimlar); }
  else { if (!formul) return hata('Bu bir formül alıştırması: formul parametresi gerekli.'); r = formulDenetle(a, SAYFALAR, formul); }
  return text(JSON.stringify({ tamam: r.tamam, mesaj: r.mesaj, gizliDenemedeYakalandi: !!r.gizli, ipucu: r.tamam ? null : r.ipucu || null, notlar: r.notlar || [], m: r.m || undefined }, null, 1));
});

await server.connect(new StdioServerTransport());
