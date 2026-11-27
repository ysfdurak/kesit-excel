// Kesit Excel · ızgara ve formül çubuğu.
// Excel'e benzer davranış: formül yazarken hücreye tıklamak başvuru ekler, Shift+tık (ya da dokunmatikte ikinci dokunuş) aralığa genişletir,
// F4 $ işaretlerini döndürür, yazarken işlev önerilir ve imlecin olduğu işlevin söz dizimi gösterilir.
import { h, temizle, yerlestir } from './yardim.js';
import { goster } from '../motor/kitap.js';
import { belirtec, adres, alanCoz, adresCoz, sutunHarf, cevir, kaydir, hataMi, yazimBul } from '../motor/formul.js';
import { ISLEVLER } from '../motor/islevler.js';
import { ISLEV_BILGI, islevBul } from '../icerik/islev-bilgi.js';
import { HATA_ACIKLAMA } from '../motor/denetci.js';
import { kosulluUygula, miniGrafik } from '../motor/kosullu.js';
import { svgDugum } from './grafik-ui.js';
import { dogrula, kuralBul, listeDegerleri, gecersizler, etkileyenler, etkilenenler, formulAdimlari } from '../motor/dogrulama.js';
import { ozelBicim } from '../motor/bicim.js';
import { sayiMetin } from '../motor/formul.js';

const REF_RENK = 6;
const EKLENEBILIR_ONCE = /[=(;,+\-*/^&<>:]\s*$/;
let sayac = 0;

// VBA rengi BGR tamsayı: 255 kırmızı, 65535 sarı → CSS
export const vbaRenk = n => { const x = Number(n) | 0; return `rgb(${x & 255}, ${(x >> 8) & 255}, ${(x >> 16) & 255})`; };
// VBA NumberFormat İngilizce koddur (#,##0.00; dd.mm.yyyy) → Kesit'in Türkçe biçimleyicisi
export const vbaBicim = b => String(b).replace(/,(?=[#0])/g, '§').replace(/\.(?=[0#])/g, ',').replace(/§/g, '.').replace(/d/g, 'g').replace(/m(?![^"]*")/g, 'a').replace(/h/g, 's');

export class Izgara {
  // secenek: { kitap, sayfa, satirSayisi, sutunSayisi, bicimler: [kolonBiçimi], hucreBicim: {adr: biçim}, hedef, okunan, duzenlenebilir: (r,c)=>bool, onYaz(r,c,icerik), onDoldur(formul) }
  constructor(s) {
    this.s = s; this.k = s.kitap; this.sayfa = s.sayfa; this.id = 'iz' + (++sayac);
    this.secili = s.ilkSecim ? adresCoz(s.ilkSecim) : { r: 1, c: 1 };
    this.duzenle = false; this.sonRef = null; this.hucreler = new Map();
    this.hedef = s.hedef ? alanCoz(s.hedef.includes(':') ? s.hedef : s.hedef + ':' + s.hedef) : null;
    this.okunan = s.okunan ? alanCoz(s.okunan) : this.hedef;
    this.el = this.kur();
    this.sec(this.secili.r, this.secili.c, false);
  }
  kur() {
    const s = this.s;
    this.adKutu = h('input.adkutu', { type: 'text', 'aria-label': 'Ad kutusu: hücre adresi yazıp Enter', spellcheck: 'false', autocomplete: 'off', size: 5 });
    this.adKutu.addEventListener('keydown', e => { if (e.key !== 'Enter') return; e.preventDefault(); const p = adresCoz(this.adKutu.value.toUpperCase()); if (p && p.r <= this.s.satirSayisi && p.c <= this.s.sutunSayisi) this.sec(p.r, p.c, true); else this.adKutu.value = adres(this.secili.r, this.secili.c); });
    this.giris = h('input.fx', { type: 'text', spellcheck: 'false', autocomplete: 'off', 'aria-label': 'Formül çubuğu', placeholder: 'Formül yazın: =TOPLA(…', id: this.id + '-fx' });
    this.oneriler = h('ul.oneri', { role: 'listbox', id: this.id + '-oneri', hidden: true });
    this.giris.setAttribute('aria-controls', this.oneriler.id);
    this.ipucu = h('div.sozdizimi', { 'aria-live': 'polite' });
    this.turEtiket = h('span.tur');
    const dilBtn = h('button.btn.tiny', { type: 'button', title: 'Formülü Türkçe ↔ İngilizce çevir', on: { click: () => this.dilDegistir() } }, 'TR ⇄ EN');
    const f4Btn = h('button.btn.tiny', { type: 'button', title: 'İmleçteki başvuruda $ işaretlerini değiştir (F4)', on: { mousedown: e => e.preventDefault(), click: () => { this.f4(); this.giris.focus(); } } }, '$ (F4)');
    const uygulaBtn = h('button.btn.tiny.primary', { type: 'button', on: { click: () => this.uygula() } }, 'Yaz ↵');
    this.doldurBtn = h('button.btn.tiny', { type: 'button', hidden: !(this.hedef && this.hedef.r2 > this.hedef.r1), title: 'İlk hedef hücredeki formülü hedef alanın sonuna kadar kopyalar', on: { click: () => this.doldur() } }, '↓ Aşağı doldur');
    this.giris.addEventListener('focus', () => { if (this.yazilabilir()) this.duzenle = true; });
    this.giris.addEventListener('input', () => { this.sonRef = null; this.oneriGoster(); this.ipucuGoster(); this.refBoya(); });
    this.giris.addEventListener('keydown', e => this.tus(e));
    this.giris.addEventListener('click', () => { this.ipucuGoster(); });
    this.giris.addEventListener('blur', () => setTimeout(() => { if (document.activeElement !== this.giris) { this.oneriler.hidden = true; } }, 150));
    const cubuk = h('div.fxcubuk', {}, this.adKutu, h('span.fxetiket', { 'aria-hidden': 'true' }, 'fx'), this.giris, h('div.fxdug', {}, uygulaBtn, f4Btn, dilBtn, this.doldurBtn));
    this.aciklama = h('div.hucreaciklama', { 'aria-live': 'polite' });
    // Tablo
    const R = s.satirSayisi, C = s.sutunSayisi;
    const thead = h('thead', {}, h('tr', {}, h('th.kose', { scope: 'col' }), Array.from({ length: C }, (_, j) => h('th', { scope: 'col' }, sutunHarf(j + 1)))));
    const tbody = h('tbody');
    for (let r = 1; r <= R; r++) {
      const tr = h('tr', {}, h('th', { scope: 'row' }, r));
      for (let c = 1; c <= C; c++) {
        const td = h('td', { veri: { r, c } });
        if (this.icinde(this.hedef, r, c)) td.classList.add('hedef');
        if (s.duzenlenebilir && s.duzenlenebilir(r, c)) td.classList.add('duz');
        if (r === 1) td.classList.add('baslik');
        this.hucreler.set(r + ',' + c, td); tr.append(td);
      }
      tbody.append(tr);
    }
    this.tablo = h('table.izgara', { role: 'grid', 'aria-label': `${this.sayfa} sayfası` }, thead, tbody);
    let surukle = null;
    const hucreAl = e => { const td = e.target.closest('td'); return td && this.tablo.contains(td) ? { r: +td.dataset.r, c: +td.dataset.c } : null; };
    this.tablo.addEventListener('mousedown', e => { const p = hucreAl(e); if (!p) return; if (this.refModu()) { e.preventDefault(); surukle = p; this.refEkle(p, p, e.shiftKey); } });
    this.tablo.addEventListener('mouseover', e => { if (!surukle || !(e.buttons & 1)) return; const p = hucreAl(e); if (p) this.refEkle(surukle, p, false, true); });
    window.addEventListener('mouseup', () => { surukle = null; });
    this.tablo.addEventListener('click', e => { const p = hucreAl(e); if (!p) return; if (this.refModu(true)) return; this.sec(p.r, p.c, true); });
    this.tablo.addEventListener('touchend', e => { const p = hucreAl(e); if (!p || !this.refModu()) return; e.preventDefault(); this.refEkle(this.sonRef ? this.sonRef.bas : p, p, !!this.sonRef); this.giris.focus(); }, { passive: false });
    const kaydirma = h('div.izgara-kaydir', { tabindex: '0', 'aria-label': 'Tablo: ok tuşlarıyla hücre seçin, Enter ile formül çubuğuna geçin' }, this.tablo);
    kaydirma.addEventListener('keydown', e => {
      const d = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
      if (d) { e.preventDefault(); const r = Math.min(this.s.satirSayisi, Math.max(1, this.secili.r + d[0])), c = Math.min(this.s.sutunSayisi, Math.max(1, this.secili.c + d[1])); this.sec(r, c, false); }
      else if (e.key === 'Enter' || e.key === 'F2') { e.preventDefault(); this.sec(this.secili.r, this.secili.c, true); if (this.giris.readOnly) this.giris.focus(); }
    });
    // Veri doğrulamada liste kuralı: seçili hücrede açılır liste (Excel'deki hücre içi ok)
    this.listeSec = h('select.liste-sec', { hidden: true, 'aria-label': 'Listeden seç', on: { change: e => { if (!e.target.value) return; this.giris.value = e.target.value; this.uygula(); } } });
    cubuk.append(this.listeSec);
    // Formül denetimi araç çubuğu (Formüller > Formül Denetleme)
    this.denetimKutu = h('div.denetim-sonuc', { 'aria-live': 'polite' });
    // Gözcü Penceresi (Formüller > Gözcü Penceresi): seçilen hücrelerin değeri, tablo kaydırılınca da görünür kalır ve her hesaplamada güncellenir
    this.gozcu = []; this.gozcuKutu = h('div.gozcu', { hidden: true, 'aria-live': 'polite' });
    const denetimCubuk = s.denetim ? h('div.denetim-cubuk', { role: 'group', 'aria-label': 'Formül denetleme' },
      h('button.btn.tiny', { type: 'button', on: { click: () => this.izle('once') } }, '⇠ Etkileyenleri izle'),
      h('button.btn.tiny', { type: 'button', on: { click: () => this.izle('sonra') } }, 'Etkilenenleri izle ⇢'),
      h('button.btn.tiny', { type: 'button', on: { click: () => this.degerlendirAc() } }, 'Formülü değerlendir'),
      h('button.btn.tiny', { type: 'button', on: { click: () => this.izTemizle() } }, 'Okları kaldır'),
      h('button.btn.tiny', { type: 'button', on: { click: () => this.gozcuEkle() } }, '👁 Gözcüye ekle'),
      s.dogrulama ? h('button.btn.tiny', { type: 'button', on: { click: () => this.gecersizGoster() } }, '◯ Geçersiz verileri işaretle') : null) : null;
    const kap = h('div.izgara-kap', {}, cubuk, this.oneriler, this.ipucu, denetimCubuk, this.denetimKutu, this.gozcuKutu, kaydirma, h('div.izgara-alt', {}, this.turEtiket, this.aciklama));
    this.guncelle();
    // Sayfaya eklenince seçili (hedef) hücreyi görünür alana kaydır
    let deneme = 0; const bekle = () => { if (kap.isConnected) this.gorunurYap(true); else if (deneme++ < 30) requestAnimationFrame(bekle); };
    requestAnimationFrame(bekle);
    this.kaydirma = kaydirma;
    return kap;
  }
  // Hücreyi kaydırma kutusunun içinde görünür yapar; sayfanın kendisini kaydırmaz
  gorunurYap(ortala = false) {
    const k = this.kaydirma, td = this.hucreler.get(this.secili.r + ',' + this.secili.c); if (!k || !td) return;
    const solSabit = 40, ustSabit = 28;
    const x = td.offsetLeft, y = td.offsetTop, w = td.offsetWidth, hh = td.offsetHeight;
    if (ortala) { if (x + w > k.clientWidth) k.scrollLeft = Math.max(0, x - k.clientWidth / 2); }
    else {
      if (x - solSabit < k.scrollLeft) k.scrollLeft = x - solSabit; else if (x + w > k.scrollLeft + k.clientWidth) k.scrollLeft = x + w - k.clientWidth;
      if (y - ustSabit < k.scrollTop) k.scrollTop = y - ustSabit; else if (y + hh > k.scrollTop + k.clientHeight) k.scrollTop = y + hh - k.clientHeight;
    }
  }
  icinde(a, r, c) { return a && r >= a.r1 && r <= a.r2 && c >= a.c1 && c <= a.c2; }
  yazilabilir(r = this.secili.r, c = this.secili.c) { return !!(this.s.duzenlenebilir && this.s.duzenlenebilir(r, c)); }
  // Formül yazılırken mi? İmleç bir işleçten sonra ya da az önce eklenen başvurunun sonundaysa tık başvuru ekler.
  refModu(tikta = false) {
    if (!this.duzenle || !this.giris.value.startsWith('=')) return false;
    if (tikta) return this.sonTik && Date.now() - this.sonTik < 400;
    const once = this.giris.value.slice(0, this.giris.selectionStart ?? this.giris.value.length);
    const uygun = EKLENEBILIR_ONCE.test(once) || (this.sonRef && this.sonRef.son === once.length);
    if (uygun) this.sonTik = Date.now();
    return uygun;
  }
  refEkle(bas, son, genislet = false, surukleme = false) {
    const g = this.giris, v = g.value;
    let a = bas, b = son;
    if (genislet && this.sonRef) a = this.sonRef.bas;
    const r1 = Math.min(a.r, b.r), r2 = Math.max(a.r, b.r), c1 = Math.min(a.c, b.c), c2 = Math.max(a.c, b.c);
    const metin = r1 === r2 && c1 === c2 ? adres(r1, c1) : adres(r1, c1) + ':' + adres(r2, c2);
    let i = g.selectionStart ?? v.length;
    let basKonum = i;
    if (this.sonRef && this.sonRef.son === i) basKonum = this.sonRef.konum; // önceki eklenen başvurunun yerine
    g.value = v.slice(0, basKonum) + metin + v.slice(i);
    const yeni = basKonum + metin.length;
    g.setSelectionRange(yeni, yeni);
    this.sonRef = { konum: basKonum, son: yeni, bas: a };
    this.refBoya(); this.ipucuGoster();
    if (!surukleme) g.focus();
  }
  sec(r, c, odak) {
    this.secili = { r, c }; this.duzenle = false; this.sonRef = null;
    for (const td of this.tablo.querySelectorAll('td.secili')) td.classList.remove('secili');
    const td = this.hucreler.get(r + ',' + c); if (td) td.classList.add('secili');
    this.gorunurYap();
    this.adKutu.value = adres(r, c);
    const ic = this.k.icerik(this.sayfa, r, c);
    this.giris.value = ic == null ? '' : typeof ic === 'number' && this.k.icerik ? String(ic).replace('.', ',') : typeof ic === 'boolean' ? (ic ? 'DOĞRU' : 'YANLIŞ') : String(ic);
    this.giris.readOnly = !this.yazilabilir(r, c);
    this.giris.classList.toggle('kilitli', this.giris.readOnly);
    this.oneriler.hidden = true; this.ipucuGoster(); this.refBoya(); this.hucreBilgisi(); this.listeGoster();
    if (odak && !this.giris.readOnly) { this.giris.focus(); const n = this.giris.value.length; this.giris.setSelectionRange(n, n); this.duzenle = true; }
  }
  hucreBilgisi() {
    const { r, c } = this.secili, v = this.k.hucre(this.sayfa, r, c);
    const tur = v == null ? 'boş' : hataMi(v) ? 'hata' : typeof v === 'number' ? 'sayı' : typeof v === 'boolean' ? 'mantıksal' : 'metin';
    const ic = this.k.icerik(this.sayfa, r, c), formul = typeof ic === 'string' && ic.startsWith('=');
    this.turEtiket.textContent = `${adres(r, c)} · ${formul ? 'formül → ' : ''}${tur}${this.k.tasmaMi(this.sayfa, r, c) ? ' (taşan sonuç)' : ''}`;
    temizle(this.aciklama);
    const fh = this.k.formulHatasi(this.sayfa, r, c);
    if (fh) yerlestir(this.aciklama, h('span.uyari', {}, 'Formül okunamadı: ' + fh));
    else if (hataMi(v)) yerlestir(this.aciklama, h('span.uyari', {}, goster(v) + ': ' + (HATA_ACIKLAMA[v.kod] || '')));
  }
  uygula() {
    if (!this.yazilabilir()) return;
    const { r, c } = this.secili;
    // Veri doğrulama: yazılan değer kurala uymuyorsa hata uyarısının stiline göre davran
    const kural = kuralBul(this.s.dogrulama, r, c), ham = this.giris.value;
    if (kural && !ham.startsWith('=')) {
      const t = ham.trim(), n = sayiMetin(t), deger = t === '' ? null : n == null ? t : n;
      if (!dogrula(this.k, this.sayfa, r, c, deger, kural)) {
        const ileti = kural.hataIletisi || 'Bu değer, bu hücre için tanımlanan veri doğrulama kısıtlamalarıyla eşleşmiyor.';
        if ((kural.hataStili || 'durdur') === 'durdur') { yerlestir(temizle(this.aciklama), h('span.uyari', {}, '⛔ ' + (kural.hataBaslik || 'Geçersiz giriş') + ': ' + ileti)); this.giris.select(); return; }
        yerlestir(temizle(this.aciklama), h('span.uyari', {}, (kural.hataStili === 'uyari' ? '⚠ ' : 'ℹ ') + ileti + ' (Değer yazıldı: ' + (kural.hataStili === 'uyari' ? 'Uyarı stilinde kullanıcı Evet diyebilir' : 'Bilgi stili yalnız bildirir') + '.)'));
        this.s.onYaz ? this.s.onYaz(r, c, ham) : this.k.yazGiris(this.sayfa, { r, c }, ham);
        this.k.hesapla(); this.guncelle(); this.duzenle = false; if (this.s.onDegis) this.s.onDegis(); return;
      }
    }
    this.s.onYaz ? this.s.onYaz(r, c, this.giris.value) : this.k.yazGiris(this.sayfa, { r, c }, this.giris.value);
    this.k.hesapla(); this.guncelle(); this.duzenle = false; this.sonRef = null; this.oneriler.hidden = true;
    this.hucreBilgisi(); this.refBoya();
    if (this.s.onDegis) this.s.onDegis();
  }
  doldur() {
    if (!this.hedef) return;
    const ilk = this.k.icerik(this.sayfa, this.hedef.r1, this.hedef.c1);
    const f = this.secili.r === this.hedef.r1 && this.giris.value.startsWith('=') ? this.giris.value : ilk;
    if (typeof f !== 'string' || !f.startsWith('=')) { this.aciklama.textContent = 'Önce ' + adres(this.hedef.r1, this.hedef.c1) + ' hücresine formülü yazın.'; return; }
    for (let r = this.hedef.r1; r <= this.hedef.r2; r++) this.k.yaz(this.sayfa, { r, c: this.hedef.c1 }, kaydir(f, r - this.hedef.r1, 0));
    this.k.hesapla(); this.guncelle(); this.hucreBilgisi();
    this.aciklama.textContent = `${adres(this.hedef.r1, this.hedef.c1)} formülü ${adres(this.hedef.r2, this.hedef.c1)} hücresine kadar kopyalandı. Bir alt hücreyi seçip başvuruların nasıl kaydığına bakın.`;
    if (this.s.onDegis) this.s.onDegis();
  }
  // Koşullu biçim kuralları ve mini grafikler dışarıdan değiştirilebilir (Koşullu biçim / Mini grafik alıştırmaları)
  kurallariAyarla(kurallar) { this.s.kurallar = kurallar; this.guncelle(); }
  miniAyarla(mini) { this.s.mini = mini; this.guncelle(); }
  dogrulamaAyarla(kurallar) { this.s.dogrulama = kurallar; this.gecersizIsaret = false; this.guncelle(); this.listeGoster(); }
  bicimAyarla(harita) { this.s.ozelBicim = harita; this.guncelle(); }
  listeGoster() {
    const { r, c } = this.secili, k = kuralBul(this.s.dogrulama, r, c);
    if (!this.listeSec) return;
    if (!k || k.tur !== 'liste' || k.listeOku === false || !this.yazilabilir(r, c)) { this.listeSec.hidden = true; return; }
    const l = listeDegerleri(this.k, this.sayfa, r, c, k.kaynak, r - (alanCoz(k.alan)?.r1 ?? r), c - (alanCoz(k.alan)?.c1 ?? c));
    yerlestir(temizle(this.listeSec), h('option', { value: '' }, '▾ liste'), l.map(x => h('option', { value: String(x) }, String(x))));
    this.listeSec.hidden = false;
  }
  gecersizGoster() {
    this.gecersizIsaret = !this.gecersizIsaret;
    const g = this.gecersizIsaret ? gecersizler(this.k, this.sayfa, this.s.dogrulama) : new Set();
    for (const [k, td] of this.hucreler) { const [r, c] = k.split(',').map(Number); td.classList.toggle('gecersiz', g.has(adres(r, c))); }
    this.denetimKutu.textContent = this.gecersizIsaret ? (g.size ? `${g.size} hücre kurala uymuyor (kırmızı halka).` : 'Kurala uymayan hücre yok.') : '';
  }
  izTemizle() { for (const td of this.tablo.querySelectorAll('td.iz-once, td.iz-sonra')) td.classList.remove('iz-once', 'iz-sonra'); temizle(this.denetimKutu); }
  izle(yon) {
    const { r, c } = this.secili; this.izTemizle();
    if (yon === 'once') {
      const l = etkileyenler(this.k, this.sayfa, r, c);
      if (!l.length) { this.denetimKutu.textContent = `${adres(r, c)} formül değil ya da başka hücreye bakmıyor.`; return; }
      for (const x of l) if (x.sayfa.toLocaleLowerCase('tr') === this.sayfa.toLocaleLowerCase('tr')) for (let a = x.r1; a <= Math.min(x.r2, this.s.satirSayisi); a++) for (let b = x.c1; b <= x.c2; b++) this.hucreler.get(a + ',' + b)?.classList.add('iz-once');
      this.denetimKutu.textContent = `${adres(r, c)} şunlara bakıyor: ` + l.map(x => x.metin + (x.sayfa.toLocaleLowerCase('tr') !== this.sayfa.toLocaleLowerCase('tr') ? ' (başka sayfa)' : '')).join(', ');
    } else {
      const l = etkilenenler(this.k, this.sayfa, r, c);
      if (!l.length) { this.denetimKutu.textContent = `${adres(r, c)} hücresini okuyan formül yok.`; return; }
      for (const x of l) if (x.sayfa.toLocaleLowerCase('tr') === this.sayfa.toLocaleLowerCase('tr')) this.hucreler.get(x.r + ',' + x.c)?.classList.add('iz-sonra');
      this.denetimKutu.textContent = `${adres(r, c)} hücresini ${l.length} formül okuyor: ` + l.slice(0, 12).map(x => (x.sayfa !== this.sayfa ? x.sayfa + '!' : '') + adres(x.r, x.c)).join(', ') + (l.length > 12 ? ' …' : '');
    }
  }
  degerlendirAc() {
    const { r, c } = this.secili, adimlar = formulAdimlari(this.k, this.sayfa, r, c);
    temizle(this.denetimKutu);
    if (!adimlar.length) { this.denetimKutu.textContent = `${adres(r, c)} formül değil.`; return; }
    let i = 0;
    const liste = h('ol.degerlendir-liste');
    const ileri = h('button.btn.tiny.primary', { type: 'button' }, 'Değerlendir');
    const goster = () => { liste.append(h('li', {}, h('code', {}, adimlar[i].metin), i ? h('span.muted', {}, '  ← ' + adimlar[i].ne) : null)); i++; if (i >= adimlar.length) { ileri.disabled = true; ileri.textContent = 'Bitti'; } };
    ileri.addEventListener('click', goster);
    yerlestir(this.denetimKutu, h('div.degerlendir', {}, h('b', {}, `Formülü değerlendir · ${adres(r, c)}`), liste, h('div.btn-row', {}, ileri, h('button.btn.tiny', { type: 'button', on: { click: () => { while (i < adimlar.length) goster(); } } }, 'Hepsini göster'))));
    goster();
  }
  gozcuEkle() {
    const { r, c } = this.secili;
    if (!this.gozcu.some(g => g.r === r && g.c === c)) this.gozcu.push({ r, c });
    this.gozcuCiz();
  }
  gozcuCiz() {
    this.gozcuKutu.hidden = !this.gozcu.length;
    if (!this.gozcu.length) return;
    yerlestir(temizle(this.gozcuKutu), h('table.veri', {}, h('caption', {}, 'Gözcü Penceresi'),
      h('thead', {}, h('tr', {}, ['Hücre', 'Formül', 'Değer', ''].map(b => h('th', { scope: 'col' }, b)))),
      h('tbody', {}, this.gozcu.map((g, i) => h('tr', {}, h('td', {}, adres(g.r, g.c)), h('td', {}, h('code', {}, String(this.k.icerik(this.sayfa, g.r, g.c) ?? ''))), h('td.sayi', {}, goster(this.k.hucre(this.sayfa, g.r, g.c))),
        h('td', {}, h('button.btn.tiny', { type: 'button', 'aria-label': adres(g.r, g.c) + ' gözcüden çıkar', on: { click: () => { this.gozcu.splice(i, 1); this.gozcuCiz(); } } }, '✕')))))));
  }
  guncelle() {
    if (this.gozcu && this.gozcu.length) queueMicrotask(() => this.gozcuCiz());
    const bic = this.s.bicimler || [], hb = this.s.hucreBicim || {};
    let gor = null; try { gor = this.s.kurallar && this.s.kurallar.length ? kosulluUygula(this.k, this.sayfa, this.s.kurallar) : null; this.kuralHatasi = null; } catch (e) { this.kuralHatasi = e.message; }
    const stiller = this.k.stiller;
    for (const [k, td] of this.hucreler) {
      const [r, c] = k.split(',').map(Number);
      const v = this.k.hucre(this.sayfa, r, c), ic = this.k.icerik(this.sayfa, r, c);
      const formul = typeof ic === 'string' && ic.startsWith('=');
      const b = hb[adres(r, c)] || (formul && this.icinde(this.okunan, r, c) ? this.s.hedefBicim : null) || (!formul && r > 1 ? bic[c - 1] : null);
      td.textContent = goster(v, typeof v === 'number' ? b : null);
      td.classList.toggle('sayi', typeof v === 'number');
      td.classList.toggle('hata', hataMi(v));
      td.classList.toggle('formul', formul);
      td.classList.toggle('tasma', this.k.tasmaMi(this.sayfa, r, c));
      // Makronun yazdığı biçim (VBA renkleri BGR tamsayıdır: kırmızı = 255)
      const st = stiller && stiller.get(this.sayfa + '!' + r + ',' + c);
      td.classList.toggle('kalin', !!(st && st.kalin));
      td.style.backgroundColor = st && st.dolgu != null && st.dolgu !== 16777215 ? vbaRenk(st.dolgu) : '';
      td.style.color = st && st.yaziRenk ? vbaRenk(st.yaziRenk) : '';
      if (st && st.sayiBicimi && typeof v === 'number' && !st.sayiBicimi.match(/^general$/i)) td.textContent = goster(v, vbaBicim(st.sayiBicimi));
      // Özel sayı biçimi (Hücreleri Biçimlendir > Özel): değer aynı kalır, yalnız görünüş değişir
      const ob = this.s.ozelBicim && Object.entries(this.s.ozelBicim).find(([al]) => this.icinde(alanCoz(al.includes(':') ? al : al + ':' + al), r, c));
      if (ob && v != null && !hataMi(v)) { try { const o = ozelBicim(v, ob[1]); td.textContent = o.metin; if (o.renk) td.style.color = o.renk; } catch { /* bozuk kod: olduğu gibi */ } }
      if (this.gecersizIsaret === false) td.classList.remove('gecersiz');
      // Koşullu biçim görünümü
      const g = gor && gor.get(r + ',' + c);
      for (const k of ['kb-kirmizi', 'kb-sari', 'kb-yesil', 'kb-kalin']) td.classList.remove(k);
      td.style.backgroundImage = '';
      if (g) {
        if (g.stil) td.classList.add('kb-' + g.stil);
        if (g.cubuk) { const b0 = g.cubuk.bas * 100, b1 = b0 + g.cubuk.oran * 100, renk = g.cubuk.negatif ? 'var(--kb-neg)' : 'var(--kb-cubuk)'; td.style.backgroundImage = `linear-gradient(90deg, transparent ${b0}%, ${renk} ${b0}%, ${renk} ${b1}%, transparent ${b1}%)`; }
        if (g.renk) { const t = g.renk.ters ? 1 - g.renk.t : g.renk.t; td.style.backgroundColor = g.renk.uclu ? (t < 0.5 ? `color-mix(in srgb, var(--kb-dus) ${Math.round((0.5 - t) * 190)}%, transparent)` : `color-mix(in srgb, var(--kb-yuk) ${Math.round((t - 0.5) * 190)}%, transparent)`) : `color-mix(in srgb, var(--kb-sira) ${Math.round(8 + t * 80)}%, transparent)`; }
        if (g.simge) td.prepend(h('span', { sinif: 'simge simge-' + g.simge, 'aria-label': { yukari: 'yüksek', yan: 'orta', asagi: 'düşük' }[g.simge] }, { yukari: '▲', yan: '▶', asagi: '▼' }[g.simge] + ' '));
      }
      // Mini grafik
      td.classList.remove('mini-hucre');
      const m = this.s.mini && this.s.mini.find(x => x.hucre === adres(r, c));
      if (m) { const svg = miniGrafik(this.k, this.sayfa, m); temizle(td); if (svg) td.append(svgDugum(svg)); td.classList.add('mini-hucre'); }
    }
  }
  refBoya() {
    for (const td of this.tablo.querySelectorAll('td[data-ref]')) { td.removeAttribute('data-ref'); td.style.boxShadow = ''; }
    const v = this.giris.value; if (!v.startsWith('=')) return;
    let tk; try { tk = belirtec(v.slice(1)); } catch { return; }
    let n = 0;
    for (const t of tk) {
      if (t.t !== 'ref' || (t.sayfa && t.sayfa.toLocaleLowerCase('tr') !== this.sayfa.toLocaleLowerCase('tr'))) continue;
      const r1 = t.tip === 'sutun' ? 1 : t.r1, r2 = t.tip === 'sutun' ? this.s.satirSayisi : (t.r2 ?? t.r1);
      const c1 = t.tip === 'satir' ? 1 : t.c1, c2 = t.tip === 'satir' ? this.s.sutunSayisi : (t.c2 ?? t.c1);
      // Excel gibi: aralığın içi açık renk, yalnız dış kenarı çizgili (CSSOM ile; satır içi stil özniteliği yazılmaz)
      const renk = `var(--r${n % REF_RENK})`, R2 = Math.min(r2, this.s.satirSayisi), C2 = Math.min(c2, this.s.sutunSayisi);
      for (let r = r1; r <= R2; r++) for (let c = c1; c <= C2; c++) {
        const td = this.hucreler.get(r + ',' + c); if (!td || td.dataset.ref) continue;
        td.dataset.ref = String(n % REF_RENK);
        const k = []; if (r === r1) k.push(`inset 0 2px 0 ${renk}`); if (r === R2) k.push(`inset 0 -2px 0 ${renk}`); if (c === c1) k.push(`inset 2px 0 0 ${renk}`); if (c === C2) k.push(`inset -2px 0 0 ${renk}`);
        td.style.boxShadow = k.join(',');
      }
      n++;
    }
  }
  tus(e) {
    if (!this.oneriler.hidden) {
      const ogeler = [...this.oneriler.children]; let i = ogeler.findIndex(o => o.getAttribute('aria-selected') === 'true');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); i = (i + (e.key === 'ArrowDown' ? 1 : -1) + ogeler.length) % ogeler.length; ogeler.forEach((o, j) => o.setAttribute('aria-selected', String(j === i))); return; }
      if ((e.key === 'Tab' || e.key === 'Enter') && i >= 0) { e.preventDefault(); this.oneriSec(ogeler[i].dataset.ad); return; }
      if (e.key === 'Escape') { this.oneriler.hidden = true; return; }
    }
    if (e.key === 'F4') { e.preventDefault(); this.f4(); }
    else if (e.key === 'Enter') { e.preventDefault(); this.uygula(); }
    else if (e.key === 'Escape') { this.sec(this.secili.r, this.secili.c, false); }
  }
  // İmleçteki başvuru: A1 → $A$1 → A$1 → $A1 → A1
  f4() {
    const g = this.giris, v = g.value, i = g.selectionStart ?? v.length;
    const re = /(\$?)([A-Za-z]{1,3})(\$?)(\d+)(?::(\$?)([A-Za-z]{1,3})(\$?)(\d+))?/g; let m;
    while ((m = re.exec(v))) {
      const bas = m.index, son = bas + m[0].length;
      if (i < bas || i > son) continue;
      if (/[A-Za-zÇĞİÖŞÜçğıöşü_]/.test(v[bas - 1] || '') || v[son] === '(') continue;
      const dongu = (a, b) => { const s = (a ? 2 : 0) + (b ? 1 : 0); const n = { 0: 3, 3: 1, 1: 2, 2: 0 }[s]; return [n >= 2, n % 2 === 1]; };
      const [ac, ar] = dongu(m[1], m[3]);
      let yeni = (ac ? '$' : '') + m[2] + (ar ? '$' : '') + m[4];
      if (m[6]) { const [bc, br] = dongu(m[5], m[7]); yeni += ':' + (bc ? '$' : '') + m[6] + (br ? '$' : '') + m[8]; }
      g.value = v.slice(0, bas) + yeni + v.slice(son); g.setSelectionRange(bas + yeni.length, bas + yeni.length);
      this.refBoya(); return;
    }
  }
  dilDegistir() {
    const v = this.giris.value; if (!v.startsWith('=')) return;
    try { const kaynak = yazimBul(v.slice(1)); this.giris.value = cevir(v, kaynak === 'tr' ? 'en' : 'tr', ISLEVLER); this.aciklama.textContent = kaynak === 'tr' ? 'İngilizce yazım: işlev adları İngilizce, ayırıcı virgül, ondalık nokta.' : 'Türkçe yazım: ayırıcı noktalı virgül, ondalık virgül.'; }
    catch (e) { this.aciklama.textContent = 'Çevrilemedi: ' + e.message; }
    this.ipucuGoster();
  }
  kelime() {
    const v = this.giris.value, i = this.giris.selectionStart ?? v.length;
    const m = /(^|[=(;,+\-*/^&<>\s])([A-Za-zÇĞİÖŞÜçğıöşü_][A-Za-zÇĞİÖŞÜçğıöşü0-9_.]*)$/.exec(v.slice(0, i));
    return m && v.startsWith('=') ? { kelime: m[2], bas: i - m[2].length, son: i } : null;
  }
  oneriGoster() {
    temizle(this.oneriler);
    const k = this.kelime(); if (!k || /^[A-Za-z]{1,3}\d/.test(k.kelime)) { this.oneriler.hidden = true; return; }
    const b = k.kelime.toLocaleUpperCase('tr');
    const liste = ISLEV_BILGI.filter(x => x.tr.toLocaleUpperCase('tr').startsWith(b) || x.en.startsWith(b)).slice(0, 7);
    if (!liste.length || (liste.length === 1 && liste[0].tr === b)) { this.oneriler.hidden = true; return; }
    const tr = yazimBul(this.giris.value.slice(1)) !== 'en' || /[ÇĞİÖŞÜ]/.test(b);
    liste.forEach((x, j) => this.oneriler.append(h('li', { role: 'option', 'aria-selected': String(j === 0), veri: { ad: tr ? x.tr : x.en }, on: { mousedown: e => { e.preventDefault(); this.oneriSec(tr ? x.tr : x.en); } } }, h('b', {}, tr ? x.tr : x.en), h('small', {}, ' ' + x.aciklama))));
    this.oneriler.hidden = false;
  }
  oneriSec(ad) {
    const k = this.kelime(); if (!k) return;
    const v = this.giris.value; this.giris.value = v.slice(0, k.bas) + ad + '(' + v.slice(k.son);
    const n = k.bas + ad.length + 1; this.giris.setSelectionRange(n, n); this.oneriler.hidden = true; this.giris.focus(); this.ipucuGoster();
  }
  // İmlecin içinde bulunduğu işlevi ve kaçıncı bağımsız değişkende olduğunu bulur
  ipucuGoster() {
    temizle(this.ipucu);
    const v = this.giris.value, i = this.giris.selectionStart ?? v.length;
    if (!v.startsWith('=')) return;
    const once = v.slice(0, i); let derinlik = 0, arg = 0, tirnak = false;
    for (let j = once.length - 1; j >= 0; j--) {
      const ch = once[j];
      if (ch === '"') { tirnak = !tirnak; continue; } if (tirnak) continue;
      if (ch === ')') derinlik++;
      else if (ch === '(') { if (derinlik === 0) { const m = /([A-Za-zÇĞİÖŞÜçğıöşü_][A-Za-zÇĞİÖŞÜçğıöşü0-9_.]*)$/.exec(once.slice(0, j)); if (!m) return; const b = islevBul(m[1]); if (!b) return; this.ipucuYaz(b, arg); return; } derinlik--; }
      else if ((ch === ';' || ch === ',') && derinlik === 0) arg++;
    }
  }
  ipucuYaz(b, arg) {
    const m = /^([^(]+)\((.*)\)$/.exec(b.sozdizimi); if (!m) return;
    const parcalar = m[2].split(';').map(s => s.trim());
    const n = Math.min(arg, parcalar.length - 1);
    const sat = h('code', {}, m[1] + '(', parcalar.flatMap((p, j) => [j ? '; ' : '', j === n ? h('mark', {}, p) : p]), ')');
    yerlestir(this.ipucu, sat, h('span', {}, ' ' + b.aciklama));
  }
}
