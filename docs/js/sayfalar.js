// Sayfa görünümleri. Her işlev main içine kendi düğümlerini kurar.
import { h, temizle, bicimli, bildir, yerlestir } from './yardim.js';
import { Izgara } from './izgara.js';
import { PivotAlani } from './pivot-ui.js';
import { SorguAlani } from './sorgu-ui.js';
import { Kitap } from '../motor/kitap.js';
import { alanCoz, adresCoz, EN_TR } from '../motor/formul.js';
import { formulDenetle, pivotDenetle, sorguDenetle } from '../motor/denetci.js';
import { sorguCalistir } from '../motor/sorgu.js';
import { MODULLER, DERSLER } from '../icerik/dersler.js';
import { SAYFALAR } from '../icerik/sayfalar.js';
import { ROLLER, SEVIYE, MULAKAT_GENEL, SOZLUK } from '../icerik/ekler.js';
import { ISLEV_BILGI, KATEGORILER } from '../icerik/islev-bilgi.js';
import * as D from './durum.js';

const dersBul = id => DERSLER.find(d => d.id === id);
const modulBul = id => MODULLER.find(m => m.id === id);
const modulDersleri = m => DERSLER.filter(d => d.modul === m);
const sonraki = id => { const i = DERSLER.findIndex(d => d.id === id); return DERSLER[i + 1] || null; };
const onceki = id => { const i = DERSLER.findIndex(d => d.id === id); return i > 0 ? DERSLER[i - 1] : null; };
const baslikBlok = (ust, baslik, alt) => h('div.page-title', {}, h('span.eyebrow', {}, ust), h('h1', {}, baslik), alt ? h('p.intro.muted', {}, alt) : null);
const link = (hash, metin, sinif = 'btn') => h('a', { href: '#' + hash, sinif }, metin);
const seviyeKod = s => h('span', { sinif: 'level-code ' + s }, { temel: 'TEMEL', orta: 'ORTA', ileri: 'İLERİ' }[s]);

/* ---------------------------------------------------------------- ortak: çalışma kitabı */
function kitapKur(hazirlik, sayfa) {
  const k = new Kitap({ bugun: 45900 });
  for (const [ad, t] of Object.entries(SAYFALAR)) {
    if (t.basliklar) k.tablo(ad, t.basliklar, t.satirlar);
    else { const s = k.sayfa(ad); t.satirlar.forEach((row, i) => row.forEach((v, j) => { if (v != null) s.h.set((i + 1) + ',' + (j + 1), { v }); })); }
  }
  for (const [a, v] of Object.entries(hazirlik || {})) k.yaz(sayfa, a, v);
  k.hesapla(); return k;
}
function boyut(sayfa, ...alanlar) {
  const t = SAYFALAR[sayfa];
  let R = t.satirlar.length + (t.basliklar ? 1 : 0), C = t.basliklar ? t.basliklar.length : Math.max(...t.satirlar.map(r => r.length));
  for (const a of alanlar.filter(Boolean)) { const x = alanCoz(a.includes(':') ? a : a + ':' + a); R = Math.max(R, x.r2); C = Math.max(C, x.c2); }
  return { R, C: C + 1 };
}
const bicimler = sayfa => (SAYFALAR[sayfa].bicim || []);

/* ---------------------------------------------------------------- ana sayfa */
export function anaSayfa(main) {
  const d = D.durum(), biten = DERSLER.filter(x => D.dersBitti(x.id)).length;
  const alSay = Object.values(d.dersler).reduce((n, x) => n + Object.keys(x.a || {}).length, 0);
  const devam = d.son ? dersBul(d.son) : DERSLER[0];
  const rol = ROLLER.find(r => r.id === d.rol);
  yerlestir(main, 
    h('section.family-hero', {},
      h('div.hero-main.article', {}, h('div.stripe', { 'aria-hidden': 'true' }, h('i'), h('i'), h('i')),
        h('span.eyebrow', {}, 'KESİT EXCEL · TÜRKÇE EXCEL, GERÇEK VERİYLE'),
        h('h1', {}, 'Formülü ezberleme, ', h('em', {}, 'veride dene'), '.'),
        h('p', {}, 'Tarayıcıda çalışan bir Excel ızgarası ve Türkçe işlevler. 48 ders, 99 alıştırma; her cevap gördüğünüz tabloda ve sayıları değiştirilmiş gizli bir kopyada denetlenir. Pivot ve Power Query de var. Kurulum ve hesap yok.'),
        h('div.btn-row', {}, link('ders/' + (devam ? devam.id : 'm1-d1'), d.son ? 'Kaldığın yerden devam et' : 'İlk derse başla', 'btn primary'), link('seviye', 'Seviyeni bul (12 soru)', 'btn'), link('atolye', 'Formül atölyesi', 'btn soft'))),
      h('div.today.article', {}, h('h3', {}, 'Bugün'),
        h('div.kpis', {}, h('div', {}, h('strong', {}, biten), h('small', {}, '/ 48 ders')), h('div', {}, h('strong', {}, alSay), h('small', {}, '/ 99 alıştırma')), h('div', {}, h('strong', {}, d.seviye ? modulBul(d.seviye)?.no ?? '–' : '–'), h('small', {}, 'önerilen modül'))),
        devam ? h('a.continue', { href: '#ders/' + devam.id }, h('span.check', { sinif: D.dersBitti(devam.id) ? 'done' : '' }, D.dersBitti(devam.id) ? '✓' : '▸'), h('span', {}, h('b', {}, devam.baslik), h('small', {}, `Modül ${modulBul(devam.modul).no} · ${devam.sure} dk`))) : null,
        h('p', {}, rol ? `Öğrenme yolun: ${rol.ad}. ${rol.dersler.filter(id => D.dersBitti(id)).length}/${rol.dersler.length} ders tamam.` : 'Bir rol seçersen sana uygun ders sırasını gösteririz.'),
        link('yol', rol ? 'Yolumu göster' : 'Rol seç', 'text-link'))),
    h('div.section-head', {}, h('h2', {}, 'Nasıl öğrenilir'), h('p.muted', {}, 'Her ders aynı dört adımı izler.')),
    h('div.learning-loop', {}, [['1', 'Anlat', 'Kısa anlatım: işlev ne yapar, hangi soruyu çözer, nerede yanıltır.'], ['2', 'Gör', 'Canlı örnek: formül hazır, hücrelere tıklayıp başvuruların rengini görün.'], ['3', 'Yap', 'Alıştırma: Satışlar, Personel, Teslimat gibi Kesit verilerinde formülü siz yazarsınız.'], ['4', 'Denetle', 'Cevap gizli bir kopyada da denenir; sonucu elle yazmak ya da $ unutmak yakalanır.']]
      .map(([n, b, t]) => h('div.article', {}, h('span.level-code', {}, n), h('h3', {}, b), h('p', {}, t)))),
    h('div.section-head', {}, h('h2', {}, 'Seviyeler'), h('p.muted', {}, '12 modül, temelden Power Query\'ye.')),
    h('div.climb', {}, ['temel', 'orta', 'ileri'].map(s => {
      const ms = MODULLER.filter(m => m.seviye === s);
      return h('a.stop', { href: '#dersler/' + ms[0].id }, seviyeKod(s), h('h3', {}, ms.map(m => m.baslik).join(' · ')), h('p', {}, ms.map(m => m.ozet).join(' ')), h('small', {}, `${ms.reduce((n, m) => n + modulDersleri(m.id).length, 0)} ders`));
    })),
    h('div.section-head', {}, h('h2', {}, 'Rolüne göre başla'), h('p.muted', {}, 'Her rol için mülakatta ve işte en çok sorulan derslerin sırası.')),
    h('div.role-grid', {}, ROLLER.map(r => h('a.role-card', { href: '#yol/' + r.id, sinif: d.rol === r.id ? 'selected' : '' }, h('span.role-initial', {}, r.harf), h('h3', {}, r.ad), h('p', {}, r.ozet), h('small', {}, r.dersler.length + ' ders →')))),
  );
}

/* ---------------------------------------------------------------- öğrenme yolu */
export function yolSayfasi(main, rolId) {
  if (rolId && ROLLER.find(r => r.id === rolId)) D.rolSec(rolId);
  const rol = ROLLER.find(r => r.id === D.durum().rol);
  yerlestir(main, baslikBlok('ÖĞRENME YOLU', rol ? rol.ad : 'Rolünü seç', rol ? rol.neden : 'Rol seçince derslerin sırası işine göre düzenlenir. İstediğin zaman değiştirebilirsin.'),
    h('div.role-grid', {}, ROLLER.map(r => h('a.role-card', { href: '#yol/' + r.id, sinif: rol && rol.id === r.id ? 'selected' : '' }, h('span.role-initial', {}, r.harf), h('h3', {}, r.ad), h('p', {}, r.ozet)))));
  if (!rol) return;
  yerlestir(main, h('div.section-head', {}, h('h2', {}, 'Sıran'), h('p.muted', {}, `${rol.dersler.filter(D.dersBitti).length}/${rol.dersler.length} tamam. Kalan dersler de Dersler sayfasında.`)),
    h('div.module-row', {}, rol.dersler.map((id, i) => { const x = dersBul(id); return h('a.lesson-row', { href: '#ders/' + id }, h('span.check', { sinif: D.dersBitti(id) ? 'done' : '' }, D.dersBitti(id) ? '✓' : i + 1), h('span', {}, h('b', {}, x.baslik), h('small', {}, `Modül ${modulBul(x.modul).no} · ${modulBul(x.modul).baslik} · ${x.sure} dk`)), h('span.tag', {}, x.alistirmalar.length + ' alıştırma')); })));
}

/* ---------------------------------------------------------------- ders listesi */
export function derslerSayfasi(main, odak) {
  yerlestir(main, baslikBlok('MÜFREDAT', 'Dersler', '12 modül, 48 ders. Sırayla gitmen önerilir ama her ders kendi başına çalışır.'));
  yerlestir(main, h('div.curriculum-table', {}, MODULLER.map(m => {
    const ds = modulDersleri(m.id), biten = ds.filter(x => D.dersBitti(x.id)).length;
    return h('section.module-row', { id: 'modul-' + m.id }, h('div.module-row-head', {}, seviyeKod(m.seviye), h('div', {}, h('h3', {}, `${m.no}. ${m.baslik}`), h('p', {}, m.ozet)), h('span.muted', {}, `${biten}/${ds.length}`)),
      ds.map(x => h('a.lesson-row', { href: '#ders/' + x.id }, h('span.check', { sinif: D.dersBitti(x.id) ? 'done' : '' }, D.dersBitti(x.id) ? '✓' : ''), h('span', {}, h('b', {}, x.baslik), h('small', {}, x.ozet)), h('span.tag', {}, x.sure + ' dk'))));
  })));
  if (odak) setTimeout(() => document.getElementById('modul-' + odak)?.scrollIntoView({ block: 'start' }), 0);
}

/* ---------------------------------------------------------------- ders */
export function dersSayfasi(main, id) {
  const d = dersBul(id); if (!d) { yerlestir(main, baslikBlok('BULUNAMADI', 'Ders yok', 'Bu adreste bir ders yok.'), link('dersler', 'Derslere dön')); return; }
  D.sonDers(id);
  const m = modulBul(d.modul), ileri = sonraki(id), geri = onceki(id);
  const bolumler = [['anlatim', 'Anlatım'], ['ornek', 'Canlı örnek'], ['alistirma', `Alıştırmalar (${d.alistirmalar.length})`], ['hata', 'Sık hata'], ['mulakat', 'Mülakat sorusu']];
  const dersLinkleri = () => modulDersleri(m.id).map(x => h('a', { href: '#ders/' + x.id, sinif: x.id === id ? 'current' : '' }, (D.dersBitti(x.id) ? '✓ ' : '') + x.baslik));
  // Masaüstünde liste açık; telefonda katlanır, ders içeriği ilk ekranda başlar
  const anahat = h('nav.lesson-outline', { 'aria-label': 'Modüldeki dersler' }, h('span.eyebrow', {}, `MODÜL ${m.no}`), h('h3', {}, m.baslik),
    h('div.anahat-tam', {}, dersLinkleri()),
    h('details.anahat-mobil', {}, h('summary', {}, `Modüldeki ${modulDersleri(m.id).length} ders`), dersLinkleri()),
    h('small', {}, 'Bu derste: ' + bolumler.map(b => b[1]).join(' · ')));
  const govde = h('article.lesson-body');
  govde.append(h('span.eyebrow', {}, `DERS ${m.no}.${modulDersleri(m.id).indexOf(d) + 1} · ${d.sure} DAKİKA`), h('h1', {}, d.baslik), h('p.intro', {}, d.ozet),
    h('nav.bolum-git', { 'aria-label': 'Bölüme git' }, bolumler.map(([b, ad]) => h('a.chip', { href: '#ders/' + id + '/' + b, on: { click: e => { e.preventDefault(); document.getElementById('b-' + b)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } } }, ad))),
    h('section.theory.article', { id: 'b-anlatim' }, h('h2', {}, 'Bu derste'), h('ul.objectives', {}, d.hedefler.map(x => h('li', {}, x))), d.anlatim.map(x => h('p', {}, bicimli(x)))),
    h('section.article', { id: 'b-ornek' }, h('h2', {}, 'Canlı örnek'), ornekCiz(d)),
    h('section', { id: 'b-alistirma' }, h('h2', {}, 'Alıştırmalar'), h('p.muted', {}, 'Formülü hedef hücreye (yeşil çerçeve) yazın, Yaz\'a basın, sonra Denetle. Alan hedeflerinde ilk hücreye yazmanız yeter: denetçi formülü alanın tamamına kopyalayıp dener.'), d.alistirmalar.map((a, i) => alistirmaCiz(d, a, i))),
    h('section.callout.warning', { id: 'b-hata' }, h('h2', {}, 'Sık hata'), h('p', {}, h('b', {}, 'Yanlış: '), h('code', {}, d.sikHata.yanlis)), h('p', {}, h('b', {}, 'Doğru: '), h('code', {}, d.sikHata.dogru)), h('p', {}, bicimli(d.sikHata.neden))),
    h('section.question', { id: 'b-mulakat' }, h('span.eyebrow', {}, 'MÜLAKAT SORUSU'), h('h3', {}, d.mulakat.soru), h('details', {}, h('summary', {}, 'Önce kendin cevapla, sonra açıp karşılaştır'), h('p', {}, bicimli(d.mulakat.cevap)))),
    h('nav.ders-gecis', { 'aria-label': 'Dersler arası geçiş' }, geri ? link('ders/' + geri.id, '← ' + geri.baslik, 'btn') : h('span'), ileri ? link('ders/' + ileri.id, ileri.baslik + ' →', 'btn primary') : link('ilerleme', 'İlerlemeni gör →', 'btn primary')));
  yerlestir(main, h('div.lesson-layout', {}, anahat, govde));
}

function ornekCiz(d) {
  const o = d.ornek; if (!o) return null;
  if (o.tur === 'pivot') { const p = new PivotAlani({ tablo: SAYFALAR[o.sayfa], sayfaAd: o.sayfa, yapi: o.yapi }); return [h('p', {}, bicimli(o.aciklama)), p.el]; }
  if (o.tur === 'sorgu') { const q = new SorguAlani({ kaynakAd: o.sayfa, kaynak: SAYFALAR[o.sayfa], kaynaklar: SAYFALAR, adimlar: o.adimlar }); return [h('p', {}, bicimli(o.aciklama)), q.el]; }
  const k = kitapKur(o.hazirlik, o.sayfa); k.yaz(o.sayfa, o.hucre, o.formul); k.hesapla();
  const { R, C } = boyut(o.sayfa, o.hucre, ...Object.keys(o.hazirlik || {}));
  const hedefAd = o.hucre, p0 = adresCoz(hedefAd);
  const iz = new Izgara({ kitap: k, sayfa: o.sayfa, satirSayisi: R, sutunSayisi: C, bicimler: bicimler(o.sayfa), hedef: hedefAd, hedefBicim: o.bicim, ilkSecim: hedefAd, duzenlenebilir: (r, c) => r === p0.r && c === p0.c });
  return [h('p', {}, bicimli(o.aciklama)), h('p.small-note.muted', {}, `Sayfa: ${o.sayfa}. ${hedefAd} hücresindeki formülü değiştirip deneyebilirsiniz; renkli hücreler formülün baktığı yerlerdir.`), iz.el];
}

function alistirmaCiz(d, a, i) {
  const kutu = h('div.question.alistirma', { id: `al-${d.id}-${a.id}` });
  const durumEt = h('span.durum', {}, D.alistirmaBitti(d.id, a.id) ? '✓ Çözüldü' : '');
  const geri = h('div.feedback', { 'aria-live': 'polite', hidden: true });
  const ipucuKutu = h('div.ipucu-kutu');
  let deneme = 0, alan;
  const sonuc = r => {
    geri.hidden = false; geri.className = 'feedback ' + (r.tamam ? 'good' : 'bad'); yerlestir(temizle(geri), h('p', {}, r.mesaj));
    if (r.notlar) for (const n of r.notlar) yerlestir(geri, h('p.small-note', {}, n));
    if (r.m) yerlestir(geri, h('details', {}, h('summary', {}, 'Sorgunuzun M kodu'), h('pre', {}, r.m)));
    if (r.tamam) { D.alistirmaTamam(d.id, a.id); durumEt.textContent = '✓ Çözüldü'; kutu.classList.add('cozuldu'); if (d.alistirmalar.every(x => D.alistirmaBitti(d.id, x.id))) { D.dersTamamla(d.id); bildir('Ders tamamlandı: ' + d.baslik, 'iyi'); } }
    else { deneme++; ipucuGuncelle(); }
  };
  const ipucuGuncelle = () => {
    temizle(ipucuKutu);
    const ip = a.ipuclari || [];
    if (deneme >= 1 && ip.length) yerlestir(ipucuKutu, h('details', {}, h('summary', {}, 'İpucu'), ip.map(x => h('p', {}, bicimli(x)))));
    if (deneme >= 2) yerlestir(ipucuKutu, h('details', {}, h('summary', {}, 'Çözümü göster'), a.tur ? h('pre', {}, JSON.stringify(a.cozum, null, 1)) : h('p', {}, h('code.blok', {}, a.cozum)), a.tur === 'sorgu' ? h('p.small-note', {}, 'Adımlar: ' + a.cozum.map(x => x.tip).join(' → ')) : null));
  };
  let denetle;
  if (a.tur === 'pivot') {
    const p = new PivotAlani({ tablo: SAYFALAR[a.sayfa], sayfaAd: a.sayfa }); alan = p.el;
    denetle = () => sonuc(pivotDenetle(a, SAYFALAR, p.yapi));
  } else if (a.tur === 'sorgu') {
    const q = new SorguAlani({ kaynakAd: a.sayfa, kaynak: SAYFALAR[a.sayfa], kaynaklar: SAYFALAR }); alan = q.el;
    denetle = () => sonuc(sorguDenetle(a, SAYFALAR, q.adimlar));
  } else {
    const k = kitapKur(a.hazirlik, a.sayfa);
    const { R, C } = boyut(a.sayfa, a.hedef, a.okunan, ...Object.keys(a.hazirlik || {}));
    const hd = alanCoz(a.hedef.includes(':') ? a.hedef : a.hedef + ':' + a.hedef);
    const iz = new Izgara({ kitap: k, sayfa: a.sayfa, satirSayisi: R, sutunSayisi: C, bicimler: bicimler(a.sayfa), hedef: a.hedef, okunan: a.okunan, hedefBicim: a.bicim, ilkSecim: a.hedef.split(':')[0],
      duzenlenebilir: (r, c) => r >= hd.r1 && r <= hd.r2 && c >= hd.c1 && c <= hd.c2 });
    alan = iz.el;
    denetle = () => { const f = k.icerik(a.sayfa, hd.r1, hd.c1); sonuc(formulDenetle(a, SAYFALAR, typeof f === 'string' ? f : f == null ? '' : String(f))); };
  }
  yerlestir(kutu, h('div.al-bas', {}, h('span.eyebrow', {}, `ALIŞTIRMA ${i + 1}${a.tur === 'pivot' ? ' · ÖZET TABLO' : a.tur === 'sorgu' ? ' · POWER QUERY' : ''}`), durumEt), h('h3', {}, bicimli(a.soru)),
    a.gerekli ? h('p.small-note.muted', {}, 'Kullanılacak işlev: ' + a.gerekli.map(g => EN_TR[g] || g).join(', ')) : null,
    alan, h('div.btn-row', {}, h('button.btn.primary', { type: 'button', on: { click: () => denetle() } }, 'Denetle')), geri, ipucuKutu);
  if (D.alistirmaBitti(d.id, a.id)) kutu.classList.add('cozuldu');
  return kutu;
}

/* ---------------------------------------------------------------- atölyeler */
export function atolyeSayfasi(main, ilkFormul) {
  const ad = h('select', { id: 'at-sayfa' }, Object.keys(SAYFALAR).map(s => h('option', { value: s }, s)));
  const alan = h('div');
  const kur = () => {
    const s = ad.value, { R, C } = boyut(s); const k = kitapKur({}, s);
    const iz = new Izgara({ kitap: k, sayfa: s, satirSayisi: R, sutunSayisi: C + 3, bicimler: bicimler(s), ilkSecim: 'A1', duzenlenebilir: () => true });
    yerlestir(temizle(alan), iz.el);
    if (ilkFormul) { const hedef = { r: 2, c: C + 1 }; iz.sec(hedef.r, hedef.c, true); iz.giris.value = ilkFormul; iz.uygula(); ilkFormul = null; }
  };
  ad.addEventListener('change', kur);
  yerlestir(main, baslikBlok('ATÖLYE', 'Formül atölyesi', 'Serbest çalışma alanı. Bütün sayfalar burada; değişiklikler kaydedilmez, sayfa yenilenince veri sıfırlanır. Başka sayfaya başvurmak için Ürünler!B2 gibi yazın.'),
    h('div.filters', {}, h('label', { for: 'at-sayfa' }, 'Sayfa '), ad, h('button.btn.tiny', { type: 'button', on: { click: kur } }, 'Sıfırla')), alan);
  kur();
}
export function pivotSayfasi(main) {
  const ad = h('select', { id: 'pv-sayfa' }, Object.entries(SAYFALAR).filter(([, t]) => t.basliklar && !t.ham).map(([s]) => h('option', { value: s }, s)));
  const alan = h('div'); const kur = () => { const p = new PivotAlani({ tablo: SAYFALAR[ad.value], sayfaAd: ad.value }); yerlestir(temizle(alan), p.el); };
  ad.addEventListener('change', kur);
  yerlestir(main, baslikBlok('ATÖLYE', 'Özet tablo atölyesi', 'Satır, sütun, değer ve filtre seçin. Her sayının hangi formülle aynı olduğunu tıklayınca görürsünüz.'), h('div.filters', {}, h('label', { for: 'pv-sayfa' }, 'Kaynak '), ad), alan);
  kur();
}
export function sorguSayfasi(main) {
  const ad = h('select', { id: 'pq-sayfa' }, Object.keys(SAYFALAR).map(s => h('option', { value: s }, s)));
  const alan = h('div'); const kur = () => { const q = new SorguAlani({ kaynakAd: ad.value, kaynak: SAYFALAR[ad.value], kaynaklar: SAYFALAR }); yerlestir(temizle(alan), q.el); };
  ad.addEventListener('change', kur);
  yerlestir(main, baslikBlok('ATÖLYE', 'Power Query atölyesi', 'Bir kaynak seçin, adım ekleyin. Her adımın sonucunu ve Power Query\'nin yazacağı M kodunu görürsünüz. Bayi ve Müşteri ham sayfaları temizlik için hazırlandı.'),
    h('div.filters', {}, h('label', { for: 'pq-sayfa' }, 'Kaynak '), ad), alan);
  ad.value = 'Bayi'; kur();
}

/* ---------------------------------------------------------------- işlev rehberi */
export function islevlerSayfasi(main, ara = '') {
  const kutu = h('input', { type: 'search', id: 'is-ara', placeholder: 'Ara: düşeyara, sumif, tarih…', value: ara, 'aria-label': 'İşlev ara' });
  const kat = h('select', { id: 'is-kat', 'aria-label': 'Kategori' }, h('option', { value: '' }, 'Tüm kategoriler'), Object.entries(KATEGORILER).map(([k, a]) => h('option', { value: k }, a)));
  const liste = h('div.islev-liste');
  const ciz = () => {
    const q = kutu.value.trim().toLocaleLowerCase('tr'), kk = kat.value;
    const x = ISLEV_BILGI.filter(f => (!kk || f.kategori === kk) && (!q || (f.tr + ' ' + f.en + ' ' + f.aciklama).toLocaleLowerCase('tr').includes(q)));
    yerlestir(temizle(liste), h('p.small-note.muted', {}, `${x.length} işlev`), x.map(f => h('article.islev', {}, h('h3', {}, f.tr, h('small', {}, ' ' + f.en + ' · ' + f.kategoriAd)), h('code', {}, f.sozdizimi), h('p', {}, f.aciklama),
      h('p', {}, h('span.muted', {}, 'Örnek (Satışlar): '), h('code', {}, f.ornek), ' ', h('a.text-link', { href: '#atolye/' + encodeURIComponent(f.ornek) }, 'Atölyede dene')),
      dersleri(f.en))));
  };
  const dersleri = en => { const ds = DERSLER.filter(d => d.alistirmalar.some(a => typeof a.cozum === 'string' && new RegExp('\\b' + (EN_TR[en] || en).replace('.', '\\.') + '\\(', 'i').test(a.cozum))).slice(0, 3); return ds.length ? h('p.small-note', {}, 'Derslerde: ', ds.map((d, i) => [i ? ', ' : '', h('a', { href: '#ders/' + d.id }, d.baslik)])) : null; };
  kutu.addEventListener('input', ciz); kat.addEventListener('change', ciz);
  yerlestir(main, baslikBlok('BAŞVURU', 'İşlev rehberi', `${ISLEV_BILGI.length} işlev: Türkçe ad, İngilizce karşılığı, söz dizimi ve Satışlar verisiyle bir örnek. Örneklerin hepsi motorda doğrulandı.`), h('div.filters', {}, kutu, kat), liste,
    h('section.article', {}, h('h2', {}, 'Terimler'), h('dl', {}, SOZLUK.flatMap(([t, a]) => [h('dt', {}, t), h('dd', {}, a)]))));
  ciz();
}

/* ---------------------------------------------------------------- seviye testi */
export function seviyeSayfasi(main) {
  const cevap = new Array(SEVIYE.length).fill(null);
  const sonucKutu = h('div', { 'aria-live': 'polite' });
  const sorular = SEVIYE.map((q, i) => h('fieldset.question', {}, h('legend', {}, h('span.eyebrow', {}, `SORU ${i + 1} · MODÜL ${modulBul(q.m).no}`), h('h3', {}, bicimli(q.s))),
    q.c.map((c, j) => { const id = `sv-${i}-${j}`; return h('label.option', { for: id }, h('input', { type: 'radio', name: 'sv' + i, id, on: { change: () => { cevap[i] = j; } } }), ' ', bicimli(c)); })));
  const bitir = () => {
    const bos = cevap.filter(x => x == null).length; if (bos) { bildir(`${bos} soru cevapsız.`); return; }
    const yanlis = SEVIYE.map((q, i) => cevap[i] === q.d ? null : q).filter(Boolean);
    const ilk = yanlis.length ? yanlis.map(q => modulBul(q.m)).sort((a, b) => a.no - b.no)[0] : MODULLER[MODULLER.length - 1];
    D.seviyeKaydet(ilk.id);
    yerlestir(temizle(sonucKutu), h('div.article', {}, h('h2', {}, `${SEVIYE.length - yanlis.length}/${SEVIYE.length} doğru`),
      h('p', {}, yanlis.length ? `Önerilen başlangıç: Modül ${ilk.no}, ${ilk.baslik}. Daha önceki modülleri hızlıca gözden geçirebilirsin.` : 'Hepsi doğru. Doğrudan son modülün vakasına geç ya da atölyelerde çalış.'),
      yanlis.map(q => h('p.small-note', {}, h('b', {}, 'Yanlış: '), bicimli(q.s), ' → ', bicimli(q.a))),
      link('dersler/' + ilk.id, 'Modül ' + ilk.no + '\'e git', 'btn primary')));
    sonucKutu.scrollIntoView({ behavior: 'smooth' });
  };
  yerlestir(main, baslikBlok('SEVİYE TESTİ', 'Nereden başlamalıyım?', '12 soru, yaklaşık 6 dakika. Sonuç yalnız bu tarayıcıda saklanır.'), sorular, h('button.btn.primary', { type: 'button', on: { click: bitir } }, 'Sonucu göster'), sonucKutu);
}

/* ---------------------------------------------------------------- sık hatalar, mülakat */
export function hatalarSayfasi(main) {
  yerlestir(main, baslikBlok('SIK HATALAR', 'Excel\'de en çok yapılan 48 hata', 'Her dersin en yaygın hatası: yanlış yazım, doğrusu ve nedeni.'),
    MODULLER.map(m => h('section.module-row', {}, h('div.module-row-head', {}, h('h3', {}, `${m.no}. ${m.baslik}`)), modulDersleri(m.id).map(d => h('div.hata-satir', {},
      h('p', {}, h('a', { href: '#ders/' + d.id }, d.baslik)), h('p', {}, '✗ ', h('code', {}, d.sikHata.yanlis)), h('p', {}, '✓ ', h('code', {}, d.sikHata.dogru)), h('p.muted', {}, bicimli(d.sikHata.neden)))))));
}
export function mulakatSayfasi(main) {
  const s = (soru, cevap, kaynak) => h('section.question', {}, kaynak ? h('span.eyebrow', {}, kaynak) : null, h('h3', {}, soru), h('details', {}, h('summary', {}, 'Cevabı aç'), h('p', {}, bicimli(cevap))));
  yerlestir(main, baslikBlok('MÜLAKAT HAZIRLIĞI', 'Excel mülakat soruları', 'Önce kendi cevabını sesli söyle, sonra aç. Cevaplar ezber için değil; bir yaklaşımın gerekçesini anlatmak için.'),
    h('h2', {}, 'Genel'), MULAKAT_GENEL.map(q => s(q.s, q.c)),
    h('h2', {}, 'Konu konu'), DERSLER.map(d => s(d.mulakat.soru, d.mulakat.cevap, `MODÜL ${modulBul(d.modul).no} · ${d.baslik.toLocaleUpperCase('tr')}`)));
}

/* ---------------------------------------------------------------- ilerleme */
export function ilerlemeSayfasi(main) {
  const d = D.durum(), biten = DERSLER.filter(x => D.dersBitti(x.id)).length;
  const dosya = h('input', { type: 'file', id: 'yedek-dosya', accept: 'application/json,.json', hidden: true });
  dosya.addEventListener('change', async () => { const f = dosya.files[0]; if (!f) return; if (f.size > 200000) { bildir('Dosya çok büyük.'); return; } try { D.iceAl(await f.text()); bildir('İlerleme geri yüklendi.', 'iyi'); location.hash = '#ilerleme?' + Date.now(); } catch (e) { bildir(e.message); } });
  const indir = () => { const b = new Blob([D.disaAktar()], { type: 'application/json' }); const u = URL.createObjectURL(b); const a = h('a', { href: u, download: 'kesit-excel-ilerleme.json' }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); };
  yerlestir(main, baslikBlok('İLERLEMEM', `${biten}/48 ders tamam`, 'İlerleme bu tarayıcıda saklanır. Başka cihaza taşımak için yedeği indirip orada geri yükleyin.'),
    h('div.stats', {}, MODULLER.map(m => { const ds = modulDersleri(m.id); const b = ds.filter(x => D.dersBitti(x.id)).length; return h('a.stat', { href: '#dersler/' + m.id }, h('strong', {}, `${b}/${ds.length}`), h('small', {}, `${m.no}. ${m.baslik}`)); })),
    h('div.btn-row', {}, h('button.btn', { type: 'button', on: { click: indir } }, 'Yedeği indir'), h('button.btn', { type: 'button', on: { click: () => dosya.click() } }, 'Yedekten geri yükle'), dosya,
      h('button.btn', { type: 'button', on: { click: () => { if (confirmIki()) { D.sifirla(); location.hash = '#ilerleme?' + Date.now(); } } } }, 'İlerlemeyi sıfırla')));
}
// Tarayıcı onay penceresi yerine iki adımlı onay (iletişim kutusu otomasyonu bozar ve mobilde kaba görünür)
let sifirlaZaman = 0;
function confirmIki() { if (Date.now() - sifirlaZaman < 4000) return true; sifirlaZaman = Date.now(); bildir('Sıfırlamak için düğmeye 4 saniye içinde bir kez daha basın.'); return false; }

/* ---------------------------------------------------------------- veri ve hakkında */
export function veriSayfasi(main) {
  const csv = t => { const q = v => v == null ? '' : /[;"\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v); return [t.basliklar, ...t.satirlar].filter(Boolean).map(r => r.map(q).join(';')).join('\r\n'); };
  const indir = (ad, t) => { const b = new Blob(['﻿' + csv(t)], { type: 'text/csv;charset=utf-8' }); const u = URL.createObjectURL(b); const a = h('a', { href: u, download: ad.toLocaleLowerCase('tr').replace(/\s+/g, '-') + '.csv' }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); };
  yerlestir(main, baslikBlok('VERİ', 'Kesit verileriyle', 'Dersler Kesit ailesinin ortak veri setlerinden alınmış sayfalarla çalışır: Anadolu Market (Kesit SQL), Pusula İK, Lezzet Kurye ve kirli veri tabloları. Kişiler ve şirketler kurgusaldır. Tarihler Excel seri sayısıdır.'),
    Object.entries(SAYFALAR).map(([ad, t]) => h('section.article.veri-kart', {}, h('h3', {}, ad, h('small.muted', {}, ' · ' + t.kaynak)), h('p', {}, t.aciklama),
      h('p.small-note', {}, `${t.satirlar.length} satır${t.basliklar ? ' · Sütunlar: ' + t.basliklar.join(', ') : ' · başlık satırı yok (ham)'}`),
      h('button.btn.tiny', { type: 'button', on: { click: () => indir(ad, t) } }, 'CSV indir (; ayırıcılı, Türkçe Excel için)'))));
}
export function hakkindaSayfasi(main) {
  yerlestir(main, baslikBlok('HAKKINDA', 'Kesit Excel nasıl çalışır?', 'Her şey tarayıcıda çalışır. Sunucu, hesap ve ölçüm yoktur; girdiğiniz formüller cihazdan çıkmaz.'),
    h('section.article', {}, h('h2', {}, 'Formül motoru'), h('p', {}, 'Excel formüllerini okuyan ve hesaplayan motor bu proje için yazıldı (eval kullanmaz). 131 işlev, Türkçe ve İngilizce adlar, ; ve , ayırıcıları, dinamik dizi taşması ve Excel\'in tarih sistemi desteklenir.'),
      h('p', {}, 'Doğruluk LibreOffice Calc ile karşılaştırılarak test edilir: 146 formül LibreOffice\'te hesaplanıp motorun sonucuyla karşılaştırılır; LibreOffice\'te olmayan Excel 365 işlevleri (ÇAPRAZARA, FİLTRE, BENZERSİZ…) ve Türkçe Excel\'e özgü davranışlar 31 elle doğrulanmış vakayla denenir.'),
      h('p', {}, 'Bilinçli farklar: döngüsel başvuru #DÖNGÜ, okunamayan formül #FORMÜL olarak gösterilir (Excel uyarı penceresi açar). Taşan aralığa # ile başvuru, adlandırılmış aralık, Excel Tablosu başvuruları ve dolaylı başvurular (DOLAYLI, KAYDIR) desteklenmez. Dizi sabitlerinde her zaman , sütun, ; satır ayırır.')),
    h('section.article', {}, h('h2', {}, 'Denetçi ve gizli varyant'), h('p', {}, 'Cevabınız iki kez hesaplanır: gördüğünüz tabloda ve satırları karıştırılmış, sayıları ve metin dağılımı değiştirilmiş gizli bir kopyada. Doğru formül ikisinde de çözümle aynı sonucu verir. Sonucu elle yazmak, yanlış hücreye bağlanmak ya da $ işaretini unutmak gizli kopyada yakalanır.')),
    h('section.article', {}, h('h2', {}, 'Lisans'), h('p', {}, 'Kod ve içerik (dersler, veri) PolyForm Shield 1.0.0 lisanslıdır. Kişisel, okul ve şirket içi kullanım ücretsizdir ve izin gerektirmez. Satmak ya da rakip bir ürün yapmak yazılı izne bağlıdır. Kurum olarak kullanıyorsanız GitHub üzerinden haber vermeniz bizi mutlu eder.'),
      h('p', {}, h('a', { href: 'https://github.com/ysfdurak/kesit-excel', target: '_blank', rel: 'noopener' }, 'Kaynak kod ve lisans ↗'))));
}
