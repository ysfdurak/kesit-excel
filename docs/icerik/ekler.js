// Roller, seviye testi ve genel mülakat soruları.
export const ROLLER = [
  { id: 'analist', ad: 'Veri analisti', harf: 'VA', ozet: 'Ham veriden doğru sayıya: temizlik, koşullu özet, arama, pivot ve kontrol.', neden: 'Analist mülakatlarında Excel testi neredeyse her zaman ÇOKETOPLA, DÜŞEYARA/ÇAPRAZARA, pivot ve veri temizliği sorar.',
    dersler: ['m1-d3', 'm2-d1', 'm3-d1', 'm4-d3', 'm4-d4', 'm5-d1', 'm5-d3', 'm5-d4', 'm6-d3', 'm7-d1', 'm8-d2', 'm8-d4', 'm9-d1', 'm9-d2', 'm10-d1', 'm10-d3', 'm11-d2', 'm12-d1', 'm12-d2', 'm13-d1', 'm13-d3', 'm13-d7'] },
  { id: 'bi', ad: 'BI / raporlama', harf: 'BI', ozet: 'Power BI\'a geçmeden önce Excel\'de veri modeli düşüncesi: uzun biçim, Power Query, pivot.', neden: 'Power Query Excel ile Power BI\'da aynıdır; burada öğrenilen adımlar ve M kodu doğrudan Power BI\'a taşınır.',
    dersler: ['m1-d1', 'm2-d3', 'm4-d3', 'm5-d4', 'm7-d1', 'm8-d4', 'm9-d3', 'm10-d1', 'm10-d2', 'm10-d3', 'm10-d4', 'm11-d1', 'm11-d2', 'm11-d3', 'm11-d4', 'm12-d2', 'm13-d1', 'm13-d3', 'm13-d6', 'm13-d7'] },
  { id: 'operasyon', ad: 'Operasyon / planlama', harf: 'OP', ozet: 'Teslim süresi, iş günü, termin, kademe kuralları ve kontrol listeleri.', neden: 'Saha verisi saat damgalıdır; süre hesabı, iş günü ve tatil kuralları operasyon raporlarının temelidir.',
    dersler: ['m1-d3', 'm2-d2', 'm3-d3', 'm4-d1', 'm4-d4', 'm5-d2', 'm7-d1', 'm7-d3', 'm7-d4', 'm8-d2', 'm9-d4', 'm10-d1', 'm10-d3', 'm12-d3', 'm13-d4', 'm14-d1', 'm14-d3'] },
  { id: 'finans', ad: 'Finans / bütçe', harf: 'FN', ozet: 'Hedef-gerçekleşen, sapma, yuvarlama, kontrol toplamları ve yönetici özeti.', neden: 'Bütçe takibinde sorun formülden çok tutarlılıktadır: yuvarlama, kontrol toplamı ve kaynağa bağlı özet.',
    dersler: ['m1-d3', 'm2-d2', 'm2-d3', 'm2-d4', 'm4-d2', 'm4-d4', 'm5-d2', 'm6-d4', 'm7-d2', 'm8-d4', 'm10-d4', 'm12-d1', 'm12-d2', 'm12-d3', 'm12-d4', 'm13-d4', 'm13-d5', 'm13-d6', 'm14-d2', 'm14-d5'] },
  { id: 'bt', ad: 'BT iş analisti', harf: 'İA', ozet: 'Kullanıcı verisini anlamak: tür, temizlik, eşleştirme, kural testi ve Power Query.', neden: 'İş analisti gereksinimi veriyle doğrular; kural kontrolleri ve eşleştirme (Merge) bu işin günlük aracıdır.',
    dersler: ['m1-d1', 'm1-d4', 'm3-d4', 'm5-d3', 'm6-d2', 'm6-d3', 'm9-d1', 'm9-d2', 'm9-d4', 'm11-d1', 'm11-d2', 'm11-d4', 'm14-d1', 'm14-d6'] },
  { id: 'ofis', ad: 'Ofis / idari', harf: 'Oİ', ozet: 'Liste tutmak, saymak, toplamak, izin ve tarih hesapları, metin düzeltme.', neden: 'Günlük işin büyük kısmı doğru sayma, tarih hesabı ve listeleri düzgün tutmaktır; az formülle çok zaman kazanılır.',
    dersler: ['m1-d1', 'm1-d2', 'm1-d3', 'm2-d1', 'm2-d2', 'm3-d1', 'm4-d1', 'm4-d2', 'm6-d1', 'm6-d3', 'm7-d2', 'm7-d3', 'm9-d2', 'm10-d1', 'm13-d1', 'm13-d4', 'm14-d1'] },
];

// Seviye testi: 14 soru, her biri bir modülü yoklar. Cevap indeksi `d`.
export const SEVIYE = [
  { m: 'm1', s: 'B2\'de =A2*$C$1 var. Formül B3\'e kopyalanınca ne olur?', c: ['=A3*$C$2', '=A3*$C$1', '=A2*$C$1', '=B3*$C$1'], d: 1, a: '$C$1 mutlak olduğu için kaymaz; A2 göreli, A3 olur.' },
  { m: 'm2', s: 'A1:A5\'te 10, boş, 0, 20, "yok" var. =ORTALAMA(A1:A5) kaç verir?', c: ['6', '10', '7,5', '#DEĞER!'], d: 1, a: 'Boş ve metin atlanır, 0 sayılır: (10+0+20)/3 = 10.' },
  { m: 'm2', s: 'Hücre biçimi 2 ondalık gösteriyor ama satır toplamları alttaki toplamla tutmuyor. En olası neden?', c: ['TOPLA hatalı', 'Değerler biçimle yuvarlanmış, gerçekte daha çok ondalık var', 'Hücreler metin', 'Hesaplama elle modunda'], d: 1, a: 'Biçim yalnız görüntüyü yuvarlar; YUVARLA değeri yuvarlar.' },
  { m: 'm3', s: '=ÇOKEĞER(A1>=500;"Orta";A1>=2000;"Yüksek";DOĞRU;"Düşük") A1=3000 için ne verir?', c: ['Yüksek', 'Orta', 'Düşük', '#YOK'], d: 1, a: 'İlk doğru koşul kazanır; 3000>=500 ilk koşuldur.' },
  { m: 'm4', s: 'N1\'de 1000 var. 1000\'den büyük fiyatları sayan doğru formül hangisi?', c: ['=EĞERSAY(B:B;">N1")', '=EĞERSAY(B:B;">"&N1)', '=EĞERSAY(B:B;>N1)', '=EĞERSAY(">"&N1;B:B)'], d: 1, a: 'İşleç metin, hücre değeri & ile eklenir.' },
  { m: 'm4', s: 'ETOPLA ve ÇOKETOPLA\'da toplanacak aralık nerede yazılır?', c: ['İkisinde de başta', 'İkisinde de sonda', 'ETOPLA\'da sonda, ÇOKETOPLA\'da başta', 'ETOPLA\'da başta, ÇOKETOPLA\'da sonda'], d: 2, a: 'Sık karıştırılan fark.' },
  { m: 'm5', s: '=DÜŞEYARA(G2;Ürünler!B:E;4) neden riskli?', c: ['Sütun numarası 4 olamaz', 'Dördüncü değişken boş: yaklaşık eşleşme yapılır', 'Ürünler sayfası adı tırnak ister', 'G2 metin olamaz'], d: 1, a: 'Kod/ad aramalarında son değişken YANLIŞ olmalı.' },
  { m: 'm6', s: 'İki listede "İstanbul" ve "İstanbul " eşleşmiyor. Hangi işlev çözer?', c: ['TEMİZ', 'KIRP', 'YAZIM.DÜZENİ', 'ÖZDEŞ'], d: 1, a: 'Sondaki boşluk KIRP ile silinir.' },
  { m: 'm7', s: 'İki tarih-saat arasındaki farkı dakikaya çevirmek için fark neyle çarpılır?', c: ['60', '24', '1440', '86400'], d: 2, a: 'Bir gün 24 × 60 = 1440 dakikadır.' },
  { m: 'm8', s: '=FİLTRE(A2:C9;VE(B2:B9="Web";C2:C9>100)) neden beklenen satırları vermez?', c: ['FİLTRE iki koşul almaz', 'VE tüm diziyi tek DOĞRU/YANLIŞ\'a indirger', 'Sütun sayısı uyuşmaz', 'Koşullar tırnak ister'], d: 1, a: 'Koşulları çarpın: (B2:B9="Web")*(C2:C9>100).' },
  { m: 'm10', s: 'Pivotta Sipariş No alanı değerlere eklenince Toplam çıktı. Sipariş sayısı için ne yapılır?', c: ['Alanı satıra taşımak', 'Özeti Say yapmak', 'Yüzde göstermek', 'Tarihe göre gruplamak'], d: 1, a: 'Kimlik numaraları sayılır, toplanmaz.' },
  { m: 'm11', s: 'Power Query\'de aylar sütun başlığı olan bir hedef tablosunu kategori-ay satırlarına çeviren adım?', c: ['Grupla', 'Aşağı Doldur', 'Diğer Sütunların Özetlemesini Kaldır', 'Sorguları Birleştir'], d: 2, a: 'Unpivot geniş tabloyu uzun yapar.' },
  { m: 'm13', s: 'Yedi kategorinin toplam satışını karşılaştırmak için hangi grafik en okunurdur?', c: ['Yedi dilimli pasta', 'Büyükten küçüğe sıralı çubuk', '3B sütun', 'Radar'], d: 1, a: 'Uzunluk açıdan daha iyi karşılaştırılır; sıralı çubuk en büyüğü ve sırayı hemen gösterir.' },
  { m: 'm14', s: 'VBA\'da For r = 2 To 241 yazan bir makro gelecek ay 300 satırlık veride ne yapar?', c: ['Hata verir', 'Son 59 satırı sessizce atlar', 'Otomatik uzar', 'Hiç çalışmaz'], d: 1, a: 'Sabit son satır uyarı vermeden eksik çalışır; son = Cells(Rows.Count, 1).End(xlUp).Row kullanılır.' },
];

export const MULAKAT_GENEL = [
  { s: 'Excel\'de bir raporu devraldınız ve sayılar tutmuyor. Nereden başlarsınız?', c: 'Önce kaynağı ve satır sayısını doğrularım, sonra ana toplamları iki bağımsız yoldan (pivot ve formül) yeniden hesaplarım. Fark çıkan yerde türü (metin sayı), boşlukları (KIRP), aralık kaymasını (ETOPLA boyutu) ve $ işaretlerini kontrol ederim. Bulguları ve düzeltmeyi raporla birlikte yazarım.' },
  { s: 'DÜŞEYARA, İNDİS+KAÇINCI ve ÇAPRAZARA arasında nasıl seçim yaparsınız?', c: 'Excel 365/2021 kullanılıyorsa ÇAPRAZARA: varsayılan tam eşleşme, her yöne arama, bulunamadı metni. Dosya eski sürümlerde açılacaksa İNDİS+KAÇINCI. DÜŞEYARA\'yı yalnız var olan dosyalarda okurum; yeni işte sütun numarası bağımlılığı yüzünden tercih etmem.' },
  { s: 'Power Query ile formül arasındaki iş bölümünü nasıl yaparsınız?', c: 'Veriyi getirme, temizleme, birleştirme ve biçim değiştirme Power Query\'de; adımlar belgelenir ve yenilenir. Hesap ve iş kuralları (oran, sapma, kademe) formülde ya da pivotta. Böylece ham veri değişince temizlik tekrarlanır, kural değişince yalnız formül değişir.' },
  { s: 'Büyük bir dosya yavaşladı. Ne yaparsınız?', c: 'Tam sütun başvurularını (A:A) gerçek aralığa ya da Excel Tablosuna çeviririm, BUGÜN/ŞİMDİ/DOLAYLI gibi her değişiklikte yeniden hesaplanan işlevleri azaltırım, tekrar eden ara hesapları LET ya da yardımcı sütunla bir kez yaparım, büyük dizi formüllerini Power Query\'ye taşırım ve gereksiz koşullu biçimleri silerim.' },
  { s: 'Bir formülün ne yaptığını başkasına nasıl açıklarsınız?', c: 'Formülü parçalarına ayırıp her parçayı ayrı hücrede gösteririm (ya da LET adlarıyla), bir satırı elle hesaplayıp sonucun aynı olduğunu gösteririm, sonra iş kuralını tek cümleyle söylerim: "Bu hücre, Web\'den gelen ve iptal edilmemiş Elektronik siparişlerinin adedini toplar."' },
  { s: 'Excel\'de veri doğrulama ve hata önleme için ne kullanırsınız?', c: 'Giriş alanlarında Veri Doğrulama (liste, tarih aralığı), hesaplarda kontrol hücreleri (iki yoldan toplam, ihlal sayısı), kritik formüllerde EĞERYOKSA ile beklenen hatayı karşılamak ve koşullu biçimle göze çarpan uyarı. Hepsi raporun içinde kalır ve her güncellemede çalışır.' },
];

export const SOZLUK = [
  ['Aralık', 'İki köşe hücreyle tanımlanan dikdörtgen alan: A2:K241.'], ['Göreli başvuru', 'Kopyalanınca kayan başvuru: A2.'], ['Mutlak başvuru', 'Kopyalanınca kaymayan başvuru: $A$2.'],
  ['Karma başvuru', 'Yalnız satırı ya da sütunu sabit başvuru: A$2, $A2.'], ['Seri sayı', 'Excel\'in tarihi sakladığı gün sayısı; 1 = 1 Ocak 1900.'], ['Ölçüt', 'Koşullu işlevlerde aranan değer ya da karşılaştırma: ">1000", "E*".'],
  ['Joker', '* (herhangi bir dizi) ve ? (tek karakter); ölçütte ve aramada.'], ['Taşma', 'Bir formülün birden çok sonucu komşu hücrelere yazması (Excel 365).'], ['Dinamik dizi', 'Boyutu sonuca göre değişen ve taşan formül sonucu.'],
  ['Özet tablo (Pivot)', 'Satır, sütun, değer ve filtre alanlarıyla kurulan, yeniden düzenlenebilir özet.'], ['Power Query', 'Veriyi getirme ve dönüştürme aracı; adımları kaydeder, M dilinde saklar.'],
  ['M', 'Power Query\'nin formül dili. Her adım bir M ifadesidir.'], ['Unpivot', 'Geniş tabloyu uzun biçime çevirme (Diğer Sütunların Özetlemesini Kaldır).'], ['Kontrol toplamı', 'Aynı sayıyı iki yoldan hesaplayıp farkın 0 olduğunu gösteren hücre.'],
];
