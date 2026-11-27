# Sürüm notları

## 0.6.2 (Kasım 2026): veri kitabı derslerle eşit

- **Veri kitabı (.xlsx):** 12 sayfadan 28 sayfaya; ders model sayfaları (Kredi, Yatırım, Üretim, Vardiya, Denetim, Bölgeler, Talep, Ocak/Şubat/Mart…) eklendi, başlıklı sayfalar Excel Tablosu (Satışlar[Adet] gerçek Excel'de çalışır). LibreOffice'te sonuçlar Kesit'le aynı.
- **Veri sayfası:** kitabı indirme kartı; model sayfalarında görünen "undefined" kaynak ve boş açıklama düzeltildi.

## 0.6.1 (Kasım 2026): bulmayı kolaylaştırma

- **Dersler:** arama kutusu, Temel/Orta/İleri süzgeci, katlanır modüller (ilk bitmemiş modül açık); telefonda sayfa 16.381 px'ten 4.392 px'e indi.
- **Sık hatalar ve mülakat:** arama kutusu ve sonuç sayısı. Üstteki **Ara** düğmesi işlevlerle birlikte ilgili dersleri de gösteriyor.
- **Düzeltmeler:** seviye testinde soru başlığının kart kenarına binmesi, telefonda kapalı menünün gölgesinin sol kenara sızması, masaüstünde süs şeridinin başlığa binmesi, ana sayfadaki seviye kartlarının paragraf yığınına dönmesi.

## 0.6.0 (Kasım 2026): Türkçe kurslardan ofis pratikleri

Türkçe kurumsal Excel eğitimleri (ULUSEM, ODTÜ, Yenibiriş, Boğaziçi Enstitüsü, IIENSTITU) ile karşılaştırmada eksik kalan konular.
- **Modül 21 · Ofis pratikleri, güvenlik ve paylaşım (7 ders):** kısayollar, Git > Özel ve formülle seri; renge göre filtre ve rengi üreten kuralı sayma; KÖPRÜ ile içindekiler ve FORMÜLMETNİ; not/açıklama ve birimli sayı biçimi (kg, lt, adet); tanımlayıcı istatistik ve Çözümleyici Araç Takımı; dosya şifreleme, değiştirme parolası, Belge Denetçisi; yazdırma, PDF ve PowerPoint'e bağlantılı aktarma, şerit özelleştirme.
- **Motor:** KÖPRÜ, FORMÜLMETNİ, ÇARPIKLIK, BASIKLIK, TRIMMEAN (190 işlev).
- 111 ders, 250 alıştırma; 152 test, LibreOffice 266/266.

## 0.5.0 (Kasım 2026): eksiklerin tamamlanması

0.4.0 karşılaştırmasında "yok" kalan konular.
- **Yeni dersler:** 18.8 Mevsimsellik ve mevsim endeksiyle tahmin (Tahmin Sayfası/ETS ile karşılaştırma), 18.9 Düzenli ifadeler (NORMİFADEAYIKLA, NORMİFADEDEĞİŞTİR, REGEXTEST; KVKK için e-posta maskeleme), 18.10 Taşma başvurusu `M2#`, TRIMRANGE ve PERCENTOF, 20.8 Zaman Çizelgesi ile dönem seçen pano.
- **Yeni alıştırmalar:** 18.1'de isteğe bağlı parametreli LAMBDA (`[oran]`, ISOMITTED), 19.3'te Veri > Birleştir (etiketsiz birleştirme Mart sırası yüzünden yakalanır).
- **Motor:** `M2#` taşma başvurusu, LAMBDA isteğe bağlı parametre ve ISOMITTED, REGEXTEST/NORMİFADEAYIKLA/NORMİFADEDEĞİŞTİR, PERCENTOF (GRUPLAÖLÇÜT'te iki bağımsız değişkenli özet), TRIMRANGE (185 işlev); Birleştir (`veriaraclari.js`).
- **Arayüz:** panoda Zaman Çizelgesi (ay ya da ay aralığı), formül denetiminde Gözcü Penceresi, Birleştir kutusu.
- **Bilinçli olarak yok:** harita grafiği (Excel'de Bing çevrimiçi hizmeti ister), TAHMİN.ETS algoritması, Hızlı Doldurma'nın desen tahmini, kamera aracı.
- 104 ders, 231 alıştırma; 145 test, LibreOffice 262/262.

## 0.4.0 (Kasım 2026): modern formüller, veri araçları, pano tasarımı

İleri Excel (Excel Off The Grid, Microsoft Press next-gen formulas, Udemy LAMBDA kursları) ve pano kurslarıyla (Gharani, My Online Training Hub, GoSkills, Udemy 50+ grafik, STL) ikinci karşılaştırmada çıkan eksikler.
- **Modül 18 · Modern formüller (7 ders):** LAMBDA ve adlandırılmış işlev; BYROW, BYCOL, MAP; SCAN ve REDUCE; GRUPLAÖLÇÜT ve ÖZETÖLÇÜT; SÜTUNA, SATIRSAR, GENİŞLET ve formülle özetlemeyi kaldırma; EĞİM, KORELASYON, TAHMİN.DOĞRUSAL; SIKLIK, TOPLAMA ve uçucu işlevler.
- **Modül 19 · Veri araçları (5 ders):** Gelişmiş Filtre (VE/YA DA, ile başlar, boş satır tuzağı), benzersiz kayıtlar, 3B başvuru ve Birleştir (sırası farklı Mart sayfasıyla), Hızlı Doldurma ve formül karşılığı, özel sıralama, Alt Toplam ve gruplama.
- **Modül 20 · Pano tasarımı ve özel grafikler (7 ders):** pano süreci (5 soru, taslak, yerleşim, koruma), madde grafiği ve ilerleme halkası, ibre ve ne zaman kullanılmayacağı, Pareto, Gantt/kelebek/halter, vurgu ve hedef çizgisi, vaka: formülle KPI panosu.
- **Motor:** LAMBDA (çağrı sözdizimi, Ad Yöneticisi, eta, kapanış), 28 yeni işlev (179), 3B başvuru, Gelişmiş Filtre, 8 grafik türü (24), vurgu ve hedef çizgisi, iki düzeyli kategori.
- **MCP:** `alistirma_denetle` Gelişmiş Filtre alır; grafik seçeneklerinde vurgu ve hedef çizgisi.
- 100 ders, 218 alıştırma, 20 soruluk seviye testi; 136 test, LibreOffice 255/255.

## 0.3.0 (Kasım 2026): kitap tasarımı, senaryo ve finans, ileri pano

Muadil müfredatlarla (Microsoft MO-211, Macquarie/Coursera Advanced, Gharani pano kursu, Maven Power Pivot) karşılaştırmada çıkan eksikler.
- **Modül 15 · Kitap tasarımı ve denetim (7 ders):** Excel Tablosu ve yapılandırılmış başvuru, adlandırılmış aralıklar, veri doğrulama (liste, sayı, tarih, özel, bağımlı liste), özel sayı biçimi, formül denetimi (izle, değerlendir), koruma ve hesaplama seçenekleri.
- **Modül 16 · Senaryo ve finans (7 ders):** DEVRESEL_ÖDEME, BD, GD, TAKSİT_SAYISI, FAİZ_ORANI; ödeme planı (FAİZTUTARI, ANA_PARA_ÖDEMESİ); NBD, İÇ_VERİM_ORANI, amortisman; Hedef Ara; Veri Tablosu ve Senaryo Yöneticisi; Çözücü ile ürün karması; vaka: haftalık vardiya planı (tamsayı).
- **Modül 17 · İleri pano ve pivot (6 ders):** hesaplanmış alan ve tuzağı, ayrıntıya inme ve ÖZETVERİAL, form denetimleri, dinamik grafik aralığı (FİLTRE, KAYDIR), dinamik başlık ve ilk N, veri modeline köprü.
- **Motor:** Tablo ve ad başvuruları; DOLAYLI, KAYDIR, ADRES, ÖZETVERİAL ve 16 finans işlevi (151 işlev); özel biçim, doğrulama, formül denetimi, Hedef Ara, Veri Tablosu, Senaryo, Çözücü (Simplex LP + dal-sınır), hesaplanmış alan, ayrıntı.
- **Arayüz:** ızgarada formül denetimi düğmeleri, doğrulama listesi ve geçersiz veri halkası; özet tabloda hesaplanmış alan ve çift tıkla ayrıntı; derslerde form denetimleri ve grafik önizleme.
- **MCP:** `durum_cozumle` aracı; `alistirma_denetle` yeni türleri kabul eder.
- 81 ders, 170 alıştırma, 17 soruluk seviye testi; 108 test, LibreOffice 219/219.

## 0.2.0 (Kasım 2026): görselleştirme ve makro

- **Modül 13 · Görselleştirme (7 ders):** soruya göre grafik seçimi; 15 grafik türü (sütun, çubuk, çizgi, alan, pasta, halka, dağılım, kabarcık, birleşik, şelale, histogram, kutu, ağaç haritası, huni, radar); pivot grafik ve dilimleyici; koşullu biçim (formülle kural dahil); veri çubuğu, renk ölçeği, simge ve mini grafik; kötü grafiği düzeltme; dilimleyicili pano vakası.
- **Modül 14 · Makro (6 ders):** kaydedici ve VBA düzenleyicisi, Range/Cells ve son satır, If ve Select Case, biçimlendirme, Function ve WorksheetFunction, Office Scripts, Power Automate ve makro güvenliği.
- **Görselleştirme atölyesi:** Grafik, Pivot grafik, Koşullu biçim ve Pano sekmeleri; tablo görünümü, araç ipucu, SVG/PNG indirme, açık/koyu tema.
- **Makro atölyesi:** tarayıcıda çalışan VBA yorumlayıcısı, makro kaydedici (R1C1), biçim araç çubuğu, `.bas` indirme (Windows-1254) ve gerçek Excel için veri kitabı (`docs/indir/kesit-excel-veri.xlsx`).
- **Denetçi:** grafik, pivot grafik, koşullu biçim, pano, makro ve çoktan seçmeli alıştırmalar. Makro gizli kopyası veriyi uzatır; sabit son satır yakalanır.
- **MCP:** `grafik_ciz` ve `makro_calistir` araçları; `alistirma_denetle` yeni türleri kabul eder.
- 61 ders, 124 alıştırma, 14 soruluk seviye testi; 79 test, LibreOffice 177/177.

## 0.1.0 (Kasım 2026)

İlk sürüm.

- Formül motoru: 131 işlev, Türkçe ve İngilizce yazım, dinamik diziler ve taşma, dizi sabitleri, 1900 tarih sistemi, Türkçe METNEÇEVİR. LibreOffice Calc ile 146 formül + 31 elle doğrulanmış vaka karşılaştırması.
- 12 modül, 48 ders, 99 alıştırma; gizli varyantlı denetçi (sonucu elle yazmak, eksik/gereksiz `$`, yanlış başvuru yakalanır).
- Özet tablo atölyesi (eşdeğer formül), Power Query atölyesi (20 adım, M kodu).
- Öğrenme yolları (6 rol), seviye testi, sık hatalar, mülakat soruları, işlev rehberi, ilerleme yedeği, koyu tema, çevrimdışı çalışma, `?lang=en` tanıtım.
- Yerel stdio MCP sunucusu: `formul_hesapla`, `formul_cevir`, `islev_bilgisi`, `alistirma_getir`, `alistirma_denetle`.
