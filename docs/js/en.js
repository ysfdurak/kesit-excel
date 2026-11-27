// ?lang=en ile açılınca: İngilizce kısa tanıtım ve menü etiketleri. Ders içeriği Türkçedir (Türkçe Excel öğretir).
const EN = { home: 'Home', yol: 'Learning path', dersler: 'Lessons', atolye: 'Formula lab', pivot: 'PivotTable lab', sorgu: 'Power Query lab', gorsel: 'Charts and dashboards', makro: 'Macros (VBA)', islevler: 'Function guide', seviye: 'Placement test', hatalar: 'Common mistakes', mulakat: 'Interview prep', ilerleme: 'My progress', veri: 'Kesit datasets', hakkinda: 'About' };
// Kesit ailesiyle ortak anahtar (kesit_lang, sessionStorage): merkez sayfada ya da başka bir Kesit uygulamasında açılan tur
// aynı sekmede burada da sürer; ?lang=en açar, ?lang=tr kapatır.
const aktif = (() => {
  const q = new URLSearchParams(location.search).get('lang');
  try {
    if (q === 'en') sessionStorage.setItem('kesit_lang', 'en');
    if (q === 'tr') sessionStorage.removeItem('kesit_lang');
    return sessionStorage.getItem('kesit_lang') === 'en';
  } catch { return q === 'en'; }
})();
if (aktif) {
  document.documentElement.lang = 'en';
  for (const a of document.querySelectorAll('#sidebar [data-page] span, .mobile-tabs [data-page] span')) { const k = a.parentElement.dataset.page; if (EN[k]) a.textContent = EN[k]; }
}
export function enTur(main, yol) {
  if (!aktif) return;
  const kutu = document.createElement('aside'); kutu.className = 'callout en-tur'; kutu.setAttribute('lang', 'en');
  const p = (t, b) => { const x = document.createElement(t); x.textContent = b; return x; };
  kutu.append(p('h2', 'Kesit Excel: Turkish Excel, practised on real data'),
    p('p', 'A free, install-free Excel course in Turkish: a spreadsheet engine written for this project runs in your browser (204 functions, Turkish and English names, dynamic arrays, LAMBDA). 167 lessons and 607 exercises on the shared Kesit datasets, including charts, slicer dashboards, VBA macros, data validation, financial functions, Goal Seek, Solver, LAMBDA helpers, Advanced Filter, Consolidate, regular expressions, timeline slicers and dashboard charts (bullet, gauge, Pareto, Gantt); every answer is checked on the sheet you see and on a hidden variant with shuffled numbers, so typed-in results and missing $ signs are caught.'),
    p('p', 'Lessons are in Turkish because they teach Turkish Excel (; separators, ETOPLA instead of SUMIF). The TR ⇄ EN button on the formula bar translates any formula. Also included: a PivotTable lab that shows the equivalent SUMIFS for every cell, and a Power Query lab that writes the M code for each step. Nothing leaves your device.'));
  const kapat = document.createElement('p'); const ka = document.createElement('a'); ka.href = '?lang=tr' + location.hash; ka.textContent = 'Turn off the English guide'; kapat.className = 'small-note'; kapat.append(ka); kutu.append(kapat);
  if (yol === '' || yol === undefined) main.prepend(kutu); else main.append(kutu);
}
