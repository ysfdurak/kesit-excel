# Kesit Excel

**Türkçe Excel, gerçek veriyle.** Tarayıcıda çalışan bir Excel ızgarası ve bu proje için yazılmış bir formül motoru üzerinde 61 ders, 124 denetlenen alıştırma; özet tablo (pivot), Power Query, grafik ve pano, VBA makro atölyeleri. Kurulum, hesap ve sunucu yok; girdiğiniz formüller cihazdan çıkmaz.

Canlı: **https://ysfdurak.github.io/kesit-excel/** · Kesit ailesi: [SQL](https://ysfdurak.github.io/kesit-sql/) · [Power BI](https://ysfdurak.github.io/kesit-powerbi/) · [Python](https://ysfdurak.github.io/kesit-python/) · [İstatistik](https://ysfdurak.github.io/kesit-istatistik/)

## Ne var?

- **Formül motoru** (`docs/motor/`): Excel formüllerini okur ve hesaplar, `eval` kullanmaz. 131 işlev; Türkçe ve İngilizce adlar (ETOPLA = SUMIF); `;` ve `,` yazımı; dinamik diziler ve taşma (#TAŞMA!); dizi sabitleri; Excel'in 1900 tarih sistemi; Türkçe büyük/küçük harf (i/İ, ı/I) ve Türkçe METNEÇEVİR kodları (gg.aa.yyyy, aaaa).
- **61 ders, 14 modül**: Excel'in mantığı ($ başvurular), temel hesaplar, mantık, koşullu özet, arama (DÜŞEYARA → ÇAPRAZARA), metin, tarih ve iş günü (2024–2025 resmî tatilleri), dinamik diziler, veri temizleme, özet tablo, Power Query, raporlama ve bir bütçe vakası, görselleştirme (grafik seçimi, 15 grafik türü, pivot grafik ve dilimleyici, koşullu biçim, mini grafik, kötü grafiği düzeltme, pano vakası) ve makro (kaydedici, Range ve son satır, If/Select Case, biçimlendirme, Function ve WorksheetFunction, Office Scripts ve güvenlik).
- **Denetçi ve gizli varyant**: cevap hem gördüğünüz tabloda hem de satırları karıştırılmış, sayıları ve metin dağılımı değiştirilmiş, bazı satırları düşürülmüş gizli bir kopyada çözümle karşılaştırılır. Sonucu elle yazmak, yanlış hücreye bağlanmak ya da `$` unutmak yakalanır ve nedeni söylenir.
- **Izgara**: formül yazarken hücreye tıklamak başvuru ekler (Shift ile aralık), F4 `$` işaretlerini döndürür, işlev adı önerilir, imlecin olduğu işlevin söz dizimi gösterilir, başvurulan hücreler renklenir, TR ⇄ EN düğmesi formülü çevirir.
- **Özet tablo atölyesi**: satır, sütun, değer, filtre, tarih gruplama, yüzde gösterimi. Her pivot hücresine tıklayınca eşdeğer ÇOKETOPLA/ÇOKEĞERSAY formülü görünür.
- **Power Query atölyesi**: 20 adım (üst satır kaldır, başlık yükselt, kırp, tür değiştir (tr-TR), hataları kaldır, sütun böl, aşağı doldur, unpivot, birleştir, ekle, grupla, özel sütun…). Her adımın sonucu ve Power Query'nin yazacağı **M kodu** görünür.
- **Görselleştirme atölyesi** (`docs/motor/grafik.js`, `kosullu.js`): 15 Excel grafik türü (sütun, çubuk, çizgi, alan, pasta, halka, dağılım, kabarcık, birleşik, şelale, histogram, kutu, ağaç haritası, huni, radar), yığın ve %100 yığın, eksen, veri etiketi, eğilim çizgisi; renk körlüğüne göre denetlenmiş sabit palet, açık/koyu tema, tablo görünümü, araç ipucu, SVG/PNG indirme. Özet tablodan pivot grafik ve çok değerli dilimleyici. Koşullu biçimin 8 kural türü (formülle kural dahil, $ kaydırmasıyla), veri çubuğu, renk ölçeği, simge ve mini grafik. Ortak dilimleyicili, KPI kutulu, en çok 4 grafikli pano. Grafik denetçisi türü, veriyi ve yanıltıcı ayarları (kesik eksen, çok dilimli pasta, ikincil eksen) yakalar.
- **Makro atölyesi** (`docs/motor/vba.js`): VBA'nın sık kullanılan bölümünü tarayıcıda çalıştıran yorumlayıcı (Sub/Function, Dim, If, For/For Each/Do, Select Case, With, Range/Cells/Offset/End(xlUp)/CurrentRegion, Formula/FormulaLocal/FormulaR1C1, AutoFill, Sort, Font/Interior/NumberFormat, WorksheetFunction, MsgBox/InputBox, Debug.Print; banker yuvarlaması ve BGR renkler Excel'deki gibi). Makro kaydedici seçimi, yazmayı, biçimi ve doldurmayı R1C1 koda çevirir ve Excel kaydedicisi gibi adresi sabit yazar. Kod Windows-1254 `.bas` olarak indirilir; `docs/indir/kesit-excel-veri.xlsx` aynı sayfalarla gerçek Excel'de denemek içindir. Denetçi makroyu satır sayısı uzatılmış gizli bir kopyada da çalıştırır: `For r = 2 To 241` yakalanır.
- **Öğrenme yolları** (veri analisti, BI, operasyon/planlama, finans/bütçe, BT iş analisti, ofis/idari), 14 soruluk **seviye testi**, **sık hatalar**, **mülakat soruları**, **işlev rehberi** (131 işlev, motorda doğrulanmış örnekler), ilerleme yedeği, açık/koyu tema, çevrimdışı çalışma, `?lang=en` İngilizce tanıtım.
- **Kesit verileri**: Anadolu Market satışları ve ürünleri, Pusula İK personel ve izinleri, Lezzet Kurye teslimatları, bütçe, kirli bayi ve müşteri raporları (`tools/veri_hazirla.py` ortak veri setlerinden üretir).

## Doğruluk nasıl sınanıyor?

| Test | Ne yapar |
|---|---|
| `tests/motor.test.mjs` | Türkçe ve İngilizce yazımın tüm vakalarda aynı sonucu verdiği, `$` kaydırma, çeviri, taşma, döngü, bozuk formül ve sınırlar |
| `tests/dersler.test.mjs` | 61 dersin her örneği hatasız; 124 alıştırmanın çözümü denetçiden geçiyor; grafik alıştırmasının başlangıç ayarı ve boş makro geçmiyor; sabit son satırlı makro gizli kopyada yakalanıyor; elle yazılan sayısal sonuç gizli denemede yakalanıyor; ilk satır boş bir hücreye bakmıyor |
| `tests/gorsel.test.mjs` | 15 grafik türü sınıf ve bağımsız kipte geçerli SVG (çift öznitelik, kaçış), koşullu biçimde $ kaydırması, pano KPI süzmesi, ders örneği makrolar, R1C1 ve .bas kod sayfası |
| `tests/mcp.test.mjs` | MCP sunucusunun yedi aracı, web ile aynı sonuçlar, izinli klasör koruması |
| `tools/lo_karsilastir.py` | 146 formülü LibreOffice Calc'ta hesaplayıp motorla karşılaştırır; LibreOffice 24.2'de olmayan Excel 365 işlevleri ve Türkçe Excel davranışları için 31 elle doğrulanmış vaka (`tests/vakalar.json`) |

```bash
npm ci --prefix mcp      # yalnız MCP testi için
npm test                 # motor + dersler + MCP
python3 tools/lo_karsilastir.py   # LibreOffice ve openpyxl gerekir
```

## Yerelde çalıştırma

Statik bir sitedir. ES modülleri `file://` üzerinden açılmaz; küçük bir sunucu yeter:

```bash
python3 -m http.server 8090 --directory docs
# http://localhost:8090
```

## MCP sunucusu (Claude Desktop ve diğer MCP istemcileri)

Aynı motor ve dersler yerel bir stdio MCP sunucusu olarak da çalışır (`mcp/server.mjs`). Ağa çıkmaz, dosya yazmaz; yalnız verdiğiniz izinli klasördeki CSV dosyalarını okuyabilir.

| Araç | Ne yapar |
|---|---|
| `formul_hesapla` | Formülü Kesit sayfalarına ya da sizin verinize (satırlar ya da CSV) karşı hesaplar; taşan sonucun ilk 50 satırı, hata açıklaması |
| `formul_cevir` | Türkçe ↔ İngilizce formül çevirisi (ad, ayırıcı, ondalık, DOĞRU/YANLIŞ) |
| `islev_bilgisi` | İşlevin Türkçe/İngilizce adı, söz dizimi, örneği ve geçtiği dersler |
| `alistirma_getir` | Dersten alıştırma (çözüm istenirse) ya da role göre ders sırası |
| `alistirma_denetle` | Formül, pivot, Power Query adımları, grafik ayarı, koşullu biçim kuralları, pano, VBA kodu ya da çoktan seçmeli cevabı denetler |
| `grafik_ciz` | Bir aralıktan ya da özet tablodan 15 türden grafiği bağımsız SVG olarak çizer |
| `makro_calistir` | VBA kodunu hazır sayfaların yalıtılmış kopyasında çalıştırır; MsgBox çıktısı, hata satırı ve istenen aralığın değerleri |

```bash
cd mcp && npm ci
```

`claude_desktop_config.json`:

```json
{ "mcpServers": { "kesit-excel": { "command": "node", "args": ["/tam/yol/kesit-excel/mcp/server.mjs", "/Users/siz/Belgeler/excel"] } } }
```

Ayrıntı: [docs/MCP.md](docs/MCP.md).

## Bilinen sınırlar

Taşan aralığa `#` ile başvuru, adlandırılmış aralıklar, Excel Tablosu başvuruları (`Tablo1[Adet]`), DOLAYLI/KAYDIR, finans ve mühendislik işlevleri ve Power Pivot/DAX bu sürümde yok. VBA yorumlayıcısı bir alt kümedir: Chart, PivotTable, UserForm, olaylar (Worksheet_Change), dosya ve Outlook işlemleri, sınıf modülleri yoktur ve açık bir hata verir; bunlar `.bas` ile gerçek Excel'de denenir. Grafikler Excel'in görünümünü birebir kopyalamaz, aynı türü ve kararları öğretir; dilimleyici tarih alanlarında yoktur (Excel'de Zaman Çizelgesi). Döngüsel başvuru `#DÖNGÜ`, okunamayan formül `#FORMÜL` olarak gösterilir (Excel uyarı penceresi açar). Dizi sabitlerinde Kesit her zaman `,` sütun, `;` satır ayırıcısı kullanır; gerçek Türkçe Excel'de bunlar Windows bölge ayarına bağlıdır. Ayrıntı ve gerekçeler: [docs/PROJE_REHBERI.md](docs/PROJE_REHBERI.md).

## Proje rehberi

Mimari, kararlar, kod turu, testler, mülakat soruları ve alıştırmalar: [docs/PROJE_REHBERI.md](docs/PROJE_REHBERI.md). Kısa yol haritası ve sık yapılan işler: [NASIL.md](NASIL.md).

## Lisans

- Uygulama kodu: [PolyForm Shield 1.0.0](LICENSE.md). Kişiler, okullar ve şirketler kendi işlerinde ücretsiz ve izin almadan kullanabilir; satmak ya da rakip bir ürün yapmak yazılı izin gerektirir.
- Ders içerikleri ve veri sayfaları: kodla aynı lisans, [PolyForm Shield 1.0.0](LICENSE.md) (özet: [LICENSE-ICERIK.md](LICENSE-ICERIK.md)).
- Yazı tipleri: Bricolage Grotesque, IBM Plex Sans, JetBrains Mono (SIL Open Font License; metinler `docs/vendor/fonts/` içinde).

**Kurumlar için:** Kurumunuzda kullanıyorsanız haber verirseniz sevinirim: kurulumda yardımcı olabilir, kurumunuza özel ihtiyaçları (kendi veri setiniz, kendi derslerimiz) birlikte değerlendirebiliriz. İletişim: iletisim@ysfdurak.com

**Kurum içi kurulum:** `docs/` klasörü tek başına çalışan statik bir sitedir; derleme adımı yoktur. Klasörü iç ağınızdaki herhangi bir web sunucusuna (IIS, nginx, SharePoint'te statik dosya, iç GitHub Pages) kopyalamanız yeter. Dış kaynak (CDN, yazı tipi, analitik) yüklemez, internet bağlantısı gerektirmez ve kullanıcı verisini sunucuya göndermez; ilerleme her kullanıcının tarayıcısında kalır. Kendi verinizle ders hazırlamak için `docs/icerik/` dosyalarına bakın ve `npm test` ile doğrulayın.

**English:** the app code is released under [PolyForm Shield 1.0.0](LICENSE.md): individuals, schools and companies may use, change and self-host the app and its content for free and without asking; selling them or offering a competing product needs written permission. Lesson content and datasets are under the same licence. **Organisations:** if you use it, please let us know; we can help with set-up and discuss your needs. **Self-hosting:** `docs/` is a self-contained static site with no build step and no external requests; copy it to any internal web server. Contact: contact@ysfdurak.com
