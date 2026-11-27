// Özet tablo (pivot) alanı: alan seçimi, sonuç tablosu, tıklanan hücrenin eşdeğer formülü.
import { h, temizle, yerlestir } from './yardim.js';
import { pivot, esdegerFormul, OZETLER, GOSTER, grupEtiketi } from '../motor/pivot.js';
import { trSayi } from '../motor/tarih.js';

export class PivotAlani {
  // s: { tablo, sayfaAd, yapi?, onDegis(yapi) }
  constructor(s) {
    this.s = s; this.t = s.tablo;
    this.yapi = JSON.parse(JSON.stringify(s.yapi || { satir: null, sutun: null, degerler: [{ alan: null, ozet: 'toplam' }], filtreler: [], grupla: {}, goster: 'deger' }));
    if (!this.yapi.degerler || !this.yapi.degerler.length) this.yapi.degerler = [{ alan: null, ozet: 'toplam' }];
    this.yapi.filtreler = this.yapi.filtreler || []; this.yapi.grupla = this.yapi.grupla || {}; this.yapi.goster = this.yapi.goster || 'deger';
    this.el = h('div.pivot');
    this.ciz();
  }
  tarihMi(alan) { const i = this.t.basliklar.indexOf(alan); return i >= 0 && /gg|aa|yyyy/.test((this.t.bicim || [])[i] || ''); }
  secim(etiket, deger, secenekler, degis, bos = '— yok —') {
    const id = 'pv' + Math.random().toString(36).slice(2, 8);
    const sel = h('select', { id, on: { change: e => degis(e.target.value || null) } }, h('option', { value: '' }, bos), secenekler.map(([v, ad]) => h('option', { value: v, selected: v === deger }, ad)));
    return h('div.alan', {}, h('label', { for: id }, etiket), sel);
  }
  ciz() {
    const y = this.yapi, B = this.t.basliklar.map(b => [b, b]);
    const gruplaSec = alan => alan && this.tarihMi(alan) ? this.secim('Gruplama: ' + alan, y.grupla[alan] || '', [['ay', 'Ay'], ['ceyrek', 'Çeyrek'], ['yil', 'Yıl']], v => { if (v) y.grupla[alan] = v; else delete y.grupla[alan]; this.yenile(); }, 'Gün (gruplama yok)') : null;
    const d = y.degerler[0];
    const filtre = y.filtreler[0] || { alan: null, degerler: [] };
    const fDegerler = filtre.alan ? [...new Set(this.t.satirlar.map(r => r[this.t.basliklar.indexOf(filtre.alan)]).filter(v => v != null))].sort((a, b) => String(a).localeCompare(String(b), 'tr')) : [];
    const panel = h('div.pivot-alanlar', {},
      this.secim('Satırlar', y.satir, B, v => { y.satir = v; this.yenile(); }),
      gruplaSec(y.satir),
      this.secim('Sütunlar', y.sutun, B, v => { y.sutun = v; this.yenile(); }),
      gruplaSec(y.sutun),
      this.secim('Değerler', d.alan, B, v => { d.alan = v; if (v && this.t.satirlar.some(r => typeof r[this.t.basliklar.indexOf(v)] === 'string')) d.ozet = 'say'; this.yenile(); }),
      this.secim('Özet', d.ozet, Object.entries(OZETLER).map(([k, o]) => [k, o.tr]), v => { d.ozet = v || 'toplam'; this.yenile(); }, 'Toplam'),
      this.secim('Göster', y.goster, Object.entries(GOSTER).map(([k, g]) => [k, g]), v => { y.goster = v || 'deger'; this.yenile(); }, 'Değer'),
      this.secim('Filtre alanı', filtre.alan, B, v => { y.filtreler = v ? [{ alan: v, degerler: [] }] : []; this.yenile(); }),
      filtre.alan ? h('fieldset.filtre-degerler', {}, h('legend', {}, filtre.alan + ': gösterilecek değerler (hiçbiri seçili değilse tümü)'),
        fDegerler.map(v => { const id = 'fv' + Math.random().toString(36).slice(2, 8); return h('label.cip', { for: id }, h('input', { type: 'checkbox', id, checked: filtre.degerler.includes(v), on: { change: e => { filtre.degerler = e.target.checked ? [...filtre.degerler, v] : filtre.degerler.filter(x => x !== v); y.filtreler = [filtre]; this.yenile(false); } } }), String(v)); })) : null);
    this.sonuc = h('div.pivot-sonuc', { 'aria-live': 'polite' });
    this.formul = h('div.esdeger', { 'aria-live': 'polite' }, 'Bir sayıya tıklayın: o hücrenin eşdeğer formülü burada görünür.');
    yerlestir(temizle(this.el), panel, this.sonuc, this.formul);
    this.hesapla();
  }
  yenile(tam = true) { if (tam) this.ciz(); else this.hesapla(); if (this.s.onDegis) this.s.onDegis(this.yapi); }
  degerYaz(v, yuzde) { if (v == null) return ''; if (typeof v !== 'number') return String(v); return yuzde ? trSayi(v * 100, 1) + ' %' : trSayi(Math.round(v * 100) / 100); }
  hesapla() {
    temizle(this.sonuc);
    let p; try { p = pivot(this.t, this.yapi); } catch (e) { yerlestir(this.sonuc, h('p.muted', {}, e.message === 'En az bir alan seçin' ? 'Başlamak için Satırlar\'dan bir alan, Değerler\'den bir sayı alanı seçin.' : e.message)); this.p = null; return; }
    this.p = p;
    const tablo = h('table.veri.pivot-tablo', {}, h('thead', {}, h('tr', {}, p.basliklar.map(b => h('th', { scope: 'col' }, b)))),
      h('tbody', {}, p.satirlar.map((r, i) => h('tr', { sinif: i === p.satirlar.length - 1 ? 'toplam' : '' }, h('th', { scope: 'row' }, r[0]), r.slice(1).map((v, j) => h('td.sayi', { tabindex: '0', veri: { i, j }, on: { click: () => this.esdeger(i, j), keydown: e => { if (e.key === 'Enter') this.esdeger(i, j); } } }, this.degerYaz(v, p.yuzde)))))));
    yerlestir(this.sonuc, h('div.tablo-kaydir', {}, tablo), h('p.small-note.muted', {}, `${p.satirlar.length - 1} satır · ${this.yapi.filtreler.some(f => f.degerler.length) ? 'filtre uygulandı' : 'filtre yok'}`));
  }
  esdeger(i, j) {
    if (!this.p) return;
    for (const td of this.sonuc.querySelectorAll('td.secili')) td.classList.remove('secili');
    const td = this.sonuc.querySelector(`td[data-i="${i}"][data-j="${j}"]`); if (td) td.classList.add('secili');
    const e = esdegerFormul(this.p, i, j, this.s.sayfaAd, this.t);
    yerlestir(temizle(this.formul), h('b', {}, 'Bu hücre şu formülle aynı:'), h('code.blok', {}, e.formul), e.not ? h('p.small-note', {}, e.not) : null, this.p.yuzde ? h('p.small-note', {}, 'Yüzde gösteriminde formülün sonucu ilgili toplama bölünür.') : null);
  }
}
