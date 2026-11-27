// DOM yardımcıları: innerHTML kullanılmaz; tüm metin textContent ile yazılır (CSP ve XSS için).
export function h(etiket, ozellik = {}, ...cocuklar) {
  const [ad, ...siniflar] = etiket.split('.');
  const el = document.createElement(ad || 'div');
  if (siniflar.length) el.className = siniflar.join(' ');
  for (const [k, v] of Object.entries(ozellik || {})) {
    if (v == null || v === false) continue;
    if (k === 'on') { for (const [o, f] of Object.entries(v)) el.addEventListener(o, f); }
    else if (k === 'sinif') el.className += (el.className ? ' ' : '') + v;
    else if (k === 'veri') { for (const [d, x] of Object.entries(v)) el.dataset[d] = x; }
    else if (k in el && k !== 'list' && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  ekle(el, cocuklar);
  return el;
}
function ekle(el, cs) { for (const c of cs.flat(Infinity)) { if (c == null || c === false) continue; el.append(c instanceof Node ? c : document.createTextNode(String(c))); } }
// replaceChildren tek işlemdir: odaklı bir giriş kaldırılırken tetiklenen blur/change yeniden çizim yapsa da döngü bozulmaz
export const temizle = el => { el.replaceChildren(); return el; };
// Element.append dizileri düzleştirmez ve null'u "null" metni yazar; bu yardımcı ikisini de düzeltir.
export const yerlestir = (el, ...xs) => { ekle(el, xs); return el; };

// Basit biçim: **kalın**, `kod`; başka işaret yok. Metin önce düğümlere bölünür, HTML olarak yorumlanmaz.
export function bicimli(metin) {
  const out = []; const re = /(\*\*([^*]+)\*\*|`([^`]+)`|\\\*)/g; let son = 0, m;
  const s = String(metin);
  while ((m = re.exec(s))) {
    if (m.index > son) out.push(s.slice(son, m.index));
    if (m[2]) out.push(h('strong', {}, m[2])); else if (m[3]) out.push(h('code', {}, m[3])); else out.push('*');
    son = re.lastIndex;
  }
  if (son < s.length) out.push(s.slice(son));
  // Formül görünümlü parçaları (=TOPLA(...)) kod gibi göster
  // Metin içindeki formülleri (=TOPLA(…)) kod olarak göster; cümle sonundaki noktalama koda girmez
  return out.flatMap(p => typeof p !== 'string' ? [p] : p.split(/(=[A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜ0-9_.]*\([^\s]*)/g).flatMap((q, i) => {
    if (!(i % 2)) return q === '' ? [] : [q];
    const m = /^(.*?)([.,;:]*)$/.exec(q); return [h('code.f', {}, m[1]), m[2]].filter(x => x !== '');
  }));
}
export const p = metin => h('p', {}, bicimli(metin));
export function bildir(metin, tur = '') {
  const t = document.getElementById('toast'); if (!t) return;
  t.textContent = metin; t.className = 'goster ' + tur; clearTimeout(bildir.z); bildir.z = setTimeout(() => { t.className = ''; }, 3200);
}
export const sayiTR = n => Number(n).toLocaleString('tr-TR');
