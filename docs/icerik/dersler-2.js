// Modül 5–8: arama, metin, tarih ve saat, dinamik diziler.
// Personel (A Sicil, B Ad Soyad, C Cinsiyet, D Doğum Yılı, E Şehir, F Eğitim, G İşe Giriş, H Çıkış, I Çıkış Türü, J Çalışma Şekli, K Kaynak; 2–161)
// İzinler (A İzin No, B Sicil, C İzin Türü, D Başlangıç, E Gün; 2–201)  Tatiller (A Tarih, B Gün, C Süre; 2–35)
// Teslimat (A Sipariş, B Restoran, C Mutfak, D Kurye, E Araç, F Sipariş Anı, G Alınma, H Teslim, I Durum, J Ödeme, K Teslimat Ücreti, L Bahşiş; 2–181)
const KADEME = { N1: 'Alt sınır', O1: 'Segment', N2: 0, O2: 'Ekonomik', N3: 500, O3: 'Orta', N4: 2000, O4: 'Premium' };
const PRIM = { N1: 'Adet ≥', O1: 'Prim oranı', N2: 1, O2: 0, N3: 3, O3: 0.02, N4: 5, O4: 0.05, N5: 8, O5: 0.08 };

export const DERSLER_2 = [
  // ---------------------------------------------------------------- M5 Arama
  {
    id: 'm5-d1', modul: 'm5', baslik: 'DÜŞEYARA ile tam eşleşme', sure: 11,
    ozet: 'Satış satırındaki ürünün maliyeti Ürünler sayfasında. DÜŞEYARA ürünü bulur, aynı satırdan maliyeti getirir.',
    hedefler: ['DÜŞEYARA\'nın dört bağımsız değişkenini kurmak', 'Tam eşleşme için YANLIŞ/0 yazmak', 'Arama tablosunu $ ile sabitlemek'],
    anlatim: [
      '**=DÜŞEYARA(aranan; tablo; sütun_no; aralık_bak)**. Excel tablonun **ilk sütununda** arananı bulur ve aynı satırdan sütun_no\'daki değeri getirir. Satışlar\'da G2 ürün adı; Ürünler sayfasında B sütunu ad, E sütunu maliyet. Tablo B:E olduğu için maliyet 4. sütundur: =DÜŞEYARA(G2;Ürünler!$B$2:$E$41;4;YANLIŞ).',
      'Dördüncü bağımsız değişken önemlidir. **YANLIŞ (0) tam eşleşme** ister; bulamazsa #YOK verir. Boş bırakılırsa ya da DOĞRU yazılırsa Excel yaklaşık eşleşme yapar ve sırasız bir listede yanlış satırı sessizce getirir. Ad, kod, sicil gibi aramalarda her zaman YANLIŞ yazın.',
      'Tablo aralığını **$ ile sabitleyin**; formülü aşağı kopyalayınca kaymamalı. Sütun numarası sabit bir sayıdır; tabloya sütun eklenirse yanlış sütunu getirir. Bu, ÇAPRAZARA\'ya geçmenin en iyi gerekçesidir.',
      'DÜŞEYARA ilk eşleşmede durur ve **yalnız sağa bakar**: aranan sütun tablonun en solunda olmalıdır. Ürün adından ürün numarasını (A sütunu, adın solunda) getiremez.',
    ],
    ornek: { sayfa: 'Satışlar', hucre: 'L2', formul: '=DÜŞEYARA(G2;Ürünler!$B$2:$E$41;4;YANLIŞ)', aciklama: 'Satırdaki ürünün birim maliyeti.' },
    alistirmalar: [
      { id: 'a1', soru: 'L sütununa her satırdaki ürünün birim maliyetini Ürünler sayfasından getirin. L2:L241.', sayfa: 'Satışlar', hedef: 'L2:L241', cozum: '=DÜŞEYARA(G2;Ürünler!$B$2:$E$41;4;YANLIŞ)', gerekli: ['VLOOKUP'], ipuclari: ['Arama tablosu Ürünler!B2:E41; maliyet bu tablonun 4. sütunu.', 'Son bağımsız değişken YANLIŞ.'] },
      { id: 'a2', soru: 'L sütununa satırın brüt kârını yazın: Adet × (Birim Fiyat − Maliyet). Maliyeti DÜŞEYARA ile alın. L2:L241.', sayfa: 'Satışlar', hedef: 'L2:L241', cozum: '=H2*(I2-DÜŞEYARA(G2;Ürünler!$B$2:$E$41;4;YANLIŞ))', ipuclari: ['Önce maliyeti getiren DÜŞEYARA\'yı yazın, sonra onu formülün içine koyun.'] },
    ],
    sikHata: { yanlis: '=DÜŞEYARA(G2;Ürünler!B2:E41;4)', dogru: '=DÜŞEYARA(G2;Ürünler!$B$2:$E$41;4;YANLIŞ)', neden: 'Dördüncü değişken boşsa yaklaşık eşleşme yapılır; sırasız listede yanlış ürünün maliyeti gelir. $ olmadan tablo aşağı kayar.' },
    mulakat: { soru: 'DÜŞEYARA\'nın sınırları nelerdir?', cevap: 'Yalnız sağa bakar (aranan sütun en solda olmalı), sütun numarası sabit olduğu için tabloya sütun eklenince bozulur, ilk eşleşmede durur, varsayılanı yaklaşık eşleşmedir. ÇAPRAZARA ya da İNDİS+KAÇINCI bu sorunları çözer.' },
  },
  {
    id: 'm5-d2', modul: 'm5', baslik: 'Kademe tablosu: yaklaşık eşleşme', sure: 10,
    ozet: 'Prim oranı, kargo bandı, vergi dilimi: aralıklı kurallar bir tabloya konur, DÜŞEYARA DOĞRU ile doğru satırı bulur.',
    hedefler: ['Alt sınır tablosu kurmak', 'Yaklaşık eşleşmenin "aranandan küçük en büyük değer" kuralını bilmek', 'İç içe EĞER yerine tablo kullanmanın faydasını görmek'],
    anlatim: [
      'Kademeli kural her zaman bir tabloya yazılabilir: ilk sütunda **alt sınır**, yanında sonuç. N1:O4\'te 0 Ekonomik, 500 Orta, 2000 Premium var. Fiyatı 750 olan ürün "Orta"dır, çünkü 750\'den küçük ya da eşit en büyük alt sınır 500\'dür.',
      'DÜŞEYARA\'da son değişken **DOĞRU** olunca tam olarak bu yapılır: =DÜŞEYARA(I2;$N$2:$O$4;2;DOĞRU). Tek şart, ilk sütunun **küçükten büyüğe sıralı** olmasıdır. Sırasız tabloda sonuç yanlış olur ve hata vermez.',
      'En küçük alt sınır 0 olmalıdır; aranan değer ilk sınırdan küçükse #YOK döner.',
      'Kazanç: kural değişince formüle değil tabloya dokunursunuz. İnsan kaynakları prim dilimini değiştirdiğinde 240 satırlık formülü yeniden yazmak yerine bir hücreyi güncellersiniz ve kural sayfada herkesin okuyabileceği biçimde durur.',
    ],
    ornek: { sayfa: 'Satışlar', hucre: 'L2', formul: '=DÜŞEYARA(I2;$N$2:$O$4;2;DOĞRU)', aciklama: 'Fiyat segmenti tablodan gelir.', hazirlik: KADEME },
    alistirmalar: [
      { id: 'a1', soru: 'N1:O4\'te fiyat segmenti tablosu var. L sütununa her satırın segmentini yaklaşık eşleşmeyle getirin. L2:L241.', sayfa: 'Satışlar', hedef: 'L2:L241', cozum: '=DÜŞEYARA(I2;$N$2:$O$4;2;DOĞRU)', hazirlik: KADEME, ipuclari: ['Aranan: birim fiyat (I2).', 'Son değişken DOĞRU (yaklaşık).'] },
      { id: 'a2', soru: 'N1:O5\'te adete göre prim oranı tablosu var (1 adet %0, 3+ %2, 5+ %5, 8+ %8). L sütununa satırın prim tutarını yazın: Adet × Birim Fiyat × prim oranı. L2:L241.', sayfa: 'Satışlar', hedef: 'L2:L241', cozum: '=H2*I2*DÜŞEYARA(H2;$N$2:$O$5;2;DOĞRU)', hazirlik: PRIM, ipuclari: ['Oranı DÜŞEYARA(H2; tablo; 2; DOĞRU) getirir.'] },
    ],
    sikHata: { yanlis: 'Alt sınırları büyükten küçüğe sıralamak', dogru: 'İlk sütun küçükten büyüğe sıralı', neden: 'Yaklaşık eşleşme sıralı liste varsayar; sırasız tabloda yanlış dilim gelir, hata vermez.' },
    mulakat: { soru: 'Yaklaşık eşleşmeli DÜŞEYARA tam olarak neyi bulur?', cevap: 'Aranan değerden küçük ya da ona eşit olan en büyük değeri. Bu yüzden ilk sütun alt sınır olarak, küçükten büyüğe sıralı yazılır ve en alt sınır 0 (ya da olası en küçük değer) olur.' },
  },
  {
    id: 'm5-d3', modul: 'm5', baslik: 'İNDİS ve KAÇINCI: her yöne arama', sure: 11,
    ozet: 'KAÇINCI satırı bulur, İNDİS o satırdan istediğiniz sütunu getirir. Sola bakabilir, sütun eklenince bozulmaz.',
    hedefler: ['KAÇINCI ile konum bulmak', 'İNDİS ile konumdan değer almak', 'İkisini birleştirip sola ve iki yönlü arama yapmak'],
    anlatim: [
      '**KAÇINCI(aranan; liste; 0)** arananın listede kaçıncı sırada olduğunu verir: =KAÇINCI("Akıllı Saat";Ürünler!B2:B41;0) → 2. Son değişken 0 tam eşleşmedir.',
      '**İNDİS(aralık; satır_no; [sütun_no])** o konumdaki değeri verir: =İNDİS(Ürünler!A2:A41;2) → 2. satırdaki ürün numarası.',
      'İkisi birlikte DÜŞEYARA\'nın yerini tutar ve **sola bakabilir**: ürün adından (B) ürün numarasını (A) getirmek: =İNDİS(Ürünler!$A$2:$A$41;KAÇINCI(G2;Ürünler!$B$2:$B$41;0)). Getirilen sütunu doğrudan seçtiğiniz için araya sütun eklenince formül bozulmaz.',
      '**İki yönlü arama**: sütun numarasını da KAÇINCI ile başlıktan bulursunuz: =İNDİS(Ürünler!$A$2:$F$41;KAÇINCI(G2;Ürünler!$B$2:$B$41;0);KAÇINCI("Stok";Ürünler!$A$1:$F$1;0)). "Stok" yerine bir hücre koyarsanız kullanıcı hangi bilgiyi istediğini seçer.',
    ],
    ornek: { sayfa: 'Satışlar', hucre: 'L2', formul: '=İNDİS(Ürünler!$A$2:$A$41;KAÇINCI(G2;Ürünler!$B$2:$B$41;0))', aciklama: 'Ürün adından, adın solundaki ürün numarası.' },
    alistirmalar: [
      { id: 'a1', soru: 'L sütununa her satırdaki ürünün ürün numarasını (Ürünler!A) İNDİS ve KAÇINCI ile getirin. L2:L241.', sayfa: 'Satışlar', hedef: 'L2:L241', cozum: '=İNDİS(Ürünler!$A$2:$A$41;KAÇINCI(G2;Ürünler!$B$2:$B$41;0))', gerekli: ['INDEX', 'MATCH'], ipuclari: ['KAÇINCI ürünün Ürünler!B2:B41\'deki sırasını verir.', 'İNDİS o sıradaki ürün numarasını Ürünler!A2:A41\'den alır.'] },
      { id: 'a2', soru: 'N1\'de bir bilgi adı yazılı ("Stok"). L sütununa her satırdaki ürün için Ürünler sayfasındaki o bilgiyi getirin; N1 "Maliyet" olunca formül maliyeti getirmeli. L2:L241.', sayfa: 'Satışlar', hedef: 'L2:L241', cozum: '=İNDİS(Ürünler!$A$2:$F$41;KAÇINCI(G2;Ürünler!$B$2:$B$41;0);KAÇINCI($N$1;Ürünler!$A$1:$F$1;0))', hazirlik: { N1: 'Stok', M1: 'Bilgi' }, ipuclari: ['Satırı ürün adından, sütunu N1\'deki başlıktan KAÇINCI ile bulun.', 'Başlık satırı Ürünler!A1:F1.'] },
    ],
    sikHata: { yanlis: '=KAÇINCI(G2;Ürünler!B2:B41)', dogru: '=KAÇINCI(G2;Ürünler!$B$2:$B$41;0)', neden: 'Üçüncü değişken yazılmazsa 1 (yaklaşık) sayılır; sırasız listede yanlış konum gelir.' },
    mulakat: { soru: 'İNDİS+KAÇINCI\'yı DÜŞEYARA\'ya neden tercih edersiniz?', cevap: 'Sola bakabilir, getirilen sütun numara değil aralık olarak verildiği için sütun eklemeye dayanıklıdır, satır ve sütunu birlikte aratarak iki yönlü arama yapar ve büyük tablolarda yalnız iki sütunla çalıştığı için hızlıdır. Excel 365\'te aynı faydaları ÇAPRAZARA daha kısa yazımla verir.' },
  },
  {
    id: 'm5-d4', modul: 'm5', baslik: 'ÇAPRAZARA: modern arama', sure: 11,
    ozet: 'Aranan sütun, getirilen sütun, bulunamazsa ne yazılacağı. Tam eşleşme varsayılandır; sondan arayabilir.',
    hedefler: ['ÇAPRAZARA\'nın zorunlu üç değişkenini kurmak', 'Bulunamadı metnini yazmak', 'Son eşleşmeyi bulmak için arama modunu -1 yapmak'],
    anlatim: [
      '**=ÇAPRAZARA(aranan; aranan_dizi; döndürülen_dizi; [bulunamıyorsa]; [eşleştirme_modu]; [arama_modu])**. Ürünün stokunu getirmek: =ÇAPRAZARA(G2;Ürünler!$B$2:$B$41;Ürünler!$F$2:$F$41). Sütun numarası yoktur; getirilen sütunu doğrudan seçersiniz.',
      'Varsayılan **tam eşleşmedir**. Bulamazsa ne yazacağını dördüncü değişkenle söylersiniz: "Katalogda yok". EĞERHATA\'ya gerek kalmaz ve gerçek hatalar gizlenmez.',
      '**Arama modu -1** listeyi sondan başa tarar: bir müşterinin **son** siparişini bulmak için. Satışlar tarih sırasında olduğu için =ÇAPRAZARA(N1;C2:C241;B2:B241;"sipariş yok";0;-1) N1\'deki müşterinin en son sipariş tarihini verir.',
      'Eşleştirme modu 2 joker kullanır ("\\*Krem\\*"), -1 ve 1 ise "küçük/büyük en yakın" eşleşmedir; kademe tablosunu sıralamadan arar.',
      'ÇAPRAZARA Excel 2021 ve 365\'te vardır. Dosya eski sürüm kullanan biriyle paylaşılacaksa İNDİS+KAÇINCI daha güvenlidir.',
    ],
    ornek: { sayfa: 'Satışlar', hucre: 'L2', formul: '=ÇAPRAZARA(G2;Ürünler!$B$2:$B$41;Ürünler!$F$2:$F$41;"Katalogda yok")', aciklama: 'Ürünün güncel stoku; katalogda yoksa açıklama.' },
    alistirmalar: [
      { id: 'a1', soru: 'L sütununa her satırdaki ürünün stokunu ÇAPRAZARA ile getirin; bulunamazsa "Katalogda yok" yazsın. L2:L241.', sayfa: 'Satışlar', hedef: 'L2:L241', cozum: '=ÇAPRAZARA(G2;Ürünler!$B$2:$B$41;Ürünler!$F$2:$F$41;"Katalogda yok")', gerekli: ['XLOOKUP'], ipuclari: ['Aranan dizi: Ürünler!B2:B41, döndürülen: Ürünler!F2:F41.'] },
      { id: 'a2', soru: 'N1\'de bir müşteri adı var. M2\'ye bu müşterinin en son sipariş tarihini yazın; hiç siparişi yoksa "sipariş yok".', sayfa: 'Satışlar', hedef: 'M2', cozum: '=ÇAPRAZARA(N1;C2:C241;B2:B241;"sipariş yok";0;-1)', bicim: 'gg.aa.yyyy', hazirlik: { N1: 'Ayşe Yıldız', M1: 'Müşteri' }, gerekli: ['XLOOKUP'], ipuclari: ['Tablo tarih sırasında; son sipariş listede en alttadır.', 'Arama modu -1 sondan başa tarar.'] },
    ],
    sikHata: { yanlis: '=ÇAPRAZARA(G2;Ürünler!B2:B41;Ürünler!F2:F40)', dogru: 'Aranan ve döndürülen diziler aynı satırlardan, aynı boyda', neden: 'Diziler farklı boydaysa #DEĞER! verir; satır kaydırılmışsa yanlış değer getirir.' },
    mulakat: { soru: 'Bir müşterinin ilk ve son siparişini nasıl bulursunuz?', cevap: 'Liste tarih sıralıysa ÇAPRAZARA\'yı arama modu 1 ile ilk, -1 ile son eşleşme için kullanırım. Liste sırasızsa ÇOKEĞERMİN ve ÇOKEĞERMAK ile en küçük ve en büyük tarihi alırım; bu sıraya bağlı değildir ve daha güvenlidir.' },
  },

  // ---------------------------------------------------------------- M6 Metin
  {
    id: 'm6-d1', modul: 'm6', baslik: 'SOLDAN, SAĞDAN, PARÇAAL, UZUNLUK', sure: 8,
    ozet: 'Kod üretmek, sabit uzunluklu alanları ayırmak, kontrol haneleri çıkarmak: metinden parça almak.',
    hedefler: ['Baştan, sondan ve ortadan karakter almak', 'Parçaları & ile yeni bir kod hâline getirmek', 'UZUNLUK ile veri kalitesini kontrol etmek'],
    anlatim: [
      '**SOLDAN(metin; n)** baştan, **SAĞDAN(metin; n)** sondan n karakter alır. **PARÇAAL(metin; başlangıç; n)** başlangıç konumundan itibaren n karakter alır.',
      'Sayıya da uygulanabilirler; sonuç metin olur: =SOLDAN(2024;2) "20" verir. Sonucu sayı olarak kullanacaksanız SAYIYAÇEVİR ile sarın.',
      'Bir sipariş kodu üretelim: kategorinin ilk üç harfi, tire ve sipariş numarası: =BÜYÜKHARF(SOLDAN(F2;3))&"-"&A2 → "SPO-176". Türkçe Excel BÜYÜKHARF\'te i → İ yapar; İngilizce Excel\'de aynı formül farklı sonuç verebilir.',
      '**UZUNLUK** karakter sayısını verir, boşluklar dahil. Telefon ya da TCKN gibi sabit uzunluklu alanlarda =UZUNLUK(A2)<>11 bir kalite kontrolüdür.',
    ],
    ornek: { sayfa: 'Satışlar', hucre: 'L2', formul: '=BÜYÜKHARF(SOLDAN(F2;3))&"-"&A2', aciklama: 'Kategori kısaltması ve sipariş numarasından kod.' },
    alistirmalar: [
      { id: 'a1', soru: 'L sütununa sipariş kodu yazın: kategorinin ilk 3 harfi büyük harfle, tire, sipariş numarası (ör. SPO-176). L2:L241.', sayfa: 'Satışlar', hedef: 'L2:L241', cozum: '=BÜYÜKHARF(SOLDAN(F2;3))&"-"&A2', ipuclari: ['SOLDAN(F2;3) ilk üç harf.', 'BÜYÜKHARF ile sarın, & ile birleştirin.'] },
      { id: 'a2', soru: 'Etiket yazıcısı 15 karakterden uzun ürün adlarını kesiyor. M2\'ye adı 15 karakterden uzun olan satır sayısını yazın.', sayfa: 'Satışlar', hedef: 'M2', cozum: '=TOPLA((UZUNLUK(G2:G241)>15)*1)', ipuclari: ['UZUNLUK(G2:G241) her satır için bir uzunluk verir (Excel 365).', '>15 karşılaştırması DOĞRU/YANLIŞ üretir; *1 ile 1/0 yapıp TOPLA ile sayın.'] },
    ],
    sikHata: { yanlis: '=SOLDAN(A2;4)+1 ile sayı beklemek', dogru: '=SAYIYAÇEVİR(SOLDAN(A2;4))+1', neden: 'Metin işlevleri her zaman metin döndürür. Excel çoğu zaman otomatik çevirir ama karşılaştırmalarda ("2024"=2024 YANLIŞ) çevirmez.' },
    mulakat: { soru: 'SOLDAN bir sayıya uygulanırsa ne olur?', cevap: 'Sayı önce görünen biçiminden bağımsız olarak metne çevrilir (15.03.2025 tarihi 45731 olarak), sonra karakterler alınır; sonuç metindir. Tarihten yıl almak için SOLDAN değil YIL kullanılır.' },
  },
  {
    id: 'm6-d2', modul: 'm6', baslik: 'BUL ve MBUL: konuma göre ayırmak', sure: 10,
    ozet: 'Ad ile soyadı ayırmak için boşluğun yerini bulmak gerekir. BUL konumu verir, SOLDAN ve PARÇAAL keser.',
    hedefler: ['BUL ile bir karakterin konumunu bulmak', 'SOLDAN + BUL ile ilk parçayı almak', 'PARÇAAL + BUL ile geri kalanı almak'],
    anlatim: [
      '**BUL(aranan; metin)** arananın metindeki ilk konumunu verir: =BUL(" ";"Ayşe Yıldız") → 5. Bulamazsa #DEĞER! verir. **MBUL** aynı işi harfe duyarsız yapar ve joker kabul eder.',
      'Ad: boşluğa kadar olan kısım, yani boşluğun bir eksiği kadar karakter: **=SOLDAN(C2;BUL(" ";C2)-1)**.',
      'Soyad: boşluktan sonraki her şey. PARÇAAL\'a başlangıç olarak boşluğun bir fazlasını, uzunluk olarak yeterince büyük bir sayı verin: **=PARÇAAL(C2;BUL(" ";C2)+1;100)**. Metinden uzun bir n vermek sorun değildir.',
      'Excel 365\'te **ÖNCEKİMETİN** ve **SONRAKİMETİN** aynı işi tek işlevle yapar: =ÖNCEKİMETİN(C2;" "). İki adlı kişilerde ("Ali Rıza Kaya") soyadı için son boşluktan sonrasını almak gerekir: =SONRAKİMETİN(C2;" ";-1).',
    ],
    ornek: { sayfa: 'Satışlar', hucre: 'L2', formul: '=SOLDAN(C2;BUL(" ";C2)-1)', aciklama: 'Müşterinin adı: ilk boşluğa kadar.' },
    alistirmalar: [
      { id: 'a1', soru: 'L sütununa müşterinin adını (ilk boşluktan önceki kısım) yazın. L2:L241.', sayfa: 'Satışlar', hedef: 'L2:L241', cozum: '=SOLDAN(C2;BUL(" ";C2)-1)', ipuclari: ['Boşluğun konumu BUL(" ";C2).', 'Ad uzunluğu bu konumun bir eksiği.'] },
      { id: 'a2', soru: 'L sütununa müşterinin soyadını (ilk boşluktan sonraki kısım) yazın. L2:L241.', sayfa: 'Satışlar', hedef: 'L2:L241', cozum: '=PARÇAAL(C2;BUL(" ";C2)+1;100)', ipuclari: ['Başlangıç: boşluğun bir sonrası.', 'Uzunluk olarak 100 gibi büyük bir sayı verin.'] },
    ],
    sikHata: { yanlis: '=SOLDAN(C2;BUL(" ";C2))', dogru: '=SOLDAN(C2;BUL(" ";C2)-1)', neden: 'BUL boşluğun konumunu verir; -1 yazılmazsa adın sonunda boşluk kalır ve sonraki eşleştirmeler tutmaz.' },
    mulakat: { soru: 'Ad Soyad sütununu ayırırken neyi kontrol edersiniz?', cevap: 'Çift boşluk ve baş/son boşluk (önce KIRP), boşluk içermeyen satırlar (BUL #DEĞER! verir; EĞERHATA ile yakalanır) ve birden çok adı olan kişiler (soyad için son boşluk). Sonra örnek satırlarda elle kontrol ederim; formül tüm satırlarda "çalışıyor" görünse de iki adlı kişileri yanlış bölmüş olabilir.' },
  },
  {
    id: 'm6-d3', modul: 'm6', baslik: 'KIRP, YERİNEKOY, büyük/küçük harf', sure: 10,
    ozet: 'Dışarıdan gelen metin kirlidir: fazladan boşluk, karışık harf, yanlış ayırıcı. Eşleştirmeden önce temizlenir.',
    hedefler: ['KIRP ile görünmeyen boşlukları silmek', 'YAZIM.DÜZENİ, BÜYÜKHARF, KÜÇÜKHARF ile yazımı tek tipe getirmek', 'YERİNEKOY ile karakter değiştirmek'],
    anlatim: [
      'Bayi raporunda şehirler " istanbul ", "ANKARA", "izmir  " diye gelmiş. Gözle aynı görünen iki değer, sondaki bir boşluk yüzünden DÜŞEYARA\'da eşleşmez ve özet tabloda iki ayrı satır olur.',
      '**KIRP** baştaki ve sondaki boşlukları siler, aradaki birden çok boşluğu teke indirir. **YAZIM.DÜZENİ** her sözcüğün ilk harfini büyütür. İkisi birlikte: =YAZIM.DÜZENİ(KIRP(B4)) → "İstanbul". Türkçe Excel i/İ ve ı/I harflerini doğru çevirir.',
      'E-posta adresleri her zaman küçük harfle karşılaştırılmalıdır: =KÜÇÜKHARF(KIRP(C2)). "Ayse.Yilmaz@Gmail.com" ile "ayse.yilmaz@gmail.com" aynı kişidir.',
      '**YERİNEKOY(metin; eski; yeni)** bir parçayı değiştirir. Noktalı sayı metnini düzeltmek için: =YERİNEKOY("1.250,50";".";"") → "1250,50". Web\'den kopyalanan veride görünmeyen bölünmez boşluk (DAMGA(160)) KIRP\'a direnir; =YERİNEKOY(A2;DAMGA(160);" ") ile önce sıradan boşluğa çevirin.',
    ],
    ornek: { sayfa: 'Bayi', hucre: 'F3', formul: '=YAZIM.DÜZENİ(KIRP(B3))', aciklama: 'Şehir adını boşluksuz ve tek yazımla verir.' },
    alistirmalar: [
      { id: 'a1', soru: 'Bayi sayfasında 1. satır rapor başlığı, 2. satır sütun adları; veri 3. satırdan başlıyor. F3:F13\'e şehir adının temiz hâlini yazın: boşluklar kırpılmış, her sözcüğün ilk harfi büyük.', sayfa: 'Bayi', hedef: 'F3:F13', cozum: '=YAZIM.DÜZENİ(KIRP(B3))', ipuclari: ['Önce KIRP, sonra YAZIM.DÜZENİ.', 'Boş satırda sonuç boş metin olur; sorun değil.'] },
      { id: 'a2', soru: 'Müşteri ham sayfasında 1. satır sütun adları, e-postalar C2:C7\'de. E2:E7\'ye küçük harfli ve boşluksuz hâlini yazın.', sayfa: 'Müşteri ham', hedef: 'E2:E7', cozum: '=KÜÇÜKHARF(KIRP(C2))', ipuclari: ['KÜÇÜKHARF(KIRP(…)).'] },
    ],
    sikHata: { yanlis: 'Eşleşmeyen aramayı DÜŞEYARA\'nın hatası sanmak', dogru: 'İki tarafı da KIRP ile temizleyip yeniden aramak', neden: '#YOK\'un en yaygın nedeni görünmeyen bir boşluktur; =UZUNLUK(A2) ile görünen harf sayısını karşılaştırın.' },
    mulakat: { soru: 'İki listede gözle aynı görünen değerler eşleşmiyor. Hangi sırayla kontrol edersiniz?', cevap: 'Önce UZUNLUK ile görünmeyen karakter var mı bakarım (boşluk, bölünmez boşluk DAMGA(160), satır sonu). Sonra tür farkına (sayı/metin: ESAYIYSA) ve harf farkına (Türkçe i/İ, ı/I) bakarım. KIRP, YERİNEKOY ve TEMİZ ile iki tarafı aynı biçime getirip yeniden eşleştiririm; tekrar eden iş ise Power Query\'ye taşırım.' },
  },
  {
    id: 'm6-d4', modul: 'm6', baslik: 'METNEÇEVİR ve cümle kurmak', sure: 9,
    ozet: 'Sayıyı ve tarihi biçimli metne çevirip açıklama cümlesi kurmak. Rapor başlıkları ve e-posta metinleri için.',
    hedefler: ['METNEÇEVİR ile tarih ve sayı biçimlemek', 'Türkçe biçim kodlarını (gg, aa, yyyy, aaaa, gggg) kullanmak', 'Değerlerden okunur bir cümle kurmak'],
    anlatim: [
      'Bir tarihi & ile metne eklerseniz seri sayısı görünür: ="Sipariş: "&B2 → "Sipariş: 45292". **METNEÇEVİR(değer; biçim)** sayıyı istediğiniz biçimde metne çevirir: =METNEÇEVİR(B2;"gg.aa.yyyy") → "01.01.2024".',
      'Türkçe Excel\'de biçim kodları Türkçedir: **gg** gün, **aa** ay, **yyyy** yıl, **aaaa** ay adı (Ocak), **gggg** gün adı (Pazartesi), **ss:dd** saat ve dakika. Sayılar için **#.##0,00** binlik noktalı ve iki ondalık.',
      'Bu kodlar formül çevirisinde değişmez, çünkü metindir. Türkçe Excel\'de "gg.aa.yyyy" yazılmış bir dosya İngilizce Excel\'de açılınca yanlış görünür (orada "dd.mm.yyyy" gerekir). Dosya iki dilde kullanılacaksa biçimi METNEÇEVİR yerine hücre biçimiyle vermek daha güvenlidir.',
      'Açıklama cümlesi: =C2&", "&METNEÇEVİR(B2;"gg aaaa yyyy")&" tarihinde "&H2&" adet "&G2&" aldı." Yönetici özeti, e-posta gövdesi ya da etiket metni üretmenin hızlı yoludur.',
    ],
    ornek: { sayfa: 'Satışlar', hucre: 'L2', formul: '=C2&", "&METNEÇEVİR(B2;"gg aaaa yyyy")&" tarihinde "&H2&" adet "&G2&" aldı."', aciklama: 'Değerlerden okunur cümle.' },
    alistirmalar: [
      { id: 'a1', soru: 'L sütununa siparişin ay ve yılını "Ocak 2024" biçiminde yazın. L2:L241.', sayfa: 'Satışlar', hedef: 'L2:L241', cozum: '=METNEÇEVİR(B2;"aaaa yyyy")', gerekli: ['TEXT'], ipuclari: ['Ay adı kodu aaaa, yıl yyyy.'] },
      { id: 'a2', soru: 'L sütununa satır tutarını (Adet × Birim Fiyat) binlik ayırıcılı, iki ondalıklı ve sonuna " TL" eklenmiş metin olarak yazın (ör. "1.377,00 TL"). L2:L241.', sayfa: 'Satışlar', hedef: 'L2:L241', cozum: '=METNEÇEVİR(H2*I2;"#.##0,00")&" TL"', ipuclari: ['Biçim kodu "#.##0,00".', 'Sonra &" TL".'] },
    ],
    sikHata: { yanlis: '="Tarih: "&B2', dogru: '="Tarih: "&METNEÇEVİR(B2;"gg.aa.yyyy")', neden: 'Tarih bir sayıdır; biçimsiz birleştirilince seri sayısı (45292) görünür.' },
    mulakat: { soru: 'METNEÇEVİR ile biçimlenen bir tutarı sonra toplayabilir misiniz?', cevap: 'Doğrudan hayır, sonuç metindir; TOPLA onu atlar. Biçimli metin yalnız gösterim için üretilir, hesaplar her zaman sayısal kaynak sütundan yapılır. Gösterimi değiştirmek için hücre biçimi daha iyi bir yoldur, çünkü değer sayı olarak kalır.' },
  },

  // ---------------------------------------------------------------- M7 Tarih ve saat
  {
    id: 'm7-d1', modul: 'm7', baslik: 'YIL, AY, GÜN ve TARİH', sure: 9,
    ozet: 'Tarihi parçalarına ayırmak ve parçalardan tarih kurmak. Ay başı, çeyrek ve yıl özetlerinin temeli.',
    hedefler: ['YIL, AY, GÜN ile tarihi parçalamak', 'TARİH ile ay başı gibi tarihler üretmek', 'Çeyrek numarasını hesaplamak'],
    anlatim: [
      '**YIL(tarih)**, **AY(tarih)**, **GÜN(tarih)** sayı verir: AY(B2) Ocak için 1. Bunlarla bir yardımcı sütun kurup ETOPLA ile aylık özet yapabilirsiniz.',
      '**TARİH(yıl; ay; gün)** parçalardan tarih üretir. Her siparişin ay başı: **=TARİH(YIL(B2);AY(B2);1)**. Bu sütun "aynı aya ait tüm satırlar" için tek bir anahtar sağlar; pivot ve grafiklerde ay adı metninden daha iyidir, çünkü doğru sıralanır.',
      'TARİH taşmayı kendisi düzeltir: TARİH(2024;14;1) Şubat 2025, TARİH(2024;3;0) Şubat\'ın son günüdür. Bu sayede "bir sonraki ay" için ayın kaç gün çektiğini düşünmezsiniz.',
      'Çeyrek: **=YUKARIYUVARLA(AY(B2)/3;0)**. Ocak–Mart 1, Nisan–Haziran 2. Metin istenirse ="Ç"&YUKARIYUVARLA(AY(B2)/3;0).',
    ],
    ornek: { sayfa: 'Satışlar', hucre: 'L2', formul: '=TARİH(YIL(B2);AY(B2);1)', bicim: 'gg.aa.yyyy', aciklama: 'Siparişin ait olduğu ayın ilk günü.' },
    alistirmalar: [
      { id: 'a1', soru: 'L sütununa her siparişin ait olduğu ayın ilk gününü yazın. L2:L241.', sayfa: 'Satışlar', hedef: 'L2:L241', cozum: '=TARİH(YIL(B2);AY(B2);1)', bicim: 'gg.aa.yyyy', gerekli: ['DATE'], ipuclari: ['YIL ve AY\'ı tarihten alın, gün olarak 1 verin.'] },
      { id: 'a2', soru: 'L sütununa siparişin çeyreğini "Ç1", "Ç2" biçiminde yazın. L2:L241.', sayfa: 'Satışlar', hedef: 'L2:L241', cozum: '="Ç"&YUKARIYUVARLA(AY(B2)/3;0)', ipuclari: ['Çeyrek = ay ÷ 3, yukarı yuvarlanmış.'] },
    ],
    sikHata: { yanlis: '=METNEÇEVİR(B2;"aaaa") ile aylık gruplamak', dogru: '=TARİH(YIL(B2);AY(B2);1)', neden: 'Ay adı metni alfabetik sıralanır (Ağustos, Aralık, Ekim…) ve farklı yılların aynı ayları birleşir.' },
    mulakat: { soru: 'Aylık özet için yardımcı sütunu neden ay başı tarihi olarak kurarsınız?', cevap: 'Tarih olduğu için kronolojik sıralanır, yılı da içerir (Ocak 2024 ile Ocak 2025 ayrı kalır), pivot ve grafiklerde tarih ekseni olarak çalışır ve gösterimi hücre biçimiyle "Oca 24" yapılabilir. Ay adı metni bunların hiçbirini sağlamaz.' },
  },
  {
    id: 'm7-d2', modul: 'm7', baslik: 'SERİTARİH, SERİAY ve ETARİHLİ: süreler', sure: 10,
    ozet: 'Deneme süresi bitişi, kıdem yılı, ay sonu ödeme günü: ay ve yıl bazlı tarih hesapları.',
    hedefler: ['SERİTARİH ile n ay sonrasını bulmak', 'SERİAY ile ay sonunu bulmak', 'ETARİHLİ ile tam yıl ve ay farkı almak'],
    anlatim: [
      '**SERİTARİH(başlangıç; ay)** n ay sonrasını verir ve ay sonunu korur: 31 Ocak + 1 ay = 29 Şubat (artık yılda). İşe girişten 2 aylık deneme süresinin bitişi: =SERİTARİH(G2;2).',
      '**SERİAY(başlangıç; ay)** n ay sonrasının **son gününü** verir. Maaşın ödendiği ay sonu: =SERİAY(G2;0); bir sonraki ayın sonu =SERİAY(G2;1).',
      '**ETARİHLİ(başlangıç; bitiş; birim)** iki tarih arasındaki tam süreyi verir: "Y" tam yıl, "M" tam ay, "D" gün, "YM" yıldan arta kalan ay. 31.12.2024 itibarıyla kıdem: =ETARİHLİ(G2;TARİH(2024;12;31);"Y"). İşlev Excel\'in işlev listesinde görünmez ama tüm sürümlerde çalışır.',
      'Gün farkını 365\'e bölmek kıdem için yanlıştır: artık yıllar yüzünden doğum gününden bir gün önce yaş bir fazla çıkabilir. Tam yıl gerekiyorsa ETARİHLİ kullanın.',
      'Rapor tarihini BUGÜN() ile vermek her gün değişen sonuç üretir. Alıştırmalarda ve resmî raporlarda sabit bir kesim tarihi kullanın ve onu bir hücreye yazın.',
    ],
    ornek: { sayfa: 'Personel', hucre: 'L2', formul: '=ETARİHLİ(G2;TARİH(2024;12;31);"Y")', aciklama: '31.12.2024 itibarıyla tam yıl kıdem.' },
    alistirmalar: [
      { id: 'a1', soru: 'Personel sayfasında L sütununa 31.12.2024 itibarıyla tam yıl kıdemi yazın. L2:L161.', sayfa: 'Personel', hedef: 'L2:L161', cozum: '=ETARİHLİ(G2;TARİH(2024;12;31);"Y")', gerekli: ['DATEDIF'], ipuclari: ['Birim "Y" tam yıl.'] },
      { id: 'a2', soru: 'Personel sayfasında L sütununa 2 aylık deneme süresinin bitiş tarihini yazın (işe girişten 2 ay sonra). L2:L161.', sayfa: 'Personel', hedef: 'L2:L161', cozum: '=SERİTARİH(G2;2)', bicim: 'gg.aa.yyyy', gerekli: ['EDATE'], ipuclari: ['SERİTARİH(başlangıç; ay sayısı).'] },
    ],
    sikHata: { yanlis: '=(TARİH(2024;12;31)-G2)/365 ile kıdem yılı', dogru: '=ETARİHLİ(G2;TARİH(2024;12;31);"Y")', neden: 'Artık yıllar yüzünden bölme yıldönümüne yakın tarihlerde bir yıl fazla ya da eksik sayar; ayrıca ondalık çıkar.' },
    mulakat: { soru: '31 Ocak\'a 1 ay eklemenin doğru sonucu nedir? Excel nasıl hesaplar?', cevap: 'SERİTARİH ay sonunu korur: 28 ya da 29 Şubat. Tarihe 30 gün eklemek ise 1 ya da 2 Mart verir. Fatura vadesi, abonelik yenileme gibi ay bazlı kurallarda SERİTARİH kullanılır; gün bazlı vadelerde (30 gün) toplama.' },
  },
  {
    id: 'm7-d3', modul: 'm7', baslik: 'İş günü ve resmî tatiller', sure: 11,
    ozet: 'İzin dönüş tarihi, termin, teslim süresi: hafta sonları ve resmî tatiller düşülerek hesaplanır.',
    hedefler: ['İŞGÜNÜ ile n iş günü sonrasını bulmak', 'TAMİŞGÜNÜ ile iki tarih arasındaki iş gününü saymak', 'Tatil listesini ve farklı hafta sonu düzenini (.ULUSL) kullanmak'],
    anlatim: [
      '**İŞGÜNÜ(başlangıç; gün; [tatiller])** başlangıçtan n iş günü sonrasını verir; Cumartesi, Pazar ve listedeki tatiller sayılmaz. **TAMİŞGÜNÜ(başlangıç; bitiş; [tatiller])** iki tarih arasındaki iş günlerini **iki uç dahil** sayar.',
      'Tatiller sayfasında 2024 ve 2025 resmî tatilleri var. Formülde aralığı verin ve $ ile sabitleyin: Tatiller!$A$2:$A$35. Liste olmadan bayram haftası iş günü sayılır ve izin dönüşü yanlış çıkar.',
      'Arifeler yarım gündür (öğleden sonra tatil). İŞGÜNÜ yarım günü bilemez: listedeki her tarihi tam gün tatil sayar. Bu derste aralık arifeleri de kapsıyor, yani arife tam gün düşülüyor. Şirketiniz arifede öğlene kadar çalışıyorsa bu, terminleri yarım gün ileri kaydırır; o zaman yalnız Süre = 1 olan satırları ayrı bir sütunda toplayıp onu aralık olarak verin. Hangi kuralı uyguladığınızı rapora yazın.',
      'Altı gün çalışan depo ya da mağaza için **İŞGÜNÜ.ULUSL** hafta sonunu seçtirir: 11 yalnız Pazar, "0000001" de yalnız Pazar (Pazartesi\'den başlayan yedi hane, 1 = tatil).',
      'İzin dönüşü: izin D2\'de başlar ve E2 iş günü sürerse kişi =İŞGÜNÜ(D2;E2;Tatiller!$A$2:$A$35) tarihinde işbaşı yapar.',
    ],
    ornek: { sayfa: 'İzinler', hucre: 'F2', formul: '=İŞGÜNÜ(D2;E2;Tatiller!$A$2:$A$35)', bicim: 'gg.aa.yyyy', aciklama: 'İzinden dönüş tarihi; hafta sonu ve resmî tatiller düşülür.' },
    alistirmalar: [
      { id: 'a1', soru: 'İzinler sayfasında F sütununa işbaşı tarihini yazın: başlangıçtan Gün kadar iş günü sonrası, resmî tatiller (Tatiller!A2:A35) düşülerek. F2:F201.', sayfa: 'İzinler', hedef: 'F2:F201', cozum: '=İŞGÜNÜ(D2;E2;Tatiller!$A$2:$A$35)', bicim: 'gg.aa.yyyy', gerekli: ['WORKDAY'], ipuclari: ['İŞGÜNÜ(başlangıç; gün; tatiller).', 'Tatil aralığını $ ile sabitleyin.'] },
      { id: 'a2', soru: 'Teslimat sayfasında M2\'ye 1–31 Ekim 2024 arasındaki iş günü sayısını resmî tatilleri düşerek yazın.', sayfa: 'Teslimat', hedef: 'M2', cozum: '=TAMİŞGÜNÜ(TARİH(2024;10;1);TARİH(2024;10;31);Tatiller!$A$2:$A$35)', gerekli: ['NETWORKDAYS'], varyantsiz: true, ipuclari: ['TAMİŞGÜNÜ iki ucu da sayar.', '28 ve 29 Ekim listede.'] },
    ],
    sikHata: { yanlis: '=D2+E2 ile izin bitişi', dogru: '=İŞGÜNÜ(D2;E2;Tatiller!$A$2:$A$35)', neden: 'Takvim günü eklemek hafta sonlarını ve bayramları iş günü sayar.' },
    mulakat: { soru: 'Altı gün çalışan bir depoda teslim terminini nasıl hesaplarsınız?', cevap: 'İŞGÜNÜ.ULUSL ile hafta sonu kodu 11 (yalnız Pazar) ya da "0000001" verir, resmî tatil listesini ekler ve arifelerin kuralını (yarım gün çalışılıyor mu) açıkça belirtirim. Tatil listesi ayrı bir sayfada durur ve her yıl güncellenir.' },
  },
  {
    id: 'm7-d4', modul: 'm7', baslik: 'Saat ve süre: dakika hesabı', sure: 10,
    ozet: 'Saat günün kesridir. İki zaman damgasını çıkarıp 1440 ile çarpınca dakika çıkar. Boş zamanı unutmayın.',
    hedefler: ['Zaman farkını dakikaya çevirmek', 'SAAT ile saat dilimi çıkarmak', 'Eksik zaman damgasını EBOŞSA ile karşılamak'],
    anlatim: [
      'Teslimat sayfasında Sipariş Anı, Alınma ve Teslim tarih-saattir: 45566,51 "01.10.2024 12:18" demektir. Ondalık kısım saattir: 0,5 öğlen, 1 saat = 1/24, 1 dakika = 1/1440.',
      'Teslim süresi dakika olarak: **=(H2-F2)*1440**. Sonuç ondalıklı çıkabilir; =YUVARLA((H2-F2)*1440;0) ile tam dakikaya yuvarlayın.',
      'İptal edilen siparişlerde Teslim boştur. Boş hücre 0 sayılır ve (0 − F2) × 1440 eksi milyonlarca dakika verir; ortalama tamamen bozulur. Formülü **=EĞER(EBOŞSA(H2);"";(H2-F2)*1440)** diye yazın. ORTALAMA boş metni atlar.',
      '**SAAT(zaman)** 0–23 arası saati verir; yoğun saat analizi için: =SAAT(F2). Öğle yoğunluğu (12–14) gibi aralıkları ÇOKEĞERSAY ile bu yardımcı sütundan sayarsınız.',
      'Süreyi saat:dakika olarak göstermek isterseniz farkı çarpmadan bırakıp hücre biçimini [ss]:dd yapın; köşeli parantez 24 saati aşan süreleri doğru gösterir.',
    ],
    ornek: { sayfa: 'Teslimat', hucre: 'M2', formul: '=EĞER(EBOŞSA(H2);"";YUVARLA((H2-F2)*1440;0))', aciklama: 'Siparişten teslime geçen dakika; teslim edilmeyenlerde boş.' },
    alistirmalar: [
      { id: 'a1', soru: 'Teslimat sayfasında M sütununa sipariş anından teslime geçen süreyi tam dakika olarak yazın; Teslim boşsa boş metin (""). M2:M181.', sayfa: 'Teslimat', hedef: 'M2:M181', cozum: '=EĞER(EBOŞSA(H2);"";YUVARLA((H2-F2)*1440;0))', ipuclari: ['Fark × 1440 = dakika.', 'Teslim boşsa "" yazın, yoksa eksi değerler çıkar.'] },
      { id: 'a2', soru: 'Teslimat sayfasında M sütununa siparişin verildiği saati (0–23) yazın. M2:M181.', sayfa: 'Teslimat', hedef: 'M2:M181', cozum: '=SAAT(F2)', gerekli: ['HOUR'], ipuclari: ['SAAT işlevi.'] },
    ],
    sikHata: { yanlis: '=(H2-F2)*24*60 formülünü boş teslimli satırlara da uygulamak', dogru: '=EĞER(EBOŞSA(H2);"";(H2-F2)*1440)', neden: 'Boş hücre 0 sayılır; sonuç eksi büyük bir sayı olur ve ortalamayı bozar.' },
    mulakat: { soru: 'Excel\'de iki saat arasındaki farkı nasıl dakikaya çevirirsiniz, gece yarısını geçen vardiyada ne olur?', cevap: 'Fark günün kesri olduğu için 1440 ile çarparım. Yalnız saat (tarihsiz) tutuluyorsa ve vardiya gece yarısını geçiyorsa bitiş başlangıçtan küçük olur; =MOD(bitiş-başlangıç;1)*1440 ile düzeltirim. En iyisi zaman damgasını tarihle birlikte tutmaktır.' },
  },

  // ---------------------------------------------------------------- M8 Dinamik diziler
  {
    id: 'm8-d1', modul: 'm8', baslik: 'Taşma: tek formül, çok sonuç', sure: 9,
    ozet: 'Excel 365\'te bir formül birden çok değer üretirse komşu hücrelere taşar. Yolda dolu hücre varsa #TAŞMA!.',
    hedefler: ['Taşan formülü ve taşma alanını tanımak', '#TAŞMA! hatasını çözmek', 'Taşan aralığa # ile başvurmak'],
    anlatim: [
      'Eski Excel\'de bir formül tek hücreye tek sonuç yazardı. Excel 365\'te =BENZERSİZ(F2:F241) yazdığınızda yedi kategori alt alta taşar. Formül yalnız ilk hücrededir; diğerleri gri bir çerçeveyle gösterilen **taşma alanıdır** ve tek tek düzenlenemez.',
      'Taşma alanında dolu bir hücre varsa formül **#TAŞMA!** verir. Çözüm engeli kaldırmaktır; Excel engeli gösterir. Kesit ızgarasında taşan hücreler açık mavi arka planla görünür.',
      'Aralık işlemleri de taşar: =H2:H241*I2:I241 240 satırlık sonucu tek formülle üretir. Eskiden bunun için formülü aşağı doldurmak ya da Ctrl+Shift+Enter gerekiyordu.',
      'Taşan bir sonucun tamamına **#** ile başvurulur: M2\'de taşan bir liste varsa =SATIRSAY(M2#) kaç değer olduğunu söyler. Liste büyüyüp küçüldükçe başvuru kendiliğinden güncellenir. (Kesit bu yazımı henüz desteklemiyor; aralığı açıkça yazın.)',
    ],
    ornek: { sayfa: 'Satışlar', hucre: 'M2', formul: '=BENZERSİZ(F2:F241)', aciklama: 'Tek formül, yedi hücreye taşan kategori listesi.' },
    alistirmalar: [
      { id: 'a1', soru: 'M2\'ye satış yapılan şehirlerin tekrarsız listesini tek formülle taşırın.', sayfa: 'Satışlar', hedef: 'M2', okunan: 'M2:M40', cozum: '=BENZERSİZ(D2:D241)', gerekli: ['UNIQUE'], ipuclari: ['BENZERSİZ(şehir sütunu).'] },
      { id: 'a2', soru: 'L2\'ye tüm satırların tutarını (Adet × Birim Fiyat) tek formülle, aşağı doldurmadan taşırın.', sayfa: 'Satışlar', hedef: 'L2', okunan: 'L2:L241', cozum: '=H2:H241*I2:I241', ipuclari: ['İki aralığı doğrudan çarpın: =H2:H241*I2:I241.'] },
    ],
    sikHata: { yanlis: 'Taşma alanındaki bir hücreye elle değer yazmak', dogru: 'Taşma alanını boş bırakmak ya da formülü başka yere taşımak', neden: 'Engel olan hücre yüzünden tüm sonuç #TAŞMA! olur.' },
    mulakat: { soru: 'Dinamik diziler eski dizi formüllerinden (Ctrl+Shift+Enter) nasıl farklıdır?', cevap: 'Sonuç boyutunu Excel belirler ve veri değiştikçe taşma alanı büyür ya da küçülür; formül tek hücrede yazılır, # ile tamamına başvurulur. Eski dizi formülleri sabit bir aralığa girilirdi ve boyut değişince elle yeniden girmek gerekirdi.' },
  },
  {
    id: 'm8-d2', modul: 'm8', baslik: 'FİLTRE: koşula uyan satırlar', sure: 10,
    ozet: 'Koşula uyan satırları canlı olarak başka bir yere getirir. Koşullar * ile VE, + ile YADA olur.',
    hedefler: ['FİLTRE ile satır süzmek', 'Birden çok koşulu * ve + ile birleştirmek', 'Boş sonuçta mesaj göstermek'],
    anlatim: [
      '**=FİLTRE(dizi; koşul; [boşsa])**. Spor kategorisindeki tüm satırlar: =FİLTRE(A2:K241;F2:F241="Spor"). Koşul dizinin satır sayısı kadar DOĞRU/YANLIŞ üretir; DOĞRU olan satırlar gelir.',
      'İki koşul birden (VE): koşulları parantez içinde **çarpın**: =FİLTRE(A2:K241;(F2:F241="Spor")*(E2:E241="Web")). DOĞRU 1, YANLIŞ 0 sayılır; çarpım yalnız ikisi de 1 ise 1 olur. YADA için **toplayın**: (K2:K241="İptal")+(K2:K241="İade").',
      'Hiçbir satır uymazsa FİLTRE #HESAP! verir. Üçüncü değişkenle mesaj yazın: =FİLTRE(…;…;"Kayıt yok").',
      'Yalnız bazı sütunları istiyorsanız diziyi daraltın (=FİLTRE(G2:I241;…)) ya da SÜTUNSEÇ ile seçin. Sonucu SIRALA ile sarınca sıralı, canlı bir alt liste elde edersiniz.',
      'VE ile çalışmaz: =FİLTRE(A2:K241;VE(F2:F241="Spor";E2:E241="Web")) tek bir DOĞRU/YANLIŞ üretir, çünkü VE tüm diziyi tek değere indirger.',
    ],
    ornek: { sayfa: 'Satışlar', hucre: 'M2', formul: '=FİLTRE(G2:I241;(F2:F241="Spor")*(E2:E241="Web");"Kayıt yok")', aciklama: 'Web\'den gelen Spor satırlarının ürün, adet ve fiyatı.' },
    alistirmalar: [
      { id: 'a1', soru: 'M2\'ye Kozmetik kategorisindeki satırların ürün adlarını (G sütunu) taşırın.', sayfa: 'Satışlar', hedef: 'M2', okunan: 'M2:M80', cozum: '=FİLTRE(G2:G241;F2:F241="Kozmetik")', gerekli: ['FILTER'], ipuclari: ['Dizi G2:G241, koşul F2:F241="Kozmetik".'] },
      { id: 'a2', soru: 'M2\'ye İstanbul\'dan ve Mobil kanalından gelen satırların ürün adı ve adedini (G:H) taşırın; kayıt yoksa "Kayıt yok" yazsın.', sayfa: 'Satışlar', hedef: 'M2', okunan: 'M2:N60', cozum: '=FİLTRE(G2:H241;(D2:D241="İstanbul")*(E2:E241="Mobil");"Kayıt yok")', ipuclari: ['İki koşulu parantez içinde çarpın.', 'VE kullanmayın; tek değer döndürür.'] },
    ],
    sikHata: { yanlis: '=FİLTRE(A2:K241;VE(F2:F241="Spor";E2:E241="Web"))', dogru: '=FİLTRE(A2:K241;(F2:F241="Spor")*(E2:E241="Web"))', neden: 'VE tüm diziyi tek DOĞRU/YANLIŞ\'a indirger; satır satır çalışmaz.' },
    mulakat: { soru: 'FİLTRE\'de VE ve YADA koşullarını nasıl kurarsınız?', cevap: 'Her koşul bir DOĞRU/YANLIŞ dizisidir. VE için dizileri çarparım (ikisi de 1 ise 1), YADA için toplarım (biri 1 ise sıfırdan büyük). VE()/YADA() işlevleri diziyi tek değere indirdiği için kullanılmaz.' },
  },
  {
    id: 'm8-d3', modul: 'm8', baslik: 'BENZERSİZ, SIRALA, SIRALAÖLÇÜT, AL', sure: 10,
    ozet: 'Tekrarsız liste, sıralı liste, ilk 5. Açılır liste kaynakları ve "en çok satanlar" tabloları.',
    hedefler: ['BENZERSİZ ve SIRALA\'yı iç içe kullanmak', 'SIRALAÖLÇÜT ile başka sütuna göre sıralamak', 'AL ile ilk n satırı almak'],
    anlatim: [
      '**BENZERSİZ(dizi)** tekrarsız değerleri ilk görüldükleri sırayla verir. **SIRALA(dizi; [sütun]; [düzen])** sıralar; düzen -1 büyükten küçüğe. Alfabetik şehir listesi: =SIRALA(BENZERSİZ(D2:D241)).',
      '**SIRALAÖLÇÜT(dizi; göre; [düzen])** listeyi başka bir sütuna göre sıralar ve o sütunu göstermek zorunda kalmazsınız: ürün adlarını fiyata göre azalan: =SIRALAÖLÇÜT(Ürünler!B2:B41;Ürünler!D2:D41;-1).',
      '**AL(dizi; n)** ilk n satırı alır (n negatifse son n). En pahalı 5 ürün: =AL(SIRALAÖLÇÜT(Ürünler!B2:B41;Ürünler!D2:D41;-1);5).',
      'BENZERSİZ büyük/küçük harfe duyarsızdır ve "İstanbul" ile "İstanbul " (sonda boşluk) farklı değerlerdir. Liste beklenenden uzunsa önce temizlik modülüne dönün.',
    ],
    ornek: { sayfa: 'Ürünler', hucre: 'H2', formul: '=AL(SIRALAÖLÇÜT(B2:B41;D2:D41;-1);5)', aciklama: 'En pahalı beş ürün.' },
    alistirmalar: [
      { id: 'a1', soru: 'Satışlar sayfasında M2\'ye kategorilerin alfabetik, tekrarsız listesini taşırın.', sayfa: 'Satışlar', hedef: 'M2', okunan: 'M2:M10', cozum: '=SIRALA(BENZERSİZ(F2:F241))', gerekli: ['SORT', 'UNIQUE'], ipuclari: ['Önce BENZERSİZ, sonra SIRALA.'] },
      { id: 'a2', soru: 'Ürünler sayfasında H2\'ye stoku en az olan 5 ürünün adını, en azdan başlayarak taşırın.', sayfa: 'Ürünler', hedef: 'H2', okunan: 'H2:H7', cozum: '=AL(SIRALAÖLÇÜT(B2:B41;F2:F41;1);5)', gerekli: ['TAKE'], ipuclari: ['Adları (B) stoka (F) göre artan sıralayın.', 'AL ile ilk 5\'i alın.'] },
    ],
    sikHata: { yanlis: '=SIRALA(B2:F41;4;-1) ile yalnız ad listesi beklemek', dogru: '=SIRALAÖLÇÜT(B2:B41;D2:D41;-1)', neden: 'SIRALA tüm diziyi (beş sütunu) döndürür; yalnız adı istiyorsanız SIRALAÖLÇÜT ile adı başka sütuna göre sıralayın.' },
    mulakat: { soru: 'Veri değiştikçe güncellenen bir "en çok satan 10 ürün" tablosunu formülle nasıl kurarsınız?', cevap: 'Ürün başına toplamı BENZERSİZ ve ETOPLA ile üretir, YATAYYIĞ ile yan yana koyar, SIRALA ile toplama göre azalan sıralar, AL ile ilk 10\'u alırım; hepsi tek LET formülünde. Kaynak tabloya satır eklendikçe sonuç kendiliğinden güncellenir. Büyük veride aynı işi pivot ya da Power Query daha hızlı yapar.' },
  },
  {
    id: 'm8-d4', modul: 'm8', baslik: 'LET ve tek formülde özet tablo', sure: 11,
    ozet: 'LET ara sonuçlara ad verir: uzun formül okunur olur ve aynı hesap bir kez yapılır.',
    hedefler: ['LET ile ad tanımlayıp kullanmak', 'Tekrar eden alt hesabı bir kez yapmak', 'BENZERSİZ + ETOPLA + YATAYYIĞ ile özet tablo kurmak'],
    anlatim: [
      '**=LET(ad1; değer1; ad2; değer2; …; sonuç)**. Her ad kendinden sonraki hesaplarda kullanılabilir. Son bağımsız değişken formülün sonucudur.',
      'İndirimli tutar: =LET(brut;H2*I2;indirim;brut*J2;brut-indirim). Aynı ifade (H2*I2) iki kez yazılmaz; yanlışlıkla birinde I3 yazma riski de kalmaz.',
      'LET dinamik dizilerle birleşince gücünü gösterir. Kategori başına toplam adet, tek formülde ve sıralı: **=LET(k;SIRALA(BENZERSİZ(F2:F241));YATAYYIĞ(k;ETOPLA(F2:F241;k;H2:H241)))**. ETOPLA\'ya ölçüt olarak bir dizi (k) verilince her kategori için ayrı toplam döner; YATAYYIĞ iki sütunu yan yana koyar.',
      'Adları kısa ama anlamlı seçin (k yerine kategori de yazabilirsiniz). Hücre adresine benzeyen adlar (A1, KDV1) kullanılamaz.',
    ],
    ornek: { sayfa: 'Satışlar', hucre: 'M2', formul: '=LET(k;SIRALA(BENZERSİZ(F2:F241));YATAYYIĞ(k;ETOPLA(F2:F241;k;H2:H241)))', aciklama: 'Kategori ve toplam adet, iki sütun, tek formül.' },
    alistirmalar: [
      { id: 'a1', soru: 'L sütununa indirimli tutarı LET ile yazın: önce brüt (H×I), sonra indirim (brüt×J), sonuç brüt − indirim. L2:L241.', sayfa: 'Satışlar', hedef: 'L2:L241', cozum: '=LET(brut;H2*I2;indirim;brut*J2;brut-indirim)', gerekli: ['LET'], ipuclari: ['=LET(brut; H2*I2; indirim; brut*J2; brut-indirim).'] },
      { id: 'a2', soru: 'M2\'ye şehirlerin alfabetik listesini ve yanına her şehrin toplam adedini tek formülle taşırın (iki sütun).', sayfa: 'Satışlar', hedef: 'M2', okunan: 'M2:N40', cozum: '=LET(s;SIRALA(BENZERSİZ(D2:D241));YATAYYIĞ(s;ETOPLA(D2:D241;s;H2:H241)))', gerekli: ['LET', 'HSTACK'], ipuclari: ['Şehir listesine bir ad verin.', 'ETOPLA\'ya ölçüt olarak bu listeyi verin; YATAYYIĞ ile yan yana koyun.'] },
    ],
    sikHata: { yanlis: '=LET(A1;H2*I2;A1*2)', dogru: '=LET(tutar;H2*I2;tutar*2)', neden: 'Hücre adresine benzeyen adlar kullanılamaz; Excel A1\'i başvuru sanar.' },
    mulakat: { soru: 'LET\'in performansa etkisi nedir?', cevap: 'Aynı alt ifade birden çok kez geçiyorsa LET onu bir kez hesaplar ve sonucu yeniden kullanır. Büyük dizilerle (FİLTRE, BENZERSİZ) çalışan formüllerde fark belirgindir. Ayrıca formül okunur olur ve hata ayıklamak için sonucu ara adlardan birine çevirip o adımı görebilirsiniz.' },
  },
];
