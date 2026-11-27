# Sürüm notları

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
