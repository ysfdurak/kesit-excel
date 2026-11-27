// Makro alanı: VBA düzenleyici, çalıştırma, çıktı, makro kaydedici, biçim araç çubuğu ve .bas indirme.
// Makrolar tarayıcıda Kesit'in VBA yorumlayıcısıyla çalışır; gerçek Excel'e .bas dosyasıyla aktarılır.
import { h, temizle, yerlestir, bildir } from './yardim.js';
import { Izgara } from './izgara.js';
import { makroCalistir, yordamlariListele, basDosyasi } from '../motor/vba.js';
import { adres, cevir, yazimBul } from '../motor/formul.js';
import { ISLEVLER } from '../motor/islevler.js';

// A1 başvurularını R1C1'e çevirir (kaydedicinin yazdığı biçim); dizgilere dokunmaz
function r1c1(f, r, c) {
  return f.split(/("(?:[^"]|"")*")/).map((p, i) => i % 2 ? p : p.replace(/(\$?)([A-Z]{1,3})(\$?)(\d+)(?![\w(!])/g, (m, ac, col, ar, row) => {
    let cc = 0; for (const ch of col) cc = cc * 26 + ch.charCodeAt(0) - 64;
    const rr = Number(row);
    return 'R' + (ar ? rr : rr === r ? '' : `[${rr - r}]`) + 'C' + (ac ? cc : cc === c ? '' : `[${cc - c}]`);
  })).join('');
}
const tirnak = s => '"' + String(s).replace(/"/g, '""') + '"';

export class MakroAlani {
  // s: { kitapYap: () => Kitap, sayfa, satirSayisi, sutunSayisi, bicimler, kod, girdiler, kaydedici: bool, sonSatir, onDegis(kod) }
  constructor(s) {
    this.s = s; this.el = h('div.makro'); this.kayit = null; this.id = 'mk' + Math.random().toString(36).slice(2, 7);
    this.kod = h('textarea.vba-kod', { id: this.id + 'kod', spellcheck: false, wrap: 'off', autocapitalize: 'off', autocomplete: 'off', 'aria-describedby': this.id + 'not', rows: 9 });
    this.kod.value = s.kod || 'Sub Merhaba()\n    MsgBox "Merhaba Excel"\nEnd Sub\n';
    let kacis = false;
    this.kod.addEventListener('keydown', e => {
      if (e.key === 'Escape') { kacis = true; return; }
      if (e.key === 'Tab' && !kacis && !e.shiftKey) { e.preventDefault(); const t = this.kod, a = t.selectionStart; t.setRangeText('    ', a, t.selectionEnd, 'end'); return; }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); this.calistir(); return; }
      kacis = false;
    });
    this.kod.addEventListener('input', () => { this.altlariYenile(); if (s.onDegis) s.onDegis(this.kod.value); });
    this.altSec = h('select', { id: this.id + 'alt' });
    this.cikti = h('div.vba-cikti', { role: 'log', 'aria-live': 'polite', tabindex: '0' }, 'Çıktı burada görünür (MsgBox, Debug.Print, hata).');
    this.kayitDug = h('button.btn.tiny', { type: 'button', 'aria-pressed': 'false', on: { click: () => this.kayitAcKapa() } }, 'Kaydı başlat');
    this.izKap = h('div');
    this.kitapYenile();
    const ust = h('div.filters', {}, h('label', { for: this.id + 'alt' }, 'Çalışacak makro '), this.altSec,
      h('button.btn.primary', { type: 'button', on: { click: () => this.calistir() } }, '▶ Çalıştır'),
      h('button.btn.tiny', { type: 'button', on: { click: () => { this.kitapYenile(); this.yazdir('Veri ilk hâline döndü.'); } } }, 'Veriyi sıfırla'));
    const kaydedici = s.kaydedici === false ? null : h('details.kaydedici', {}, h('summary', {}, 'Makro kaydedici (Excel\'deki Geliştirici > Makro Kaydet)'),
      h('p.small-note', {}, 'Kaydı başlatın, sonra aşağıdaki tabloda hücre seçin, formül ya da değer yazın, biçim düğmelerini kullanın. Her hareketiniz VBA satırına dönüşür. Excel kaydedicisi gibi seçilen adresi sabit yazar: "son satıra kadar" demez, o an kaç satır varsa onu yazar.'),
      h('div.bicim-cubugu', {}, this.kayitDug,
        h('label', { for: this.id + 'bicimalan' }, 'Biçimlenecek alan '), this.bicimAlan = h('input.fx', { id: this.id + 'bicimalan', type: 'text', placeholder: 'seçili hücre', size: 10 }),
        h('button.btn.tiny', { type: 'button', on: { click: () => this.bicim('    Selection.Font.Bold = True') } }, 'Kalın'),
        h('button.btn.tiny', { type: 'button', on: { click: () => this.bicim('    With Selection.Interior\n        .Color = 65535\n    End With') } }, 'Sarı dolgu'),
        h('button.btn.tiny', { type: 'button', on: { click: () => this.bicim('    Selection.NumberFormat = "#,##0.00"') } }, 'Sayı biçimi #.##0,00'),
        h('button.btn.tiny', { type: 'button', on: { click: () => this.asagiDoldur() } }, 'Aşağıya doldur (veri sonuna)')));
    const alt = h('div.btn-row', {},
      h('button.btn.tiny', { type: 'button', on: { click: () => this.basIndir() } }, '.bas indir (Excel\'e aktar)'),
      h('a.btn.tiny', { href: 'indir/kesit-excel-veri.xlsx', download: 'kesit-excel-veri.xlsx' }, 'Veri kitabı (.xlsx)'));
    // Çalıştır düğmesi düzenleyicinin hemen altında: telefonda ilk ekranda görünsün
    yerlestir(this.el, h('label', { for: this.id + 'kod' }, h('b', {}, 'VBA kodu')), this.kod, ust,
      h('p.small-note.muted', { id: this.id + 'not' }, 'Ctrl+Enter çalıştırır. Tab dört boşluk girinti ekler; düzenleyiciden çıkmak için önce Esc, sonra Tab.'),
      this.cikti, kaydedici, h('h4', {}, 'Çalışma sayfası: ' + s.sayfa), this.izKap, alt);
    this.altlariYenile();
  }
  kitapYenile() {
    this.k = this.s.kitapYap(); this.k.stiller = new Map();
    this.iz = new Izgara({ kitap: this.k, sayfa: this.s.sayfa, satirSayisi: this.s.satirSayisi, sutunSayisi: this.s.sutunSayisi, bicimler: this.s.bicimler, ilkSecim: 'A1', duzenlenebilir: () => !!this.kayit });
    // Kaydedici: seçme ve yazma hareketlerini VBA satırına çevirir
    const sec = this.iz.sec.bind(this.iz), uygula = this.iz.uygula.bind(this.iz);
    this.iz.sec = (r, c, odak) => { sec(r, c, odak); if (this.kayit) this.kaydet(`    Range("${adres(r, c)}").Select`, true); };
    this.iz.uygula = () => {
      if (!this.kayit) return uygula();
      const { r, c } = this.iz.secili, v = this.iz.giris.value;
      uygula();
      if (v.startsWith('=')) { let en = v; try { if (yazimBul(v.slice(1)) === 'tr') en = cevir(v, 'en', ISLEVLER); } catch { /* çevrilemezse olduğu gibi */ } this.kaydet(`    ActiveCell.FormulaR1C1 = ${tirnak(r1c1(en, r, c))}`); }
      else this.kaydet(`    ActiveCell.FormulaR1C1 = ${tirnak(v)}`);
    };
    yerlestir(temizle(this.izKap), this.iz.el);
  }
  altlariYenile() {
    const y = yordamlariListele(this.kod.value), onceki = this.altSec.value;
    temizle(this.altSec);
    if (y.hata) { this.altSec.append(h('option', { value: '' }, '(kod okunamadı)')); return; }
    const subs = y.filter(x => String(x.tur).toUpperCase() === 'SUB');
    if (!subs.length) { this.altSec.append(h('option', { value: '' }, '(Sub yok)')); return; }
    for (const x of subs) this.altSec.append(h('option', { value: x.ad, selected: x.ad === onceki }, x.ad));
  }
  yazdir(...satirlar) { yerlestir(temizle(this.cikti), satirlar); }
  calistir() {
    const r = makroCalistir(this.kod.value, this.k, { sayfa: this.s.sayfa, alt: this.altSec.value || undefined, girdiler: this.s.girdiler });
    if (r.stiller) this.k.stiller = r.stiller;
    this.k.hesapla(); this.iz.guncelle(); this.iz.hucreBilgisi();
    const parca = (r.cikti || []).map(x => x.tur === 'msgbox' ? h('span.msgbox', {}, 'MsgBox: ' + x.metin) : x.tur === 'girdi' ? h('span.msgbox', {}, 'InputBox: ' + x.metin) : h('span', {}, x.metin + '\n'));
    if (!r.tamam) {
      const git = r.hata.satir ? h('button.btn.tiny', { type: 'button', on: { click: () => this.satiraGit(r.hata.satir) } }, r.hata.satir + '. satıra git') : null;
      this.yazdir(...parca, h('span.hata', {}, (r.hata.satir ? r.hata.satir + '. satır: ' : '') + r.hata.mesaj), ' ', git);
    } else this.yazdir(...parca, h('span.muted', {}, `\nBitti · ${r.yazilan ?? 0} hücre yazıldı · ${r.adim ?? 0} adım`));
    this.sonSonuc = r; return r;
  }
  satiraGit(n) {
    const sat = this.kod.value.split('\n'); let i = 0; for (let k = 0; k < n - 1 && k < sat.length; k++) i += sat[k].length + 1;
    this.kod.focus(); this.kod.setSelectionRange(i, i + (sat[n - 1] || '').length);
  }
  // ---- kaydedici
  kayitAcKapa() {
    if (!this.kayit) {
      this.kayit = []; this.kayitDug.textContent = '■ Kaydı durdur'; this.kayitDug.setAttribute('aria-pressed', 'true'); this.kayitDug.prepend(h('span.kayit-nokta', { 'aria-hidden': 'true' }));
      this.izKap.classList.add('kayit-acik'); this.iz.sec(this.iz.secili.r, this.iz.secili.c, false);
      bildir('Kayıt başladı: tabloda seçin, yazın, biçimleyin.');
    } else {
      const satirlar = this.kayit; this.kayit = null;
      this.kayitDug.textContent = 'Kaydı başlat'; this.kayitDug.setAttribute('aria-pressed', 'false'); this.izKap.classList.remove('kayit-acik');
      const ad = 'Makro' + (this.kod.value.match(/\bSub\s+Makro(\d+)/gi)?.length + 1 || 1);
      const kod = `Sub ${ad}()\n'\n' ${ad} Makro (kaydedici)\n'\n${satirlar.join('\n')}\nEnd Sub\n`;
      this.kod.value = this.kod.value.replace(/\s*$/, '\n\n') + kod; this.altlariYenile(); this.altSec.value = ad;
      if (this.s.onDegis) this.s.onDegis(this.kod.value);
      this.yazdir(h('span', {}, `Kaydedilen ${satirlar.length} satır ${ad} adıyla koda eklendi. "Veriyi sıfırla" deyip Çalıştır'a basarak tekrar oynatabilirsiniz.`));
    }
  }
  kaydet(satir, secim = false) {
    if (!this.kayit) return;
    // Arka arkaya seçimlerde yalnız sonuncusu kalır (Excel'de de gereksiz Select satırları birikir; burada sadeleşir)
    if (secim && this.kayit.length && /\.Select$/.test(this.kayit[this.kayit.length - 1])) this.kayit[this.kayit.length - 1] = satir; else this.kayit.push(satir);
  }
  hedefAlan() { const a = (this.bicimAlan?.value || '').trim().toUpperCase(); return a || adres(this.iz.secili.r, this.iz.secili.c); }
  satirCalistir(govde) {
    const r = makroCalistir(`Sub Gecici()\n${govde}\nEnd Sub`, this.k, { sayfa: this.s.sayfa });
    if (r.stiller) this.k.stiller = r.stiller;
    this.k.hesapla(); this.iz.guncelle();
    if (!r.tamam) this.yazdir(h('span.hata', {}, r.hata.mesaj));
    return r.tamam;
  }
  bicim(satir) {
    const alan = this.hedefAlan(), sec = `    Range("${alan}").Select`;
    if (!this.satirCalistir(sec + '\n' + satir)) return;
    if (this.kayit) { this.kaydet(sec, true); this.kayit.push(satir); } else bildir('Biçim uygulandı. Koda dönüşmesi için önce kaydı başlatın.');
  }
  asagiDoldur() {
    const { r, c } = this.iz.secili, son = this.sonSatir();
    if (son <= r) { this.yazdir(h('span.hata', {}, 'Seçili hücrenin altında doldurulacak veri satırı yok.')); return; }
    const hedef = `${adres(r, c)}:${adres(son, c)}`, satir = `    Selection.AutoFill Destination:=Range("${hedef}")`;
    if (!this.satirCalistir(`    Range("${adres(r, c)}").Select\n${satir}`)) return;
    if (this.kayit) { this.kaydet(`    Range("${adres(r, c)}").Select`, true); this.kayit.push(satir); this.kayit.push(`    Range("${hedef}").Select`); }
    this.yazdir(h('span', {}, `${hedef} dolduruldu.` + (this.kayit ? ` Kaydedici "${hedef}" adresini sabit yazdı: yarın veri ${son - 1} satır değil de daha uzun olursa makro eksik doldurur.` : '')));
  }
  sonSatir() { let r = this.s.satirSayisi; while (r > 1 && this.k.hucre(this.s.sayfa, r, 1) == null) r--; return r; }
  basIndir() {
    const { bayt, bozuk } = basDosyasi(this.kod.value, 'KesitMakro');
    const u = URL.createObjectURL(new Blob([bayt], { type: 'application/octet-stream' }));
    const a = h('a', { href: u, download: 'KesitMakro.bas' }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000);
    bildir(bozuk ? `İndirildi; ${bozuk} karakter Windows-1254'te yok, ? oldu.` : 'KesitMakro.bas indirildi. Excel: Alt+F11 > Dosya > Dosya Al.');
  }
}
