// Kesit Excel kabuğu: hash yönlendirme, menü, tema, mobil sekmeler, İngilizce tur.
import { temizle, h, yerlestir } from './yardim.js';
import * as S from './sayfalar.js';
import * as D from './durum.js';
import { DERSLER } from '../icerik/dersler.js';
import { enTur } from './en.js';

const ROTA = {
  '': ['Ana sayfa', S.anaSayfa, 'home'], yol: ['Öğrenme yolu', S.yolSayfasi, 'yol'], dersler: ['Dersler', S.derslerSayfasi, 'dersler'], ders: ['Ders', S.dersSayfasi, 'dersler'],
  atolye: ['Formül atölyesi', (m, a) => S.atolyeSayfasi(m, a ? decodeURIComponent(a) : null), 'atolye'], pivot: ['Özet tablo', S.pivotSayfasi, 'pivot'], sorgu: ['Power Query', S.sorguSayfasi, 'sorgu'], gorsel: ['Görselleştirme', S.gorselSayfasi, 'gorsel'], makro: ['Makro (VBA)', S.makroSayfasi, 'makro'],
  islevler: ['İşlev rehberi', S.islevlerSayfasi, 'islevler'], seviye: ['Seviye testi', S.seviyeSayfasi, 'seviye'], hatalar: ['Sık hatalar', S.hatalarSayfasi, 'hatalar'],
  mulakat: ['Mülakat hazırlığı', S.mulakatSayfasi, 'mulakat'], ilerleme: ['İlerlemem', S.ilerlemeSayfasi, 'ilerleme'], veri: ['Kesit verileriyle', S.veriSayfasi, 'veri'], hakkinda: ['Hakkında', S.hakkindaSayfasi, 'hakkinda'],
};
const main = document.getElementById('main');
function git() {
  const ham = location.hash.replace(/^#/, '').split('?')[0];
  const [yol, a, b] = ham.split('/');
  const r = ROTA[yol] || ROTA[''];
  temizle(main);
  try { r[1](main, a, b); } catch (e) { console.error(e); yerlestir(main, h('div.callout.warning', {}, h('p', {}, 'Bu sayfa açılırken bir sorun oldu: ' + e.message))); }
  const ders = yol === 'ders' ? DERSLER.find(d => d.id === a) : null;
  document.title = (ders ? ders.baslik : r[0]) + ' · Kesit Excel';
  const crumb = document.getElementById('crumb'); temizle(crumb).append('Öğrenme alanı ', h('span', {}, '/ ' + (ders ? ders.baslik : r[0])));
  const ATOLYE = new Set(['atolye', 'pivot', 'sorgu', 'gorsel', 'makro']);
  for (const el of document.querySelectorAll('[data-page]')) el.classList.toggle('active', el.dataset.page === r[2] || (el.closest('.mobile-tabs') && el.dataset.page === 'atolye' && ATOLYE.has(r[2])));
  document.getElementById('sidebar').classList.remove('open'); document.getElementById('menu')?.setAttribute('aria-expanded', 'false');
  if (yol !== 'ders' || !b) window.scrollTo(0, 0); else setTimeout(() => document.getElementById('b-' + b)?.scrollIntoView({ block: 'start' }), 0);
  main.focus({ preventScroll: true });
  enTur(main, yol);
}
// Tema
const tema = D.durum().tema || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
document.documentElement.dataset.theme = tema;
const ts = document.getElementById('theme-select'); ts.value = tema;
ts.addEventListener('change', () => { document.documentElement.dataset.theme = ts.value; D.temaSec(ts.value); });
// Menü
const ac = () => { const sb = document.getElementById('sidebar'); const acik = sb.classList.toggle('open'); document.getElementById('menu')?.setAttribute('aria-expanded', String(acik)); };
document.getElementById('menu')?.addEventListener('click', ac);
document.querySelector('[data-open-menu]')?.addEventListener('click', ac);
document.addEventListener('keydown', e => { if (e.key === 'Escape') document.getElementById('sidebar').classList.remove('open'); if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); location.hash = '#islevler'; setTimeout(() => document.getElementById('is-ara')?.focus(), 50); } });
document.getElementById('search-shortcut')?.addEventListener('click', () => { location.hash = '#islevler'; setTimeout(() => document.getElementById('is-ara')?.focus(), 50); });
window.addEventListener('hashchange', git);
git();
