// Kesit Excel · Power Query adım motoru.
// Öğrenci M yazmaz; arayüzde adım seçer. Her adım tabloyu dönüştürür ve Power Query'nin üreteceği M satırını yazar.
// Tablo: { basliklar: [ad], satirlar: [[...]], turler: [ 'any' | 'text' | 'number' | 'date' ] }
// Hücrede hata: { hata: 'DataFormat.Error', mesaj }
import { seriye, seriden, metindenTarih } from './tarih.js';

const trK = s => String(s).toLocaleLowerCase('tr');
const trB = s => String(s).toLocaleUpperCase('tr');
export const hataHucre = (mesaj) => ({ hata: 'DataFormat.Error', mesaj });
export const hucreHatali = v => v != null && typeof v === 'object' && 'hata' in v;
const kopya = t => ({ basliklar: t.basliklar.slice(), satirlar: t.satirlar.map(r => r.slice()), turler: (t.turler || t.basliklar.map(() => 'any')).slice() });
const mAd = s => '"' + String(s).replace(/"/g, '""') + '"';
const adim = ad => /^[A-Za-z_][A-Za-z0-9_]*$/.test(ad) ? ad : '#' + mAd(ad);
const liste = xs => '{' + xs.map(mAd).join(', ') + '}';
const M_TUR = { text: 'type text', number: 'type number', date: 'type date', int: 'Int64.Type' };

function sutunNo(t, ad) { const i = t.basliklar.indexOf(ad); if (i < 0) throw new Error(`"${ad}" sütunu yok. Var olanlar: ${t.basliklar.join(', ')}`); return i; }

// Türkçe kültürle (tr-TR) metinden sayı: "1.250,50" → 1250.5; "-" ve boş → hata/null
function sayiCevir(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return v;
  const s = String(v).trim().replace(/\s/g, '');
  if (/^[+-]?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s) || /^[+-]?\d+(,\d+)?$/.test(s)) return Number(s.replace(/\./g, '').replace(',', '.'));
  return hataHucre(`"${v}" sayıya dönüştürülemedi`);
}
function tarihCevir(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return Math.floor(v);
  const s = String(v).trim();
  const d = metindenTarih(s);
  if (d == null) return hataHucre(`"${v}" tarihe dönüştürülemedi`);
  // 2024-02-30 gibi takvimde olmayan günler: Power Query hata verir (Excel'in DATE gibi kaydırmaz)
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s) || /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(s);
  if (m) { const [y, a, g] = m[1].length === 4 ? [+m[1], +m[2], +m[3]] : [+m[3], +m[2], +m[1]]; const t = seriye(seriden(y, a, g)); if (t.y !== y || t.m !== a || t.d !== g) return hataHucre(`"${v}" geçerli bir tarih değil`); }
  return Math.floor(d);
}

// Özel sütun ifadesi: [Adet] * [Birim Fiyat] * (1 - [İndirim]) ya da [Ad] & " " & [Soyad]
function ifadeDerle(kaynakIfade, basliklar) {
  // Not: parametre adı içteki ifade() işleviyle çakışmamalı (işlev bildirimi yukarı taşınır ve parametreyi gölgeler).
  const tk = []; let i = 0; const s = String(kaynakIfade);
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '[') { const j = s.indexOf(']', i); if (j < 0) throw new Error('] eksik'); const ad = s.slice(i + 1, j); if (!basliklar.includes(ad)) throw new Error(`[${ad}] sütunu yok`); tk.push({ t: 'alan', v: basliklar.indexOf(ad) }); i = j + 1; continue; }
    if (c === '"') { let j = i + 1, v = ''; while (j < s.length && s[j] !== '"') v += s[j++]; if (j >= s.length) throw new Error('Tırnak kapanmadı'); tk.push({ t: 'sabit', v }); i = j + 1; continue; }
    const m = /^\d+(\.\d+)?/.exec(s.slice(i)); if (m) { tk.push({ t: 'sabit', v: Number(m[0]) }); i += m[0].length; continue; }
    if ('+-*/&()'.includes(c)) { tk.push({ t: c }); i++; continue; }
    throw new Error(`İfadede beklenmeyen karakter: ${c}`);
  }
  let p = 0;
  const ON = { '&': 1, '+': 2, '-': 2, '*': 3, '/': 3 };
  function birincil() {
    const t = tk[p++]; if (!t) throw new Error('İfade eksik');
    if (t.t === 'alan' || t.t === 'sabit') return t;
    if (t.t === '-') return { t: 'neg', a: birincil() };
    if (t.t === '(') { const e = ifade(0); if (!tk[p] || tk[p].t !== ')') throw new Error(') eksik'); p++; return e; }
    throw new Error('İfade bozuk');
  }
  function ifade(min) { let a = birincil(); while (tk[p] && ON[tk[p].t] && ON[tk[p].t] > min - 1 && ON[tk[p].t] >= min) { const o = tk[p++].t; a = { t: 'op', o, a, b: ifade(ON[o] + 1) }; } return a; }
  const agac = ifade(0); if (p < tk.length) throw new Error('İfade bozuk');
  const calis = (n, r) => {
    if (n.t === 'alan') return r[n.v]; if (n.t === 'sabit') return n.v;
    if (n.t === 'neg') { const x = calis(n.a, r); return x == null ? null : typeof x === 'number' ? -x : hataHucre('Sayı bekleniyor'); }
    const a = calis(n.a, r), b = calis(n.b, r);
    if (hucreHatali(a)) return a; if (hucreHatali(b)) return b;
    if (a == null || b == null) return null; // M'de null ile işlem null verir
    if (n.o === '&') return typeof a === 'string' && typeof b === 'string' ? a + b : hataHucre('& yalnız metinleri birleştirir; sayıyı önce Number.ToText ile çevirin');
    if (typeof a !== 'number' || typeof b !== 'number') return hataHucre(`${n.o} için iki sayı gerekir`);
    return n.o === '+' ? a + b : n.o === '-' ? a - b : n.o === '*' ? a * b : b === 0 ? hataHucre('Sıfıra bölme') : a / b;
  };
  return r => calis(agac, r);
}

// Adım tanımları: ad (Türkçe Power Query adım adı), uygula(tablo, a, kaynaklar), m(onceki, a)
export const ADIMLAR = {
  ustSatirKaldir: {
    ad: 'Kaldırılan Üst Satırlar', etiket: 'Üst satırları kaldır', alanlar: [['n', 'sayi', 'Kaç satır']],
    uygula: (t, a) => { const x = kopya(t); x.satirlar = x.satirlar.slice(Number(a.n) || 0); return x; },
    m: (o, a) => `Table.Skip(${o}, ${Number(a.n) || 0})`,
  },
  basligiYukselt: {
    ad: 'Yükseltilen Üst Bilgiler', etiket: 'İlk satırı başlık yap', alanlar: [],
    uygula: t => { const x = kopya(t); if (!x.satirlar.length) throw new Error('Tablo boş'); const ilk = x.satirlar.shift(); const say = {}; x.basliklar = ilk.map((v, i) => { let ad = v == null || v === '' ? 'Column' + (i + 1) : String(v); if (say[ad]) ad += '_' + say[ad]++; else say[ad] = 1; return ad; }); x.turler = x.basliklar.map(() => 'any'); return x; },
    m: o => `Table.PromoteHeaders(${o}, [PromoteAllScalars=true])`,
  },
  bosSatirKaldir: {
    ad: 'Kaldırılan Boş Satırlar', etiket: 'Boş satırları kaldır', alanlar: [],
    uygula: t => { const x = kopya(t); x.satirlar = x.satirlar.filter(r => r.some(v => v != null && v !== '')); return x; },
    m: o => `Table.SelectRows(${o}, each not List.IsEmpty(List.RemoveMatchingItems(Record.FieldValues(_), {"", null})))`,
  },
  kirp: {
    ad: 'Kırpılan Metin', etiket: 'Boşlukları kırp', alanlar: [['sutunlar', 'sutunlar', 'Sütunlar']],
    uygula: (t, a) => { const x = kopya(t); const is = a.sutunlar.map(s => sutunNo(x, s)); for (const r of x.satirlar) for (const i of is) if (typeof r[i] === 'string') r[i] = r[i].trim(); return x; },
    m: (o, a) => `Table.TransformColumns(${o}, {${a.sutunlar.map(s => `{${mAd(s)}, Text.Trim, type text}`).join(', ')}})`,
  },
  harf: {
    ad: 'Büyük/Küçük Harf Değiştirilen Metin', etiket: 'Büyük/küçük harf', alanlar: [['sutunlar', 'sutunlar', 'Sütunlar'], ['mod', ['buyuk', 'kucuk', 'ilk'], 'Biçim']],
    uygula: (t, a) => { const x = kopya(t); const is = a.sutunlar.map(s => sutunNo(x, s)); const f = a.mod === 'buyuk' ? trB : a.mod === 'kucuk' ? trK : (s => trK(s).replace(/(^|[\s-])(\S)/g, (m, o, h) => o + h.toLocaleUpperCase('tr'))); for (const r of x.satirlar) for (const i of is) if (typeof r[i] === 'string') r[i] = f(r[i]); return x; },
    m: (o, a) => `Table.TransformColumns(${o}, {${a.sutunlar.map(s => `{${mAd(s)}, ${a.mod === 'buyuk' ? 'Text.Upper' : a.mod === 'kucuk' ? 'Text.Lower' : 'Text.Proper'}, type text}`).join(', ')}})`,
  },
  degerDegistir: {
    ad: 'Değiştirilen Değer', etiket: 'Değeri değiştir', alanlar: [['sutun', 'sutun', 'Sütun'], ['eski', 'metin', 'Aranan'], ['yeni', 'metin', 'Yerine']],
    uygula: (t, a) => { const x = kopya(t); const i = sutunNo(x, a.sutun); const yeni = a.yeni === '' ? null : a.yeni; for (const r of x.satirlar) if (r[i] != null && String(r[i]) === String(a.eski)) r[i] = yeni; return x; },
    m: (o, a) => `Table.ReplaceValue(${o}, ${mAd(a.eski)}, ${a.yeni === '' ? 'null' : mAd(a.yeni)}, Replacer.ReplaceValue, {${mAd(a.sutun)}})`,
  },
  turDegistir: {
    ad: 'Değiştirilen Tür', etiket: 'Veri türünü değiştir', alanlar: [['sutun', 'sutun', 'Sütun'], ['tur', ['number', 'date', 'text'], 'Tür']],
    uygula: (t, a) => { const x = kopya(t); const i = sutunNo(x, a.sutun); for (const r of x.satirlar) { const v = r[i]; if (hucreHatali(v)) continue; r[i] = a.tur === 'number' ? sayiCevir(v) : a.tur === 'date' ? tarihCevir(v) : v == null ? null : String(v); } x.turler[i] = a.tur; return x; },
    m: (o, a) => `Table.TransformColumnTypes(${o}, {{${mAd(a.sutun)}, ${M_TUR[a.tur]}}}, "tr-TR")`,
  },
  hataKaldir: {
    ad: 'Kaldırılan Hatalar', etiket: 'Hatalı satırları kaldır', alanlar: [['sutunlar', 'sutunlar', 'Sütunlar']],
    uygula: (t, a) => { const x = kopya(t); const is = a.sutunlar.map(s => sutunNo(x, s)); x.satirlar = x.satirlar.filter(r => !is.some(i => hucreHatali(r[i]))); return x; },
    m: (o, a) => `Table.RemoveRowsWithErrors(${o}, ${liste(a.sutunlar)})`,
  },
  yinelenenKaldir: {
    ad: 'Kaldırılan Yinelenenler', etiket: 'Yinelenenleri kaldır', alanlar: [['sutunlar', 'sutunlar', 'Hangi sütunlara göre']],
    uygula: (t, a) => { const x = kopya(t); const is = (a.sutunlar && a.sutunlar.length ? a.sutunlar : x.basliklar).map(s => sutunNo(x, s)); const gor = new Set(); x.satirlar = x.satirlar.filter(r => { const k = JSON.stringify(is.map(i => r[i])); if (gor.has(k)) return false; gor.add(k); return true; }); return x; },
    // Power Query yinelenen karşılaştırmasında büyük/küçük harfe duyarlıdır (Excel'in "Yinelenenleri Kaldır" düğmesinden farklı).
    m: (o, a) => `Table.Distinct(${o}${a.sutunlar && a.sutunlar.length ? ', ' + liste(a.sutunlar) : ''})`,
  },
  sutunBol: {
    ad: 'Sınırlayıcıya Göre Bölünmüş Sütun', etiket: 'Sütunu böl', alanlar: [['sutun', 'sutun', 'Sütun'], ['ayirici', 'metin', 'Ayırıcı'], ['adlar', 'metin', 'Yeni adlar (virgülle)']],
    uygula: (t, a) => {
      const x = kopya(t); const i = sutunNo(x, a.sutun), adlar = String(a.adlar || '').split(',').map(s => s.trim()).filter(Boolean);
      if (adlar.length !== 2) throw new Error('İki yeni ad yazın (ör. Kod, Ad)');
      x.basliklar.splice(i, 1, ...adlar); x.turler.splice(i, 1, 'text', 'text');
      x.satirlar = x.satirlar.map(r => { const v = r[i]; let p = [null, null]; if (typeof v === 'string') { const k = v.indexOf(a.ayirici); p = k < 0 ? [v, null] : [v.slice(0, k), v.slice(k + a.ayirici.length)]; } const n = r.slice(); n.splice(i, 1, ...p); return n; });
      return x;
    },
    m: (o, a) => `Table.SplitColumn(${o}, ${mAd(a.sutun)}, Splitter.SplitTextByEachDelimiter({${mAd(a.ayirici)}}, QuoteStyle.Csv, false), ${liste(String(a.adlar || '').split(',').map(s => s.trim()))})`,
  },
  asagiDoldur: {
    ad: 'Aşağı Doldurulan', etiket: 'Aşağı doldur', alanlar: [['sutunlar', 'sutunlar', 'Sütunlar']],
    uygula: (t, a) => { const x = kopya(t); for (const s of a.sutunlar) { const i = sutunNo(x, s); let son = null; for (const r of x.satirlar) { if (r[i] == null || r[i] === '') r[i] = son; else son = r[i]; } } return x; },
    m: (o, a) => `Table.FillDown(${o}, ${liste(a.sutunlar)})`,
  },
  filtre: {
    ad: 'Filtrelenen Satırlar', etiket: 'Satırları filtrele', alanlar: [['sutun', 'sutun', 'Sütun'], ['op', ['=', '<>', '>', '>=', '<', '<=', 'icerir', 'bosDegil'], 'Koşul'], ['deger', 'metin', 'Değer']],
    uygula: (t, a) => {
      const x = kopya(t); const i = sutunNo(x, a.sutun); const n = Number(String(a.deger).replace(',', '.')); const sayisal = a.deger !== '' && !isNaN(n);
      const test = v => { if (hucreHatali(v)) return false; if (a.op === 'bosDegil') return v != null && v !== ''; if (a.op === 'icerir') return typeof v === 'string' && v.includes(a.deger);
        const b = sayisal && typeof v === 'number' ? n : a.deger; if (v == null) return a.op === '<>';
        const c = typeof v === 'number' && typeof b === 'number' ? v - b : String(v) < String(b) ? -1 : String(v) > String(b) ? 1 : 0;
        return { '=': c === 0, '<>': c !== 0, '>': c > 0, '>=': c >= 0, '<': c < 0, '<=': c <= 0 }[a.op]; };
      x.satirlar = x.satirlar.filter(r => test(r[i])); return x;
    },
    m: (o, a) => {
      const v = a.deger !== '' && !isNaN(Number(String(a.deger).replace(',', '.'))) ? String(a.deger).replace(',', '.') : mAd(a.deger);
      const ex = a.op === 'bosDegil' ? `[${a.sutun}] <> null and [${a.sutun}] <> ""` : a.op === 'icerir' ? `Text.Contains([${a.sutun}], ${mAd(a.deger)})` : `[${a.sutun}] ${a.op} ${v}`;
      return `Table.SelectRows(${o}, each ${ex})`;
    },
  },
  sutunKaldir: {
    ad: 'Kaldırılan Sütunlar', etiket: 'Sütunları kaldır', alanlar: [['sutunlar', 'sutunlar', 'Sütunlar']],
    uygula: (t, a) => { const x = kopya(t); const is = a.sutunlar.map(s => sutunNo(x, s)); const tut = x.basliklar.map((_, i) => !is.includes(i)); x.basliklar = x.basliklar.filter((_, i) => tut[i]); x.turler = x.turler.filter((_, i) => tut[i]); x.satirlar = x.satirlar.map(r => r.filter((_, i) => tut[i])); return x; },
    m: (o, a) => `Table.RemoveColumns(${o}, ${liste(a.sutunlar)})`,
  },
  yenidenAdlandir: {
    ad: 'Yeniden Adlandırılan Sütunlar', etiket: 'Sütunu yeniden adlandır', alanlar: [['sutun', 'sutun', 'Sütun'], ['yeni', 'metin', 'Yeni ad']],
    uygula: (t, a) => { const x = kopya(t); const i = sutunNo(x, a.sutun); if (!a.yeni) throw new Error('Yeni ad boş'); if (x.basliklar.includes(a.yeni)) throw new Error('Bu adda sütun zaten var'); x.basliklar[i] = a.yeni; return x; },
    m: (o, a) => `Table.RenameColumns(${o}, {{${mAd(a.sutun)}, ${mAd(a.yeni)}}})`,
  },
  ozelSutun: {
    ad: 'Eklenen Özel', etiket: 'Özel sütun ekle', alanlar: [['ad', 'metin', 'Sütun adı'], ['ifade', 'metin', 'Formül (ör. [Adet] * [Birim Fiyat])']],
    uygula: (t, a) => { const x = kopya(t); if (!a.ad) throw new Error('Sütun adı boş'); const f = ifadeDerle(a.ifade, x.basliklar); x.basliklar.push(a.ad); x.turler.push('any'); x.satirlar = x.satirlar.map(r => [...r, f(r)]); return x; },
    m: (o, a) => `Table.AddColumn(${o}, ${mAd(a.ad)}, each ${a.ifade})`,
  },
  grupla: {
    ad: 'Gruplandırılmış Satırlar', etiket: 'Grupla', alanlar: [['anahtar', 'sutun', 'Gruplanacak sütun'], ['islem', ['toplam', 'say', 'ortalama'], 'İşlem'], ['deger', 'sutun', 'Değer sütunu'], ['ad', 'metin', 'Sonuç sütununun adı']],
    uygula: (t, a) => {
      const x = kopya(t); const k = sutunNo(x, a.anahtar), d = a.islem === 'say' ? -1 : sutunNo(x, a.deger);
      const gr = new Map(); for (const r of x.satirlar) { const key = r[k]; if (!gr.has(key)) gr.set(key, []); gr.get(key).push(r); }
      const ozet = rs => { if (a.islem === 'say') return rs.length; const n = rs.map(r => r[d]).filter(v => typeof v === 'number'); if (rs.some(r => hucreHatali(r[d]))) return hataHucre('Grupta hatalı değer var'); return !n.length ? null : a.islem === 'toplam' ? n.reduce((p, q) => p + q, 0) : n.length ? n.reduce((p, q) => p + q, 0) / n.length : null; };
      return { basliklar: [a.anahtar, a.ad || 'Sayı'], turler: ['any', 'number'], satirlar: [...gr].map(([key, rs]) => [key, ozet(rs)]) };
    },
    m: (o, a) => `Table.Group(${o}, {${mAd(a.anahtar)}}, {{${mAd(a.ad || 'Sayı')}, ${a.islem === 'say' ? 'each Table.RowCount(_), Int64.Type' : `each List.${a.islem === 'toplam' ? 'Sum' : 'Average'}([${a.deger}]), type number`}}})`,
  },
  birlestir: {
    ad: 'Birleştirilmiş Sorgular', etiket: 'Sorguları birleştir (Merge)', alanlar: [['anahtar', 'sutun', 'Bu tablodaki anahtar'], ['tablo', 'tablo', 'Diğer tablo'], ['digerAnahtar', 'metin', 'Diğer tablodaki anahtar'], ['getir', 'metin', 'Getirilecek sütunlar (virgülle)'], ['tur', ['solDis', 'ic'], 'Birleştirme türü']],
    uygula: (t, a, kaynaklar) => {
      const x = kopya(t), s = kaynaklar[a.tablo]; if (!s) throw new Error('Diğer tablo bulunamadı');
      const k = sutunNo(x, a.anahtar), sk = s.basliklar.indexOf(a.digerAnahtar); if (sk < 0) throw new Error(`Diğer tabloda "${a.digerAnahtar}" yok`);
      const getir = String(a.getir || '').split(',').map(v => v.trim()).filter(Boolean); const gi = getir.map(g => { const i = s.basliklar.indexOf(g); if (i < 0) throw new Error(`Diğer tabloda "${g}" yok`); return i; });
      const harita = new Map(); for (const r of s.satirlar) { const key = r[sk]; if (!harita.has(key)) harita.set(key, []); harita.get(key).push(r); }
      const out = [];
      for (const r of x.satirlar) { const es = harita.get(r[k]); if (es) for (const e of es) out.push([...r, ...gi.map(i => e[i])]); else if (a.tur !== 'ic') out.push([...r, ...gi.map(() => null)]); }
      x.basliklar.push(...getir.map(g => x.basliklar.includes(g) ? a.tablo + '.' + g : g)); x.turler.push(...getir.map(() => 'any')); x.satirlar = out; return x;
    },
    m: (o, a) => `let Birleşik = Table.NestedJoin(${o}, {${mAd(a.anahtar)}}, ${adim(a.tablo)}, {${mAd(a.digerAnahtar)}}, ${mAd(a.tablo)}, JoinKind.${a.tur === 'ic' ? 'Inner' : 'LeftOuter'}) in Table.ExpandTableColumn(Birleşik, ${mAd(a.tablo)}, ${liste(String(a.getir || '').split(',').map(v => v.trim()).filter(Boolean))})`,
  },
  ekle: {
    ad: 'Eklenen Sorgu', etiket: 'Sorgu ekle (Append)', alanlar: [['tablo', 'tablo', 'Alta eklenecek tablo']],
    uygula: (t, a, kaynaklar) => { const x = kopya(t), s = kaynaklar[a.tablo]; if (!s) throw new Error('Tablo bulunamadı'); const tum = [...x.basliklar, ...s.basliklar.filter(b => !x.basliklar.includes(b))]; const hizala = (tb, r) => tum.map(b => { const i = tb.basliklar.indexOf(b); return i < 0 ? null : r[i]; }); return { basliklar: tum, turler: tum.map(() => 'any'), satirlar: [...x.satirlar.map(r => hizala(x, r)), ...s.satirlar.map(r => hizala(s, r))] }; },
    m: (o, a) => `Table.Combine({${o}, ${adim(a.tablo)}})`,
  },
  ozetKaldir: {
    ad: 'Özetlemesi Kaldırılan Diğer Sütunlar', etiket: 'Diğer sütunların özetlemesini kaldır (Unpivot)', alanlar: [['sabit', 'sutunlar', 'Sabit kalacak sütunlar'], ['nitelik', 'metin', 'Öznitelik adı'], ['deger', 'metin', 'Değer adı']],
    uygula: (t, a) => { const x = kopya(t); const sb = a.sabit.map(s => sutunNo(x, s)); const diger = x.basliklar.map((_, i) => i).filter(i => !sb.includes(i)); const out = []; for (const r of x.satirlar) for (const i of diger) if (r[i] != null) out.push([...sb.map(j => r[j]), x.basliklar[i], r[i]]); return { basliklar: [...a.sabit, a.nitelik || 'Öznitelik', a.deger || 'Değer'], turler: [...sb.map(() => 'any'), 'text', 'any'], satirlar: out }; },
    m: (o, a) => `Table.UnpivotOtherColumns(${o}, ${liste(a.sabit)}, ${mAd(a.nitelik || 'Öznitelik')}, ${mAd(a.deger || 'Değer')})`,
  },
  sirala: {
    ad: 'Sıralanmış Satırlar', etiket: 'Sırala', alanlar: [['sutun', 'sutun', 'Sütun'], ['yon', ['artan', 'azalan'], 'Yön']],
    uygula: (t, a) => { const x = kopya(t); const i = sutunNo(x, a.sutun), y = a.yon === 'azalan' ? -1 : 1; x.satirlar = x.satirlar.map((r, k) => [r, k]).sort((p, q) => { const u = p[0][i], v = q[0][i]; if (u == null) return 1; if (v == null) return -1; const c = typeof u === 'number' && typeof v === 'number' ? u - v : String(u).localeCompare(String(v), 'tr'); return c * y || p[1] - q[1]; }).map(([r]) => r); return x; },
    m: (o, a) => `Table.Sort(${o}, {{${mAd(a.sutun)}, Order.${a.yon === 'azalan' ? 'Descending' : 'Ascending'}}})`,
  },
};

// Sorguyu çalıştır: her adımın ara sonucu ve M kodu döner. Hatalı adımda durur, önceki adımlar korunur.
export function sorguCalistir(kaynakAd, kaynak, adimlar, kaynaklar = {}) {
  let t = { basliklar: kaynak.basliklar ? kaynak.basliklar.slice() : (kaynak.satirlar[0] || []).map((_, i) => 'Column' + (i + 1)), satirlar: kaynak.satirlar.map(r => r.slice()), turler: null };
  t.turler = t.basliklar.map(() => 'any');
  const ara = [{ ad: 'Kaynak', tablo: t }], satirlar = [`    Kaynak = Excel.CurrentWorkbook(){[Name=${mAd(kaynakAd)}]}[Content]`];
  let onceki = 'Kaynak', hata = null; const kullanilan = {};
  for (let k = 0; k < adimlar.length; k++) {
    const a = adimlar[k], tanim = ADIMLAR[a.tip];
    if (!tanim) { hata = { adim: k, mesaj: 'Bilinmeyen adım: ' + a.tip }; break; }
    try {
      t = tanim.uygula(t, a, kaynaklar);
      let ad = tanim.ad; kullanilan[ad] = (kullanilan[ad] || 0) + 1; if (kullanilan[ad] > 1) ad += kullanilan[ad];
      satirlar.push(`    ${adim(ad)} = ${tanim.m(onceki, a)}`);
      ara.push({ ad, tablo: t }); onceki = adim(ad);
    } catch (e) { hata = { adim: k, mesaj: e.message }; break; }
  }
  const m = 'let\n' + satirlar.join(',\n') + '\nin\n    ' + onceki;
  const hataSayisi = t.satirlar.reduce((n, r) => n + r.filter(hucreHatali).length, 0);
  return { tablo: t, ara, m, hata, hataSayisi };
}
