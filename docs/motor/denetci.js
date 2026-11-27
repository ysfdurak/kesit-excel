// Kesit Excel · alıştırma denetçisi.
// Öğrencinin formülü iki veriyle hesaplanır: gördüğü tablo ve aynı yapıda gizli bir varyant (sayılar, satır sırası ve
// metinler karıştırılmış). Sonucu elle yazmak ya da yanlış hücreye bağlanmak görünür veride tutsa bile varyantta yakalanır.
import { Kitap, goster } from './kitap.js';
import { ayristir, belirtec, adresCoz, alanCoz, adres, kaydir, hataMi, HATA_TR, yazimBul, islevAdi, EN_TR } from './formul.js';
import { ISLEVLER } from './islevler.js';
import { pivot } from './pivot.js';
import { sorguCalistir, hucreHatali } from './sorgu.js';
import { makroCalistir } from './vba.js';
import { grafikDenetle, aralikVerisi, pivotVerisi } from './grafik.js';
import { kosulluUygula, gorunumOzeti } from './kosullu.js';


// Tohumlu rastgele (mulberry32): aynı tohum aynı varyantı verir, testler tekrarlanabilir.
export function rastgele(tohum) { let a = tohum >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// Varyant: sütun türüne göre bozar. Kimlik sütunları (No, Sicil) ve sabit tutulması istenen sütunlar korunur.
export function varyant(tablo, tohum = 7, { sabit = [], uzat = false } = {}) {
  const r = rastgele(tohum), B = tablo.basliklar, n = tablo.satirlar.length;
  const satirlar = tablo.satirlar.map(s => s.slice());
  const sira = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [sira[i], sira[j]] = [sira[j], sira[i]]; }
  const out = sira.map(i => satirlar[i]);
  B.forEach((ad, c) => {
    if (sabit.includes(ad) || /(^| )(No|Sicil|Kod)$/i.test(ad)) return;
    const bic = (tablo.bicim || [])[c] || '';
    const deg = out.map(s => s[c]);
    const sayisal = deg.filter(v => v != null).every(v => typeof v === 'number');
    if (sayisal) {
      const tarih = /g|a|y|s/.test(bic) && /gg|aa|yy|ss/.test(bic);
      const tam = deg.every(v => v == null || Number.isInteger(v));
      const yuzde = bic.includes('%');
      out.forEach(s => {
        const v = s[c]; if (v == null) return;
        if (tarih) s[c] = Number.isInteger(v) ? v + Math.round((r() - 0.5) * 20) : v + Math.round((r() - 0.5) * 20) + 0; // gün kaydır, saat kısmı korunur
        else if (yuzde) s[c] = v === 0 ? (r() < 0.2 ? 0.05 : 0) : Math.round(Math.min(0.5, v * (0.5 + r())) * 100) / 100;
        else if (tam) s[c] = Math.max(v === 0 ? 0 : 1, Math.round(v * (0.6 + r() * 0.8)));
        else s[c] = Math.round(v * (0.6 + r() * 0.8) * 100) / 100;
      });
    } else {
      // metin: sütunun kendi değerlerinden yeniden örnekle (aynı değer kümesi, farklı sayımlar).
      // Yalnız karıştırmak yetmez: "kaç satır Mobil?" sorusunun cevabı karıştırmayla değişmez.
      const dolu = deg.filter(v => v != null);
      if (dolu.length) out.forEach(s => { if (s[c] != null) s[c] = dolu[Math.floor(r() * dolu.length)]; });
    }
    // Boş hücreler: sütunda hem boş hem dolu varsa bir kısmının durumunu değiştir (boş sayma soruları için)
    const bosSay = out.filter(s => s[c] == null).length;
    if (bosSay > 0 && bosSay < n) {
      const doluD = out.map(s => s[c]).filter(v => v != null);
      out.forEach(s => { if (r() < 0.08) s[c] = s[c] == null ? doluD[Math.floor(r() * doluD.length)] : null; });
    }
  });
  // Satır sayısı da değişsin: ~%5 satır düşer (kalanlar yukarı kayar, sabit aralıklar yine geçerli). "Kaç satır?" sorusunun sabit cevabı tutmaz.
  let kalan = n > 20 ? out.filter(() => r() >= 0.05) : out;
  if (!kalan.length) kalan = out;
  // Makrolar için veri uzar: "For r = 2 To 241" gibi sabit son satır, eklenen satırları atlar ve yakalanır
  if (uzat) { const ek = Math.max(3, Math.ceil(n * 0.1)); for (let i = 0; i < ek; i++) kalan.push(kalan[Math.floor(r() * kalan.length)].slice()); }
  return { ...tablo, satirlar: kalan };
}

function kitapKur(alistirma, tablolar) {
  const k = new Kitap({ bugun: alistirma.bugun ?? 45900 });
  for (const [ad, t] of Object.entries(tablolar)) {
    if (t.basliklar) k.tablo(ad, t.basliklar, t.satirlar); else { const s = k.sayfa(ad); t.satirlar.forEach((row, i) => row.forEach((v, j) => { if (v != null) s.h.set((i + 1) + ',' + (j + 1), { v }); })); k.sifirla(); }
  }
  // Alıştırmanın hazırladığı hücreler (oran, eşik, kategori listesi): hem görünen hem gizli denemede aynı
  for (const [adr, v] of Object.entries(alistirma.hazirlik || {})) k.yaz(alistirma.sayfa, adr, v);
  return k;
}
// Hedef: tek hücre "L2" ya da doldurulacak alan "L2:L241" (ilk hücreye yazılan formül aşağı kaydırılır)
function yerlestir(k, sayfa, hedef, formul) {
  if (hedef.includes(':')) { const a = alanCoz(hedef); const n = a.r2 - a.r1 + 1; for (let i = 0; i < n; i++) k.yaz(sayfa, { r: a.r1 + i, c: a.c1 }, kaydir(formul, i, 0)); }
  else k.yaz(sayfa, hedef, formul);
}
function oku(k, sayfa, hedef, alan) {
  k.hesapla();
  const a = alanCoz(alan || (hedef.includes(':') ? hedef : hedef + ':' + hedef));
  return k.degerler(sayfa, a);
}
function esit(a, b) {
  if (hataMi(a) || hataMi(b)) return hataMi(a) && hataMi(b) && a.kod === b.kod;
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));
  if (a == null) a = 0; if (b == null) b = 0; // boş taşma hücresi ile 0
  return a === b || (typeof a === 'string' && typeof b === 'string' && a.toLocaleLowerCase('tr') === b.toLocaleLowerCase('tr') && false);
}
const izgaraEsit = (x, y) => x.length === y.length && x.every((r, i) => r.length === y[i].length && r.every((v, j) => esit(v, y[i][j])));

function formulBilgisi(f) {
  // kullanılan işlevler (İngilizce iç ad) ve başvuru var mı
  try { const tk = belirtec(f.replace(/^=/, '')); return { islevler: tk.filter(t => t.t === 'fn').map(t => islevAdi(t.v, ISLEVLER)).filter(Boolean), basvuru: tk.some(t => t.t === 'ref'), mutlak: tk.some(t => t.t === 'ref' && (t.ac1 || t.ar1)) }; }
  catch { return { islevler: [], basvuru: false, mutlak: false }; }
}
const trAd = en => EN_TR[en] || en;

// Hata kodları için öğrenciye yol gösteren kısa açıklama
export const HATA_ACIKLAMA = {
  '#DIV/0!': 'Bir sayı sıfıra ya da boş hücreye bölünüyor. Payda hücresini kontrol edin ya da EĞERHATA ile karşılayın.',
  '#N/A': 'Aranan değer listede bulunamadı. Yazım farkı, fazladan boşluk (KIRP) ya da sayı/metin türü farkı olabilir.',
  '#VALUE!': 'İşlem yanlış türde değerle yapılıyor (ör. metin + sayı). Hücrede sayı gibi görünen bir metin olabilir.',
  '#REF!': 'Başvuru geçersiz: silinmiş bir hücreye ya da tablonun dışına (DÜŞEYARA sütun numarası büyük) işaret ediyor.',
  '#NAME?': 'Excel bu adı tanımıyor: işlev adı yanlış yazılmış ya da metin tırnak içine alınmamış.',
  '#NUM!': 'Sayı geçersiz ya da çok büyük (ör. negatifin karekökü, sınırı aşan dizi).',
  '#SPILL!': 'Sonuç birden çok hücreye taşmak istiyor ama yolda dolu hücre var. Alttaki/yandaki hücreleri boşaltın.',
  '#CALC!': 'Dinamik dizi boş sonuç verdi (ör. FİLTRE hiçbir satır bulamadı). Üçüncü bağımsız değişkenle "bulunamadı" yazdırın.',
  '#DÖNGÜ': 'Formül kendi sonucuna bağlı (döngüsel başvuru). Excel bunu uyarıyla gösterir ve genelde 0 yazar.',
  '#FORMÜL': 'Formül yazımı bozuk (parantez, ayırıcı ya da tırnak eksik).',
};

export function formulDenetle(alistirma, tablolar, ogrenciFormul) {
  const sayfa = alistirma.sayfa, hedef = alistirma.hedef;
  const f = String(ogrenciFormul || '').trim();
  if (!f) return { tamam: false, mesaj: 'Hedef hücreye bir formül yazın.' };
  if (!f.startsWith('=')) return { tamam: false, mesaj: 'Formül = ile başlar. Elle yazılan değer veri değişince güncellenmez.', ipucu: 'Başına = koyun.' };
  try { ayristir(f, ISLEVLER); } catch (e) { return { tamam: false, mesaj: 'Formül okunamadı: ' + e.message }; }
  const bilgi = formulBilgisi(f);
  for (const g of alistirma.gerekli || []) if (!bilgi.islevler.includes(g)) return { tamam: false, mesaj: `Bu alıştırmada ${trAd(g)} işlevini kullanın.`, ipucu: alistirma.ipuclari?.[0] };
  for (const y of alistirma.yasak || []) if (bilgi.islevler.includes(y)) return { tamam: false, mesaj: `Bu alıştırmada ${trAd(y)} kullanmadan çözün; amaç başka bir yolu denemek.` };
  const deneme = tabs => {
    const ko = kitapKur(alistirma, tabs), kc = kitapKur(alistirma, tabs);
    yerlestir(ko, sayfa, hedef, f); yerlestir(kc, sayfa, hedef, alistirma.cozum);
    return { o: oku(ko, sayfa, hedef, alistirma.okunan), c: oku(kc, sayfa, hedef, alistirma.okunan) };
  };
  const g = deneme(tablolar);
  if (!izgaraEsit(g.o, g.c)) {
    const ilk = g.o.flat().find(hataMi);
    const fark = (() => { for (let i = 0; i < g.o.length; i++) for (let j = 0; j < g.o[i].length; j++) if (!esit(g.o[i][j], g.c[i][j])) return { i, j }; return null; })();
    let mesaj = ilk ? `Formül ${goster(ilk)} hatası veriyor. ${HATA_ACIKLAMA[ilk.kod] || ''}` : 'Sonuç beklenenle aynı değil.';
    const tek = g.o.length === 1 && g.o[0].length === 1;
    if (!ilk && fark) mesaj += tek ? ` Sizin sonucunuz ${goster(g.o[0][0])}, beklenen ${goster(g.c[0][0])}.` : ` İlk fark ${(() => { const al = alanCoz(alistirma.okunan || (hedef.includes(':') ? hedef : hedef + ':' + hedef)); return adres(al.r1 + fark.i, al.c1 + fark.j); })()} hücresinde: sizin sonucunuz ${goster(g.o[fark.i][fark.j])}, beklenen ${goster(g.c[fark.i][fark.j])}.`;
    if (!ilk && hedef.includes(':') && g.o[0] && esit(g.o[0][0], g.c[0][0])) mesaj += ' İlk satır doğru, aşağıdakiler yanlış: formül aşağı kopyalanınca başvurular doğru kaymıyor. $ işaretlerine bakın (eksik ya da gereksiz $; F4 ile değiştirilir).';
    return { tamam: false, mesaj, ipucu: alistirma.ipuclari?.[0], sizin: g.o, beklenen: g.c };
  }
  // Gizli varyant: aynı yapı, farklı sayılar
  const tv = Object.fromEntries(Object.entries(tablolar).map(([ad, t]) => [ad, t.basliklar && !t.ham && ad === sayfa ? varyant(t, alistirma.tohum ?? 11, { sabit: alistirma.sabitSutunlar || [] }) : t]));
  const v = deneme(tv);
  if (!izgaraEsit(v.o, v.c)) {
    const sabitYazilmis = !bilgi.basvuru;
    return { tamam: false, gizli: true, mesaj: sabitYazilmis
      ? 'Görünen veride sonuç tutuyor ama formülde hiç hücre başvurusu yok: sonucu elle yazmışsınız. Veri değişince yanlış kalır.'
      : 'Görünen veride sonuç tutuyor, ama aynı yapıda farklı sayılarla denediğimiz gizli tabloda tutmadı. Formül bu verinin bir özelliğine (satır sırası, belirli bir hücre, sabit sayı) dayanıyor olabilir.', ipucu: alistirma.ipuclari?.[1] || alistirma.ipuclari?.[0] };
  }
  const notlar = [];
  if (alistirma.cozum && formulBilgisi(alistirma.cozum).islevler.length && !bilgi.islevler.length && bilgi.basvuru) notlar.push('Sonuç doğru. İşlevsiz yazdığınız bu formül uzun listelerde zorlaşır; çözümdeki işleve de bakın.');
  return { tamam: true, mesaj: 'Doğru. Formül hem gördüğünüz tabloda hem de gizli denemede doğru sonuç verdi.', notlar, cozum: alistirma.cozum };
}

const tabloEsit = (a, b, { sirasiz = false } = {}) => {
  if (a.basliklar.length !== b.basliklar.length || a.basliklar.some((h, i) => String(h) !== String(b.basliklar[i]))) return { esit: false, neden: 'Sütunlar farklı: ' + a.basliklar.join(', ') + ' (beklenen: ' + b.basliklar.join(', ') + ')' };
  if (a.satirlar.length !== b.satirlar.length) return { esit: false, neden: `${a.satirlar.length} satır var, ${b.satirlar.length} bekleniyor.` };
  const n = v => hucreHatali(v) ? '#hata' : typeof v === 'number' ? Math.round(v * 1e9) / 1e9 : v ?? null;
  const k = r => JSON.stringify(r.map(n));
  const x = a.satirlar.map(k), y = b.satirlar.map(k);
  if (sirasiz) { x.sort(); y.sort(); }
  const i = x.findIndex((v, j) => v !== y[j]);
  return i < 0 ? { esit: true } : { esit: false, neden: `${i + 1}. satır farklı: ${x[i]} (beklenen ${y[i]})` };
};

export function pivotDenetle(alistirma, tablolar, yapi) {
  let o; try { o = pivot(tablolar[alistirma.sayfa], yapi); } catch (e) { return { tamam: false, mesaj: e.message }; }
  const c = pivot(tablolar[alistirma.sayfa], alistirma.cozum);
  const t = tabloEsit({ basliklar: o.basliklar, satirlar: o.satirlar }, { basliklar: c.basliklar, satirlar: c.satirlar });
  return t.esit ? { tamam: true, mesaj: 'Doğru. Özet tablo beklenen sonucu veriyor.' } : { tamam: false, mesaj: 'Özet tablo beklenenden farklı. ' + t.neden, ipucu: alistirma.ipuclari?.[0] };
}
export function sorguDenetle(alistirma, tablolar, adimlar) {
  const kay = tablolar[alistirma.sayfa];
  const o = sorguCalistir(alistirma.sayfa, kay, adimlar, tablolar), c = sorguCalistir(alistirma.sayfa, kay, alistirma.cozum, tablolar);
  if (o.hata) return { tamam: false, mesaj: `${o.hata.adim + 1}. adım çalışmadı: ${o.hata.mesaj}` };
  if (o.hataSayisi) return { tamam: false, mesaj: `Sonuç tabloda ${o.hataSayisi} hatalı hücre (Error) var. Türü değiştirmeden önce değeri temizleyin ya da hatalı satırları kaldırın.` };
  const t = tabloEsit(o.tablo, c.tablo, { sirasiz: alistirma.sirasiz });
  return t.esit ? { tamam: true, mesaj: 'Doğru. Sorgu beklenen tabloyu üretiyor.', m: o.m } : { tamam: false, mesaj: 'Sonuç tablo beklenenden farklı. ' + t.neden, ipucu: alistirma.ipuclari?.[0] };
}

/* ---------------------------------------------------------------- makro, grafik, koşullu biçim */

// Makro: öğrencinin ve çözümün makrosu aynı kitapta çalışır; okunan alanın değerleri (ve istenirse biçim, MsgBox çıktısı) karşılaştırılır.
export function makroDenetle(alistirma, tablolar, kod) {
  const k = String(kod || '');
  if (!/\bsub\b/i.test(k)) return { tamam: false, mesaj: 'Makro Sub ile başlar: Sub Adı() … End Sub.' };
  for (const g of alistirma.gerekliVba || []) if (!new RegExp('\\b' + g.replace(' ', '\\s+') + '\\b', 'i').test(k.replace(/'.*$/gm, ''))) return { tamam: false, mesaj: `Bu alıştırmada ${g} kullanın.`, ipucu: alistirma.ipuclari?.[0] };
  const calis = (tabs, kd) => { const kt = kitapKur(alistirma, tabs); kt.stiller = new Map(); const r = makroCalistir(kd, kt, { sayfa: alistirma.sayfa, girdiler: alistirma.girdiler }); return { kt, r }; };
  const karsilastir = (tabs) => {
    const o = calis(tabs, k), c = calis(tabs, alistirma.cozum);
    if (!o.r.tamam) return { tamam: false, mesaj: `Makro ${o.r.hata.satir ? o.r.hata.satir + '. satırda ' : ''}durdu: ${o.r.hata.mesaj}` };
    if (!c.r.tamam) throw new Error('Çözüm makrosu çalışmadı: ' + c.r.hata.mesaj);
    const al = { ...alanCoz(alistirma.okunan) };
    // Okunan alan veriyle birlikte uzar (gizli kopya görünen tablodan uzun olabilir)
    const tb = tabs[alistirma.sayfa]; if (tb && tb.basliklar && al.r2 > 2) al.r2 = Math.max(al.r2, tb.satirlar.length + 1);
    const ov = o.kt.degerler(alistirma.sayfa, al), cv = c.kt.degerler(alistirma.sayfa, al);
    for (let i = 0; i < ov.length; i++) for (let j = 0; j < ov[i].length; j++) if (!esit(ov[i][j], cv[i][j])) return { tamam: false, fark: true, mesaj: `${adres(al.r1 + i, al.c1 + j)} hücresinde sonucunuz ${goster(ov[i][j]) || '(boş)'}, beklenen ${goster(cv[i][j]) || '(boş)'}.` };
    if (alistirma.stilKontrol) {
      for (let r = al.r1; r <= al.r2; r++) for (let c2 = al.c1; c2 <= al.c2; c2++) {
        const key = alistirma.sayfa + '!' + r + ',' + c2, so = o.kt.stiller.get(key) || {}, sc = c.kt.stiller.get(key) || {};
        for (const p of alistirma.stilKontrol) if ((so[p] ?? null) !== (sc[p] ?? null) && !(p === 'kalin' && !so[p] && !sc[p])) return { tamam: false, fark: true, mesaj: `${adres(r, c2)} hücresinin biçimi beklenenden farklı (${{ kalin: 'kalın yazı', dolgu: 'dolgu rengi', sayiBicimi: 'sayı biçimi', yaziRenk: 'yazı rengi' }[p]}).` };
      }
    }
    if (alistirma.ciktiKontrol) { const a = o.r.cikti.filter(x => x.tur === 'msgbox').map(x => x.metin), b = c.r.cikti.filter(x => x.tur === 'msgbox').map(x => x.metin); if (a.join('\n') !== b.join('\n')) return { tamam: false, fark: true, mesaj: `MsgBox çıktısı farklı: "${a.join(' / ') || '(yok)'}", beklenen "${b.join(' / ')}".` }; }
    return { tamam: true, cikti: o.r.cikti };
  };
  const g = karsilastir(tablolar);
  if (!g.tamam) return { ...g, ipucu: alistirma.ipuclari?.[0] };
  if (!alistirma.varyantsiz) {
    const tv = Object.fromEntries(Object.entries(tablolar).map(([ad, t]) => [ad, t.basliklar && !t.ham && ad === alistirma.sayfa ? varyant(t, alistirma.tohum ?? 11, { sabit: alistirma.sabitSutunlar || [], uzat: true }) : t]));
    const v = karsilastir(tv);
    if (!v.tamam) return { tamam: false, gizli: true, mesaj: 'Görünen veride doğru çalıştı ama satır sayısı ve değerleri farklı gizli bir kopyada tutmadı. Son satırı sabit yazmış olabilirsiniz (241 yerine Cells(Rows.Count, 1).End(xlUp).Row kullanın) ya da sonucu elle yazmış olabilirsiniz. ' + v.mesaj, ipucu: alistirma.ipuclari?.[1] || alistirma.ipuclari?.[0] };
  }
  return { tamam: true, mesaj: 'Doğru. Makro hem gördüğünüz tabloda hem de farklı uzunluktaki gizli kopyada doğru sonuç verdi.', cikti: g.cikti };
}

// Grafik: { veriKaynagi: { alan } ya da { pivot }, secenek } → kurallar + veri karşılaştırması
export function grafikVerisiAl(tablolar, sayfa, kaynak, hazirlik) {
  if (kaynak.pivot) return pivotVerisi(pivot(tablolar[sayfa], kaynak.pivot));
  const kt = kitapKur({ sayfa, hazirlik }, tablolar);
  const al = alanCoz(kaynak.alan); if (!al) throw new Error('Geçersiz veri aralığı');
  const t = tablolar[sayfa];
  return aralikVerisi(kt.degerler(sayfa, al), { seriYonu: kaynak.seriYonu || 'otomatik', bicimler: (t.bicim || []).slice(al.c1 - 1, al.c2) });
}
export function grafikAlistirmaDenetle(alistirma, tablolar, cevap) {
  let veri, beklenen;
  try { veri = grafikVerisiAl(tablolar, alistirma.sayfa, cevap.kaynak, alistirma.hazirlik); } catch (e) { return { tamam: false, mesaj: e.message }; }
  if (alistirma.cozum.kaynak) beklenen = grafikVerisiAl(tablolar, alistirma.sayfa, alistirma.cozum.kaynak, alistirma.hazirlik);
  return grafikDenetle(alistirma.kural || {}, veri, cevap.secenek || {}, beklenen);
}

// Koşullu biçim: kuralların işaretlediği hücreler görünen ve gizli veride çözümle aynı olmalı
export function kosulluDenetle(alistirma, tablolar, kurallar) {
  if (!kurallar || !kurallar.length) return { tamam: false, mesaj: 'Önce bir kural ekleyin.' };
  const dene = tabs => {
    const k1 = kitapKur(alistirma, tabs), k2 = kitapKur(alistirma, tabs);
    let a; try { a = gorunumOzeti(kosulluUygula(k1, alistirma.sayfa, kurallar)); } catch (e) { return { hata: e.message }; }
    const b = gorunumOzeti(kosulluUygula(k2, alistirma.sayfa, alistirma.cozum));
    const anah = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const x of [...anah].sort((p, q) => { const [r1, c1] = p.split(',').map(Number), [r2, c2] = q.split(',').map(Number); return r1 - r2 || c1 - c2; })) {
      if ((a[x] || '') !== (b[x] || '')) { const [r, c] = x.split(',').map(Number); return { fark: `${adres(r, c)}: ${b[x] && !a[x] ? 'bu hücre biçimlenmeliydi' : !b[x] && a[x] ? 'bu hücre biçimlenmemeliydi' : 'biçim beklenenden farklı'}` }; }
    }
    return {};
  };
  const g = dene(tablolar);
  if (g.hata) return { tamam: false, mesaj: g.hata };
  if (g.fark) return { tamam: false, mesaj: 'Biçimlenen hücreler beklenenden farklı. İlk fark ' + g.fark + '.', ipucu: alistirma.ipuclari?.[0] };
  if (!alistirma.varyantsiz) {
    const tv = Object.fromEntries(Object.entries(tablolar).map(([ad, t]) => [ad, t.basliklar && !t.ham && ad === alistirma.sayfa ? varyant(t, alistirma.tohum ?? 11) : t]));
    const v = dene(tv);
    if (v.fark) return { tamam: false, gizli: true, mesaj: 'Görünen veride doğru ama gizli kopyada tutmadı: kural formülündeki $ işaretlerine bakın (sütun sabit, satır serbest olmalı) ya da eşik sabit yazılmış olabilir. ' + v.fark, ipucu: alistirma.ipuclari?.[1] };
  }
  return { tamam: true, mesaj: 'Doğru. Kural hem gördüğünüz tabloda hem de gizli kopyada aynı hücreleri biçimlendiriyor.' };
}

// Pano: KPI değeri (dilimleyici filtreleriyle) ve pano yapısının soruya uygunluğu
export function panoKpi(tablo, k, filtreler = []) {
  const B = tablo.basliklar, i = B.indexOf(k.alan); if (i < 0) return null;
  const fs = filtreler.filter(f => f.degerler && f.degerler.length).map(f => ({ i: B.indexOf(f.alan), d: f.degerler }));
  const rows = tablo.satirlar.filter(r => fs.every(f => f.d.includes(r[f.i])));
  const v = rows.map(r => r[i]).filter(x => x != null && x !== '');
  if (k.ozet === 'say') return v.length;
  if (k.ozet === 'benzersiz') return new Set(v.map(x => typeof x === 'string' ? x.toLocaleLowerCase('tr') : x)).size;
  const s = v.filter(x => typeof x === 'number');
  if (k.ozet === 'ortalama') return s.length ? s.reduce((a, b) => a + b, 0) / s.length : null;
  return s.reduce((a, b) => a + b, 0);
}
// alistirma.kural: { dilimler:[alan], kpi:[{alan, ozet}], grafikler:[{satir, deger?, ozet?, turler?}], enAzGrafik, baslikGerekli }
export function panoDenetle(alistirma, tablolar, pano) {
  const k = alistirma.kural || {}, p = pano || {};
  const dil = (p.dilimler || []).map(d => d.alan), gr = p.grafikler || [], kp = p.kpi || [];
  if (k.baslikGerekli && !String(p.baslik || '').trim()) return { tamam: false, mesaj: 'Panonun bir başlığı olmalı: kim, ne için bakıyor? (ör. "Satış panosu · 2024")' };
  for (const a of k.dilimler || []) if (!dil.includes(a)) return { tamam: false, mesaj: `"${a}" dilimleyicisi eksik: yönetici bu alana göre süzmek istiyor.` };
  for (const x of k.kpi || []) if (!kp.some(y => y.alan === x.alan && (!x.ozet || y.ozet === x.ozet))) return { tamam: false, mesaj: `KPI eksik: ${x.alan} (${x.ozet || 'herhangi bir özet'}).` };
  if (k.enAzGrafik && gr.length < k.enAzGrafik) return { tamam: false, mesaj: `Panoda en az ${k.enAzGrafik} grafik olmalı; şu an ${gr.length}.` };
  for (const x of k.grafikler || []) {
    const g = gr.find(y => y.yapi?.satir === x.satir && (x.deger === undefined || (y.yapi.degerler?.[0]?.alan || null) === x.deger) && (!x.ozet || y.yapi.degerler?.[0]?.ozet === x.ozet));
    if (!g) return { tamam: false, mesaj: `"${x.satir}" kırılımında ${x.deger ? x.deger + ' değerini gösteren' : 'bir'} grafik eksik.` };
    if (x.turler && !x.turler.includes(g.tur)) return { tamam: false, mesaj: x.turNeden || `"${x.satir}" grafiği için tür uygun değil.` };
    if (alistirma.sayfa && tablolar) { try { pivot(tablolar[alistirma.sayfa], g.yapi); } catch (e) { return { tamam: false, mesaj: e.message }; } }
  }
  if ((k.enCokGrafik ?? 4) < gr.length) return { tamam: false, mesaj: `Panoda ${gr.length} grafik var; tek bakışta okunması için en çok ${k.enCokGrafik ?? 4}.` };
  return { tamam: true, mesaj: 'Doğru. Pano soruyu cevaplıyor: dilimleyiciler bütün kartları birlikte süzüyor.' };
}
