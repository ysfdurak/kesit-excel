// Power Query alanı: uygulanan adımlar listesi, adım ekleme formu, önizleme ve M kodu.
import { h, temizle, yerlestir } from './yardim.js';
import { ADIMLAR, sorguCalistir, hucreHatali } from '../motor/sorgu.js';
import { trSayi } from '../motor/tarih.js';

const ONIZLEME = 15;
const SECENEK_AD = { buyuk: 'BÜYÜK HARF', kucuk: 'küçük harf', ilk: 'Her Sözcüğün İlk Harfi Büyük', number: 'Ondalık sayı', date: 'Tarih', text: 'Metin', solDis: 'Sol dış (tüm satırlar kalır)', ic: 'İç (yalnız eşleşenler)', toplam: 'Toplam', say: 'Satır say', ortalama: 'Ortalama', artan: 'Artan', azalan: 'Azalan', icerir: 'içerir', bosDegil: 'boş değil' };

export class SorguAlani {
  // s: { kaynakAd, kaynak, kaynaklar, adimlar?, onDegis(adimlar) }
  constructor(s) {
    this.s = s; this.adimlar = (s.adimlar || []).map(a => ({ ...a })); this.secili = this.adimlar.length;
    this.el = h('div.sorgu'); this.ciz();
  }
  calistir(n = this.adimlar.length) { return sorguCalistir(this.s.kaynakAd, this.s.kaynak, this.adimlar.slice(0, n), this.s.kaynaklar); }
  ciz() {
    const r = this.calistir(this.secili);
    const tum = this.calistir();
    const liste = h('ol.adimlar', {}, h('li', { sinif: this.secili === 0 ? 'secili' : '' }, h('button.adim', { type: 'button', on: { click: () => { this.secili = 0; this.ciz(); } } }, 'Kaynak')),
      this.adimlar.map((a, i) => h('li', { sinif: (this.secili === i + 1 ? 'secili ' : '') + (tum.hata && tum.hata.adim === i ? 'hatali' : '') },
        h('button.adim', { type: 'button', title: 'Bu adımdan sonraki tabloyu göster', on: { click: () => { this.secili = i + 1; this.ciz(); } } }, (ADIMLAR[a.tip]?.ad || a.tip) + this.ozetMetni(a)),
        h('button.btn.tiny', { type: 'button', 'aria-label': `${ADIMLAR[a.tip]?.ad} adımını sil`, on: { click: () => { this.adimlar.splice(i, 1); this.secili = Math.min(this.secili, this.adimlar.length); this.degisti(); } } }, '✕'))));
    const kolonlar = this.calistir(this.adimlar.length).tablo.basliklar;
    this.form = h('div.adim-form');
    const tipSec = h('select', { id: 'pq-tip', on: { change: e => this.formKur(e.target.value, kolonlar) } }, h('option', { value: '' }, 'Adım seçin…'), Object.entries(ADIMLAR).map(([k, a]) => h('option', { value: k }, a.etiket)));
    const ekle = h('div.adim-ekle', {}, h('label', { for: 'pq-tip' }, 'Yeni adım'), tipSec, this.form);
    const hataSatiri = tum.hata ? h('p.uyari', {}, `${tum.hata.adim + 1}. adım çalışmadı: ${tum.hata.mesaj}`) : null;
    const onizleme = this.tabloCiz(r.tablo);
    const mKod = h('details.mkod', {}, h('summary', {}, 'M kodu (Gelişmiş Düzenleyici)'), h('pre', {}, tum.m));
    yerlestir(temizle(this.el), h('div.sorgu-yan', {}, h('h4', {}, 'Uygulanan adımlar'), liste, ekle), h('div.sorgu-ana', {}, hataSatiri,
      h('p.small-note.muted', {}, `${this.secili === 0 ? 'Kaynak' : this.secili + '. adımdan sonra'} · ${r.tablo.satirlar.length} satır, ${r.tablo.basliklar.length} sütun${r.hataSayisi ? ` · ${r.hataSayisi} hatalı hücre (Error)` : ''}`), onizleme, mKod));
  }
  ozetMetni(a) {
    const d = [a.sutun, a.sutunlar && a.sutunlar.join(', '), a.anahtar, a.n != null ? a.n : null, a.ad].filter(x => x != null && x !== '');
    return d.length ? ` · ${d.join(' · ')}` : '';
  }
  tabloCiz(t) {
    const satirlar = t.satirlar.slice(0, ONIZLEME);
    const deger = v => v == null ? h('span.null', {}, 'null') : hucreHatali(v) ? h('span.err', { title: v.mesaj }, 'Error') : typeof v === 'number' ? trSayi(v) : String(v);
    const tablo = h('table.veri', {}, h('thead', {}, h('tr', {}, t.basliklar.map((b, i) => h('th', { scope: 'col' }, b, h('small', {}, ' ' + ({ number: '1.2', date: '📅', text: 'ABC' }[t.turler?.[i]] || '')))))),
      h('tbody', {}, satirlar.map(r => h('tr', {}, r.map(v => h('td', { sinif: typeof v === 'number' ? 'sayi' : '' }, deger(v)))))));
    return h('div.tablo-kaydir', {}, tablo, t.satirlar.length > ONIZLEME ? h('p.small-note.muted', {}, `İlk ${ONIZLEME} satır gösteriliyor.`) : null);
  }
  formKur(tip, kolonlar) {
    temizle(this.form); if (!tip) return;
    const tanim = ADIMLAR[tip], deger = {};
    const alanlar = tanim.alanlar.map(([ad, tur, etiket]) => {
      const id = 'pq-' + ad;
      if (tur === 'sutun') { deger[ad] = kolonlar[0]; return h('div.alan', {}, h('label', { for: id }, etiket), h('select', { id, on: { change: e => { deger[ad] = e.target.value; } } }, kolonlar.map(k => h('option', { value: k }, k)))); }
      if (tur === 'sutunlar') { deger[ad] = []; return h('fieldset.filtre-degerler', {}, h('legend', {}, etiket), kolonlar.map(k => { const cid = id + '-' + k; return h('label.cip', { for: cid }, h('input', { type: 'checkbox', id: cid, on: { change: e => { deger[ad] = e.target.checked ? [...deger[ad], k] : deger[ad].filter(x => x !== k); } } }), k); })); }
      if (tur === 'tablo') { const ad2 = Object.keys(this.s.kaynaklar).filter(k => k !== this.s.kaynakAd && this.s.kaynaklar[k].basliklar); deger[ad] = ad2[0]; return h('div.alan', {}, h('label', { for: id }, etiket), h('select', { id, on: { change: e => { deger[ad] = e.target.value; } } }, ad2.map(k => h('option', { value: k }, k)))); }
      if (Array.isArray(tur)) { deger[ad] = tur[0]; return h('div.alan', {}, h('label', { for: id }, etiket), h('select', { id, on: { change: e => { deger[ad] = e.target.value; } } }, tur.map(k => h('option', { value: k }, SECENEK_AD[k] || k)))); }
      deger[ad] = ''; return h('div.alan', {}, h('label', { for: id }, etiket), h('input', { id, type: tur === 'sayi' ? 'number' : 'text', on: { input: e => { deger[ad] = tur === 'sayi' ? Number(e.target.value) : e.target.value; } } }));
    });
    yerlestir(this.form, ...alanlar, h('button.btn.primary.tiny', { type: 'button', on: { click: () => { this.adimlar.push({ tip, ...deger }); this.secili = this.adimlar.length; this.degisti(); } } }, 'Adımı ekle'));
  }
  degisti() { this.ciz(); if (this.s.onDegis) this.s.onDegis(this.adimlar); }
}
