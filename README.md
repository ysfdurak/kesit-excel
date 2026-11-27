# Kesit Excel

**Türkçe Excel, gerçek veriyle.** Tarayıcıda çalışan bir Excel ızgarası ve bu proje için yazılmış bir formül motoru üzerinde 111 ders, 250 denetlenen alıştırma; özet tablo (pivot), Power Query, grafik ve pano, VBA makro atölyeleri; veri doğrulama, özel biçim, formül denetimi, finans işlevleri, Hedef Ara, Veri Tablosu, Senaryo Yöneticisi ve Çözücü; LAMBDA ve dizi işlevleri, Gelişmiş Filtre, 3B başvuru, madde/ibre/Pareto/Gantt gibi pano grafikleri. Kurulum, hesap ve sunucu yok; girdiğiniz formüller cihazdan çıkmaz.

Canlı: **https://ysfdurak.github.io/kesit-excel/** · Kesit ailesi: [SQL](https://ysfdurak.github.io/kesit-sql/) · [Power BI](https://ysfdurak.github.io/kesit-powerbi/) · [Python](https://ysfdurak.github.io/kesit-python/) · [İstatistik](https://ysfdurak.github.io/kesit-istatistik/)

## Ne var?

- **Formül motoru** (`docs/motor/`): Excel formüllerini okur ve hesaplar, `eval` kullanmaz. 190 işlev (finans, DOLAYLI/KAYDIR/ADRES, ÖZETVERİAL, LAMBDA, MAP/BYROW/SCAN/REDUCE, GRUPLAÖLÇÜT/ÖZETÖLÇÜT, SÜTUNA/SATIRSAR, EĞİM/TAHMİN.DOĞRUSAL, SIKLIK, TOPLAMA, düzenli ifadeler (NORMİFADEAYIKLA/DEĞİŞTİR, REGEXTEST), PERCENTOF, TRIMRANGE, KÖPRÜ, FORMÜLMETNİ, ÇARPIKLIK, BASIKLIK dahil); 3B başvuru (`Ocak:Mart!B2`), taşma başvurusu (`M2#`), LAMBDA'da isteğe bağlı parametre (`[b]`, ISOMITTED); Excel Tablosu yapılandırılmış başvuruları (`Satışlar[Adet]`, `[@[Birim Fiyat]]`) ve Ad Yöneticisi adları; Türkçe ve İngilizce adlar (ETOPLA = SUMIF); `;` ve `,` yazımı; dinamik diziler ve taşma (#TAŞMA!); dizi sabitleri; Excel'in 1900 tarih sistemi; Türkçe büyük/küçük harf (i/İ, ı/I) ve Türkçe METNEÇEVİR kodları (gg.aa.yyyy, aaaa).
- **111 ders, 21 modül**: Excel'in mantığı ($ başvurular), temel hesaplar, mantık, koşullu özet, arama (DÜŞEYARA → ÇAPRAZARA), metin, tarih ve iş günü (2024–2025 resmî tatilleri), dinamik diziler, veri temizleme, özet tablo, Power Query, raporlama ve bir bütçe vakası, görselleştirme (grafik seçimi, 23 grafik türü, pivot grafik ve dilimleyici, koşullu biçim, mini grafik, kötü grafiği düzeltme, pano vakası) ve makro (kaydedici, Range ve son satır, If/Select Case, biçimlendirme, Function ve WorksheetFunction, Office Scripts ve güvenlik), kitap tasarımı (Tablo, adlar, veri doğrulama ve bağımlı liste, özel sayı biçimi, formül denetimi, koruma), senaryo ve finans (taksit ve ödeme planı, NBD ve İVO, amortisman, Hedef Ara, Veri Tablosu, Senaryo Yöneticisi, Çözücü ile ürün karması ve vardiya planı), ileri pano ve pivot (hesaplanmış alan tuzağı, ayrıntıya inme, ÖZETVERİAL, form denetimleri, dinamik grafik, veri modeline köprü), modern formüller (LAMBDA, BYROW/MAP, SCAN/REDUCE, GRUPLAÖLÇÜT/ÖZETÖLÇÜT, dizi biçimlendirme, eğim ve tahmin, mevsim endeksi, SIKLIK, TOPLAMA, düzenli ifadeler, M2# ve TRIMRANGE), veri araçları (Gelişmiş Filtre, benzersiz kayıtlar, 3B başvuru ve Birleştir, Hızlı Doldurma, özel sıralama, Alt Toplam), pano tasarımı ve özel grafikler (süreç, madde, ibre, ilerleme halkası, Pareto, Gantt, kelebek, halter, vurgu ve hedef çizgisi, Zaman Çizelgesi) ve ofis pratikleri (kısayollar ve Git > Özel, renge göre filtre, köprü ve içindekiler, birimli biçim, tanımlayıcı istatistik ve Araç Takımı, dosya şifreleme ve Belge Denetçisi, yazdırma ve PowerPoint'e bağlantılı aktarma).
- **Denetçi ve gizli varyant**: cevap hem gördüğünüz tabloda hem de satırları karıştırılmış, sayıları ve metin dağılımı değiştirilmiş, bazı satırları düşürülmüş gizli bir kopyada çözümle karşılaştırılır. Sonucu elle yazmak, yanlış hücreye bağlanmak ya da `$` unutmak yakalanır ve nedeni söylenir.
- **Izgara**: formül yazarken hücreye tıklamak başvuru ekler (Shift ile aralık), F4 `$` işaretlerini döndürür, işlev adı önerilir, imlecin olduğu işlevin söz dizimi gösterilir, başvurulan hücreler renklenir, TR ⇄ EN düğmesi formülü çevirir.
- **Özet tablo atölyesi**: satır, sütun, değer, filtre, tarih gruplama, yüzde gösterimi. Her pivot hücresine tıklayınca eşdeğer ÇOKETOPLA/ÇOKEĞERSAY formülü görünür.
- **Power Query atölyesi**: 20 adım (üst satır kaldır, başlık yükselt, kırp, tür değiştir (tr-TR), hataları kaldır, sütun böl, aşağı doldur, unpivot, birleştir, ekle, grupla, özel sütun…). Her adımın sonucu ve Power Query'nin yazacağı **M kodu** görünür.
- **Görselleştirme atölyesi** (`docs/motor/grafik.js`, `kosullu.js`): 15 Excel grafik türü (sütun, çubuk, çizgi, alan, pasta, halka, dağılım, kabarcık, birleşik, şelale, histogram, kutu, ağaç haritası, huni, radar), yığın ve %100 yığın, eksen, veri etiketi, eğilim çizgisi; renk körlüğüne göre denetlenmiş sabit palet, açık/koyu tema, tablo görünümü, araç ipucu, SVG/PNG indirme. Özet tablodan pivot grafik ve çok değerli dilimleyici. Koşullu biçimin 8 kural türü (formülle kural dahil, $ kaydırmasıyla), veri çubuğu, renk ölçeği, simge ve mini grafik. Ortak dilimleyicili, KPI kutulu, en çok 4 grafikli pano. Grafik denetçisi türü, veriyi ve yanıltıcı ayarları (kesik eksen, çok dilimli pasta, ikincil eksen) yakalar.
- **Makro atölyesi** (`docs/motor/vba.js`): VBA'nın sık kullanılan bölümünü tarayıcıda çalıştıran yorumlayıcı (Sub/Function, Dim, If, For/For Each/Do, Select Case, With, Range/Cells/Offset/End(xlUp)/CurrentRegion, Formula/FormulaLocal/FormulaR1C1, AutoFill, Sort, Font/Interior/NumberFormat, WorksheetFunction, MsgBox/InputBox, Debug.Print; banker yuvarlaması ve BGR renkler Excel'deki gibi). Makro kaydedici seçimi, yazmayı, biçimi ve doldurmayı R1C1 koda çevirir ve Excel kaydedicisi gibi adresi sabit yazar. Kod Windows-1254 `.bas` olarak indirilir; `docs/indir/kesit-excel-veri.xlsx` aynı sayfalarla gerçek Excel'de denemek içindir. Denetçi makroyu satır sayısı uzatılmış gizli bir kopyada da çalıştırır: `For r = 2 To 241` yakalanır.
- **Kitap tasarımı ve durum çözümlemesi** (`docs/motor/bicim.js`, `dogrulama.js`, `senaryo.js`): Excel'in özel sayı biçimi dili (4 bölüm, koşul, renk, ölçekleme); veri doğrulama (liste, sayı, tarih, uzunluk, özel formül, DOLAYLI ile bağımlı liste, Durdur/Uyarı/Bilgi, geçersiz verileri işaretleme); formül denetimi (etkileyenleri/etkilenenleri izle, Formülü Değerlendir adım adım); Hedef Ara (sekant + ikiye bölme), iki değişkenli Veri Tablosu, Senaryo özeti ve Çözücü (iki aşamalı Simplex LP, tamsayı için dal-sınır, doğrusallık denetimi). Özet tabloda hesaplanmış alan, ayrıntıya inme ve ÖZETVERİAL. Model sayfaları (Kredi, Yatırım, Fiyat, Üretim, Vardiya, Denetim, Kayıt) `docs/icerik/modeller.js`'te.
- **Veri araçları ve pano grafikleri** (`docs/motor/veriaraclari.js`, `grafik.js`): Birleştir (konuma ya da Sol sütun/Üst satır etiketine göre) ve Excel'in Gelişmiş Filtre kuralları (aynı satır VE, alt alta YA DA, düz metin "ile başlar", boş ölçüt satırı her kaydı geçirir); 23 grafik türü (Pareto, madde, ibre, ilerleme halkası, Gantt, kelebek, halter, güneş patlaması eklendi), en büyüğü vurgulama ve hedef çizgisi; panoda Zaman Çizelgesi (ay aralığı seçimi); formül denetiminde Gözcü Penceresi. Yeni model sayfaları: İadeler, Ocak/Şubat/Mart/Çeyrek, Görevler, Bölgeler, Vardiyalar, Talep.
- **Öğrenme yolları** (veri analisti, BI, operasyon/planlama, finans/bütçe, BT iş analisti, ofis/idari), 21 soruluk **seviye testi**, **sık hatalar**, **mülakat soruları**, **işlev rehberi** (179 işlev, motorda doğrulanmış örnekler), ilerleme yedeği, açık/koyu tema, çevrimdışı çalışma, `?lang=en` İngilizce tanıtım.
- **Kesit verileri**: Anadolu Market satışları ve ürünleri, Pusula İK personel ve izinleri, Lezzet Kurye teslimatları, bütçe, kirli bayi ve müşteri raporları (`tools/veri_hazirla.py` ortak veri setlerinden üretir).

## Doğruluk nasıl sınanıyor?

| Test | Ne yapar |
|---|---|
| `tests/motor.test.mjs` | Türkçe ve İngilizce yazımın tüm vakalarda aynı sonucu verdiği, `$` kaydırma, çeviri, taşma, döngü, bozuk formül ve sınırlar |
| `tests/dersler.test.mjs` | 111 dersin her örneği hatasız; 250 alıştırmanın çözümü denetçiden geçiyor; grafik alıştırmasının başlangıç ayarı ve boş makro geçmiyor; sabit son satırlı makro gizli kopyada yakalanıyor; elle yazılan sayısal sonuç gizli denemede yakalanıyor; ilk satır boş bir hücreye bakmıyor |
| `tests/gorsel.test.mjs` | 15 temel grafik türü sınıf ve bağımsız kipte geçerli SVG (çift öznitelik, kaçış), koşullu biçimde $ kaydırması, pano KPI süzmesi, ders örneği makrolar, R1C1 ve .bas kod sayfası |
| `tests/model.test.mjs` | Tablo ve ad başvuruları, DOLAYLI/KAYDIR/ADRES, özel biçim, doğrulama (bağımlı liste dahil), formül adımları, Hedef Ara, Veri Tablosu, Çözücü (LP 22,33 → tamsayı 23), hesaplanmış alan, ayrıntı, ÖZETVERİAL, işlev rehberi örnekleri |
| `tests/modern.test.mjs` | LAMBDA ve yardımcıları, GRUPLAÖLÇÜT/ÖZETÖLÇÜT, dizi biçimlendirme, regresyon ve SIKLIK, 3B başvuru, Gelişmiş Filtre tuzakları, yeni grafik türleri (geçerli SVG, %100+ halka), vurgu ve hedef çizgisi |
| `tests/mcp.test.mjs` | MCP sunucusunun sekiz aracı, web ile aynı sonuçlar, izinli klasör koruması |
| `tools/lo_karsilastir.py` | 203 formülü (finans, DOLAYLI, KAYDIR, ADRES, regresyon, SIKLIK, TOPLAMA dahil) LibreOffice Calc'ta hesaplayıp motorla karşılaştırır; LibreOffice 24.2'de olmayan Excel 365 işlevleri ve Türkçe Excel davranışları için 59 elle doğrulanmış vaka (LAMBDA yardımcıları, GRUPLAÖLÇÜT, düzenli ifadeler dahil) (`tests/vakalar.json`) |

```bash
npm ci --prefix mcp      # yalnız MCP testi için
npm test                 # tüm testler (motor, dersler, MCP, model, görsel, modern)
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
| `durum_cozumle` | Model sayfalarında Hedef Ara ya da Çözücü (Simplex LP, tamsayı) çalıştırır |
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

Taşan aralığa `#` ile başvuru, mühendislik işlevleri, harita grafiği (Excel'de Bing çevrimiçi hizmeti ister; Kesit çevrimdışı çalışır), TAHMİN.ETS algoritması (Tahmin Sayfası mevsim endeksiyle formülle anlatılır), Hızlı Doldurma'nın desen tahmini, kırpılmış başvuru işleci `A1:.A1000` ve Power Pivot/DAX bu sürümde yok (veri modeli dersi kavramsaldır, DAX Kesit Power BI'da). Çözücü yalnız doğrusal modelleri (Simplex LP) çözer; doğrusal olmayan modeli açıkça reddeder (Excel'de GRG). Senaryo Yöneticisi ve Veri Tablosu kitaba {=TABLO()} formülü yazmaz, sonucu panelde gösterir. Sayfa koruması ve kitaplar arası başvuru yalnız anlatılır. VBA yorumlayıcısı bir alt kümedir: Chart, PivotTable, UserForm, olaylar (Worksheet_Change), dosya ve Outlook işlemleri, sınıf modülleri yoktur ve açık bir hata verir; bunlar `.bas` ile gerçek Excel'de denenir. Grafikler Excel'in görünümünü birebir kopyalamaz, aynı türü ve kararları öğretir; dilimleyici tarih alanlarında yoktur (Excel'de Zaman Çizelgesi). Döngüsel başvuru `#DÖNGÜ`, okunamayan formül `#FORMÜL` olarak gösterilir (Excel uyarı penceresi açar). Dizi sabitlerinde Kesit her zaman `,` sütun, `;` satır ayırıcısı kullanır; gerçek Türkçe Excel'de bunlar Windows bölge ayarına bağlıdır. Ayrıntı ve gerekçeler: [docs/PROJE_REHBERI.md](docs/PROJE_REHBERI.md).

## Proje rehberi

Mimari, kararlar, kod turu, testler, mülakat soruları ve alıştırmalar: [docs/PROJE_REHBERI.md](docs/PROJE_REHBERI.md). Kısa yol haritası ve sık yapılan işler: [NASIL.md](NASIL.md).

## Lisans

- Uygulama kodu: [PolyForm Shield 1.0.0](LICENSE.md). Kişiler, okullar ve şirketler kendi işlerinde ücretsiz ve izin almadan kullanabilir; satmak ya da rakip bir ürün yapmak yazılı izin gerektirir.
- Ders içerikleri ve veri sayfaları: kodla aynı lisans, [PolyForm Shield 1.0.0](LICENSE.md) (özet: [LICENSE-ICERIK.md](LICENSE-ICERIK.md)).
- Yazı tipleri: Bricolage Grotesque, IBM Plex Sans, JetBrains Mono (SIL Open Font License; metinler `docs/vendor/fonts/` içinde).

**Kurumlar için:** Kurumunuzda kullanıyorsanız haber verirseniz sevinirim: kurulumda yardımcı olabilir, kurumunuza özel ihtiyaçları (kendi veri setiniz, kendi derslerimiz) birlikte değerlendirebiliriz. İletişim: iletisim@ysfdurak.com

**Kurum içi kurulum:** `docs/` klasörü tek başına çalışan statik bir sitedir; derleme adımı yoktur. Klasörü iç ağınızdaki herhangi bir web sunucusuna (IIS, nginx, SharePoint'te statik dosya, iç GitHub Pages) kopyalamanız yeter. Dış kaynak (CDN, yazı tipi, analitik) yüklemez, internet bağlantısı gerektirmez ve kullanıcı verisini sunucuya göndermez; ilerleme her kullanıcının tarayıcısında kalır. Kendi verinizle ders hazırlamak için `docs/icerik/` dosyalarına bakın ve `npm test` ile doğrulayın.

**English:** the app code is released under [PolyForm Shield 1.0.0](LICENSE.md): individuals, schools and companies may use, change and self-host the app and its content for free and without asking; selling them or offering a competing product needs written permission. Lesson content and datasets are under the same licence. **Organisations:** if you use it, please let us know; we can help with set-up and discuss your needs. **Self-hosting:** `docs/` is a self-contained static site with no build step and no external requests; copy it to any internal web server. Contact: contact@ysfdurak.com
