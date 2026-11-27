# Kesit Excel nasıl çalışır? (kısa rehber)

Ayrıntılı ve eğitim amaçlı belge: [docs/PROJE_REHBERI.md](docs/PROJE_REHBERI.md). Bu sayfa sık yapılan işlerin kısa tarifidir.

## Büyük resim
- **Statik site.** GitHub Pages deponun kökünden yayınlar (`.nojekyll`). Kökteki `index.html`, `yonlendir.js` ile `#ders/m4-d3` gibi adresleri koruyarak `docs/`'a yönlendirir.
- **Derleme adımı yok.** `docs/index.html` tek bir ES modülü (`js/app.js`) yükler; gerisi `import` ile gelir.
- **VPS gerekmez.** Hesap yok, ilerleme tarayıcıda (`localStorage`, anahtar `kesit-excel-v1`), hesap istemcide. Ortak sıralama, öğretmen paneli ya da sınıf takibi istenirse o zaman sunucu (VPS) gerekir.
- **Tek çekirdek, iki kapı.** `docs/motor/` ve `docs/icerik/` hem web arayüzünde hem `mcp/server.mjs`'de kullanılır.

## Klasörler
| Yol | Ne |
|---|---|
| `docs/motor/` | Formül motoru (`formul.js` ayrıştırıcı ve değerlendirici, `islevler.js` 131 işlev, `kitap.js` çalışma kitabı ve taşma, `tarih.js`), `pivot.js`, `sorgu.js` (Power Query adımları + M), `denetci.js` (gizli varyant) |
| `docs/icerik/` | `dersler-1/2/3.js` (48 ders), `ekler.js` (roller, seviye testi, mülakat), `islev-bilgi.js`, `veri.js` (**üretilir**), `sayfalar.js` |
| `docs/js/` | Arayüz: `izgara.js` (formül çubuğu), `pivot-ui.js`, `sorgu-ui.js`, `sayfalar.js` (görünümler), `app.js` (yönlendirme), `durum.js` (ilerleme) |
| `mcp/` | Yerel MCP sunucusu |
| `tests/` | `node --test` testleri ve `vakalar.json` (LibreOffice karşılaştırma vakaları) |
| `tools/` | `veri_hazirla.py` (Kesit verisinden sayfalar), `lo_karsilastir.py` + `motor_hesapla.mjs` (LibreOffice karşılaştırması) |

## Sık yapılan işler
- **Yeni ders:** `docs/icerik/dersler-N.js`'e bir nesne ekle (id `mX-dY`), `npm test`. Test çözümün denetçiden geçtiğini, örneğin hata vermediğini ve sabit cevabın gizli denemede yakalandığını kontrol eder. Yakalanmıyorsa soruyu, cevabı veriye bağlı olacak şekilde değiştir ya da (gerçekten sabit bir sonuçsa) `varyantsiz: true` yaz.
- **Yeni işlev:** `docs/motor/islevler.js`'e `tanim('EN_AD', fn)`, `formul.js`'deki `TR_EN` tablosuna Türkçe adı, `docs/icerik/islev-bilgi.js`'e bilgi satırı, `tests/vakalar.json`'a vaka; `python3 tools/lo_karsilastir.py`.
- **Veriyi yenilemek:** `git clone https://github.com/ysfdurak/kesit-python /tmp/kp` ve `python3 tools/veri_hazirla.py /tmp/kp/data`. Seçim sabit tohumla yapılır; satırlar değişirse ders testleri hangi alıştırmanın etkilendiğini söyler.
- **Önbellek sürümü:** dosya eklenince ya da çıkarılınca `docs/sw.js` içinde `CORE` listesini ve `CACHE` adını güncelle.
