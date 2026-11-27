// Kitap tasarımı ve durum çözümlemesi arayüzleri: Veri Doğrulama, Özel Biçim, Hedef Ara, Veri Tablosu, Senaryo Yöneticisi, Çözücü.
// Her alan Excel'deki iletişim kutusunun alanlarını taklit eder ve ayar() ile denetçiye giden nesneyi verir.
import { h, temizle, yerlestir } from './yardim.js';
import { DOGRULAMA_TURLERI, DOGRULAMA_OP, HATA_STILI } from '../motor/dogrulama.js';
import { ozelBicim } from '../motor/bicim.js';
import { hedefAra, veriTablosu, senaryoOzeti, cozucu } from '../motor/senaryo.js';
import { goster } from '../motor/kitap.js';
import { gelismisFiltre, birlestir, BIRLESTIR_ISLEVLERI } from '../motor/veriaraclari.js';
import { alanCoz, adres } from '../motor/formul.js';

let sayac = 0;
const yeniId = () => 'md' + (++sayac);
function alan(etiket, el, ipucu) { const i = yeniId(); el.id = i; return h('div.alan', {}, h('label', { for: i }, etiket), el, ipucu ? h('small.muted', {}, ipucu) : null); }
const secim = (deger, ops, degis) => h('select', { on: { change: e => degis(e.target.value) } }, ops.map(([v, a]) => h('option', { value: v, selected: String(v) === String(deger) }, a)));
const metin = (deger, degis, ph = '') => h('input', { type: 'text', value: deger ?? '', placeholder: ph, on: { input: e => degis(e.target.value) } });
const sayiOku = s => { const t = String(s ?? '').trim(); if (t === '') return null; const n = Number(t.replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')); return Number.isFinite(n) ? n : NaN; };
const adr = s => String(s || '').toUpperCase().replace(/\$/g, '').replace(/\s/g, '');

/* ---------------------------------------------------------------- Veri Doğrulama */
export class DogrulamaAlani {
  // s: { izgara, varsayilanAlan, kurallar?, onDegis }
  constructor(s) {
    this.s = s; this.kurallar = JSON.parse(JSON.stringify(s.kurallar || []));
    this.t = { tur: 'liste', alan: s.varsayilanAlan || 'A2:A10', kaynak: '', op: 'arasinda', d1: '', d2: '', formul: '', hataStili: 'durdur', hataIletisi: '' };
    this.el = h('div.dogrulama'); this.ciz(); this.uygula();
  }
  uygula() { this.s.izgara.dogrulamaAyarla(this.kurallar); if (this.s.onDegis) this.s.onDegis(this.kurallar); }
  ciz() {
    const t = this.t, ozel = [];
    if (t.tur === 'liste') ozel.push(alan('Kaynak', metin(t.kaynak, v => { t.kaynak = v; }, 'Web;Mobil;Mağaza ya da =$M$2:$M$4'), 'Liste ; ile ayrılır ya da = ile bir alana, ada, DOLAYLI()\'ya bağlanır'));
    if (['tamSayi', 'ondalik', 'tarih', 'uzunluk'].includes(t.tur)) {
      ozel.push(alan('Veri', secim(t.op, Object.entries(DOGRULAMA_OP), v => { t.op = v; this.ciz(); })));
      ozel.push(alan(['arasinda', 'arasindaDegil'].includes(t.op) ? 'En az' : 'Değer', metin(t.d1, v => { t.d1 = v; }, t.tur === 'tarih' ? '01.01.2024 ya da =BUGÜN()' : '1')));
      if (['arasinda', 'arasindaDegil'].includes(t.op)) ozel.push(alan('En çok', metin(t.d2, v => { t.d2 = v; }, t.tur === 'tarih' ? '=BUGÜN()' : '5')));
    }
    if (t.tur === 'ozel') ozel.push(alan('Formül (alanın ilk hücresine göre)', metin(t.formul, v => { t.formul = v; }, '=EĞERSAY($A:$A;A2)=1')));
    const form = h('div.pivot-alanlar', {},
      alan('İzin verilen', secim(t.tur, Object.entries(DOGRULAMA_TURLERI), v => { t.tur = v; this.ciz(); })),
      alan('Uygulanacak alan', metin(t.alan, v => { t.alan = adr(v); }, 'E2:E241')), ozel,
      alan('Hata uyarısı stili', secim(t.hataStili, Object.entries(HATA_STILI), v => { t.hataStili = v; })),
      alan('Hata iletisi (isteğe bağlı)', metin(t.hataIletisi, v => { t.hataIletisi = v; }, 'Kanal Web, Mobil ya da Mağaza olmalı')),
      h('div.alan', {}, h('span', {}, ' '), h('button.btn.primary', { type: 'button', on: { click: () => this.ekle() } }, 'Kuralı ekle')));
    this.hata = h('p.uyari', { 'aria-live': 'polite' });
    const liste = this.kurallar.length ? h('ol.kural-listesi', {}, this.kurallar.map((k, i) => h('li', {}, h('code', {}, ozetle(k)), ' ',
      h('button.btn.tiny', { type: 'button', 'aria-label': 'Kuralı sil', on: { click: () => { this.kurallar.splice(i, 1); this.ciz(); this.uygula(); } } }, 'Sil'))))
      : h('p.small-note.muted', {}, 'Henüz kural yok.');
    yerlestir(temizle(this.el), h('h4', {}, 'Veri doğrulama kuralları'), liste, form, this.hata,
      h('p.small-note.muted', {}, 'Kuralı ekledikten sonra tablodaki "Geçersiz verileri işaretle" ile mevcut veriyi denetleyin ve kural alanındaki bir hücreye değer yazarak deneyin.'));
  }
  ekle() {
    const t = { ...this.t }, hata = m => { this.hata.textContent = m; };
    if (!/^[A-Z]{1,3}\d+(:[A-Z]{1,3}\d+)?$/.test(t.alan)) return hata('Alanı E2:E241 biçiminde yazın.');
    if (t.tur === 'liste' && !String(t.kaynak).trim()) return hata('Liste kaynağını yazın.');
    if (['tamSayi', 'ondalik', 'tarih', 'uzunluk'].includes(t.tur) && String(t.d1).trim() === '') return hata('Sınır değerini yazın.');
    if (['tamSayi', 'ondalik', 'tarih', 'uzunluk'].includes(t.tur) && ['arasinda', 'arasindaDegil'].includes(t.op) && String(t.d2).trim() === '') return hata('"En çok" değerini yazın.');
    if (t.tur === 'ozel' && !String(t.formul).trim().startsWith('=')) return hata('Özel formül = ile başlar ve DOĞRU/YANLIŞ döndürür.');
    const k = { tur: t.tur, alan: t.alan, hataStili: t.hataStili };
    if (t.hataIletisi) k.hataIletisi = t.hataIletisi;
    if (t.tur === 'liste') k.kaynak = t.kaynak.trim();
    else if (t.tur === 'ozel') k.formul = t.formul.trim();
    else { k.op = t.op; const cev = x => { const s = String(x).trim(); if (s.startsWith('=') || /^\d{1,2}\.\d{1,2}\.\d{4}$/.test(s)) return s; const n = sayiOku(s); return Number.isNaN(n) ? s : n; }; k.d1 = cev(t.d1); if (['arasinda', 'arasindaDegil'].includes(t.op)) k.d2 = cev(t.d2); }
    this.kurallar.push(k); this.hata.textContent = ''; this.ciz(); this.uygula();
  }
}
export function ozetle(k) {
  const tur = DOGRULAMA_TURLERI[k.tur] || k.tur;
  const ek = k.tur === 'liste' ? ': ' + k.kaynak : k.tur === 'ozel' ? ': ' + k.formul : ` ${DOGRULAMA_OP[k.op] || ''} ${k.d1 ?? ''}${k.d2 != null ? ' ve ' + k.d2 : ''}`;
  return `${k.alan} · ${tur}${ek} · ${({ durdur: 'Durdur', uyari: 'Uyarı', bilgi: 'Bilgi' })[k.hataStili || 'durdur']}`;
}

/* ---------------------------------------------------------------- Özel sayı biçimi */
export class BicimAlani {
  // s: { degerler: [..], kod?, izgara?, alan?, onDegis }
  constructor(s) {
    this.s = s; this.kod = s.kod || '';
    const i = yeniId();
    this.giris = h('input.fx.bicim-kod', { id: i, type: 'text', value: this.kod, spellcheck: 'false', autocomplete: 'off', placeholder: '#.##0,00 "₺"', on: { input: e => { this.kod = e.target.value; this.onizle(); } } });
    this.tablo = h('div.tablo-kaydir');
    const hazir = [['#.##0', 'Binlik ayırıcı'], ['#.##0,00 "₺"', 'Para'], ['%0,0', 'Yüzde'], ['#.##0;[Kırmızı]-#.##0', 'Negatif kırmızı'], ['#.##0.."Mn"', 'Milyon'], ['gg.aa.yyyy gggg', 'Tarih ve gün']];
    this.el = h('div.bicim-alani', {}, h('label', { for: i }, h('b', {}, 'Tür (biçim kodu)')), this.giris,
      h('div.cipler', {}, h('span.small-note.muted', {}, 'Örnek kodlar: '), hazir.map(([k, a]) => h('button.cip', { type: 'button', title: k, on: { click: () => { this.giris.value = k; this.kod = k; this.onizle(); } } }, a))),
      h('p.small-note.muted', {}, 'Bölümler ; ile ayrılır: pozitif;negatif;sıfır;metin. "Tırnak" içindeki metin aynen yazılır, [Kırmızı] renk verir, [>=1000] koşul koyar.'), this.tablo);
    this.onizle();
  }
  onizle() {
    const satirlar = this.s.degerler.map(v => { let o; try { o = this.kod ? ozelBicim(v, this.kod) : { metin: goster(v), renk: null }; } catch { o = { metin: '(kod okunamadı)', renk: null }; } return [v, o]; });
    yerlestir(temizle(this.tablo), h('table.veri', {}, h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Hücredeki değer'), h('th', { scope: 'col' }, 'Görünen'))),
      h('tbody', {}, satirlar.map(([v, o]) => { const td = h('td.sayi', {}, o.metin); if (o.renk) td.style.color = o.renk; return h('tr', {}, h('td.sayi', {}, typeof v === 'number' ? String(v).replace('.', ',') : String(v)), td); }))));
    if (this.s.izgara && this.s.alan) this.s.izgara.bicimAyarla(this.kod ? { [this.s.alan]: this.kod } : {});
    if (this.s.onDegis) this.s.onDegis(this.kod);
  }
}

/* ---------------------------------------------------------------- Hedef Ara */
export class HedefAraAlani {
  // s: { kitap, sayfa, izgara, varsayilan?: {hedefHucre, hedefDeger, degisenHucre} }
  constructor(s) {
    this.s = s; const v = s.varsayilan || {};
    this.a = { hedefHucre: v.hedefHucre || '', hedefDeger: v.hedefDeger ?? '', degisenHucre: v.degisenHucre || '' };
    this.sonuc = h('div.small-note', { 'aria-live': 'polite' });
    this.el = h('div.durum-kutu', {}, h('h4', {}, 'Hedef Ara'),
      h('div.pivot-alanlar', {}, alan('Hedef hücre', metin(this.a.hedefHucre, x => { this.a.hedefHucre = adr(x); }, 'B6'), 'formül içeren sonuç hücresi'),
        alan('Hedef değer', metin(this.a.hedefDeger, x => { this.a.hedefDeger = x; }, '5000')),
        alan('Değişecek hücre', metin(this.a.degisenHucre, x => { this.a.degisenHucre = adr(x); }, 'B2'), 'sabit değerli girdi hücresi'),
        h('div.alan', {}, h('span', {}, ' '), h('div.btn-row', {}, h('button.btn.primary', { type: 'button', on: { click: () => this.calistir() } }, 'Tamam'), h('button.btn.tiny', { type: 'button', on: { click: () => this.geriAl() } }, 'Geri al')))),
      this.sonuc);
  }
  ayar() { return { ...this.a, hedefDeger: sayiOku(this.a.hedefDeger) }; }
  calistir() {
    const a = this.ayar(); if (a.hedefDeger == null || Number.isNaN(a.hedefDeger)) { this.sonuc.textContent = 'Hedef değeri sayı olarak yazın.'; return; }
    const r = hedefAra(this.s.kitap, this.s.sayfa, a);
    if (r.tamam) this.eski = { hucre: a.degisenHucre, deger: r.eski };
    this.s.izgara.guncelle(); this.s.izgara.hucreBilgisi();
    this.sonuc.textContent = r.tamam ? `Hedef Ara bir çözüm buldu (${r.adim} deneme): ${a.degisenHucre} = ${goster(+r.deger.toPrecision(10))}, ${a.hedefHucre} = ${goster(+Number(r.sonuc).toPrecision(10))}.` : r.mesaj;
  }
  geriAl() { if (!this.eski) return; this.s.kitap.yaz(this.s.sayfa, this.eski.hucre, this.eski.deger); this.s.kitap.hesapla(); this.s.izgara.guncelle(); this.sonuc.textContent = 'Değişen hücre eski değerine döndü.'; this.eski = null; }
}

/* ---------------------------------------------------------------- Veri Tablosu */
export class VeriTablosuAlani {
  // s: { kitap, sayfa, formul (sonuç hücresi), satirDegerleri, sutunDegerleri, satirEtiket, sutunEtiket, bicim }
  constructor(s) {
    this.s = s; this.a = { satirGiris: '', sutunGiris: '' };
    this.cikti = h('div.tablo-kaydir', { 'aria-live': 'polite' });
    this.el = h('div.durum-kutu', {}, h('h4', {}, 'Veri Tablosu (iki değişkenli)'),
      h('p.small-note.muted', {}, `Tablonun sol üst köşesinde ${s.formul} formülü var. Üst satırdaki değerler (${s.satirEtiket}) ve sol sütundaki değerler (${s.sutunEtiket}) modelde hangi hücreye yazılmalı?`),
      h('div.pivot-alanlar', {}, alan('Satır giriş hücresi', metin('', x => { this.a.satirGiris = adr(x); }, 'üst satırdaki değerler için')), alan('Sütun giriş hücresi', metin('', x => { this.a.sutunGiris = adr(x); }, 'sol sütundaki değerler için')),
        h('div.alan', {}, h('span', {}, ' '), h('button.btn.primary', { type: 'button', on: { click: () => this.calistir() } }, 'Tamam'))), this.cikti);
  }
  ayar() { return { satirGiris: this.a.satirGiris, sutunGiris: this.a.sutunGiris }; }
  calistir() {
    const s = this.s; let t;
    try { if (!/^[A-Z]{1,3}\d+$/.test(this.a.satirGiris) || !/^[A-Z]{1,3}\d+$/.test(this.a.sutunGiris)) throw new Error('İki giriş hücresini de B2 biçiminde yazın.'); t = veriTablosu(s.kitap, s.sayfa, { formulHucreler: [s.formul], satirGiris: this.a.satirGiris, sutunGiris: this.a.sutunGiris, satirDegerleri: s.satirDegerleri, sutunDegerleri: s.sutunDegerleri }); }
    catch (e) { this.cikti.textContent = e.message; return; }
    s.kitap.hesapla();
    const b = v => typeof v === 'number' ? (s.bicim ? ozelBicim(v, s.bicim).metin : goster(+v.toPrecision(10))) : goster(v);
    yerlestir(temizle(this.cikti), h('table.veri', {}, h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, `${s.sutunEtiket} ↓ / ${s.satirEtiket} →`), s.satirDegerleri.map(v => h('th', { scope: 'col' }, s.satirBicim ? ozelBicim(v, s.satirBicim).metin : goster(v))))),
      h('tbody', {}, s.sutunDegerleri.map((cv, i) => h('tr', {}, h('th', { scope: 'row' }, s.sutunBicim ? ozelBicim(cv, s.sutunBicim).metin : goster(cv)), t[i].map(v => h('td.sayi', {}, b(v))))))));
  }
}

/* ---------------------------------------------------------------- Senaryo Yöneticisi */
export class SenaryoAlani {
  // s: { kitap, sayfa, izgara, senaryolar: [{ad, degerler}], sonucHucreler: [..], etiketler: {B2: 'Faiz'} }
  constructor(s) {
    this.s = s; this.cikti = h('div.tablo-kaydir');
    this.el = h('div.durum-kutu', {}, h('h4', {}, 'Senaryo Yöneticisi'),
      h('div.btn-row', {}, s.senaryolar.map(sn => h('button.btn.tiny', { type: 'button', on: { click: () => this.goster(sn) } }, 'Göster: ' + sn.ad)), h('button.btn.tiny.primary', { type: 'button', on: { click: () => this.ozet() } }, 'Özet')), this.cikti);
  }
  goster(sn) { for (const [a, v] of Object.entries(sn.degerler)) this.s.kitap.yaz(this.s.sayfa, a, v); this.s.kitap.hesapla(); this.s.izgara.guncelle(); this.cikti.textContent = `"${sn.ad}" senaryosunun değerleri hücrelere yazıldı (Excel'deki Göster düğmesi gibi).`; }
  ozet() {
    const o = senaryoOzeti(this.s.kitap, this.s.sayfa, this.s.senaryolar, this.s.sonucHucreler), et = this.s.etiketler || {};
    const girdiler = Object.keys(this.s.senaryolar[0].degerler);
    yerlestir(temizle(this.cikti), h('table.veri', {}, h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Senaryo Özeti'), o.map(x => h('th', { scope: 'col' }, x.ad)))),
      h('tbody', {}, h('tr', {}, h('th', { colspan: o.length + 1 }, 'Değişen hücreler')), girdiler.map(g => h('tr', {}, h('th', { scope: 'row' }, et[g] ? `${et[g]} (${g})` : g), o.map(x => h('td.sayi', {}, goster(x.degerler[g]))))),
        h('tr', {}, h('th', { colspan: o.length + 1 }, 'Sonuç hücreleri')), this.s.sonucHucreler.map(sh => h('tr', {}, h('th', { scope: 'row' }, et[sh] ? `${et[sh]} (${sh})` : sh), o.map(x => h('td.sayi', {}, goster(typeof x.sonuclar[sh] === 'number' ? Math.round(x.sonuclar[sh] * 100) / 100 : x.sonuclar[sh]))))))));
  }
}

/* ---------------------------------------------------------------- Çözücü */
export class CozucuAlani {
  // s: { kitap, sayfa, izgara, varsayilan?: model }
  constructor(s) {
    this.s = s; const v = s.varsayilan || {};
    this.m = { amac: v.amac || '', yon: v.yon || 'maks', degiskenler: v.degiskenler || '', kisitlar: JSON.parse(JSON.stringify(v.kisitlar || [])) };
    this.taslak = { sol: '', op: '<=', sag: '' };
    this.el = h('div.durum-kutu'); this.sonuc = h('div.small-note', { 'aria-live': 'polite' }); this.ciz();
  }
  ayar() { return JSON.parse(JSON.stringify(this.m)); }
  ciz() {
    const m = this.m, t = this.taslak;
    const kis = m.kisitlar.length ? h('ol.kural-listesi', {}, m.kisitlar.map((k, i) => h('li', {}, h('code', {}, k.op === 'tamsayi' ? `${k.sol} = tamsayı` : k.op === 'ikili' ? `${k.sol} = ikili (0/1)` : `${k.sol} ${k.op} ${k.sag}`), ' ', h('button.btn.tiny', { type: 'button', on: { click: () => { m.kisitlar.splice(i, 1); this.ciz(); } } }, 'Sil'))))
      : h('p.small-note.muted', {}, 'Kısıt yok.');
    yerlestir(temizle(this.el), h('h4', {}, 'Çözücü parametreleri'),
      h('div.pivot-alanlar', {}, alan('Amacı ayarla', metin(m.amac, x => { m.amac = adr(x); }, 'B12')), alan('Hedef', secim(m.yon, [['maks', 'En büyük'], ['min', 'En küçük']], x => { m.yon = x; })),
        alan('Değişken hücreleri değiştirerek', metin(m.degiskenler, x => { m.degiskenler = adr(x); }, 'B4:C4'))),
      h('b', {}, 'Kısıtlamalar'), kis,
      h('div.pivot-alanlar', {}, alan('Hücre başvurusu', metin(t.sol, x => { t.sol = adr(x); }, 'D8')), alan('', secim(t.op, [['<=', '<='], ['>=', '>='], ['=', '='], ['tamsayi', 'tamsayı'], ['ikili', 'ikili']], x => { t.op = x; this.ciz(); })),
        ['tamsayi', 'ikili'].includes(t.op) ? null : alan('Kısıtlama', metin(t.sag, x => { t.sag = x.trim(); }, 'E8 ya da 100')),
        h('div.alan', {}, h('span', {}, ' '), h('button.btn.tiny', { type: 'button', on: { click: () => this.kisitEkle() } }, 'Ekle'))),
      h('p.small-note.muted', {}, 'Sınırlandırılmamış değişkenleri negatif olmayan yap: açık. Çözme yöntemi: Simplex LP (doğrusal model).'),
      h('div.btn-row', {}, h('button.btn.primary', { type: 'button', on: { click: () => this.coz() } }, 'Çöz')), this.sonuc);
  }
  kisitEkle() {
    const t = this.taslak;
    if (!/^[A-Z]{1,3}\d+(:[A-Z]{1,3}\d+)?$/.test(t.sol)) { this.sonuc.textContent = 'Hücre başvurusunu D8 ya da B4:C4 biçiminde yazın.'; return; }
    if (!['tamsayi', 'ikili'].includes(t.op) && !String(t.sag).trim()) { this.sonuc.textContent = 'Kısıtlama değerini ya da hücresini yazın.'; return; }
    const sag = ['tamsayi', 'ikili'].includes(t.op) ? undefined : /^[A-Za-z]/.test(t.sag) ? adr(t.sag) : sayiOku(t.sag);
    this.m.kisitlar.push({ sol: t.sol, op: t.op, ...(sag !== undefined ? { sag } : {}) }); this.taslak = { sol: '', op: '<=', sag: '' }; this.sonuc.textContent = ''; this.ciz();
  }
  coz() {
    const r = cozucu(this.s.kitap, this.s.sayfa, this.ayar());
    this.s.izgara.guncelle(); this.s.izgara.hucreBilgisi();
    this.sonuc.textContent = r.tamam ? `${r.mesaj} Amaç: ${goster(+r.amac.toPrecision(10))}. ` + Object.entries(r.degerler).map(([a, v]) => `${a} = ${goster(v)}`).join(', ') : r.mesaj;
  }
}

/* ---------------------------------------------------------------- Gelişmiş Filtre */
export class GelismisFiltreAlani {
  // s: { kitap, sayfa, izgara, varsayilan?: { liste, olcut, benzersiz }, bolge: ölçüt yazılabilecek alan (ör. M1:P4) }
  constructor(s) {
    this.s = s; const v = s.varsayilan || {};
    this.a = { liste: v.liste || '', olcut: v.olcut || '', benzersiz: !!v.benzersiz };
    this.sonuc = h('div.small-note', { 'aria-live': 'polite' });
    const kutu = h('input', { type: 'checkbox', checked: this.a.benzersiz, on: { change: e => { this.a.benzersiz = e.target.checked; } } });
    this.el = h('div.durum-kutu', {}, h('h4', {}, 'Gelişmiş Filtre'),
      h('p.small-note.muted', {}, `Ölçütleri tablodaki ${s.bolge} alanına yazın: ilk satıra liste başlıkları, altına koşullar. Aynı satır VE, alt alta satırlar YA DA.`),
      h('div.pivot-alanlar', {}, alan('Liste aralığı', metin(this.a.liste, x => { this.a.liste = adr(x); }, 'A1:K241')),
        alan('Ölçüt aralığı', metin(this.a.olcut, x => { this.a.olcut = adr(x); }, 'M1:N2')),
        h('div.alan', {}, h('span', {}, ' '), h('label.cip', {}, kutu, 'Yalnızca benzersiz kayıtlar')),
        h('div.alan', {}, h('span', {}, ' '), h('button.btn.primary', { type: 'button', on: { click: () => this.calistir() } }, 'Tamam'))),
      this.sonuc);
  }
  hucreler() {
    const al = alanCoz(this.s.bolge), out = {};
    for (let r = al.r1; r <= al.r2; r++) for (let c = al.c1; c <= al.c2; c++) { const v = this.s.kitap.icerik(this.s.sayfa, r, c); if (v != null && v !== '') out[adres(r, c)] = v; }
    return out;
  }
  ayar() { return { ...this.a, hucreler: this.hucreler() }; }
  calistir() {
    let r; try { r = gelismisFiltre(this.s.kitap, this.s.sayfa, this.a.liste, this.a.olcut, { benzersiz: this.a.benzersiz }); } catch (e) { yerlestir(temizle(this.sonuc), h('p.uyari', {}, e.message)); return; }
    const goster20 = r.satirlar.slice(0, 20);
    yerlestir(temizle(this.sonuc), h('p', {}, `${r.satirlar.length} kayıt bulundu${r.bosSatir ? ' (ölçüt aralığında boş satır var: her kayıt geçer)' : ''}.` + (r.satirlar.length > 20 ? ' İlk 20 gösteriliyor.' : '')),
      h('div.tablo-kaydir', {}, h('table.veri', {}, h('thead', {}, h('tr', {}, r.basliklar.map(b => h('th', { scope: 'col' }, b)))),
        h('tbody', {}, goster20.map(sat => h('tr', {}, sat.map(x => h('td', {}, goster(x)))))))));
  }
}

/* ---------------------------------------------------------------- Birleştir */
export class BirlestirAlani {
  // s: { kitap, varsayilan?: { kaynaklar, islev, solSutun, ustSatir } }
  constructor(s) {
    this.s = s; const v = s.varsayilan || {};
    this.a = { kaynaklar: [...(v.kaynaklar || [])], islev: v.islev || 'TOPLA', solSutun: !!v.solSutun, ustSatir: !!v.ustSatir };
    this.sonuc = h('div.small-note', { 'aria-live': 'polite' }); this.liste = h('ul.birlestir-liste');
    const yeni = metin('', () => {}, 'Ocak!A1:C8');
    const kutu = (ad, alan) => h('label.cip', {}, h('input', { type: 'checkbox', checked: this.a[alan], on: { change: e => { this.a[alan] = e.target.checked; } } }), ad);
    this.el = h('div.durum-kutu', {}, h('h4', {}, 'Birleştir'),
      h('div.pivot-alanlar', {}, alan('İşlev', secim(this.a.islev, BIRLESTIR_ISLEVLERI.map(x => [x, x]), x => { this.a.islev = x; })),
        alan('Başvuru', yeni, 'Sayfa!A1:C8, Ekle ile listeye'),
        h('div.alan', {}, h('span', {}, ' '), h('button.btn.tiny', { type: 'button', on: { click: () => { const x = yeni.value.trim(); if (x) { this.a.kaynaklar.push(x); yeni.value = ''; this.listeCiz(); } } } }, 'Ekle'))),
      this.liste,
      h('div.alan.cipler', {}, h('span.small-note', {}, 'Etiketleri kullan: '), kutu('Üst satır', 'ustSatir'), kutu('Sol sütun', 'solSutun')),
      h('div.btn-row', {}, h('button.btn.primary', { type: 'button', on: { click: () => this.calistir() } }, 'Tamam')),
      this.sonuc);
    this.listeCiz();
  }
  listeCiz() {
    yerlestir(temizle(this.liste), this.a.kaynaklar.length ? this.a.kaynaklar.map((k, i) => h('li', {}, h('code', {}, k), ' ', h('button.btn.tiny', { type: 'button', 'aria-label': k + ' kaldır', on: { click: () => { this.a.kaynaklar.splice(i, 1); this.listeCiz(); } } }, 'Sil'))) : h('li.muted', {}, 'Henüz başvuru yok.'));
  }
  ayar() { return { ...this.a, kaynaklar: [...this.a.kaynaklar] }; }
  calistir() {
    let r; try { r = birlestir(this.s.kitap, this.a.kaynaklar, this.a); } catch (e) { yerlestir(temizle(this.sonuc), h('p.uyari', {}, e.message)); return; }
    yerlestir(temizle(this.sonuc), h('div.tablo-kaydir', {}, h('table.veri', {}, r.basliklar ? h('thead', {}, h('tr', {}, r.basliklar.map(b => h('th', { scope: 'col' }, b)))) : null,
      h('tbody', {}, r.satirlar.map(s => h('tr', {}, s.map(x => h('td', {}, goster(x)))))))));
  }
}
