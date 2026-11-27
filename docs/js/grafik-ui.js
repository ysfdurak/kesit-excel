// Grafik alanı: veri kaynağı (aralık ya da pivot), tür, ayarlar, grafik + tablo görünümü, araç ipucu ve indirme.
import { h, temizle, yerlestir, bildir } from './yardim.js';
import { grafikCiz, TURLER, grafikTablosu, aralikVerisi, pivotVerisi } from '../motor/grafik.js';
import { pivot } from '../motor/pivot.js';
import { alanCoz } from '../motor/formul.js';
import { trSayi } from '../motor/tarih.js';

// SVG metnini DOM düğümüne çevirir. DOMParser betik çalıştırmaz; içerik motorun kendi ürettiği SVG'dir.
export function svgDugum(metin) {
  const d = new DOMParser().parseFromString(metin, 'image/svg+xml');
  return document.importNode(d.documentElement, true);
}
// Grafiğin üzerine araç ipucu: <title> taşıyan öğeye gelince (ya da dokununca) kutu gösterir
export function ipucuBagla(kap) {
  const kutu = h('div.g-ipucu', { role: 'tooltip', hidden: true });
  kap.classList.add('g-kap'); kap.append(kutu);
  const goster = e => {
    const el = e.target.closest && e.target.closest('svg.grafik [data-k], svg.grafik circle, svg.grafik path, svg.grafik rect');
    const t = el && [...el.children].find(x => x.tagName.toLowerCase() === 'title');
    if (!t) { kutu.hidden = true; return; }
    kutu.textContent = t.textContent; kutu.hidden = false;
    const r = kap.getBoundingClientRect(), x = (e.clientX ?? e.touches?.[0]?.clientX) - r.left, y = (e.clientY ?? e.touches?.[0]?.clientY) - r.top;
    kutu.style.left = Math.min(r.width - 10, Math.max(10, x)) + 'px'; kutu.style.top = Math.max(0, y - 12) + 'px';
  };
  kap.addEventListener('pointermove', goster); kap.addEventListener('pointerdown', goster); kap.addEventListener('pointerleave', () => { kutu.hidden = true; });
}
// Grafik genişliği: öğe henüz sayfaya eklenmemişse ana alanın genişliğinden tahmin (yoksa 700'e çizilip küçülür, yazılar okunmaz)
export function genislikBul(el, enCok = 760) {
  const w = (el && el.clientWidth) || (document.querySelector('.lesson-body, #main')?.clientWidth || innerWidth) - 48;
  return Math.max(300, Math.min(enCok, w - 4));
}
function indir(ad, blob) { const u = URL.createObjectURL(blob); const a = h('a', { href: u, download: ad }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); }
// PNG: bağımsız (renkleri gömülü) SVG'yi tuvale çizer; aynı köken, CSP img-src blob: izinli
export async function pngIndir(svgMetni, ad, W, H) {
  const blob = new Blob([svgMetni], { type: 'image/svg+xml' }), u = URL.createObjectURL(blob);
  try {
    const img = new Image(); img.src = u; await img.decode();
    const c = document.createElement('canvas'); c.width = W * 2; c.height = H * 2; const x = c.getContext('2d'); x.scale(2, 2); x.drawImage(img, 0, 0, W, H);
    c.toBlob(b => b && indir(ad, b), 'image/png');
  } finally { setTimeout(() => URL.revokeObjectURL(u), 2000); }
}

const AILE = { karsilastirma: 'Karşılaştırma', zaman: 'Zaman', parca: 'Parça–bütün', hedef: 'Hedef ve ilerleme', iliski: 'İlişki', dagilim: 'Dağılım', akis: 'Akış' };
const YIGINLI = new Set(['sutun', 'cubuk', 'cizgi', 'alan']);

export class GrafikAlani {
  // s: { tablolar, sayfa, kaynak: { alan } | { pivot }, secenek, kilitKaynak, onDegis({kaynak, secenek}) }
  constructor(s) {
    this.s = s; this.kaynak = JSON.parse(JSON.stringify(s.kaynak || { alan: 'A1:B5' }));
    this.secenek = { tur: 'sutun', baslik: '', yigin: 'yok', gosterge: 'alt', veriEtiketi: false, ...(s.secenek || {}) };
    this.el = h('div.grafik-alani'); this.tablo = false; this.ciz();
  }
  veri() {
    const t = this.s.tablolar[this.s.sayfa];
    if (this.kaynak.pivot) return pivotVerisi(pivot(t, this.kaynak.pivot));
    const al = alanCoz(this.kaynak.alan); if (!al) throw new Error('Veri aralığını A1:D7 biçiminde yazın');
    const kt = this.s.kitap; if (!kt) throw new Error('Kitap yok');
    return aralikVerisi(kt.degerler(this.s.sayfa, al), { seriYonu: this.kaynak.seriYonu || 'otomatik', bicimler: (t.bicim || []).slice(al.c1 - 1, al.c2), tarihSeri: !!this.kaynak.tarihSeri });
  }
  ciz() {
    const sc = this.secenek, id = 'gr' + Math.random().toString(36).slice(2, 7);
    const sec = (etiket, deger, ops, degis, ozel = '') => { const i = id + etiket.replace(/\W/g, ''); return h('div.alan', {}, h('label', { for: i }, etiket), h('select', { id: i, on: { change: e => degis(e.target.value) } }, ops.map(([v, a]) => h('option', { value: v, selected: String(v) === String(deger) }, a)))); };
    const turSec = h('div.alan', {}, h('label', { for: id + 'tur' }, 'Grafik türü'),
      h('select', { id: id + 'tur', on: { change: e => { sc.tur = e.target.value; if (!YIGINLI.has(sc.tur)) sc.yigin = 'yok'; this.yenile(); } } },
        Object.entries(AILE).map(([a, ad]) => h('optgroup', { label: ad }, Object.entries(TURLER).filter(([, t]) => t.aile === a).map(([k, t]) => h('option', { value: k, selected: k === sc.tur }, t.ad))))));
    const metin = (etiket, deger, degis, ph = '') => { const i = id + etiket.replace(/\W/g, ''); return h('div.alan', {}, h('label', { for: i }, etiket), h('input', { id: i, type: 'text', value: deger ?? '', placeholder: ph, on: { change: e => degis(e.target.value) } })); };
    const kutucuk = (etiket, deger, degis) => { const i = id + etiket.replace(/\W/g, ''); return h('label.cip', { for: i }, h('input', { type: 'checkbox', id: i, checked: !!deger, on: { change: e => degis(e.target.checked) } }), etiket); };
    const kaynakAlan = this.kaynak.pivot ? h('p.small-note.muted', {}, 'Kaynak: özet tablo (Genel Toplam grafiğe girmez).')
      : [metin('Veri aralığı', this.kaynak.alan, v => { this.kaynak.alan = v.toUpperCase().replace(/\s/g, ''); this.yenile(); }, 'A1:D7'),
         sec('Seriler', this.kaynak.seriYonu || 'otomatik', [['otomatik', 'Otomatik'], ['sutun', 'Sütunlarda'], ['satir', 'Satırlarda']], v => { this.kaynak.seriYonu = v; this.yenile(); })];
    const ayar = h('div.pivot-alanlar.grafik-ayar', {}, this.s.kilitKaynak ? null : kaynakAlan, turSec,
      YIGINLI.has(sc.tur) ? sec('Yığın', sc.yigin, [['yok', 'Kümelenmiş (yan yana)'], ['yigin', 'Yığılmış'], ['yuzde', '%100 yığılmış']], v => { sc.yigin = v; this.yenile(); }) : null,
      metin('Başlık', sc.baslik, v => { sc.baslik = v; this.yenile(); }, 'Ne gösteriyor?'),
      ['sutun', 'cubuk', 'cizgi', 'alan', 'birlesik', 'dagilim'].includes(sc.tur) ? metin('Değer ekseni en az', sc.eksenMin ?? '', v => { sc.eksenMin = v.trim() === '' ? null : Number(v.replace(',', '.')); this.yenile(); }, 'otomatik') : null,
      ['sutun', 'cubuk'].includes(sc.tur) ? sec('Vurgu', sc.vurgu || 'yok', [['yok', 'Yok'], ['enBuyuk', 'En büyük'], ['enKucuk', 'En küçük']], v => { sc.vurgu = v === 'yok' ? undefined : v; this.yenile(); }) : null,
      ['sutun', 'cubuk', 'cizgi', 'alan', 'birlesik'].includes(sc.tur) ? metin('Hedef çizgisi', sc.hedefCizgisi ?? '', v => { sc.hedefCizgisi = v.trim() === '' ? undefined : Number(v.replace(/\./g, '').replace(',', '.')); this.yenile(); }, 'yok') : null,
      sc.tur === 'ibre' ? metin('Ölçek en çok', sc.eksenMax ?? '', v => { sc.eksenMax = v.trim() === '' ? undefined : Number(v.replace(',', '.')); this.yenile(); }, 'otomatik') : null,
      sec('Gösterge', sc.gosterge, [['alt', 'Altta'], ['yok', 'Yok']], v => { sc.gosterge = v; this.yenile(); }),
      h('div.alan.cipler', {}, kutucuk('Veri etiketleri', sc.veriEtiketi, v => { sc.veriEtiketi = v; this.yenile(); }),
        sc.tur === 'birlesik' ? kutucuk('İkincil eksen', sc.ikincilEksen, v => { sc.ikincilEksen = v; this.yenile(); }) : null,
        sc.tur === 'dagilim' ? kutucuk('Eğilim çizgisi', sc.egilim, v => { sc.egilim = v; this.yenile(); }) : null));
    this.cizim = h('div.grafik-cizim', { 'aria-live': 'polite' });
    const dug = h('div.btn-row', {},
      h('button.btn.tiny', { type: 'button', 'aria-pressed': String(this.tablo), on: { click: () => { this.tablo = !this.tablo; this.ciz(); } } }, this.tablo ? 'Grafiği göster' : 'Tablo görünümü'),
      h('button.btn.tiny', { type: 'button', on: { click: () => this.indir('svg') } }, 'SVG indir'), h('button.btn.tiny', { type: 'button', on: { click: () => this.indir('png') } }, 'PNG indir'));
    yerlestir(temizle(this.el), ayar, h('p.small-note.muted.tur-notu', {}, TURLER[sc.tur].ad + ': ' + TURLER[sc.tur].ne), this.cizim, dug);
    this.goster();
  }
  // Yeniden çizim bir sonraki göreve ertelenir: change olayı odak kaybıyla (blur) gelebilir, o anda DOM kaldırılmamalı
  yenile() { clearTimeout(this.zam); this.zam = setTimeout(() => { this.ciz(); if (this.s.onDegis) this.s.onDegis({ kaynak: this.kaynak, secenek: this.secenek }); }, 0); }
  goster() {
    temizle(this.cizim);
    let v; try { v = this.veri(); this.sonVeri = v; } catch (e) { this.cizim.append(h('p.uyari', {}, e.message)); return; }
    if (this.tablo) {
      const t = grafikTablosu(v);
      this.cizim.append(h('div.tablo-kaydir', {}, h('table.veri', {}, h('thead', {}, h('tr', {}, t.basliklar.map(b => h('th', { scope: 'col' }, b)))), h('tbody', {}, t.satirlar.map(r => h('tr', {}, h('th', { scope: 'row' }, r[0]), r.slice(1).map(x => h('td.sayi', {}, x == null ? '' : trSayi(x)))))))));
      return;
    }
    try {
      const W = genislikBul(this.el), H = W < 480 ? 300 : 360;
      const svg = svgDugum(grafikCiz(v, { ...this.secenek, genislik: W, yukseklik: H }));
      const kap = h('div', {}, svg); this.cizim.append(kap); ipucuBagla(kap);
    } catch (e) { this.cizim.append(h('p.uyari', {}, e.message)); }
  }
  indir(tur) {
    let v; try { v = this.veri(); } catch (e) { bildir(e.message); return; }
    const W = 960, H = 540, tema = document.documentElement.dataset.theme === 'dark' ? 'koyu' : 'acik';
    const metin = grafikCiz(v, { ...this.secenek, genislik: W, yukseklik: H, bagimsiz: true, tema });
    const ad = (this.secenek.baslik || 'grafik').toLocaleLowerCase('tr').replace(/[^a-z0-9çğıöşü]+/g, '-').replace(/^-|-$/g, '') || 'grafik';
    if (tur === 'svg') indir(ad + '.svg', new Blob([metin], { type: 'image/svg+xml' })); else pngIndir(metin, ad + '.png', W, H);
  }
}
