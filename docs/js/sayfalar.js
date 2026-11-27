// Sayfa görünümleri. Her işlev main içine kendi düğümlerini kurar.
import { h, temizle, bicimli, bildir, yerlestir } from './yardim.js';
import { Izgara } from './izgara.js';
import { PivotAlani } from './pivot-ui.js';
import { SorguAlani } from './sorgu-ui.js';
import { GrafikAlani, svgDugum, ipucuBagla, genislikBul } from './grafik-ui.js';
import { KosulluAlani } from './kosullu-ui.js';
import { MakroAlani } from './makro-ui.js';
import { PanoAlani } from './pano-ui.js';
import { Kitap } from '../motor/kitap.js';
import { ISLEVLER } from '../motor/islevler.js';
import { pivot } from '../motor/pivot.js';
import { alanCoz, adresCoz, EN_TR } from '../motor/formul.js';
import { formulDenetle, pivotDenetle, sorguDenetle, makroDenetle, grafikAlistirmaDenetle, kosulluDenetle, panoDenetle, kitapKur as denetciKitap, gelismisFiltreDenetle, birlestirDenetle, dogrulamaDenetle, bicimDenetle, hucreBulDenetle, sayiDenetle, hedefAraDenetle, veriTablosuDenetle, cozucuDenetle, adDenetle } from '../motor/denetci.js';
import { DogrulamaAlani, BicimAlani, HedefAraAlani, VeriTablosuAlani, SenaryoAlani, CozucuAlani, GelismisFiltreAlani, BirlestirAlani } from './model-ui.js';
import { aralikVerisi, grafikCiz as grafikCizMotor } from '../motor/grafik.js';
import { sorguCalistir } from '../motor/sorgu.js';
import { MODULLER, DERSLER } from '../icerik/dersler.js';
import { SAYFALAR } from '../icerik/sayfalar.js';
import { ROLLER, SEVIYE, MULAKAT_GENEL, SOZLUK } from '../icerik/ekler.js';
import { ISLEV_BILGI, KATEGORILER } from '../icerik/islev-bilgi.js';
import * as D from './durum.js';

const dersBul = id => DERSLER.find(d => d.id === id);
const alistirmaYonergesi = d => {
  const t = new Set(d.alistirmalar.map(a => a.tur || 'formul'));
  if (t.has('dogrulama')) return 'Kuralı ekleyin, tablodaki "Geçersiz verileri işaretle" ile mevcut veriyi görün, kural alanındaki bir hücreye değer yazarak deneyin, sonra Denetle. Denetçi mevcut verideki geçersiz hücreleri ve deneme girişlerini çözümle karşılaştırır.';
  if (t.has('birlestir')) return 'Birleştir kutusuna her ayın aralığını ekleyin, işlevi ve etiket kutularını seçin, Tamam ile sonucu görün, sonra Denetle.';
  if (t.has('gelismisFiltre')) return 'Ölçütleri tablodaki açık (düzenlenebilir) alana yazın: ilk satıra başlıklar, altına koşullar. Gelişmiş Filtre kutusuna liste ve ölçüt aralığını yazıp Tamam ile sonucu görün, sonra Denetle.';
  if (t.has('hedefAra') || t.has('cozucu') || t.has('veriTablosu')) return 'Aracın kutularını doldurup çalıştırın; tablo yeniden hesaplanır. Sonra Denetle: denetçi seçtiğiniz hücreleri ve bulunan sonucu çözümle karşılaştırır.';
  if (t.has('bicim')) return 'Biçim kodunu yazın; önizleme tablosu her değerin nasıl görüneceğini gösterir. Sonra Denetle.';
  if (t.has('hucreBul')) return 'Formül denetimi düğmeleriyle (Etkileyenleri izle, Formülü değerlendir) hatanın kaynağını bulun ve hücre adresini yazın.';
  if (t.has('makro')) return 'Makroyu düzenleyiciye yazın, Çalıştır ile sonucu tabloda görün, sonra Denetle. Denetçi makroyu görünen tabloda ve satır sayısı farklı gizli bir kopyada çalıştırır.';
  if (t.has('grafik') || t.has('pivotGrafik') || t.has('pano')) return 'Grafiği soruya göre kurun, sonra Denetle. Denetçi türü, veri aralığını ve ayarları (eksen, yığın, başlık) kontrol eder.';
  if (t.has('kosullu')) return 'Kural yöneticisinden kuralı ekleyin, tabloda sonucu görün, sonra Denetle. Kural gizli bir kopyada da denenir.';
  if (t.size === 1 && t.has('secmeli')) return 'Bir seçenek işaretleyip Denetle\'ye basın.';
  return 'Formülü hedef hücreye (yeşil çerçeve) yazın, Yaz\'a basın, sonra Denetle. Alan hedeflerinde ilk hücreye yazmanız yeter: denetçi formülü alanın tamamına kopyalayıp dener.';
};
const ATOLYELER = [['atolye', 'Formül'], ['pivot', 'Özet tablo'], ['sorgu', 'Power Query'], ['gorsel', 'Görselleştirme'], ['makro', 'Makro (VBA)']];
const atolyeGecis = aktif => h('nav.atolye-gecis', { 'aria-label': 'Atölyeler' }, ATOLYELER.map(([k, a]) => k === aktif ? h('span.cip.secili', { 'aria-current': 'page' }, a) : h('a.cip', { href: '#' + k }, a)));
const ALISTIRMA_SAYISI = DERSLER.reduce((n, d) => n + d.alistirmalar.length, 0);
const modulBul = id => MODULLER.find(m => m.id === id);
const modulDersleri = m => DERSLER.filter(d => d.modul === m);
const sonraki = id => { const i = DERSLER.findIndex(d => d.id === id); return DERSLER[i + 1] || null; };
const onceki = id => { const i = DERSLER.findIndex(d => d.id === id); return i > 0 ? DERSLER[i - 1] : null; };
const baslikBlok = (ust, baslik, alt) => h('div.page-title', {}, h('span.eyebrow', {}, ust), h('h1', {}, baslik), alt ? h('p.intro.muted', {}, alt) : null);
const link = (hash, metin, sinif = 'btn') => h('a', { href: '#' + hash, sinif }, metin);
const seviyeKod = s => h('span', { sinif: 'level-code ' + s }, { temel: 'TEMEL', orta: 'ORTA', ileri: 'İLERİ' }[s]);

/* ---------------------------------------------------------------- ortak: çalışma kitabı */
// Denetçiyle aynı kitap: hazırlık hücreleri, Ad Yöneticisi adları ve sayfaya yerleşmiş özet tablolar (ÖZETVERİAL)
function kitapKur(hazirlik, sayfa, a = {}) {
  const k = denetciKitap({ sayfa, hazirlik, adlar: a.adlar, pivotlar: a.pivotlar }, SAYFALAR);
  k.hesapla(); return k;
}
// Formül alıştırması ve örneğine ek parçalar: form denetimleri (bağlı hücre), grafik önizleme, Ad Yöneticisi listesi
function formulEkleri(a, k, iz) {
  const parcalar = [];
  if (a.adlar) parcalar.push(h('details.ad-yonetici', {}, h('summary', {}, `Ad Yöneticisi (${Object.keys(a.adlar).length} ad)`), h('table.veri', {}, h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Ad'), h('th', { scope: 'col' }, 'Başvurur'))), h('tbody', {}, Object.entries(a.adlar).map(([ad, t]) => h('tr', {}, h('td', {}, h('code', {}, ad)), h('td', {}, h('code', {}, t)))))), h('p.small-note.muted', {}, 'Formülde adı yazmanız yeter: =TOPLA(Adet_Alanı). Excel\'de Formüller > Ad Yöneticisi.')));
  let grafikKap = null;
  const grafikCizim = () => {
    if (!grafikKap) return;
    try {
      const al = alanCoz(a.grafik.alan), v = aralikVerisi(k.degerler(a.sayfa, al), { seriYonu: 'sutun' });
      if (!v.kategoriler.length) { yerlestir(temizle(grafikKap), h('p.small-note.muted', {}, 'Grafik, formül sonuç verince çizilir.')); return; }
      const kap = h('div', {}, svgDugum(grafikCizMotor(v, { tur: a.grafik.tur || 'sutun', baslik: a.grafik.baslik || '', genislik: genislikBul(grafikKap, 640), yukseklik: 280, gosterge: 'alt' })));
      yerlestir(temizle(grafikKap), kap); ipucuBagla(kap);
    } catch (e) { yerlestir(temizle(grafikKap), h('p.small-note.muted', {}, 'Grafik henüz çizilemiyor: ' + e.message)); }
  };
  const yenile = () => { k.hesapla(); iz.guncelle(); iz.hucreBilgisi(); grafikCizim(); };
  if (a.denetimler) {
    const el = h('div.form-denetim', { role: 'group', 'aria-label': 'Form denetimleri' }, h('span.small-note.muted', {}, 'Form denetimleri:'), a.denetimler.map(dn => {
      const ilk = k.icerik(a.sayfa, adresCoz(dn.hucre).r, adresCoz(dn.hucre).c);
      const yaz = v => { k.yaz(a.sayfa, dn.hucre, v); yenile(); };
      const etiket = `${dn.etiket} → ${dn.hucre}`;
      if (dn.tur === 'acilan') { const l = String(dn.liste).split(';'); return h('label', {}, etiket + ' ', h('select', { on: { change: e => yaz(Number(e.target.value)) } }, l.map((x, i) => h('option', { value: String(i + 1), selected: i + 1 === ilk }, x)))); }
      if (dn.tur === 'onay') return h('label', {}, h('input', { type: 'checkbox', checked: ilk === true, on: { change: e => yaz(e.target.checked) } }), etiket);
      if (dn.tur === 'kaydirma') { const cikti = h('output', {}, String(ilk ?? dn.min)); return h('label', {}, etiket + ' ', h('input', { type: 'range', min: dn.min, max: dn.max, step: dn.adim || 1, value: ilk ?? dn.min, on: { input: e => { cikti.textContent = e.target.value; yaz(Number(e.target.value)); } } }), cikti); }
      if (dn.tur === 'secenek') return h('span', { role: 'radiogroup', 'aria-label': dn.etiket }, dn.etiket + ': ', dn.secenekler.map((x, i) => h('label', {}, h('input', { type: 'radio', name: 'fd' + a.id + dn.hucre, checked: ilk === i + 1, on: { change: () => yaz(i + 1) } }), x)));
      return null;
    }), h('span.small-note.muted', {}, 'Denetim bağlı hücreye değer yazar; formülünüz o hücreye bakarak sonucu değiştirmeli.'));
    parcalar.push(el);
  }
  if (a.grafik) { grafikKap = h('div.grafik-onizleme', { 'aria-live': 'polite' }); parcalar.push(h('div', {}, h('b', {}, 'Grafik önizleme · ' + a.grafik.alan), grafikKap)); setTimeout(grafikCizim, 0); }
  const onceki = iz.s.onDegis; iz.s.onDegis = () => { if (onceki) onceki(); grafikCizim(); };
  return parcalar;
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
        h('p', {}, `Tarayıcıda çalışan bir Excel ızgarası ve Türkçe işlevler. ${DERSLER.length} ders, ${ALISTIRMA_SAYISI} alıştırma; her cevap gördüğünüz tabloda ve sayıları değiştirilmiş gizli bir kopyada denetlenir. Pivot, Power Query, grafik, pano, VBA makro, veri doğrulama, finans, Çözücü, LAMBDA ve Gelişmiş Filtre de var. Kurulum ve hesap yok.`),
        h('div.btn-row', {}, link('ders/' + (devam ? devam.id : 'm1-d1'), d.son ? 'Kaldığın yerden devam et' : 'İlk derse başla', 'btn primary'), link('seviye', `Seviyeni bul (${SEVIYE.length} soru)`, 'btn'), link('atolye', 'Formül atölyesi', 'btn soft'))),
      h('div.today.article', {}, h('h3', {}, 'Bugün'),
        h('div.kpis', {}, h('div', {}, h('strong', {}, biten), h('small', {}, `/ ${DERSLER.length} ders`)), h('div', {}, h('strong', {}, alSay), h('small', {}, `/ ${ALISTIRMA_SAYISI} alıştırma`)), h('div', {}, h('strong', {}, d.seviye ? modulBul(d.seviye)?.no ?? '–' : '–'), h('small', {}, 'önerilen modül'))),
        devam ? h('a.continue', { href: '#ders/' + devam.id }, h('span.check', { sinif: D.dersBitti(devam.id) ? 'done' : '' }, D.dersBitti(devam.id) ? '✓' : '▸'), h('span', {}, h('b', {}, devam.baslik), h('small', {}, `Modül ${modulBul(devam.modul).no} · ${devam.sure} dk`))) : null,
        h('p', {}, rol ? `Öğrenme yolun: ${rol.ad}. ${rol.dersler.filter(id => D.dersBitti(id)).length}/${rol.dersler.length} ders tamam.` : 'Bir rol seçersen sana uygun ders sırasını gösteririz.'),
        link('yol', rol ? 'Yolumu göster' : 'Rol seç', 'text-link'))),
    h('div.section-head', {}, h('h2', {}, 'Nasıl öğrenilir'), h('p.muted', {}, 'Her ders aynı dört adımı izler.')),
    h('div.learning-loop', {}, [['1', 'Anlat', 'Kısa anlatım: işlev ne yapar, hangi soruyu çözer, nerede yanıltır.'], ['2', 'Gör', 'Canlı örnek: formül hazır, hücrelere tıklayıp başvuruların rengini görün.'], ['3', 'Yap', 'Alıştırma: Satışlar, Personel, Teslimat gibi Kesit verilerinde formülü siz yazarsınız.'], ['4', 'Denetle', 'Cevap gizli bir kopyada da denenir; sonucu elle yazmak ya da $ unutmak yakalanır.']]
      .map(([n, b, t]) => h('div.article', {}, h('span.level-code', {}, n), h('h3', {}, b), h('p', {}, t)))),
    h('div.section-head', {}, h('h2', {}, 'Seviyeler'), h('p.muted', {}, `${MODULLER.length} modül, temelden pano, makro ve Çözücü'ye.`)),
    h('div.climb', {}, ['temel', 'orta', 'ileri'].map(s => {
      const ms = MODULLER.filter(m => m.seviye === s);
      return h('a.stop', { href: '#dersler/' + ms[0].id }, seviyeKod(s), h('h3', {}, `${ms.length} modül · ${ms.reduce((n, m) => n + modulDersleri(m.id).length, 0)} ders`), h('ul.stop-liste', {}, ms.map(m => h('li', {}, `${m.no}. ${m.baslik}`))));
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
  const kucuk = t => t.toLocaleLowerCase('tr');
  // İlk bitmemiş modül açık gelir; diğerleri başlık ve ilerlemeyle katlı durur (telefonda 111 ders tek sayfada 16.000 px'ti)
  const acik = odak || (MODULLER.find(m => modulDersleri(m.id).some(x => !D.dersBitti(x.id))) || MODULLER[0]).id;
  const kutu = h('input', { type: 'search', placeholder: 'Ders ara: düşeyara, pivot, tarih…', 'aria-label': 'Ders ara' });
  let seviye = '';
  const sev = h('div.seviye-cip', { role: 'group', 'aria-label': 'Seviye' }, [['', 'Tümü'], ['temel', 'Temel'], ['orta', 'Orta'], ['ileri', 'İleri']].map(([k, a]) => h('button.chip', { type: 'button', 'aria-pressed': String(!k), veri: { k }, on: { click: e => { seviye = k; sev.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === e.currentTarget))); suz(); } } }, a)));
  const sayac = h('p.small-note.muted', { 'aria-live': 'polite' });
  const moduller = MODULLER.map(m => {
    const ds = modulDersleri(m.id), biten = ds.filter(x => D.dersBitti(x.id)).length;
    const satirlar = ds.map(x => h('a.lesson-row', { href: '#ders/' + x.id, veri: { ara: kucuk(x.baslik + ' ' + x.ozet) } }, h('span.check', { sinif: D.dersBitti(x.id) ? 'done' : '' }, D.dersBitti(x.id) ? '✓' : ''), h('span', {}, h('b', {}, x.baslik), h('small', {}, x.ozet)), h('span.tag', {}, x.sure + ' dk')));
    const det = h('details.module-row', { id: 'modul-' + m.id, open: m.id === acik, veri: { seviye: m.seviye, ara: kucuk(m.baslik + ' ' + m.ozet) } },
      h('summary.module-row-head', {}, seviyeKod(m.seviye), h('div', {}, h('h3', {}, `${m.no}. ${m.baslik}`), h('p', {}, m.ozet)), h('span.muted', {}, `${biten}/${ds.length}`)), satirlar);
    return det;
  });
  const suz = () => {
    const q = kucuk(kutu.value.trim()); let n = 0;
    moduller.forEach(det => {
      const uygun = !seviye || det.dataset.seviye === seviye, modulEs = q && det.dataset.ara.includes(q);
      let es = 0;
      det.querySelectorAll('.lesson-row').forEach(a => { const g = uygun && (!q || modulEs || a.dataset.ara.includes(q)); a.hidden = !g; if (g) es++; });
      det.hidden = !es; n += es;
      if (q) det.open = es > 0;
    });
    sayac.textContent = q || seviye ? `${n} ders` : '';
  };
  kutu.addEventListener('input', suz);
  const hepsi = h('button.chip', { type: 'button', on: { click: () => { const ac = moduller.some(d => !d.open); moduller.forEach(d => { d.open = ac; }); hepsi.textContent = ac ? 'Hepsini kapat' : 'Hepsini aç'; } } }, 'Hepsini aç');
  yerlestir(main, baslikBlok('MÜFREDAT', 'Dersler', `${MODULLER.length} modül, ${DERSLER.length} ders. Sırayla gitmen önerilir ama her ders kendi başına çalışır. Modül başlığına dokununca dersleri açılır.`),
    h('div.filters', {}, kutu, sev, hepsi), sayac, h('div.curriculum-table', {}, moduller));
  if (odak) setTimeout(() => document.getElementById('modul-' + odak)?.scrollIntoView({ block: 'start' }), 0);
}

/* Uzun başvuru sayfalarında (sık hatalar, mülakat) ortak arama kutusu: data-ara metninde arar */
function aramaKutusu(yer, ogeler, ornek) {
  const kutu = h('input', { type: 'search', placeholder: ornek, 'aria-label': 'Ara' }), sayac = h('span.small-note.muted', { 'aria-live': 'polite' });
  kutu.addEventListener('input', () => {
    const q = kutu.value.trim().toLocaleLowerCase('tr'); let n = 0;
    ogeler().forEach(o => { const g = !q || o.dataset.ara.includes(q); o.hidden = !g; if (g) n++; });
    yer().forEach(b => { b.hidden = ![...b.querySelectorAll('[data-ara]')].some(o => !o.hidden); });
    sayac.textContent = q ? `${n} sonuç` : '';
  });
  return h('div.filters', {}, kutu, sayac);
}

/* ---------------------------------------------------------------- ders */
export function dersSayfasi(main, id) {
  const d = dersBul(id); if (!d) { yerlestir(main, baslikBlok('BULUNAMADI', 'Ders yok', 'Bu adreste bir ders yok.'), link('dersler', 'Derslere dön')); return; }
  D.sonDers(id);
  const m = modulBul(d.modul), ileri = sonraki(id), geri = onceki(id);
  const bolumler = [['anlatim', 'Anlatım'], ...(d.ornek ? [['ornek', 'Canlı örnek']] : []), ['alistirma', `Alıştırmalar (${d.alistirmalar.length})`], ['hata', 'Sık hata'], ['mulakat', 'Mülakat sorusu']];
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
    d.ornek ? h('section.article', { id: 'b-ornek' }, h('h2', {}, 'Canlı örnek'), ornekCiz(d)) : null,
    h('section', { id: 'b-alistirma' }, h('h2', {}, 'Alıştırmalar'), h('p.muted', {}, alistirmaYonergesi(d)), d.alistirmalar.map((a, i) => alistirmaCiz(d, a, i))),
    h('section.callout.warning', { id: 'b-hata' }, h('h2', {}, 'Sık hata'), h('p', {}, h('b', {}, 'Yanlış: '), h('code', {}, d.sikHata.yanlis)), h('p', {}, h('b', {}, 'Doğru: '), h('code', {}, d.sikHata.dogru)), h('p', {}, bicimli(d.sikHata.neden))),
    h('section.question', { id: 'b-mulakat' }, h('span.eyebrow', {}, 'MÜLAKAT SORUSU'), h('h3', {}, d.mulakat.soru), h('details', {}, h('summary', {}, 'Önce kendin cevapla, sonra açıp karşılaştır'), h('p', {}, bicimli(d.mulakat.cevap)))),
    h('nav.ders-gecis', { 'aria-label': 'Dersler arası geçiş' }, geri ? link('ders/' + geri.id, '← ' + geri.baslik, 'btn') : h('span'), ileri ? link('ders/' + ileri.id, ileri.baslik + ' →', 'btn primary') : link('ilerleme', 'İlerlemeni gör →', 'btn primary')));
  yerlestir(main, h('div.lesson-layout', {}, anahat, govde));
}

function ornekCiz(d) {
  const o = d.ornek; if (!o) return null;
  if (o.tur === 'pivot') { const p = new PivotAlani({ tablo: SAYFALAR[o.sayfa], sayfaAd: o.sayfa, yapi: o.yapi }); return [h('p', {}, bicimli(o.aciklama)), p.el]; }
  if (o.tur === 'sorgu') { const q = new SorguAlani({ kaynakAd: o.sayfa, kaynak: SAYFALAR[o.sayfa], kaynaklar: SAYFALAR, adimlar: o.adimlar }); return [h('p', {}, bicimli(o.aciklama)), q.el]; }
  if (o.tur && YENI_TURLER[o.tur]) return [h('p', {}, bicimli(o.aciklama)), YENI_TURLER[o.tur](o, true).el];
  const k = kitapKur(o.hazirlik, o.sayfa, o); if (o.hucre && o.formul) k.yaz(o.sayfa, o.hucre, o.formul); for (const [a2, f2] of Object.entries(o.formuller || {})) k.yaz(o.sayfa, a2, f2); k.hesapla();
  const { R, C } = boyut(o.sayfa, o.hucre, o.alan, ...Object.keys(o.hazirlik || {}), ...Object.keys(o.formuller || {}));
  const hedefAd = o.hucre, p0 = adresCoz(hedefAd);
  const iz = new Izgara({ kitap: k, sayfa: o.sayfa, satirSayisi: R, sutunSayisi: C, bicimler: bicimler(o.sayfa), hedef: hedefAd, hedefBicim: o.bicim, ilkSecim: hedefAd, denetim: !!o.denetimAraci, ozelBicim: o.ozelBicim, duzenlenebilir: (r, c) => r === p0.r && c === p0.c });
  return [h('p', {}, bicimli(o.aciklama)), h('p.small-note.muted', {}, `Sayfa: ${o.sayfa}. ${hedefAd} hücresindeki formülü değiştirip deneyebilirsiniz; renkli hücreler formülün baktığı yerlerdir.`), ...formulEkleri(o, k, iz), iz.el];
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
    if (deneme >= 2) yerlestir(ipucuKutu, h('details', {}, h('summary', {}, 'Çözümü göster'), a.tur === 'makro' ? h('pre.vba-cikti', {}, a.cozum) : a.tur === 'secmeli' ? null : a.tur ? h('pre', {}, JSON.stringify(a.cozum, null, 1)) : h('p', {}, h('code.blok', {}, a.cozum)), a.tur === 'sorgu' ? h('p.small-note', {}, 'Adımlar: ' + a.cozum.map(x => x.tip).join(' → ')) : null));
  };
  let denetle;
  if (a.tur === 'pivot') {
    const p = new PivotAlani({ tablo: SAYFALAR[a.sayfa], sayfaAd: a.sayfa }); alan = p.el;
    denetle = () => sonuc(pivotDenetle(a, SAYFALAR, p.yapi));
  } else if (YENI_TURLER[a.tur]) {
    const y = YENI_TURLER[a.tur](a, false); alan = y.el;
    denetle = () => sonuc(y.denetle());
  } else if (a.tur === 'sorgu') {
    const q = new SorguAlani({ kaynakAd: a.sayfa, kaynak: SAYFALAR[a.sayfa], kaynaklar: SAYFALAR }); alan = q.el;
    denetle = () => sonuc(sorguDenetle(a, SAYFALAR, q.adimlar));
  } else {
    const k = kitapKur(a.hazirlik, a.sayfa, a);
    const { R, C } = boyut(a.sayfa, a.hedef, a.okunan, a.grafik?.alan, ...Object.keys(a.hazirlik || {}));
    const hd = alanCoz(a.hedef.includes(':') ? a.hedef : a.hedef + ':' + a.hedef);
    const iz = new Izgara({ kitap: k, sayfa: a.sayfa, satirSayisi: R, sutunSayisi: C, bicimler: bicimler(a.sayfa), hedef: a.hedef, okunan: a.okunan, hedefBicim: a.bicim, ilkSecim: a.hedef.split(':')[0],
      duzenlenebilir: (r, c) => r >= hd.r1 && r <= hd.r2 && c >= hd.c1 && c <= hd.c2, denetim: !!a.denetimAraci, ozelBicim: a.ozelBicim });
    alan = h('div', {}, ...formulEkleri(a, k, iz), iz.el);
    denetle = () => { const f = k.icerik(a.sayfa, hd.r1, hd.c1); sonuc(formulDenetle(a, SAYFALAR, typeof f === 'string' ? f : f == null ? '' : String(f))); };
  }
  yerlestir(kutu, h('div.al-bas', {}, h('span.eyebrow', {}, `ALIŞTIRMA ${i + 1}${TUR_ETIKET[a.tur] ? ' · ' + TUR_ETIKET[a.tur] : ''}`), durumEt), h('h3', {}, bicimli(a.soru)),
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
  yerlestir(main, atolyeGecis('atolye'), baslikBlok('ATÖLYE', 'Formül atölyesi', 'Serbest çalışma alanı. Bütün sayfalar burada; değişiklikler kaydedilmez, sayfa yenilenince veri sıfırlanır. Başka sayfaya başvurmak için Ürünler!B2 gibi yazın.'),
    h('div.filters', {}, h('label', { for: 'at-sayfa' }, 'Sayfa '), ad, h('button.btn.tiny', { type: 'button', on: { click: kur } }, 'Sıfırla')), alan);
  kur();
}
export function pivotSayfasi(main) {
  const ad = h('select', { id: 'pv-sayfa' }, Object.entries(SAYFALAR).filter(([, t]) => t.basliklar && !t.ham).map(([s]) => h('option', { value: s }, s)));
  const alan = h('div'); const kur = () => { const p = new PivotAlani({ tablo: SAYFALAR[ad.value], sayfaAd: ad.value }); yerlestir(temizle(alan), p.el); };
  ad.addEventListener('change', kur);
  yerlestir(main, atolyeGecis('pivot'), baslikBlok('ATÖLYE', 'Özet tablo atölyesi', 'Satır, sütun, değer ve filtre seçin. Her sayının hangi formülle aynı olduğunu tıklayınca görürsünüz.'), h('div.filters', {}, h('label', { for: 'pv-sayfa' }, 'Kaynak '), ad), alan);
  kur();
}
export function sorguSayfasi(main) {
  const ad = h('select', { id: 'pq-sayfa' }, Object.keys(SAYFALAR).map(s => h('option', { value: s }, s)));
  const alan = h('div'); const kur = () => { const q = new SorguAlani({ kaynakAd: ad.value, kaynak: SAYFALAR[ad.value], kaynaklar: SAYFALAR }); yerlestir(temizle(alan), q.el); };
  ad.addEventListener('change', kur);
  yerlestir(main, atolyeGecis('sorgu'), baslikBlok('ATÖLYE', 'Power Query atölyesi', 'Bir kaynak seçin, adım ekleyin. Her adımın sonucunu ve Power Query\'nin yazacağı M kodunu görürsünüz. Bayi ve Müşteri ham sayfaları temizlik için hazırlandı.'),
    h('div.filters', {}, h('label', { for: 'pq-sayfa' }, 'Kaynak '), ad), alan);
  ad.value = 'Bayi'; kur();
}

/* ---------------------------------------------------------------- işlev rehberi */
export function islevlerSayfasi(main, ara = '') {
  const kutu = h('input', { type: 'search', id: 'is-ara', placeholder: 'Ara: düşeyara, sumif, tarih…', value: ara, 'aria-label': 'İşlev ve ders ara' });
  const kat = h('select', { id: 'is-kat', 'aria-label': 'Kategori' }, h('option', { value: '' }, 'Tüm kategoriler'), Object.entries(KATEGORILER).map(([k, a]) => h('option', { value: k }, a)));
  const liste = h('div.islev-liste');
  const ciz = () => {
    const q = kutu.value.trim().toLocaleLowerCase('tr'), kk = kat.value;
    const x = ISLEV_BILGI.filter(f => (!kk || f.kategori === kk) && (!q || (f.tr + ' ' + f.en + ' ' + f.aciklama).toLocaleLowerCase('tr').includes(q)));
    const dersEs = q.length > 2 ? DERSLER.filter(d => (d.baslik + ' ' + d.ozet).toLocaleLowerCase('tr').includes(q)).slice(0, 5) : [];
    yerlestir(temizle(liste), dersEs.length ? h('div.ders-eslesme', {}, h('b', {}, 'Bu konudaki dersler: '), dersEs.map(d => h('a.chip', { href: '#ders/' + d.id }, d.baslik))) : null, h('p.small-note.muted', {}, `${x.length} işlev`), x.map(f => h('article.islev', {}, h('h3', {}, f.tr, h('small', {}, ' ' + f.en + ' · ' + f.kategoriAd)), h('code', {}, f.sozdizimi), h('p', {}, f.aciklama),
      h('p', {}, h('span.muted', {}, 'Örnek (Satışlar): '), h('code', {}, f.ornek), ' ', f.en === 'GETPIVOTDATA' ? h('a.text-link', { href: '#ders/m17-d2' }, 'Özet tabloyla dersinde dene') : h('a.text-link', { href: '#atolye/' + encodeURIComponent(f.ornek) }, 'Atölyede dene')),
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
  yerlestir(main, baslikBlok('SEVİYE TESTİ', 'Nereden başlamalıyım?', `${SEVIYE.length} soru, yaklaşık 7 dakika. Sonuç yalnız bu tarayıcıda saklanır.`), sorular, h('button.btn.primary', { type: 'button', on: { click: bitir } }, 'Sonucu göster'), sonucKutu);
}

/* ---------------------------------------------------------------- sık hatalar, mülakat */
export function hatalarSayfasi(main) {
  yerlestir(main, baslikBlok('SIK HATALAR', `Excel'de en çok yapılan ${DERSLER.length} hata`, 'Her dersin en yaygın hatası: yanlış yazım, doğrusu ve nedeni.'),
    aramaKutusu(() => [...main.querySelectorAll('section.module-row')], () => [...main.querySelectorAll('.hata-satir')], 'Ara: $, düşeyara, tarih, metin…'),
    MODULLER.map(m => h('section.module-row', {}, h('div.module-row-head', {}, h('h3', {}, `${m.no}. ${m.baslik}`)), modulDersleri(m.id).map(d => h('div.hata-satir', { veri: { ara: (m.baslik + ' ' + d.baslik + ' ' + d.sikHata.yanlis + ' ' + d.sikHata.dogru + ' ' + d.sikHata.neden).toLocaleLowerCase('tr') } },
      h('p', {}, h('a', { href: '#ders/' + d.id }, d.baslik)), h('p', {}, '✗ ', h('code', {}, d.sikHata.yanlis)), h('p', {}, '✓ ', h('code', {}, d.sikHata.dogru)), h('p.muted', {}, bicimli(d.sikHata.neden)))))));
}
export function mulakatSayfasi(main) {
  const s = (soru, cevap, kaynak) => h('section.question', { veri: { ara: (soru + ' ' + (kaynak || '') + ' ' + cevap).toLocaleLowerCase('tr') } }, kaynak ? h('span.eyebrow', {}, kaynak) : null, h('h3', {}, soru), h('details', {}, h('summary', {}, 'Cevabı aç'), h('p', {}, bicimli(cevap))));
  yerlestir(main, baslikBlok('MÜLAKAT HAZIRLIĞI', 'Excel mülakat soruları', `${MULAKAT_GENEL.length + DERSLER.length} soru. Önce kendi cevabını sesli söyle, sonra aç. Cevaplar ezber için değil; bir yaklaşımın gerekçesini anlatmak için.`),
    aramaKutusu(() => [], () => [...main.querySelectorAll('section.question')], 'Ara: pivot, düşeyara, makro, pano…'),
    h('h2', {}, 'Genel'), MULAKAT_GENEL.map(q => s(q.s, q.c)),
    h('h2', {}, 'Konu konu'), DERSLER.map(d => s(d.mulakat.soru, d.mulakat.cevap, `MODÜL ${modulBul(d.modul).no} · ${d.baslik.toLocaleUpperCase('tr')}`)));
}

/* ---------------------------------------------------------------- ilerleme */
export function ilerlemeSayfasi(main) {
  const d = D.durum(), biten = DERSLER.filter(x => D.dersBitti(x.id)).length;
  const dosya = h('input', { type: 'file', id: 'yedek-dosya', accept: 'application/json,.json', hidden: true });
  dosya.addEventListener('change', async () => { const f = dosya.files[0]; if (!f) return; if (f.size > 200000) { bildir('Dosya çok büyük.'); return; } try { D.iceAl(await f.text()); bildir('İlerleme geri yüklendi.', 'iyi'); location.hash = '#ilerleme?' + Date.now(); } catch (e) { bildir(e.message); } });
  const indir = () => { const b = new Blob([D.disaAktar()], { type: 'application/json' }); const u = URL.createObjectURL(b); const a = h('a', { href: u, download: 'kesit-excel-ilerleme.json' }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); };
  yerlestir(main, baslikBlok('İLERLEMEM', `${biten}/${DERSLER.length} ders tamam`, 'İlerleme bu tarayıcıda saklanır. Başka cihaza taşımak için yedeği indirip orada geri yükleyin.'),
    h('div.stats', {}, MODULLER.map(m => { const ds = modulDersleri(m.id); const b = ds.filter(x => D.dersBitti(x.id)).length; return h('a.stat', { href: '#dersler/' + m.id }, h('strong', {}, `${b}/${ds.length}`), h('small', {}, `${m.no}. ${m.baslik}`)); })),
    h('div.btn-row', {}, h('button.btn', { type: 'button', on: { click: indir } }, 'Yedeği indir'), h('button.btn', { type: 'button', on: { click: () => dosya.click() } }, 'Yedekten geri yükle'), dosya,
      h('button.btn', { type: 'button', on: { click: () => { if (confirmIki()) { D.sifirla(); location.hash = '#ilerleme?' + Date.now(); } } } }, 'İlerlemeyi sıfırla')));
}
// Tarayıcı onay penceresi yerine iki adımlı onay (iletişim kutusu otomasyonu bozar ve mobilde kaba görünür)
let sifirlaZaman = 0;
function confirmIki() { if (Date.now() - sifirlaZaman < 4000) return true; sifirlaZaman = Date.now(); bildir('Sıfırlamak için düğmeye 4 saniye içinde bir kez daha basın.'); return false; }

/* ---------------------------------------------------------------- veri ve hakkında */
// Ders model sayfaları elle kurulmuştur; Kesit ortak verisinden gelmez (icerik/modeller.js)
const MODEL_ACIKLAMA = {
  'Kredi': 'Forklift kredisi: tutar, faiz, vade → taksit. Hedef Ara, Veri Tablosu, Senaryo ve ödeme planı (Modül 16).',
  'Yatırım': 'Forklift satın al mı, kirala mı: nakit akışları, iskonto oranı, amortisman (NBD, İVO; Modül 16).',
  'Fiyat': 'Depo hizmeti kâr modeli: başabaş ve kâr hedefi (Hedef Ara; Modül 16).',
  'Üretim': 'Ürün karması: kaynak kısıtları ve birim kâr (Çözücü, doğrusal; Modül 16).',
  'Vardiya': 'Haftalık forklift operatörü planı: 5 gün çalış, 2 gün izin; en az kişiyle talebi karşıla (Çözücü; Modül 16).',
  'Denetim': 'Bilerek hatalı bütçe özeti: formül denetimi ve Gözcü Penceresi ile hatanın kaynağını bulun (Modül 15).',
  'Listeler': 'Bağımlı açılır liste için kategori → ürün listeleri (veri doğrulama; Modül 15).',
  'Kayıt': 'Sipariş giriş formu; bazı satırlar bilerek kurala uymuyor (veri doğrulama; Modül 15).',
  'İadeler': 'İade nedenleri ve adetleri, sırasız (Pareto grafiği; Modül 20).',
  'Ocak': 'Ocak kategori özeti (3B başvuru ve Birleştir; Modül 19).',
  'Şubat': 'Şubat kategori özeti (3B başvuru ve Birleştir; Modül 19).',
  'Mart': 'Mart kategori özeti; satır sırası bilerek farklı (Birleştir tuzağı; Modül 19).',
  'Çeyrek': 'Üç ayın toplanacağı özet sayfası (3B başvuru; Modül 19).',
  'Görevler': 'Depo taşıma projesi görevleri: başlangıç, süre, sorumlu (Gantt ve özel sıralama; Modül 19–20).',
  'Bölgeler': 'Bölge depolarının günlük sevki, hedefi ve bantları (madde grafiği, ilerleme halkası; Modül 20).',
  'Vardiyalar': 'İki vardiyanın kalite ölçüleri (kelebek grafiği; Modül 20).',
  'Talep': 'Aylık sipariş talebi ve personel (eğim, korelasyon, mevsim endeksiyle tahmin; Modül 18).',
};

export function veriSayfasi(main) {
  const csv = t => { const q = v => v == null ? '' : /[;"\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v); return [t.basliklar, ...t.satirlar].filter(Boolean).map(r => r.map(q).join(';')).join('\r\n'); };
  const indir = (ad, t) => { const b = new Blob(['﻿' + csv(t)], { type: 'text/csv;charset=utf-8' }); const u = URL.createObjectURL(b); const a = h('a', { href: u, download: ad.toLocaleLowerCase('tr').replace(/\s+/g, '-') + '.csv' }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); };
  yerlestir(main, baslikBlok('VERİ', 'Kesit verileriyle', 'Dersler Kesit ailesinin ortak veri setlerinden alınmış sayfalarla çalışır: Anadolu Market (Kesit SQL), Pusula İK, Lezzet Kurye ve kirli veri tabloları. Kişiler ve şirketler kurgusaldır. Tarihler Excel seri sayısıdır.'),
    h('section.article.veri-kart', {}, h('h3', {}, 'Bütün sayfalar tek Excel kitabında'), h('p', {}, `${Object.keys(SAYFALAR).length} sayfa: Kesit verileri ve ders model sayfaları. Başlıklı sayfalar Excel Tablosudur, Satışlar[Adet] gibi başvurular gerçek Excel'de de çalışır. Dersleri ve makroları kendi Excel'inizde denemek için.`),
      h('a.btn.primary', { href: 'indir/kesit-excel-veri.xlsx', download: 'kesit-excel-veri.xlsx' }, 'Veri kitabını indir (.xlsx)')),
    Object.entries(SAYFALAR).map(([ad, t]) => h('section.article.veri-kart', {}, h('h3', {}, ad, h('small.muted', {}, ' · ' + (t.kaynak || 'Ders modeli'))), h('p', {}, t.aciklama || MODEL_ACIKLAMA[ad] || ''),
      h('p.small-note', {}, `${t.satirlar.length} satır${t.basliklar ? ' · Sütunlar: ' + t.basliklar.join(', ') : ' · başlık satırı yok (ham)'}`),
      h('button.btn.tiny', { type: 'button', on: { click: () => indir(ad, t) } }, 'CSV indir (; ayırıcılı, Türkçe Excel için)'))));
}
export function hakkindaSayfasi(main) {
  yerlestir(main, baslikBlok('HAKKINDA', 'Kesit Excel nasıl çalışır?', 'Her şey tarayıcıda çalışır. Sunucu, hesap ve ölçüm yoktur; girdiğiniz formüller cihazdan çıkmaz.'),
    h('section.article', {}, h('h2', {}, 'Formül motoru'), h('p', {}, `Excel formüllerini okuyan ve hesaplayan motor bu proje için yazıldı (eval kullanmaz). ${Object.keys(ISLEVLER).length} işlev, Türkçe ve İngilizce adlar, ; ve , ayırıcıları, dinamik dizi taşması ve Excel\'in tarih sistemi desteklenir.`),
      h('p', {}, 'Doğruluk LibreOffice Calc ile karşılaştırılarak test edilir: 146 formül LibreOffice\'te hesaplanıp motorun sonucuyla karşılaştırılır; LibreOffice\'te olmayan Excel 365 işlevleri (ÇAPRAZARA, FİLTRE, BENZERSİZ…) ve Türkçe Excel\'e özgü davranışlar 31 elle doğrulanmış vakayla denenir.'),
      h('p', {}, 'Bilinçli farklar: döngüsel başvuru #DÖNGÜ, okunamayan formül #FORMÜL olarak gösterilir (Excel uyarı penceresi açar). Taşan aralığa # ile başvuru, adlandırılmış aralık, Excel Tablosu başvuruları ve dolaylı başvurular (DOLAYLI, KAYDIR) desteklenmez. Dizi sabitlerinde her zaman , sütun, ; satır ayırır.')),
    h('section.article', {}, h('h2', {}, 'Denetçi ve gizli varyant'), h('p', {}, 'Cevabınız iki kez hesaplanır: gördüğünüz tabloda ve satırları karıştırılmış, sayıları ve metin dağılımı değiştirilmiş gizli bir kopyada. Doğru formül ikisinde de çözümle aynı sonucu verir. Sonucu elle yazmak, yanlış hücreye bağlanmak ya da $ işaretini unutmak gizli kopyada yakalanır.')),
    h('section.article', {}, h('h2', {}, 'Lisans'), h('p', {}, 'Kod ve içerik (dersler, veri) PolyForm Shield 1.0.0 lisanslıdır. Kişisel, okul ve şirket içi kullanım ücretsizdir ve izin gerektirmez. Satmak ya da rakip bir ürün yapmak yazılı izne bağlıdır. Kurum olarak kullanıyorsanız GitHub üzerinden haber vermeniz bizi mutlu eder.'),
      h('p', {}, h('a', { href: 'https://github.com/ysfdurak/kesit-excel', target: '_blank', rel: 'noopener' }, 'Kaynak kod ve lisans ↗'))));
}

/* ---------------------------------------------------------------- görselleştirme ve makro: örnek + alıştırma kurucuları */
const TUR_ETIKET = { pivot: 'ÖZET TABLO', sorgu: 'POWER QUERY', grafik: 'GRAFİK', pivotGrafik: 'PİVOT GRAFİK', kosullu: 'KOŞULLU BİÇİM', pano: 'PANO', makro: 'MAKRO (VBA)', secmeli: 'SORU', dogrulama: 'VERİ DOĞRULAMA', bicim: 'ÖZEL BİÇİM', hucreBul: 'FORMÜL DENETİMİ', sayi: 'SORU', ad: 'AD YÖNETİCİSİ', hedefAra: 'HEDEF ARA', veriTablosu: 'VERİ TABLOSU', cozucu: 'ÇÖZÜCÜ', gelismisFiltre: 'GELİŞMİŞ FİLTRE', birlestir: 'BİRLEŞTİR' };
const hataListesi = r => r.hatalar && r.hatalar.length > 1 ? { ...r, notlar: r.hatalar.slice(1).map(x => 'Ayrıca: ' + x) } : r;
// Her kurucu { el, denetle() } döndürür. ornek=true ise denetleme yok, yalnız gösterim.
const YENI_TURLER = {
  grafik(a, ornek) {
    const k = kitapKur(a.hazirlik, a.sayfa, a);
    const g = new GrafikAlani({ tablolar: SAYFALAR, kitap: k, sayfa: a.sayfa, kaynak: a.kaynak || (ornek ? a.cozum?.kaynak : null) || { alan: 'A1:B5' }, secenek: a.secenek || {}, kilitKaynak: !!a.kaynakSabit });
    const el = h('div', {}, a.hazirlik && !a.kaynakSabit ? veriOnizleme(k, a) : null, g.el);
    return { el, denetle: () => hataListesi(grafikAlistirmaDenetle(a, SAYFALAR, { kaynak: g.kaynak, secenek: g.secenek })) };
  },
  pivotGrafik(a, ornek) {
    const p = new PivotAlani({ tablo: SAYFALAR[a.sayfa], sayfaAd: a.sayfa, yapi: ornek ? a.yapi : a.baslangic, grafik: ornek || !!a.grafikAcik, grafikSecenek: a.secenek });
    return { el: p.el, denetle: () => {
      if (!p.grafikAcik) return { tamam: false, mesaj: 'Özet tablo hazırsa "Pivot grafik ekle" düğmesine basın; denetim grafiği de kontrol eder.' };
      let pv; try { pv = pivot(SAYFALAR[a.sayfa], p.yapi); } catch (e) { return { tamam: false, mesaj: e.message }; }
      if (a.cozum.yapi) { const r = pivotDenetle({ ...a, cozum: a.cozum.yapi }, SAYFALAR, p.yapi); if (!r.tamam) return r; }
      void pv; return hataListesi(grafikAlistirmaDenetle({ ...a, cozum: {} }, SAYFALAR, { kaynak: { pivot: p.yapi }, secenek: p.grafikSecenek }));
    } };
  },
  kosullu(a, ornek) {
    const k = kitapKur(a.hazirlik, a.sayfa, a);
    const { R, C } = boyut(a.sayfa, a.okunan, ...Object.keys(a.hazirlik || {}));
    const iz = new Izgara({ kitap: k, sayfa: a.sayfa, satirSayisi: Math.min(R, a.satirGoster || R), sutunSayisi: C, bicimler: bicimler(a.sayfa), okunan: a.okunan, ilkSecim: 'A1', duzenlenebilir: () => false, kurallar: ornek ? a.kurallar : [], mini: a.mini });
    const ka = ornek && !a.duzenlenebilir ? null : new KosulluAlani({ izgara: iz, kurallar: ornek ? a.kurallar : [], varsayilanAlan: a.okunan });
    return { el: h('div', {}, ka ? ka.el : null, iz.el), denetle: () => kosulluDenetle(a, SAYFALAR, ka.kurallar) };
  },
  pano(a, ornek) {
    const pa = new PanoAlani({ tablo: SAYFALAR[a.sayfa], sayfaAd: a.sayfa, pano: ornek ? a.pano : a.baslangic });
    return { el: pa.el, denetle: () => panoDenetle(a, SAYFALAR, pa.pano) };
  },
  makro(a, ornek) {
    const { R, C } = boyut(a.sayfa, a.okunan, ...Object.keys(a.hazirlik || {}));
    const m = new MakroAlani({ kitapYap: () => kitapKur(a.hazirlik, a.sayfa, a), sayfa: a.sayfa, satirSayisi: R, sutunSayisi: C, bicimler: bicimler(a.sayfa), kod: ornek ? a.kod : (a.baslangicKod || `Sub Cozum()\n    \nEnd Sub\n`), girdiler: a.girdiler, kaydedici: !!a.kaydedici || ornek });
    return { el: m.el, denetle: () => { m.kitapYenile(); m.calistir(); return makroDenetle(a, SAYFALAR, m.kod.value); } };
  },
  secmeli(a) {
    let secim = null; const ad = 'sc' + Math.random().toString(36).slice(2, 7);
    const el = h('fieldset.secmeli', {}, h('legend.sr-only', {}, a.soru), a.secenekler.map((x, i) => h('label.secenek', {}, h('input', { type: 'radio', name: ad, value: String(i), on: { change: () => { secim = i; } } }), ' ', bicimli(x))));
    return { el, denetle: () => secim == null ? { tamam: false, mesaj: 'Bir seçenek işaretleyin.' } : secim === a.dogru ? { tamam: true, mesaj: 'Doğru. ' + (a.aciklama || '') } : { tamam: false, mesaj: (a.yanlisAciklama?.[secim] || 'Bu seçenek değil.') } };
  },
};
// Model sayfasının ızgarası (salt okunur; araçlar hücreleri kendisi değiştirir)
function modelIzgara(a, k, ek = {}) {
  const { R, C } = boyut(a.sayfa, a.okunan, ...Object.keys(a.hazirlik || {}));
  return new Izgara({ kitap: k, sayfa: a.sayfa, satirSayisi: Math.min(R, a.satirGoster || R), sutunSayisi: C, bicimler: bicimler(a.sayfa), ilkSecim: a.ilkSecim || 'A1', duzenlenebilir: () => false, ozelBicim: a.ozelBicim, ...ek });
}
Object.assign(YENI_TURLER, {
  dogrulama(a, ornek) {
    const k = kitapKur(a.hazirlik, a.sayfa, a);
    const iz = modelIzgara(a, k, { duzenlenebilir: () => true, dogrulama: ornek ? a.kurallar || [] : [], denetim: true });
    const da = new DogrulamaAlani({ izgara: iz, kurallar: ornek ? a.kurallar : [], varsayilanAlan: a.varsayilanAlan || a.okunan });
    return { el: h('div', {}, da.el, iz.el), denetle: () => dogrulamaDenetle(a, SAYFALAR, da.kurallar) };
  },
  bicim(a, ornek) {
    let iz = null;
    if (a.sayfa && a.alan) { const k = kitapKur(a.hazirlik, a.sayfa, a); iz = modelIzgara(a, k); }
    const ba = new BicimAlani({ degerler: a.denemeDegerleri, kod: ornek ? a.kod : (a.baslangicKod || ''), izgara: iz, alan: a.alan });
    return { el: h('div', {}, ba.el, iz ? h('div', {}, h('b', {}, `Önizleme: ${a.sayfa} ${a.alan}`), iz.el) : null), denetle: () => bicimDenetle(a, SAYFALAR, ba.kod) };
  },
  hucreBul(a) {
    const k = kitapKur(a.hazirlik, a.sayfa, a), iz = modelIzgara(a, k, { denetim: true });
    const id = 'hb' + a.id + Math.random().toString(36).slice(2, 5), giris = h('input.fx', { id, type: 'text', placeholder: 'ör. D7', autocomplete: 'off', spellcheck: 'false' });
    return { el: h('div', {}, iz.el, h('div.filters', {}, h('label', { for: id }, 'Hatalı hücre: '), giris)), denetle: () => hucreBulDenetle(a, giris.value) };
  },
  sayi(a) {
    const id = 'sy' + a.id + Math.random().toString(36).slice(2, 5), giris = h('input.fx', { id, type: 'text', inputmode: 'decimal', placeholder: 'sayı', autocomplete: 'off' });
    const ek = a.pivot ? new PivotAlani({ tablo: SAYFALAR[a.sayfa], sayfaAd: a.sayfa, yapi: a.pivot }).el : a.okunan ? modelIzgara(a, kitapKur(a.hazirlik, a.sayfa, a), { denetim: !!a.denetimAraci }).el : null;
    return { el: h('div', {}, ek, h('div.filters', {}, h('label', { for: id }, 'Cevabınız: '), giris)), denetle: () => sayiDenetle(a, SAYFALAR, giris.value) };
  },
  ad(a) {
    const i1 = 'ad' + a.id + Math.random().toString(36).slice(2, 5), i2 = i1 + 't', lambdaMi = /^=LAMBDA/i.test(a.cozum.tanim);
    const ad = h('input.fx', { id: i1, type: 'text', placeholder: lambdaMi ? 'MARJ' : 'Adet_Alani', autocomplete: 'off', spellcheck: 'false', value: a.adGerekli || '' });
    const tn = h('input.fx', { id: i2, type: 'text', placeholder: lambdaMi ? '=LAMBDA(parametre;…;hesap)' : '=Satışlar!$H$2:$H$241', autocomplete: 'off', spellcheck: 'false' });
    return { el: h('div.durum-kutu', {}, h('h4', {}, 'Yeni Ad'), h('div.pivot-alanlar', {}, h('div.alan', {}, h('label', { for: i1 }, 'Ad'), ad), h('div.alan', {}, h('label', { for: i2 }, 'Başvurur'), tn)),
      h('p.small-note.muted', {}, lambdaMi ? 'Excel: Formüller > Ad Yöneticisi > Yeni. Başvurur kutusuna LAMBDA yazılır; kitapta =AD(…) diye çağrılır.' : 'Excel: Formüller > Ad Tanımla. Ad harfle başlar, boşluk içermez, B2 gibi bir adrese benzemez.')), denetle: () => adDenetle(a, SAYFALAR, { ad: ad.value.trim(), tanim: tn.value.trim() }) };
  },
  birlestir(a, ornek) {
    const k = kitapKur(a.hazirlik, a.sayfa, a), iz = modelIzgara(a, k);
    const ba = new BirlestirAlani({ kitap: k, varsayilan: ornek ? a.cozum : null });
    return { el: h('div', {}, iz.el, ba.el), denetle: () => birlestirDenetle(a, SAYFALAR, ba.ayar()) };
  },
  gelismisFiltre(a, ornek) {
    const bolge = alanCoz(a.bolge), hz = { ...(a.hazirlik || {}), ...(ornek ? a.cozum.hucreler : {}) };
    const k = kitapKur(hz, a.sayfa, a);
    const iz = modelIzgara({ ...a, okunan: a.bolge.split(':')[1] }, k, { duzenlenebilir: (r, c) => r >= bolge.r1 && r <= bolge.r2 && c >= bolge.c1 && c <= bolge.c2, ilkSecim: a.bolge.split(':')[0] });
    const gf = new GelismisFiltreAlani({ kitap: k, sayfa: a.sayfa, izgara: iz, bolge: a.bolge, varsayilan: ornek ? a.cozum : { liste: a.varsayilanListe || '' } });
    return { el: h('div', {}, iz.el, gf.el), denetle: () => gelismisFiltreDenetle(a, SAYFALAR, gf.ayar()) };
  },
  hedefAra(a, ornek) {
    const k = kitapKur(a.hazirlik, a.sayfa, a), iz = modelIzgara(a, k);
    const ha = new HedefAraAlani({ kitap: k, sayfa: a.sayfa, izgara: iz, varsayilan: ornek ? a.cozum : null });
    return { el: h('div', {}, iz.el, ha.el), denetle: () => hedefAraDenetle(a, SAYFALAR, ha.ayar()) };
  },
  veriTablosu(a) {
    const k = kitapKur(a.hazirlik, a.sayfa, a), iz = modelIzgara(a, k);
    const vt = new VeriTablosuAlani({ kitap: k, sayfa: a.sayfa, ...a.tablo });
    return { el: h('div', {}, iz.el, vt.el), denetle: () => veriTablosuDenetle(a, SAYFALAR, vt.ayar()) };
  },
  senaryo(a) {
    const k = kitapKur(a.hazirlik, a.sayfa, a), iz = modelIzgara(a, k);
    const sa = new SenaryoAlani({ kitap: k, sayfa: a.sayfa, izgara: iz, senaryolar: a.senaryolar, sonucHucreler: a.sonucHucreler, etiketler: a.etiketler });
    return { el: h('div', {}, iz.el, sa.el), denetle: () => ({ tamam: false, mesaj: 'Örnek' }) };
  },
  cozucu(a, ornek) {
    const k = kitapKur(a.hazirlik, a.sayfa, a), iz = modelIzgara(a, k);
    const ca = new CozucuAlani({ kitap: k, sayfa: a.sayfa, izgara: iz, varsayilan: ornek ? a.cozum : a.baslangic });
    return { el: h('div', {}, iz.el, ca.el), denetle: () => cozucuDenetle(a, SAYFALAR, ca.ayar()) };
  },
});
function veriOnizleme(k, a) {
  const { R, C } = boyut(a.sayfa, ...Object.keys(a.hazirlik || {}));
  const iz = new Izgara({ kitap: k, sayfa: a.sayfa, satirSayisi: R, sutunSayisi: C, bicimler: bicimler(a.sayfa), okunan: a.okunan, ilkSecim: Object.keys(a.hazirlik)[0], duzenlenebilir: () => false });
  return h('details.veri-onizleme', {}, h('summary', {}, 'Veriyi gör (' + a.sayfa + ')'), iz.el);
}

/* ---------------------------------------------------------------- atölye: görselleştirme */
const GORSEL_SEKME = [['grafik', 'Grafik'], ['pivot', 'Pivot grafik'], ['kosullu', 'Koşullu biçim'], ['pano', 'Pano']];
export function gorselSayfasi(main, sekme = 'grafik') {
  if (!GORSEL_SEKME.some(s => s[0] === sekme)) sekme = 'grafik';
  const tabl = Object.entries(SAYFALAR).filter(([, t]) => t.basliklar && !t.ham).map(([s]) => s);
  const ad = h('select', { id: 'gr-sayfa' }, tabl.map(s => h('option', { value: s, selected: s === (sekme === 'kosullu' ? 'Bütçe' : 'Satışlar') }, s)));
  const alan = h('div', { role: 'tabpanel', id: 'gr-panel', 'aria-labelledby': 'gr-tab-' + sekme });
  const kur = () => {
    const s = ad.value, t = SAYFALAR[s];
    if (sekme === 'grafik') {
      const k = kitapKur({}, s), kaynak = s === 'Bütçe' ? { alan: 'B1:D7' } : { alan: 'A1:' + String.fromCharCode(64 + Math.min(t.basliklar.length, 4)) + '8' };
      yerlestir(temizle(alan), h('p.small-note.muted', {}, 'Veri aralığını değiştirerek farklı sütunları çizdirin. Ham tablolarda önce Pivot grafik sekmesinde özetleyin: 240 satırı tek grafiğe dökmek okunmaz.'), new GrafikAlani({ tablolar: SAYFALAR, kitap: k, sayfa: s, kaynak, secenek: { tur: s === 'Bütçe' ? 'cizgi' : 'sutun' } }).el);
    } else if (sekme === 'pivot') {
      yerlestir(temizle(alan), new PivotAlani({ tablo: t, sayfaAd: s, grafik: true, yapi: s === 'Satışlar' ? { satir: 'Kategori', sutun: null, degerler: [{ alan: 'Adet', ozet: 'toplam' }], filtreler: [{ alan: 'Kanal', degerler: [] }], grupla: {}, goster: 'deger' } : null }).el);
    } else if (sekme === 'kosullu') {
      const k = kitapKur({}, s), { R, C } = boyut(s);
      const iz = new Izgara({ kitap: k, sayfa: s, satirSayisi: Math.min(R, 60), sutunSayisi: C, bicimler: bicimler(s), ilkSecim: 'A1', duzenlenebilir: () => false });
      const son = String.fromCharCode(64 + t.basliklar.length), sayisal = t.basliklar.findIndex((b, i) => t.satirlar.some(r => typeof r[i] === 'number') && !/gg|aa|yyyy/.test((t.bicim || [])[i] || ''));
      const sut = String.fromCharCode(65 + Math.max(0, sayisal));
      yerlestir(temizle(alan), new KosulluAlani({ izgara: iz, varsayilanAlan: `${sut}2:${sut}${Math.min(R, 60)}` }).el, h('p.small-note.muted', {}, `İlk ${Math.min(R, 60) - 1} satır gösteriliyor (A1:${son}${Math.min(R, 60)}).`), iz.el);
    } else {
      const ornekPano = s === 'Satışlar' ? { baslik: 'Satış panosu · 2024', dilimler: [{ alan: 'Kanal', degerler: [] }, { alan: 'Şehir', degerler: [] }], kpi: [{ alan: 'Adet', ozet: 'toplam' }, { alan: 'Sipariş No', ozet: 'say' }, { alan: 'Müşteri', ozet: 'benzersiz' }],
        grafikler: [{ baslik: 'Adet · Kategori', tur: 'cubuk', yapi: { satir: 'Kategori', degerler: [{ alan: 'Adet', ozet: 'toplam' }], filtreler: [], grupla: {}, goster: 'deger' } }, { baslik: 'Sipariş sayısı · Ay', tur: 'cizgi', yapi: { satir: 'Tarih', degerler: [{ alan: 'Sipariş No', ozet: 'say' }], filtreler: [], grupla: { Tarih: 'ay' }, goster: 'deger' } }] } : null;
      yerlestir(temizle(alan), new PanoAlani({ tablo: t, sayfaAd: s, pano: ornekPano }).el);
    }
  };
  ad.addEventListener('change', kur);
  const sekmeler = h('div.sekmeler', { role: 'tablist', 'aria-label': 'Görselleştirme araçları' }, GORSEL_SEKME.map(([k, a], i) => h('button', { type: 'button', role: 'tab', id: 'gr-tab-' + k, tabindex: k === sekme ? '0' : '-1', 'aria-selected': String(k === sekme), 'aria-controls': 'gr-panel',
    on: { click: () => { location.hash = '#gorsel/' + k; }, keydown: e => { const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (!d) return; e.preventDefault(); const y = GORSEL_SEKME[(i + d + GORSEL_SEKME.length) % GORSEL_SEKME.length][0]; location.hash = '#gorsel/' + y; setTimeout(() => document.getElementById('gr-tab-' + y)?.focus(), 50); } } }, a)));
  yerlestir(main, atolyeGecis('gorsel'), baslikBlok('ATÖLYE', 'Görselleştirme atölyesi', 'Grafik kurun, özet tablodan grafik çıkarın, koşullu biçimle tabloyu okunur yapın, dilimleyicili pano hazırlayın. Grafikleri SVG ya da PNG olarak indirebilirsiniz.'),
    sekmeler, h('div.filters', {}, h('label', { for: 'gr-sayfa' }, 'Kaynak '), ad), alan);
  kur();
}

/* ---------------------------------------------------------------- atölye: makro */
const ORNEK_MAKROLAR = {
  'Merhaba': 'Sub Merhaba()\n    MsgBox "Merhaba, " & ActiveSheet.Name & " sayfasındasınız."\nEnd Sub\n',
  'Tutar sütunu (döngü)': "Sub TutarHesapla()\n    ' Satışlar: H Adet, I Birim Fiyat, J İndirim. L sütununa net tutarı yazar.\n    Dim son As Long, r As Long\n    son = Cells(Rows.Count, 1).End(xlUp).Row\n    Range(\"L1\").Value = \"Net Tutar\"\n    Range(\"L1\").Font.Bold = True\n    For r = 2 To son\n        Cells(r, 12).Value = Cells(r, 8).Value * Cells(r, 9).Value * (1 - Cells(r, 10).Value)\n    Next r\n    Range(\"L2:L\" & son).NumberFormat = \"#,##0.00\"\n    MsgBox son - 1 & \" satır hesaplandı.\"\nEnd Sub\n",
  'İptalleri boya (If)': "Sub IptalleriBoya()\n    Dim hucre As Range, adet As Long\n    For Each hucre In Range(\"K2:K\" & Cells(Rows.Count, 1).End(xlUp).Row)\n        If hucre.Value = \"İptal\" Then\n            hucre.EntireRow.Interior.Color = RGB(255, 230, 230)\n            adet = adet + 1\n        End If\n    Next hucre\n    MsgBox adet & \" iptal satırı boyandı.\"\nEnd Sub\n",
  'Kategori özeti (WorksheetFunction)': "Sub KategoriOzeti()\n    Dim kat As Variant, r As Long\n    r = 2\n    Range(\"N1\").Value = \"Kategori\": Range(\"O1\").Value = \"Toplam Adet\"\n    For Each kat In Array(\"Elektronik\", \"Giyim\", \"Kitap\", \"Spor\")\n        Cells(r, 14).Value = kat\n        Cells(r, 15).Value = WorksheetFunction.SumIfs(Range(\"H:H\"), Range(\"F:F\"), kat)\n        r = r + 1\n    Next kat\nEnd Sub\n",
  'Formül yazdır (Formula / FormulaLocal)': "Sub FormulYaz()\n    Dim son As Long\n    son = Cells(Rows.Count, 1).End(xlUp).Row\n    ' .Formula her zaman İngilizce ad ve virgül ister (her bilgisayarda aynı çalışır).\n    ' .FormulaLocal Excel'in menü dilindeki adı ve bölge ayarının ayırıcısını ister:\n    ' Türkçe menülü Excel'de EĞER ve ;  İngilizce menülü, Türkçe bölgeli Excel'de IF ve ; (EĞER orada #AD? verir).\n    Range(\"L2:L\" & son).Formula = \"=H2*I2*(1-J2)\"\n    Range(\"M2:M\" & son).FormulaLocal = \"=EĞER(L2>1000;\"\"Büyük\"\";\"\"Küçük\"\")\"\nEnd Sub\n",
};
export function makroSayfasi(main) {
  const tabl = Object.entries(SAYFALAR).filter(([, t]) => t.basliklar && !t.ham).map(([s]) => s);
  const ad = h('select', { id: 'mk-sayfa' }, tabl.map(s => h('option', { value: s, selected: s === 'Satışlar' }, s)));
  const ornek = h('select', { id: 'mk-ornek' }, Object.keys(ORNEK_MAKROLAR).map(k => h('option', { value: k }, k)));
  const alan = h('div');
  const kur = (kod) => { const s = ad.value, { R, C } = boyut(s); const m = new MakroAlani({ kitapYap: () => kitapKur({}, s), sayfa: s, satirSayisi: R, sutunSayisi: C + 5, bicimler: bicimler(s), kod: kod ?? ORNEK_MAKROLAR[ornek.value], kaydedici: true }); yerlestir(temizle(alan), m.el); };
  ad.addEventListener('change', () => kur(alan.querySelector('textarea')?.value));
  ornek.addEventListener('change', () => kur());
  yerlestir(main, atolyeGecis('makro'), baslikBlok('ATÖLYE', 'Makro atölyesi (VBA)', 'VBA kodunu yazın ve tarayıcıda çalıştırın. Kesit, Excel VBA\'nın sık kullanılan bölümünü taklit eder; aynı kodu .bas dosyası olarak indirip gerçek Excel\'de deneyebilirsiniz.'),
    h('div.filters', {}, h('label', { for: 'mk-ornek' }, 'Örnek makro '), ornek, h('label', { for: 'mk-sayfa' }, ' Sayfa '), ad), alan,
    h('details.callout', {}, h('summary', {}, 'Gerçek Excel\'de denemek için'), h('ol', {},
      h('li', {}, 'Veri kitabını (.xlsx) indirip açın, Dosya > Farklı Kaydet ile "Excel Makro İçerebilen Çalışma Kitabı (.xlsm)" olarak kaydedin.'),
      h('li', {}, 'Alt+F11 ile VBA düzenleyicisini açın; Dosya > Dosya Al (Import File) ile indirdiğiniz KesitMakro.bas dosyasını seçin.'),
      h('li', {}, 'İlgili sayfaya geçip Alt+F8 ile makroyu seçin ve Çalıştır deyin. Sonucu buradaki tabloyla karşılaştırın.'),
      h('li', {}, 'Makro çalışmazsa Dosya > Seçenekler > Güven Merkezi > Makro Ayarları\'na bakın; internetten indirilen dosyada önce dosyanın Özellikler penceresinden "Engellemeyi kaldır" gerekir.')),
      h('p.small-note', {}, 'Kesit\'in desteklemediği bir nesneyle (Chart, PivotTable, UserForm, dosya işlemleri) karşılaşınca açık bir hata verir; bunlar yalnız gerçek Excel\'de çalışır.')));
  kur();
}
