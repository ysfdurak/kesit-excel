// Ders model sayfalarını (docs/icerik/modeller.js) JSON olarak basar; formüller İngilizce yazıma çevrilir. tools/kitap_olustur.py kullanır.
const kok = new URL('../docs/', import.meta.url).href;
const { MODELLER } = await import(kok + 'icerik/modeller.js');
const { ISLEVLER } = await import(kok + 'motor/islevler.js');
const { cevir } = await import(kok + 'motor/formul.js');
const cik = {};
for (const [ad, m] of Object.entries(MODELLER)) {
  const sat = m.satirlar.map(r => r.map(v => typeof v === 'string' && v.startsWith('=') ? cevir(v, 'en', ISLEVLER) : v));
  cik[ad] = { ...m, satirlar: sat };
}
process.stdout.write(JSON.stringify(cik));
