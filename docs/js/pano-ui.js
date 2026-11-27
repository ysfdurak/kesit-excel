// Pano (dashboard): ortak dilimleyiciler, KPI kutuları ve en çok 4 pivot grafik. Dilimleyici bütün kartları birlikte süzer.
import { h, temizle, yerlestir } from './yardim.js';
import { pivot, OZETLER } from '../motor/pivot.js';
import { grafikCiz, pivotVerisi, TURLER, kisaSayi } from '../motor/grafik.js';
import { panoKpi } from '../motor/denetci.js';
import { trSayi } from '../motor/tarih.js';
import { svgDugum, ipucuBagla, genislikBul } from './grafik-ui.js';

const KPI_OZET = [['toplam', 'Toplam'], ['ortalama', 'Ortalama'], ['say', 'Kayıt sayısı'], ['benzersiz', 'Farklı değer sayısı']];
const PANO_TURLER = ['sutun', 'cubuk', 'cizgi', 'alan', 'halka', 'agac', 'huni'];

export class PanoAlani {
  // s: { tablo, sayfaAd, pano?, onDegis(pano) }
  constructor(s) {
    this.s = s; this.t = s.tablo; this.id = 'pn' + Math.random().toString(36).slice(2, 7);
    this.pano = JSON.parse(JSON.stringify(s.pano || { baslik: '', dilimler: [], kpi: [], grafikler: [] }));
    for (const k of ['dilimler', 'kpi', 'grafikler']) this.pano[k] = this.pano[k] || [];
    this.el = h('div.pano-alani'); this.ciz();
  }
  tarihMi(a) { const i = this.t.basliklar.indexOf(a); return i >= 0 && /gg|aa|yyyy/.test((this.t.bicim || [])[i] || ''); }
  sayisalMi(a) { const i = this.t.basliklar.indexOf(a); return i >= 0 && this.t.satirlar.some(r => typeof r[i] === 'number') && !this.tarihMi(a); }
  degerleri(a) { const i = this.t.basliklar.indexOf(a); return [...new Set(this.t.satirlar.map(r => r[i]).filter(v => v != null))].sort((x, y) => typeof x === 'number' ? x - y : String(x).localeCompare(String(y), 'tr')); }
  degisti() { this.ciz(); if (this.s.onDegis) this.s.onDegis(this.pano); }
  sec(etiket, deger, ops, degis, bos) {
    const i = this.id + Math.random().toString(36).slice(2, 6);
    return h('div.alan', {}, h('label', { for: i }, etiket), h('select', { id: i, on: { change: e => degis(e.target.value || null) } }, bos ? h('option', { value: '' }, bos) : null, ops.map(([v, a]) => h('option', { value: v, selected: v === deger }, a))));
  }
  ciz() {
    const p = this.pano, B = this.t.basliklar, alanlar = B.map(b => [b, b]), sayisal = B.filter(b => this.sayisalMi(b)).map(b => [b, b]);
    const filtreler = p.dilimler.map(d => ({ alan: d.alan, degerler: d.degerler || [] }));
    // --- Düzenleyici (açılır bölüm: panoyu kuran kişi için)
    const yeniG = { satir: B.find(b => !this.sayisalMi(b) && !this.tarihMi(b)) || B[0], deger: sayisal[0]?.[0] || null, ozet: sayisal.length ? 'toplam' : 'say', tur: 'sutun' };
    const yeniK = { alan: sayisal[0]?.[0] || B[0], ozet: sayisal.length ? 'toplam' : 'say' };
    const duzen = h('details.pano-duzen', { open: !p.grafikler.length }, h('summary', {}, 'Panoyu düzenle (dilimleyici, KPI, grafik ekle)'),
      h('div.pivot-alanlar', {},
        h('div.alan', {}, h('label', { for: this.id + 'bas' }, 'Pano başlığı'), h('input', { id: this.id + 'bas', type: 'text', value: p.baslik || '', placeholder: 'Satış panosu · 2024', on: { change: e => { p.baslik = e.target.value; this.degisti(); } } })),
        this.sec('Dilimleyici ekle', '', alanlar.filter(([b]) => !this.tarihMi(b) && !p.dilimler.some(d => d.alan === b)), v => { if (v) { p.dilimler.push({ alan: v, degerler: [] }); this.degisti(); } }, 'Alan seçin…')),
      h('h4', {}, 'KPI kutusu'),
      h('div.pivot-alanlar', {}, this.sec('Alan', yeniK.alan, alanlar, v => { yeniK.alan = v; }), this.sec('Özet', yeniK.ozet, KPI_OZET, v => { yeniK.ozet = v; }),
        h('div.alan', {}, h('span', {}, ' '), h('button.btn.tiny', { type: 'button', disabled: p.kpi.length >= 4, on: { click: () => { p.kpi.push({ ...yeniK }); this.degisti(); } } }, 'KPI ekle'))),
      h('h4', {}, 'Grafik kartı (en çok 4)'),
      h('div.pivot-alanlar', {}, this.sec('Satırlar (kategori)', yeniG.satir, alanlar, v => { yeniG.satir = v; }), this.sec('Değer', yeniG.deger, alanlar, v => { yeniG.deger = v; }, '(kayıt say)'),
        this.sec('Özet', yeniG.ozet, Object.entries(OZETLER).map(([k, o]) => [k, o.tr]), v => { yeniG.ozet = v; }), this.sec('Tür', yeniG.tur, PANO_TURLER.map(t => [t, TURLER[t].ad]), v => { yeniG.tur = v; }),
        h('div.alan', {}, h('span', {}, ' '), h('button.btn.tiny', { type: 'button', disabled: p.grafikler.length >= 4, on: { click: () => {
          const g = { baslik: '', tur: yeniG.tur, yapi: { satir: yeniG.satir, sutun: null, degerler: [{ alan: yeniG.deger || B[0], ozet: yeniG.deger ? yeniG.ozet : 'say' }], filtreler: [], grupla: this.tarihMi(yeniG.satir) ? { [yeniG.satir]: 'ay' } : {}, goster: 'deger' } };
          g.baslik = `${yeniG.deger ? OZETLER[g.yapi.degerler[0].ozet].tr + ': ' + yeniG.deger : 'Kayıt sayısı'} · ${yeniG.satir}`;
          p.grafikler.push(g); this.degisti();
        } } }, 'Grafik ekle'))));
    // --- Dilimleyiciler
    const dilimler = p.dilimler.map((d, di) => h('div.dilimleyici', { role: 'group', 'aria-label': d.alan + ' dilimleyicisi' },
      h('div.dilim-bas', {}, h('b', {}, d.alan), h('button.btn.tiny', { type: 'button', on: { click: () => { d.degerler = []; this.degisti(); } } }, 'Tümü'), h('button.btn.tiny', { type: 'button', 'aria-label': d.alan + ' dilimleyicisini kaldır', on: { click: () => { p.dilimler.splice(di, 1); this.degisti(); } } }, '✕')),
      h('div.dilim-dug', {}, this.degerleri(d.alan).slice(0, 30).map(v => { d.degerler = d.degerler || []; const on = d.degerler.includes(v); return h('button', { type: 'button', sinif: 'dilim' + (on ? ' secili' : ''), 'aria-pressed': String(on), on: { click: () => { d.degerler = on ? d.degerler.filter(x => x !== v) : [...d.degerler, v]; this.degisti(); } } }, String(v)); }))));
    // --- KPI kutuları
    const kpi = p.kpi.map((k, ki) => {
      const tum = panoKpi(this.t, k, []), suz = panoKpi(this.t, k, filtreler), oran = tum ? suz / tum : null;
      return h('div.kpi', {}, h('small', {}, `${KPI_OZET.find(o => o[0] === k.ozet)?.[1] || k.ozet} · ${k.alan}`), h('b', {}, kisaSayi(suz)),
        h('span', {}, filtreler.some(f => f.degerler.length) && k.ozet !== 'ortalama' && oran != null ? `tümünün %${trSayi(oran * 100, 0)}'ü` : filtreler.some(f => f.degerler.length) ? 'tümü: ' + kisaSayi(tum) : 'filtre yok'),
        h('button.btn.tiny.kpi-sil', { type: 'button', 'aria-label': 'KPI kutusunu kaldır', on: { click: () => { p.kpi.splice(ki, 1); this.degisti(); } } }, '✕'));
    });
    // --- Grafik kartları
    const kartlar = p.grafikler.map((g, gi) => {
      const kart = h('div.pano-kart', {}, h('div.dilim-bas', {}, h('h4', {}, g.baslik), h('button.btn.tiny', { type: 'button', 'aria-label': 'Grafiği kaldır', on: { click: () => { p.grafikler.splice(gi, 1); this.degisti(); } } }, '✕')));
      try {
        const pv = pivot(this.t, { ...g.yapi, filtreler });
        const tum = genislikBul(this.el, 1100), tek = this.pano.grafikler.length === 1 || tum < 700, W = tek ? Math.min(tum - 24, 760) : Math.max(300, (tum - 36) / 2), H = tek ? 300 : 250;
        const kap = h('div', {}, svgDugum(grafikCiz(pivotVerisi(pv), { tur: g.tur, genislik: W, yukseklik: H, gosterge: 'alt' })));
        kart.append(kap); ipucuBagla(kap);
      } catch (e) { kart.append(h('p.uyari', {}, e.message)); }
      return kart;
    });
    const aktif = filtreler.filter(f => f.degerler.length);
    yerlestir(temizle(this.el), duzen,
      h('section.pano', { 'aria-label': p.baslik || 'Pano' }, p.baslik ? h('h3', {}, p.baslik) : null,
        dilimler.length ? h('div.dilimleyiciler', {}, dilimler) : null,
        h('p.small-note.muted', { 'aria-live': 'polite' }, aktif.length ? 'Filtre: ' + aktif.map(f => f.alan + ' = ' + f.degerler.join(', ')).join('; ') : 'Filtre yok: bütün kayıtlar.'),
        kpi.length ? h('div.kpi-sira', {}, kpi) : null,
        kartlar.length ? h('div.pano-izgara', { sinif: kartlar.length === 1 ? 'tek' : '' }, kartlar) : h('p.muted', {}, 'Henüz grafik yok. "Panoyu düzenle" bölümünden grafik ekleyin.')));
  }
}
