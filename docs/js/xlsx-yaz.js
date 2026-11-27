// Kesit Excel · küçük .xlsx yazıcı (dış kitaplık yok). Tarayıcıda ve Node'da çalışır.
// Desteklenen: metin, sayı, mantıksal, formül (İngilizce yazımla, açılışta Excel hesaplar), birkaç hücre stili,
// sütun genişliği, ilk satırı dondurma ve Excel Tablosu (yapılandırılmış başvurular için).
// Dosya zip'tir: tarayıcı destekliyorsa CompressionStream ile sıkıştırılır, desteklemiyorsa sıkıştırmasız (STORE) yazılır.

const enc = new TextEncoder();
const xmlKac = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
export const sutunAdi = c => { let s = ''; for (let n = c; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + (n - 1) % 26) + s; return s; };
export const hucreAdres = (r, c) => sutunAdi(c) + r;

// Stil kimlikleri (styles.xml'deki cellXfs sırası)
export const STIL = { normal: 0, baslik: 1, hedef: 2, kalin: 3, kaydir: 4, buyuk: 5 };
const SAYI_BICIM_ESAS = 164;

function stillerXml(bicimler) {
  // Her (stil, sayı biçimi) çifti için bir xf: önce 6 temel stil, sonra biçimli kopyalar
  const numFmts = bicimler.map((k, i) => `<numFmt numFmtId="${SAYI_BICIM_ESAS + i}" formatCode="${xmlKac(k)}"/>`).join('');
  const temel = [
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>',
    '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>',
    '<xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1"/>',
    '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>',
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf>',
    '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>',
  ];
  const ek = [];
  for (let i = 0; i < bicimler.length; i++) for (const t of [0, 2]) ek.push(`<xf numFmtId="${SAYI_BICIM_ESAS + i}" fontId="0" fillId="${t === 2 ? 3 : 0}" borderId="${t === 2 ? 1 : 0}" xfId="0" applyNumberFormat="1"${t === 2 ? ' applyFill="1" applyBorder="1"' : ''}/>`);
  const xfs = [...temel, ...ek];
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${bicimler.length ? `<numFmts count="${bicimler.length}">${numFmts}</numFmts>` : ''}
<fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="14"/><name val="Calibri"/></font></fonts>
<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE7ECF3"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF2B3"/></patternFill></fill></fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFB8C2CF"/></left><right style="thin"><color rgb="FFB8C2CF"/></right><top style="thin"><color rgb="FFB8C2CF"/></top><bottom style="thin"><color rgb="FFB8C2CF"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="${xfs.length}">${xfs.join('')}</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
}

// Kitap: { adlar: [{ ad, tanim (İngilizce, = olmadan) }], sayfalar: [{ ad, hucreler: [{ r, c, v?, f?, stil?, bicim? }], genislik: {sütun: genişlik}, dondur: true, tablo: { ad, r1, c1, r2, c2, basliklar } }] }
export function xlsxDosyalari(kitap) {
  const bicimler = [];
  const bicimNo = k => { let i = bicimler.indexOf(k); if (i < 0) { bicimler.push(k); i = bicimler.length - 1; } return i; };
  const dosyalar = {};
  let tabloNo = 0;
  const sayfaXml = (s, i) => {
    const satirlar = new Map();
    for (const h of s.hucreler) { if (!satirlar.has(h.r)) satirlar.set(h.r, []); satirlar.get(h.r).push(h); }
    const rs = [...satirlar.keys()].sort((a, b) => a - b);
    const govde = rs.map(r => {
      const hs = satirlar.get(r).sort((a, b) => a.c - b.c);
      return `<row r="${r}">` + hs.map(h => {
        let st = h.stil || 0;
        if (h.bicim) st = 6 + bicimNo(h.bicim) * 2 + (h.stil === STIL.hedef ? 1 : 0);
        const a = hucreAdres(h.r, h.c), sa = st ? ` s="${st}"` : '';
        if (h.f) return `<c r="${a}"${sa}><f>${xmlKac(h.f.replace(/^=/, ''))}</f></c>`;
        const v = h.v;
        if (v == null || v === '') return st ? `<c r="${a}"${sa}/>` : '';
        if (typeof v === 'number' && Number.isFinite(v)) return `<c r="${a}"${sa}><v>${v}</v></c>`;
        if (typeof v === 'boolean') return `<c r="${a}"${sa} t="b"><v>${v ? 1 : 0}</v></c>`;
        return `<c r="${a}"${sa} t="inlineStr"><is><t xml:space="preserve">${xmlKac(v)}</t></is></c>`;
      }).join('') + '</row>';
    }).join('');
    const gen = Object.entries(s.genislik || {}).sort((a, b) => a[0] - b[0]).map(([c, w]) => `<col min="${c}" max="${c}" width="${w}" customWidth="1"/>`).join('');
    const don = s.dondur ? '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' : '';
    let tabloRel = '';
    if (s.tablo) {
      tabloNo++;
      const t = s.tablo, ref = hucreAdres(t.r1, t.c1) + ':' + hucreAdres(t.r2, t.c2);
      const kolon = t.basliklar.map((b, j) => `<tableColumn id="${j + 1}" name="${xmlKac(b)}"/>`).join('');
      dosyalar[`xl/tables/table${tabloNo}.xml`] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<table xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" id="${tabloNo}" name="${xmlKac(t.ad)}" displayName="${xmlKac(t.ad)}" ref="${ref}" totalsRowShown="0"><autoFilter ref="${ref}"/><tableColumns count="${t.basliklar.length}">${kolon}</tableColumns><tableStyleInfo name="TableStyleLight9" showFirstColumn="0" showLastColumn="0" showRowStripes="1" showColumnStripes="0"/></table>`;
      dosyalar[`xl/worksheets/_rels/sheet${i + 1}.xml.rels`] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/table" Target="../tables/table${tabloNo}.xml"/></Relationships>`;
      tabloRel = '<tableParts count="1"><tablePart r:id="rId1"/></tableParts>';
    }
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${don}${gen ? `<cols>${gen}</cols>` : ''}<sheetData>${govde}</sheetData>${tabloRel}</worksheet>`;
  };
  kitap.sayfalar.forEach((s, i) => { dosyalar[`xl/worksheets/sheet${i + 1}.xml`] = sayfaXml(s, i); });
  const tablolar = Object.keys(dosyalar).filter(k => k.startsWith('xl/tables/'));
  dosyalar['[Content_Types].xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>${kitap.sayfalar.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}${tablolar.map(t => `<Override PartName="/${t}" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml"/>`).join('')}</Types>`;
  dosyalar['_rels/.rels'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`;
  dosyalar['docProps/core.xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xmlKac(kitap.baslik || 'Kesit Excel')}</dc:title><dc:creator>Kesit Excel</dc:creator></cp:coreProperties>`;
  dosyalar['xl/workbook.xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="0"/></bookViews><sheets>${kitap.sayfalar.map((s, i) => `<sheet name="${xmlKac(s.ad)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets>${(kitap.adlar || []).length ? '<definedNames>' + kitap.adlar.map(a => `<definedName name="${xmlKac(a.ad)}">${xmlKac(a.tanim)}</definedName>`).join('') + '</definedNames>' : ''}<calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`;
  dosyalar['xl/_rels/workbook.xml.rels'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${kitap.sayfalar.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${kitap.sayfalar.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  dosyalar['xl/styles.xml'] = stillerXml(bicimler);
  return dosyalar;
}

/* ---------------------------------------------------------------- zip */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
async function sikistir(b) {
  if (typeof CompressionStream === 'undefined') return null;
  try { const s = new Blob([b]).stream().pipeThrough(new CompressionStream('deflate-raw')); return new Uint8Array(await new Response(s).arrayBuffer()); } catch { return null; }
}
export async function zip(dosyalar) {
  const parcalar = [], merkez = []; let ofs = 0;
  for (const [ad, icerik] of Object.entries(dosyalar)) {
    const veri = typeof icerik === 'string' ? enc.encode(icerik) : icerik, adB = enc.encode(ad), crc = crc32(veri);
    const sik = await sikistir(veri), yontem = sik ? 8 : 0, govde = sik || veri;
    const yerel = new DataView(new ArrayBuffer(30));
    yerel.setUint32(0, 0x04034b50, true); yerel.setUint16(4, 20, true); yerel.setUint16(6, 0x0800, true); yerel.setUint16(8, yontem, true);
    yerel.setUint16(10, 0, true); yerel.setUint16(12, 0x21, true); yerel.setUint32(14, crc, true); yerel.setUint32(18, govde.length, true); yerel.setUint32(22, veri.length, true);
    yerel.setUint16(26, adB.length, true); yerel.setUint16(28, 0, true);
    parcalar.push(new Uint8Array(yerel.buffer), adB, govde);
    const m = new DataView(new ArrayBuffer(46));
    m.setUint32(0, 0x02014b50, true); m.setUint16(4, 20, true); m.setUint16(6, 20, true); m.setUint16(8, 0x0800, true); m.setUint16(10, yontem, true);
    m.setUint16(12, 0, true); m.setUint16(14, 0x21, true); m.setUint32(16, crc, true); m.setUint32(20, govde.length, true); m.setUint32(24, veri.length, true);
    m.setUint16(28, adB.length, true); m.setUint32(42, ofs, true);
    merkez.push(new Uint8Array(m.buffer), adB);
    ofs += 30 + adB.length + govde.length;
  }
  const mBoy = merkez.reduce((t, p) => t + p.length, 0);
  const son = new DataView(new ArrayBuffer(22));
  son.setUint32(0, 0x06054b50, true); son.setUint16(8, Object.keys(dosyalar).length, true); son.setUint16(10, Object.keys(dosyalar).length, true);
  son.setUint32(12, mBoy, true); son.setUint32(16, ofs, true);
  const hepsi = [...parcalar, ...merkez, new Uint8Array(son.buffer)];
  const out = new Uint8Array(hepsi.reduce((t, p) => t + p.length, 0)); let i = 0;
  for (const p of hepsi) { out.set(p, i); i += p.length; }
  return out;
}
export async function xlsx(kitap) { return zip(xlsxDosyalari(kitap)); }
