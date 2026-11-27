// ?lang=en ile açılınca: İngilizce kısa tanıtım ve menü etiketleri. Ders içeriği Türkçedir (Türkçe Excel öğretir).
const EN = { home: 'Home', yol: 'Learning path', dersler: 'Lessons', atolye: 'Formula lab', pivot: 'PivotTable lab', sorgu: 'Power Query lab', islevler: 'Function guide', seviye: 'Placement test', hatalar: 'Common mistakes', mulakat: 'Interview prep', ilerleme: 'My progress', veri: 'Kesit datasets', hakkinda: 'About' };
const aktif = new URLSearchParams(location.search).get('lang') === 'en';
if (aktif) {
  document.documentElement.lang = 'en';
  for (const a of document.querySelectorAll('#sidebar [data-page] span, .mobile-tabs [data-page] span')) { const k = a.parentElement.dataset.page; if (EN[k]) a.textContent = EN[k]; }
}
export function enTur(main, yol) {
  if (!aktif) return;
  const kutu = document.createElement('aside'); kutu.className = 'callout en-tur'; kutu.setAttribute('lang', 'en');
  const p = (t, b) => { const x = document.createElement(t); x.textContent = b; return x; };
  kutu.append(p('h2', 'Kesit Excel: Turkish Excel, practised on real data'),
    p('p', 'A free, install-free Excel course in Turkish: a spreadsheet engine written for this project runs in your browser (179 functions, Turkish and English names, dynamic arrays, LAMBDA). 100 lessons and 218 exercises on the shared Kesit datasets, including charts, slicer dashboards, VBA macros, data validation, financial functions, Goal Seek, Solver, LAMBDA helpers, Advanced Filter and dashboard charts (bullet, gauge, Pareto, Gantt); every answer is checked on the sheet you see and on a hidden variant with shuffled numbers, so typed-in results and missing $ signs are caught.'),
    p('p', 'Lessons are in Turkish because they teach Turkish Excel (; separators, ETOPLA instead of SUMIF). The TR ⇄ EN button on the formula bar translates any formula. Also included: a PivotTable lab that shows the equivalent SUMIFS for every cell, and a Power Query lab that writes the M code for each step. Nothing leaves your device.'));
  if (yol === '' || yol === undefined) main.prepend(kutu); else main.append(kutu);
}
