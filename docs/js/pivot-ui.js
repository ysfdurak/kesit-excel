// Özet tablo (pivot) alanı: alan seçimi, dilimleyiciler (birden çok alanlı filtre), sonuç tablosu,
// tıklanan hücrenin eşdeğer formülü ve isteğe bağlı pivot grafik.
import { h, temizle, yerlestir } from './yardim.js';
import { pivot, esdegerFormul, OZETLER, GOSTER, ayrinti, hesaplanmisAlanDerle } from '../motor/pivot.js';
import { goster } from '../motor/kitap.js';
import { grafikCiz, pivotVerisi, TURLER } from '../motor/grafik.js';
import { trSayi } from '../motor/tarih.js';
import { svgDugum, ipucuBagla, genislikBul } from './grafik-ui.js';

export class PivotAlani {
  // s: { tablo, sayfaAd, yapi?, grafik?: bool, grafikSecenek?, onDegis(yapi, grafikSecenek) }
  constructor(s) {
    this.s = s; this.t = s.tablo;
    this.yapi = JSON.parse(JSON.stringify(s.yapi || { satir: null, sutun: null, degerler: [{ alan: null, ozet: 'toplam' }], filtreler: [], grupla: {}, goster: 'deger' }));
    if (!this.yapi.degerler || !this.yapi.degerler.length) this.yapi.degerler = [{ alan: null, ozet: 'toplam' }];
    this.yapi.filtreler = this.yapi.filtreler || []; this.yapi.hesaplananlar = this.yapi.hesaplananlar || []; this.yapi.grupla = this.yapi.grupla || {}; this.yapi.goster = this.yapi.goster || 'deger';
    this.grafikSecenek = { tur: 'sutun', ...(s.grafikSecenek || {}) };
    this.grafikAcik = !!s.grafik;
    this.el = h('div.pivot');
    this.ciz();
  }
  tarihMi(alan) { const i = this.t.basliklar.indexOf(alan); return i >= 0 && /gg|aa|yyyy/.test((this.t.bicim || [])[i] || ''); }
  secim(etiket, deger, secenekler, degis, bos = '— yok —') {
    const id = 'pv' + Math.random().toString(36).slice(2, 8);
    const sel = h('select', { id, on: { change: e => degis(e.target.value || null) } }, bos == null ? null : h('option', { value: '' }, bos), secenekler.map(([v, ad]) => h('option', { value: v, selected: v === deger }, ad)));
    return h('div.alan', {}, h('label', { for: id }, etiket), sel);
  }
  degerleri(alan) { const i = this.t.basliklar.indexOf(alan); return [...new Set(this.t.satirlar.map(r => r[i]).filter(v => v != null))].sort((a, b) => typeof a === 'number' ? a - b : String(a).localeCompare(String(b), 'tr')); }
  ciz() {
    const y = this.yapi, B = this.t.basliklar.map(b => [b, b]);
    const gruplaSec = alan => alan && this.tarihMi(alan) ? this.secim('Gruplama: ' + alan, y.grupla[alan] || '', [['ay', 'Ay'], ['ceyrek', 'Çeyrek'], ['yil', 'Yıl']], v => { if (v) y.grupla[alan] = v; else delete y.grupla[alan]; this.yenile(); }, 'Gün (gruplama yok)') : null;
    const d = y.degerler[0];
    const panel = h('div.pivot-alanlar', {},
      this.secim('Satırlar', y.satir, B, v => { y.satir = v; this.yenile(); }), gruplaSec(y.satir),
      this.secim('Sütunlar', y.sutun, B, v => { y.sutun = v; this.yenile(); }), gruplaSec(y.sutun),
      this.secim('Değerler', d.alan, [...B, ...y.hesaplananlar.map(x => [x.ad, x.ad + ' (hesaplanmış)'])], v => { d.alan = v; if (v && this.t.satirlar.some(r => typeof r[this.t.basliklar.indexOf(v)] === 'string')) d.ozet = 'say'; this.yenile(); }),
      this.secim('Özet', d.ozet, Object.entries(OZETLER).map(([k, o]) => [k, o.tr]), v => { d.ozet = v || 'toplam'; this.yenile(); }, null),
      this.secim('Göster', y.goster, Object.entries(GOSTER).map(([k, g]) => [k, g]), v => { y.goster = v || 'deger'; this.yenile(); }, null),
      this.secim('Filtre / dilimleyici ekle', '', B.filter(([b]) => !y.filtreler.some(f => f.alan === b) && !this.tarihMi(b)), v => { if (v) { y.filtreler.push({ alan: v, degerler: [] }); this.yenile(); } }, 'Alan seçin…'));
    // Dilimleyiciler: her alan için düğme satırı; hiçbiri seçili değilse tümü
    const dilimler = y.filtreler.map((f, fi) => h('div.dilimleyici', { role: 'group', 'aria-label': f.alan + ' dilimleyicisi' },
      h('div.dilim-bas', {}, h('b', {}, f.alan), h('button.btn.tiny', { type: 'button', on: { click: () => { f.degerler = []; this.yenile(); } } }, 'Temizle'), h('button.btn.tiny', { type: 'button', 'aria-label': f.alan + ' dilimleyicisini kaldır', on: { click: () => { y.filtreler.splice(fi, 1); this.yenile(); } } }, '✕')),
      h('div.dilim-dug', {}, this.degerleri(f.alan).slice(0, 40).map(v => h('button', { type: 'button', sinif: 'dilim' + (f.degerler.includes(v) ? ' secili' : ''), 'aria-pressed': String(f.degerler.includes(v)), on: { click: e => {
        // Excel: tık tek seçer, Ctrl+tık ekler; dokunmatikte çoklu seçim için her dokunuş açar/kapatır
        const coklu = e.ctrlKey || e.metaKey || matchMedia('(pointer: coarse)').matches;
        f.degerler = coklu ? (f.degerler.includes(v) ? f.degerler.filter(x => x !== v) : [...f.degerler, v]) : (f.degerler.length === 1 && f.degerler[0] === v ? [] : [v]);
        this.yenile();
      } } }, String(v))))));
    this.sonuc = h('div.pivot-sonuc', { 'aria-live': 'polite' });
    this.formul = h('div.esdeger', { 'aria-live': 'polite' }, 'Bir sayıya tıklayın: o hücrenin eşdeğer formülü burada görünür.');
    this.grafikKutu = h('div.pivot-grafik');
    const grafikDug = h('button.btn.tiny', { type: 'button', 'aria-pressed': String(this.grafikAcik), on: { click: () => { this.grafikAcik = !this.grafikAcik; this.yenile(); } } }, this.grafikAcik ? 'Pivot grafiği gizle' : 'Pivot grafik ekle');
    // Hesaplanmış alan (Özet Tablo Analizi > Alanlar, Öğeler ve Kümeler)
    const hsAd = h('input', { type: 'text', placeholder: 'Ciro', 'aria-label': 'Hesaplanmış alan adı' }), hsF = h('input', { type: 'text', placeholder: "='Birim Fiyat'*Adet", 'aria-label': 'Hesaplanmış alan formülü' });
    const hsHata = h('span.uyari');
    const hesapKutu = h('details.hesap-alan', { open: y.hesaplananlar.length > 0 }, h('summary', {}, 'Hesaplanmış alan' + (y.hesaplananlar.length ? ` (${y.hesaplananlar.length})` : '')),
      y.hesaplananlar.length ? h('ul.kural-listesi', {}, y.hesaplananlar.map((x, i) => h('li', {}, h('code', {}, x.ad + ' ' + x.formul), ' ', h('button.btn.tiny', { type: 'button', on: { click: () => { y.hesaplananlar.splice(i, 1); y.degerler = y.degerler.filter(dd => dd.alan !== x.ad); if (!y.degerler.length) y.degerler = [{ alan: null, ozet: 'toplam' }]; this.yenile(); } } }, 'Sil')))) : null,
      h('div.filters', {}, hsAd, hsF, h('button.btn.tiny', { type: 'button', on: { click: () => {
        const ad = hsAd.value.trim(), f = hsF.value.trim();
        if (!ad || !f) { hsHata.textContent = 'Ad ve formül gerekli.'; return; }
        if (B.some(([b]) => b.toLocaleLowerCase('tr') === ad.toLocaleLowerCase('tr')) || y.hesaplananlar.some(x => x.ad === ad)) { hsHata.textContent = 'Bu ad zaten bir alan.'; return; }
        try { hesaplanmisAlanDerle(f, this.t.basliklar); } catch (e) { hsHata.textContent = e.message; return; }
        y.hesaplananlar.push({ ad, formul: f.startsWith('=') ? f : '=' + f });
        if (!y.degerler[0].alan) y.degerler[0] = { alan: ad, ozet: 'toplam' }; else if (!y.sutun) y.degerler.push({ alan: ad, ozet: 'toplam' });
        this.yenile();
      } } }, 'Ekle'), hsHata),
      h('p.small-note.muted', {}, "Alan adı boşluk içeriyorsa tek tırnak: 'Birim Fiyat'. Excel hesaplanmış alanı her hücrede alanların TOPLAMI ile hesaplar; satır satır çarpmaz."));
    this.ayrintiKutu = h('div.ayrinti', { 'aria-live': 'polite' });
    yerlestir(temizle(this.el), panel, hesapKutu, dilimler.length ? h('div.dilimleyiciler', {}, dilimler, h('p.small-note.muted', {}, 'Dilimleyicide bir düğmeye tık o değeri seçer; Ctrl+tık (telefonda her dokunuş) birden çok seçer.')) : null, this.sonuc, this.formul, this.ayrintiKutu, h('div.btn-row', {}, grafikDug), this.grafikKutu);
    this.hesapla();
  }
  yenile() { this.ciz(); if (this.s.onDegis) this.s.onDegis(this.yapi, this.grafikAcik ? this.grafikSecenek : null); }
  // Ayrıntıya inme: Excel hücreye çift tıklayınca kaynak satırları yeni bir sayfaya döker
  ayrintiGoster(i, j) {
    if (!this.p) return;
    const a = ayrinti(this.t, this.p, i, j), bic = this.t.bicim || [];
    const goru = (v, k) => typeof v === 'number' && /gg|aa|yyyy/.test(bic[k] || '') ? goster(v, bic[k]) : goster(v);
    yerlestir(temizle(this.ayrintiKutu), h('div.dilim-bas', {}, h('b', {}, `Ayrıntı: ${a.satirlar.length} kaynak satır`), h('button.btn.tiny', { type: 'button', on: { click: () => temizle(this.ayrintiKutu) } }, 'Kapat')),
      h('div.tablo-kaydir.ayrinti-tablo', {}, h('table.veri', {}, h('thead', {}, h('tr', {}, a.basliklar.map(b => h('th', { scope: 'col' }, b)))), h('tbody', {}, a.satirlar.slice(0, 60).map(r => h('tr', {}, r.map((v, k) => h('td', { sinif: typeof v === 'number' ? 'sayi' : '' }, goru(v, k)))))))),
      a.satirlar.length > 60 ? h('p.small-note.muted', {}, `İlk 60 satır gösteriliyor (toplam ${a.satirlar.length}).`) : null);
    this.sonAyrinti = a.satirlar.length;
  }
  degerYaz(v, yuzde) { if (v == null) return ''; if (v && v.kod) return goster(v); if (typeof v !== 'number') return String(v); return yuzde ? trSayi(v * 100, 1) + ' %' : trSayi(Math.round(v * 100) / 100); }
  hesapla() {
    temizle(this.sonuc); temizle(this.grafikKutu);
    let p; try { p = pivot(this.t, this.yapi); } catch (e) { this.sonuc.append(h('p.muted', {}, e.message === 'En az bir alan seçin' ? 'Başlamak için Satırlar\'dan bir alan, Değerler\'den bir sayı alanı seçin.' : e.message)); this.p = null; return; }
    this.p = p;
    const tablo = h('table.veri.pivot-tablo', {}, h('thead', {}, h('tr', {}, p.basliklar.map(b => h('th', { scope: 'col' }, b)))),
      h('tbody', {}, p.satirlar.map((r, i) => h('tr', { sinif: i === p.satirlar.length - 1 ? 'toplam' : '' }, h('th', { scope: 'row' }, r[0]), r.slice(1).map((v, j) => h('td.sayi', { tabindex: '0', veri: { i, j }, on: { click: () => this.esdeger(i, j), dblclick: () => this.ayrintiGoster(i, j), keydown: e => { if (e.key === 'Enter') this.esdeger(i, j); } } }, this.degerYaz(v, p.yuzde)))))));
    const aktif = this.yapi.filtreler.filter(f => f.degerler.length);
    this.sonuc.append(h('div.tablo-kaydir', {}, tablo), h('p.small-note.muted', {}, `${p.satirlar.length - 1} satır · ${aktif.length ? 'Filtre: ' + aktif.map(f => f.alan + ' = ' + f.degerler.join(', ')).join('; ') : 'filtre yok'}`));
    if (this.grafikAcik) this.grafikCiz(p);
  }
  grafikCiz(p) {
    const sc = this.grafikSecenek, id = 'pg' + Math.random().toString(36).slice(2, 7);
    const turler = ['sutun', 'cubuk', 'cizgi', 'alan', 'pasta', 'halka', 'agac', 'huni', 'radar'];
    const ust = h('div.filters', {}, h('label', { for: id }, 'Pivot grafik türü '), h('select', { id, on: { change: e => { sc.tur = e.target.value; this.yenile(); } } }, turler.map(t => h('option', { value: t, selected: t === sc.tur }, TURLER[t].ad))),
      ['sutun', 'cubuk', 'alan'].includes(sc.tur) && this.yapi.sutun ? h('label.cip', {}, h('input', { type: 'checkbox', checked: sc.yigin === 'yigin', on: { change: e => { sc.yigin = e.target.checked ? 'yigin' : 'yok'; this.yenile(); } } }), 'Yığılmış') : null);
    const W = genislikBul(this.el);
    try {
      const v = pivotVerisi(p);
      const kap = h('div', {}, svgDugum(grafikCiz(v, { ...sc, genislik: W, yukseklik: W < 480 ? 280 : 340 })));
      yerlestir(this.grafikKutu, ust, kap); ipucuBagla(kap);
    } catch (e) { yerlestir(this.grafikKutu, ust, h('p.uyari', {}, e.message)); }
  }
  esdeger(i, j) {
    if (!this.p) return;
    for (const td of this.sonuc.querySelectorAll('td.secili')) td.classList.remove('secili');
    const td = this.sonuc.querySelector(`td[data-i="${i}"][data-j="${j}"]`); if (td) td.classList.add('secili');
    const e = esdegerFormul(this.p, i, j, this.s.sayfaAd, this.t);
    this.secilen = { i, j };
    yerlestir(temizle(this.formul), h('button.btn.tiny', { type: 'button', on: { click: () => this.ayrintiGoster(i, j) } }, 'Ayrıntıyı göster (çift tık)'), ' ', h('b', {}, 'Bu hücre şu formülle aynı:'), h('code.blok', {}, e.formul), e.not ? h('p.small-note', {}, e.not) : null, this.p.yuzde ? h('p.small-note', {}, 'Yüzde gösteriminde formülün sonucu ilgili toplama bölünür.') : null);
  }
}
