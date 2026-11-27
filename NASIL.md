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
| `docs/motor/` | Formül motoru (`formul.js` ayrıştırıcı ve değerlendirici, `islevler.js` 185 işlev, `kitap.js` çalışma kitabı ve taşma, `tarih.js`), `pivot.js`, `sorgu.js` (Power Query adımları + M), `denetci.js` (gizli varyant), `grafik.js` (15 grafik türü, SVG, grafik denetimi), `kosullu.js` (koşullu biçim ve mini grafik), `vba.js` (VBA yorumlayıcısı, R1C1, .bas), `bicim.js` (özel sayı biçimi), `dogrulama.js` (veri doğrulama, formül denetimi), `senaryo.js` (Hedef Ara, Veri Tablosu, Senaryo, Çözücü), `veriaraclari.js` (Gelişmiş Filtre, Birleştir) |
| `docs/icerik/` | `dersler-1/2/3/4/5/6.js` (104 ders; 4: görselleştirme ve makro, 5: kitap tasarımı, senaryo ve finans, ileri pano, 6: modern formüller, veri araçları, pano tasarımı), `modeller.js` (Kredi, Üretim, Vardiya… model sayfaları, formüller Türkçe), `ekler.js` (roller, seviye testi, mülakat), `islev-bilgi.js`, `veri.js` (**üretilir**), `sayfalar.js` |
| `docs/js/` | Arayüz: `izgara.js` (formül çubuğu), `pivot-ui.js` (dilimleyici ve pivot grafik), `sorgu-ui.js`, `grafik-ui.js` (grafik alanı, ipucu, SVG/PNG), `kosullu-ui.js`, `pano-ui.js`, `makro-ui.js` (düzenleyici, kaydedici, .bas), `model-ui.js` (Veri Doğrulama, Özel Biçim, Hedef Ara, Veri Tablosu, Senaryo, Çözücü kutuları), `sayfalar.js` (görünümler), `app.js` (yönlendirme), `durum.js` (ilerleme) |
| `mcp/` | Yerel MCP sunucusu |
| `tests/` | `node --test` testleri ve `vakalar.json` (LibreOffice karşılaştırma vakaları) |
| `tools/` | `veri_hazirla.py` (Kesit verisinden sayfalar), `lo_karsilastir.py` + `motor_hesapla.mjs` (LibreOffice karşılaştırması), `kitap_olustur.py` (gerçek Excel için `docs/indir/kesit-excel-veri.xlsx`) |

## Sık yapılan işler
- **Yeni ders:** `docs/icerik/dersler-N.js`'e bir nesne ekle (id `mX-dY`), `npm test`. Test çözümün denetçiden geçtiğini, örneğin hata vermediğini ve sabit cevabın gizli denemede yakalandığını kontrol eder. Yakalanmıyorsa soruyu, cevabı veriye bağlı olacak şekilde değiştir ya da (gerçekten sabit bir sonuçsa) `varyantsiz: true` yaz.
- **Yeni işlev:** `docs/motor/islevler.js`'e `tanim('EN_AD', fn)`, `formul.js`'deki `TR_EN` tablosuna Türkçe adı, `docs/icerik/islev-bilgi.js`'e bilgi satırı, `tests/vakalar.json`'a vaka; `python3 tools/lo_karsilastir.py`.
- **Veriyi yenilemek:** `git clone https://github.com/ysfdurak/kesit-python /tmp/kp` ve `python3 tools/veri_hazirla.py /tmp/kp/data`. Seçim sabit tohumla yapılır; satırlar değişirse ders testleri hangi alıştırmanın etkilendiğini söyler.
- **Önbellek sürümü:** dosya eklenince ya da çıkarılınca `docs/sw.js` içinde `CORE` listesini ve `CACHE` adını güncelle.
- **Yeni grafik/koşullu biçim/makro alıştırması:** `tur: 'grafik' | 'pivotGrafik' | 'kosullu' | 'pano' | 'makro' | 'secmeli'`. Grafikte `cozum: { kaynak, secenek }` ve `kural` (izinli türler, yığın, sıfırdan başlama…); başlangıç ayarı (`kaynak`, `secenek`) çözüm olmamalı, test bunu yakalar. Makroda `cozum` VBA kodu, `okunan` aralık, gerekirse `stilKontrol`, `ciktiKontrol`; sabit son satırlı bir `yanlis` sürüm ekleyin, test gizli kopyada yakalandığını doğrular.
- **Veri kitabı:** sayfalar değişince `python3 tools/kitap_olustur.py` (`.xlsx` yeniden üretilir).
- **Durum çözümlemesi alıştırması:** `tur: 'hedefAra' | 'veriTablosu' | 'cozucu'` ve `cozum` (aynı biçimde model). Çözücü alıştırmasında çözüm modeli LP gevşetmesiyle aynı sonucu veriyorsa tamsayı kısıtı öğretilemez; test bunu yakalar, katsayıları değiştirin.
- **Model sayfası (ham) formül alıştırması:** gizli kopya yoktur; sabit sonucu yakalamak için `durumlar: [{}, { B3: 1200000 }]` ile girdileri değiştirin. Test, sabit sonucun bir durumda yakalandığını doğrular.
- **Gelişmiş Filtre alıştırması:** `tur: 'gelismisFiltre'`, `bolge` (öğrencinin yazabileceği ölçüt alanı, ör. `M1:O4`), `cozum: { liste, olcut, benzersiz, hucreler }`. Test ölçütsüz ve boş satırlı ölçüt alanının geçmediğini doğrular.
- **Adlandırılmış LAMBDA alıştırması:** `tur: 'ad'`, `cozum.tanim` `=LAMBDA(…)` ve `lambdaDeneme: [[100, 60], …]` (denetçi iki LAMBDA'yı bu bağımsız değişkenlerle çağırıp karşılaştırır).
- **Başka sayfalardan beslenen alıştırma** (3B başvuru gibi): `varyantSayfalar: ['Ocak', 'Şubat', 'Mart']` gizli denemede o sayfaları da karıştırır; böylece ham bir hedef sayfada da elle yazılan sonuç yakalanır.
- **Yeni grafik türü:** `motor/grafik.js` → `TURLER`'e kayıt (ad, aile, ne), çizim işlevi, `grafikCizHam`'daki `switch`'e bir satır; `tests/modern.test.mjs`'teki tür listesine bir örnek veri. Halka ve yaylar için `yay()` kullanın; tam tur iki yarım yay olarak çizilmeli.
- **Birleştir alıştırması:** `tur: 'birlestir'`, `cozum: { kaynaklar: ['Ocak!A1:C8', …], islev: 'TOPLA', solSutun, ustSatir }`. Test etiketsiz birleştirmenin geçmediğini doğrular (kaynak sayfalarda sıra farklı olmalı).
- **Pano Zaman Çizelgesi:** pano nesnesinde `zaman: { alan: 'Tarih', bas: 202401, son: 202403 }`; kuralda `zaman: 'Tarih'`.
