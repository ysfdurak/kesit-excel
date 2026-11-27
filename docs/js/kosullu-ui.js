// Koşullu biçim alanı: kural listesi + Excel'deki "Yeni Biçimlendirme Kuralı" penceresine benzeyen form.
// Kurallar ızgaraya kurallariAyarla ile verilir; ızgara görünümü CSS sınıfı ve CSSOM ile çizer.
import { h, temizle, yerlestir } from './yardim.js';
import { KURAL_TURLERI, STILLER } from '../motor/kosullu.js';

const OPLAR = [['>', 'büyüktür'], ['>=', 'büyük ya da eşit'], ['<', 'küçüktür'], ['<=', 'küçük ya da eşit'], ['=', 'eşittir'], ['<>', 'eşit değil'], ['arasinda', 'arasında'], ['icerir', 'metin içerir']];
const sayiMi = v => /^-?\d+([.,]\d+)?$/.test(String(v).trim());
const sayi = v => Number(String(v).trim().replace(',', '.'));
export function kuralOzeti(k) {
  const st = k.stil ? ' → ' + (STILLER[k.stil] || k.stil).split(',')[0] : '';
  switch (k.tur) {
    case 'deger': return `${k.alan}: değer ${OPLAR.find(o => o[0] === k.op)?.[1] || k.op} ${k.deger}${k.op === 'arasinda' ? ' ve ' + k.deger2 : ''}${st}`;
    case 'ilkN': return `${k.alan}: ${k.alt ? 'son' : 'ilk'} ${k.n}${k.yuzde ? '%' : ''}${st}`;
    case 'ortalama': return `${k.alan}: ortalamanın ${k.alt ? 'altı' : 'üstü'}${st}`;
    case 'yinelenen': return `${k.alan}: ${k.benzersiz ? 'benzersiz' : 'yinelenen'} değerler${st}`;
    case 'formul': return `${k.alan}: formül ${k.formul}${st}`;
    case 'veriCubugu': return `${k.alan}: veri çubukları`;
    case 'renkOlcegi': return `${k.alan}: ${k.uclu ? 'üç' : 'iki'} renkli ölçek${k.ters ? ' (ters)' : ''}`;
    case 'simge': return `${k.alan}: üç ok simgesi`;
  }
  return k.alan + ': ' + k.tur;
}

export class KosulluAlani {
  // s: { izgara, kurallar?, varsayilanAlan, onDegis(kurallar) }
  constructor(s) {
    this.s = s; this.kurallar = JSON.parse(JSON.stringify(s.kurallar || []));
    this.taslak = { tur: 'deger', alan: s.varsayilanAlan || 'A2:A10', op: '>', deger: '', stil: 'kirmizi' };
    this.el = h('div.kosullu'); this.id = 'kb' + Math.random().toString(36).slice(2, 7);
    this.ciz(); this.uygula();
  }
  uygula() { this.s.izgara.kurallariAyarla(this.kurallar); if (this.s.onDegis) this.s.onDegis(this.kurallar); }
  alan(etiket, el) { const i = this.id + etiket.replace(/\W/g, ''); el.id = i; return h('div.alan', {}, h('label', { for: i }, etiket), el); }
  secim(etiket, deger, ops, degis) { return this.alan(etiket, h('select', { on: { change: e => degis(e.target.value) } }, ops.map(([v, a]) => h('option', { value: v, selected: String(v) === String(deger) }, a)))); }
  metin(etiket, deger, degis, ph = '') { return this.alan(etiket, h('input', { type: 'text', value: deger ?? '', placeholder: ph, on: { input: e => degis(e.target.value) } })); }
  ciz() {
    const t = this.taslak;
    const ozel = [];
    if (t.tur === 'deger') {
      ozel.push(this.secim('Koşul', t.op, OPLAR, v => { t.op = v; this.ciz(); }), this.metin('Değer', t.deger, v => { t.deger = v; }, '50000'));
      if (t.op === 'arasinda') ozel.push(this.metin('ve', t.deger2, v => { t.deger2 = v; }));
    }
    if (t.tur === 'ilkN') ozel.push(this.secim('Hangisi', t.alt ? 'son' : 'ilk', [['ilk', 'İlk (en büyük)'], ['son', 'Son (en küçük)']], v => { t.alt = v === 'son'; }), this.metin('Kaç', t.n ?? 10, v => { t.n = v; }), this.secim('Birim', t.yuzde ? 'y' : 'o', [['o', 'öğe'], ['y', '%']], v => { t.yuzde = v === 'y'; }));
    if (t.tur === 'ortalama') ozel.push(this.secim('Hangisi', t.alt ? 'alt' : 'ust', [['ust', 'Ortalamanın üstü'], ['alt', 'Ortalamanın altı']], v => { t.alt = v === 'alt'; }));
    if (t.tur === 'yinelenen') ozel.push(this.secim('Hangisi', t.benzersiz ? 'b' : 'y', [['y', 'Yinelenen'], ['b', 'Benzersiz']], v => { t.benzersiz = v === 'b'; }));
    if (t.tur === 'formul') ozel.push(this.metin('Formül (alanın ilk satırına göre)', t.formul, v => { t.formul = v; }, '=$D2<$C2*0,9'));
    if (t.tur === 'renkOlcegi') ozel.push(this.secim('Ölçek', t.uclu ? '3' : '2', [['2', 'İki renk (açık → koyu yeşil)'], ['3', 'Üç renk (kırmızı → yeşil)']], v => { t.uclu = v === '3'; }), this.secim('Yön', t.ters ? 't' : 'd', [['d', 'Büyük iyi'], ['t', 'Küçük iyi (ters)']], v => { t.ters = v === 't'; }));
    const stilli = ['deger', 'ilkN', 'ortalama', 'yinelenen', 'formul'].includes(t.tur);
    if (stilli) ozel.push(this.secim('Biçim', t.stil || 'kirmizi', Object.entries(STILLER), v => { t.stil = v; }));
    const form = h('div.pivot-alanlar', {},
      this.secim('Kural türü', t.tur, Object.entries(KURAL_TURLERI), v => { t.tur = v; this.ciz(); }),
      this.metin('Uygulanacak alan', t.alan, v => { t.alan = v.toUpperCase().replace(/\s/g, ''); }, 'D2:D43'), ozel,
      h('div.alan', {}, h('span', { 'aria-hidden': 'true' }, ' '), h('button.btn.primary', { type: 'button', on: { click: () => this.ekle() } }, 'Kuralı ekle')));
    this.hata = h('p.uyari', { 'aria-live': 'polite' });
    const liste = this.kurallar.length ? h('ol.kural-listesi', {}, this.kurallar.map((k, i) => h('li', {}, h('code', {}, kuralOzeti(k)), ' ',
      i > 0 ? h('button.btn.tiny', { type: 'button', 'aria-label': 'Kuralı yukarı taşı', on: { click: () => { [this.kurallar[i - 1], this.kurallar[i]] = [this.kurallar[i], this.kurallar[i - 1]]; this.ciz(); this.uygula(); } } }, '↑') : null,
      h('button.btn.tiny', { type: 'button', 'aria-label': 'Kuralı sil', on: { click: () => { this.kurallar.splice(i, 1); this.ciz(); this.uygula(); } } }, 'Sil'))))
      : h('p.small-note.muted', {}, 'Henüz kural yok. Kural türünü seçin, alanı yazın, Kuralı ekle\'ye basın.');
    yerlestir(temizle(this.el), h('h4', {}, 'Kural yöneticisi'), liste, h('p.small-note.muted', {}, 'İki kural aynı hücreye dolgu vermek isterse listede üstte olan kazanır (Excel\'de de öyle).'), form, this.hata);
  }
  ekle() {
    const t = { ...this.taslak }, hata = m => { this.hata.textContent = m; };
    if (!/^[A-Z]{1,3}\d+(:[A-Z]{1,3}\d+)?$/.test(t.alan)) return hata('Alanı D2:D43 biçiminde yazın.');
    if (t.tur === 'deger') {
      if (String(t.deger ?? '').trim() === '') return hata('Karşılaştırılacak değeri yazın.');
      t.deger = sayiMi(t.deger) ? sayi(t.deger) : t.deger;
      if (t.op === 'arasinda') { if (!sayiMi(t.deger2 ?? '') || typeof t.deger !== 'number') return hata('"Arasında" için iki sayı yazın.'); t.deger2 = sayi(t.deger2); } else delete t.deger2;
    } else { delete t.op; delete t.deger; delete t.deger2; }
    if (t.tur === 'ilkN') { t.n = Math.max(1, Math.round(sayi(t.n ?? 10))); if (!Number.isFinite(t.n)) return hata('Kaç öğe olduğunu sayıyla yazın.'); }
    if (t.tur === 'formul' && !String(t.formul || '').trim()) return hata('Formülü yazın; DOĞRU dönen hücreler biçimlenir.');
    if (!['deger', 'ilkN', 'ortalama', 'yinelenen', 'formul'].includes(t.tur)) delete t.stil;
    for (const k of Object.keys(t)) if (t[k] === undefined || t[k] === false) delete t[k];
    this.kurallar.push(t); this.hata.textContent = '';
    try { this.uygula(); } catch (e) { this.kurallar.pop(); this.uygula(); return hata(e.message); }
    this.ciz();
  }
}
