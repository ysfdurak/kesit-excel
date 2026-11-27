// Türkçe Excel eğitmenlerinin (Mustafa Bolat, Ömer Bağcı, Faruk Çubukçu) ve Udemy kurslarının müfredatıyla
// karşılaştırmada eksik çıkan konular (0.8.0). Ayrıntı: PROJE_REHBERI §9.y.
const S = `Satışlar`;
const TAMAM = { F1: `Tamam`, F2: true, F3: true, F4: false, F5: true, F6: false, F7: false, F8: true, F9: false };
const KAYNAK = { N1: `Kaynak`, N2: `kariyer sitesi`, N3: `LinkedIn`, N4: `referans`, N5: `iç başvuru`, N6: `üniversite`, N7: `ajans`, O1: `Hâlâ çalışan oranı` };

export const DERSLER_11 = [
  /* ------------------------------------------------------------ Modül 1 */
  {
    id: `m1-d9`, modul: `m1`, baslik: `Kopyala, Özel Yapıştır, Bul ve Değiştir`, sure: 10,
    ozet: `Değerleri yapıştırmak, satırı sütuna çevirmek (Devrik), yapıştırırken çarpmak; Bul ve Değiştir'de joker ve ~. Her birinin formül karşılığı.`,
    hedefler: [`Özel Yapıştır seçeneklerinin ne yaptığını bilmek`, `DEVRİK_DÖNÜŞÜM ile bağlı bir devrik tablo kurmak`, `Bul ve Değiştir'de * ve ~ kullanmak`],
    anlatim: [
      `**Ctrl+C / Ctrl+V** hücrenin her şeyini (formül, biçim, not) taşır. **Giriş > Yapıştır > Özel Yapıştır** (Ctrl+Alt+V) ne taşınacağını seçtirir: **Değerler** formülü bırakıp sonucu yapıştırır (dosyayı paylaşmadan önce ya da hesabı dondurmak için), **Biçimler** yalnız görünümü, **Formüller** yalnız formülü.`,
      `**İşlemi Tersine Çevir (Devrik)** satırları sütun yapar. Bu bir kopyadır: kaynak değişince güncellenmez. Bağlı kalsın istiyorsanız formül kullanın: **=DEVRİK_DÖNÜŞÜM(A1:K1)** başlık satırını alt alta taşırır ve kaynak değişince değişir.`,
      `**İşlem** bölümü yapıştırırken hesap yapar: bir hücreye 1,1 yazıp kopyalayın, fiyat aralığını seçin, Özel Yapıştır > **Çarp**: bütün fiyatlar %10 artar. Formül içeren hücrelerde Excel formülü =(eski formül)*1,1 yapar. Geri alınamaz bir toplu değişikliktir; önce kopya alın.`,
      `**Bul ve Değiştir** (Ctrl+H): * herhangi sayıda, ? tek karakter. Yıldızın kendisini aramak için **~*** yazın. "Seçenekler" ile yalnız tam hücre eşleşmesi, büyük-küçük harf ve tüm kitapta arama seçilebilir. Formül karşılığı: **=YERİNEKOY(G2;"Seti";"Set")**; farkı, kaynağı değiştirmeden yeni sütunda çalışmasıdır.`,
    ],
    ornek: { sayfa: S, hucre: `M1`, formul: `=DEVRİK_DÖNÜŞÜM(A1:K1)`, aciklama: `11 başlık alt alta taşar; başlık değişince liste de değişir.` },
    alistirmalar: [
      { id: `a1`, soru: `M1'e Satışlar'ın başlık satırını (A1:K1) alt alta, kaynağa bağlı olarak getirin.`, sayfa: S, hedef: `M1`, okunan: `M1:M11`, cozum: `=DEVRİK_DÖNÜŞÜM(A1:K1)`, gerekli: [`TRANSPOSE`], ipuclari: [`DEVRİK_DÖNÜŞÜM(aralık) taşar.`] },
      { id: `a2`, soru: `M2:M241'e ürün adlarında "Seti" kelimesini "Set" yapan formülü yazın (kaynağı değiştirmeden).`, sayfa: S, hedef: `M2:M241`, cozum: `=YERİNEKOY(G2;"Seti";"Set")`, gerekli: [`SUBSTITUTE`], ipuclari: [`YERİNEKOY(metin; eski; yeni).`] },
      { id: `a3`, tur: `secmeli`, soru: `Bir rapor sayfasını müşteriye göndermeden önce formüllerin görünmesini istemiyorsunuz ama sayılar kalsın. Ne yaparsınız?`, secenekler: [`Hücreleri gizlemek`, `Kopyalayıp Özel Yapıştır > Değerler ile aynı yere yapıştırmak (önce kopyasını saklayarak)`, `Sayfayı korumak`, `Yazı rengini beyaz yapmak`], dogru: 1, aciklama: `Değerleri yapıştır formülü siler, sonucu bırakır. Asıl dosyayı ayrıca saklayın; değer yapıştırma geri alınamaz bir dönüşümdür.`, yanlisAciklama: { 0: `Gizli hücre bir tıkla açılır.`, 2: `Koruma formülü göstermeyi engelleyebilir ama formül dosyada kalır.`, 3: `Formül çubuğunda görünür.` } },
      { id: `a4`, tur: `secmeli`, soru: `Bul ve Değiştir'de ürün kodlarındaki "*" karakterini "-" ile değiştirmek istiyorsunuz. Aranan kutusuna ne yazarsınız?`, secenekler: [`*`, `~*`, `"*"`, `\\*`], dogru: 1, aciklama: `* joker karakterdir ve her şeyi eşler; Bul ve Değiştir'de her hücreyi "-" yapardı. ~ işareti jokeri kendi karakteri olarak arar.`, yanlisAciklama: { 0: `Her hücrenin tamamını eşler.`, 2: `Tırnak da aranacak metne dahil olur.`, 3: `Excel kaçış için ~ kullanır.` } },
      { id: `a5`, tur: `secmeli`, soru: `B sütununda =A2*1,2 formülleri var. Bir hücreye 2 yazıp kopyaladınız, B2:B10'u seçip Özel Yapıştır > Çarp dediniz. B2 ne olur?`, secenekler: [`2`, `=(A2*1,2)*2`, `=A2*2,4 olarak sadeleşir`, `#DEĞER!`], dogru: 1, aciklama: `Excel formülü parantez içine alıp işlemi ekler. Formül kalır ve A2 değişince hesap doğru sürer.`, yanlisAciklama: { 0: `Değer yapıştırılmaz, işlem yapılır.`, 2: `Excel formülü sadeleştirmez.`, 3: `Hesap geçerlidir.` } },
    ],
    sikHata: { yanlis: `Özel Yapıştır > Devrik ile kurulan tabloyu kaynak değişince güncel sanmak`, dogru: `=DEVRİK_DÖNÜŞÜM(…) ile bağlı kurmak`, neden: `Devrik yapıştırma bir kopyadır; kaynak değişince eski değerler kalır.` },
    mulakat: { soru: `Formüllü bir tabloyu nasıl "dondurursunuz"?`, cevap: `Kopyalayıp Özel Yapıştır > Değerler. Önce formüllü sürümü saklarım; gerekiyorsa değer kopyasını ayrı sayfaya alırım ki hesap yolu kaybolmasın. Tek hücrede F2 ve F9 o parçanın değerini hesaplatır.` },
  },
  {
    id: `m1-d10`, modul: `m1`, baslik: `Hücre biçimlendirme temelleri`, sure: 10,
    ozet: `Biçim değeri değiştirmez, görünüşünü değiştirir. Tarih ve yüzde biçimleri, telefon gibi kalıplar, Biçim Boyacısı ve birleştirme yerine "Seçim Boyunca Ortala".`,
    hedefler: [`Hücreleri Biçimlendir (Ctrl+1) penceresini kullanmak`, `Tarih, yüzde ve kalıp biçimleri yazmak`, `Biçim Boyacısı ve hücre stilleriyle tutarlı görünüm kurmak`],
    anlatim: [
      `**Ctrl+1** Hücreleri Biçimlendir penceresini açar: Sayı, Hizalama, Yazı Tipi, Kenarlık, Dolgu, Koruma. En önemli kural: **biçim değeri değiştirmez**. 0,1234 hücresi %12,3 görünse de hesapta 0,1234'tür.`,
      `İsteğe uyarlanmış biçimde tarih harfleri Türkçedir: **gg** gün, **aa** ay, **aaaa** ay adı, **yyyy** yıl, **gggg** gün adı. **gg aaaa yyyy gggg** → 01 Ocak 2024 Pazartesi. Yüzde: **0,0%**. Kalıp: **0 (000) 000 00 00** telefon numarasını gruplar; numara sayı olarak kalır.`,
      `**Biçim Boyacısı** (fırça) bir hücrenin biçimini başka yere kopyalar; çift tıklarsanız Esc'e basana kadar açık kalır. **Hücre Stilleri** (Giriş sekmesi) başlık, toplam, girdi gibi hazır stillerdir; aynı stil her yerde aynı görünür.`,
      `**Birleştir ve Ortala** başlıklarda sık kullanılır ama sıralama, filtre, kopyalama ve formül doldurmayı bozar. Yerine: hücreleri seçin, Ctrl+1 > Hizalama > Yatay: **Seçim Boyunca Ortala**. Görünüm aynı, hücreler ayrı kalır.`,
    ],
    ornek: { tur: `bicim`, kod: `gg aaaa yyyy gggg`, denemeDegerleri: [45292, 45383, 45657], sayfa: S, alan: `B2:B20`, aciklama: `Satışlar'ın tarih sütunu bu biçimle gün adıyla görünür; değer aynı kalır.` },
    alistirmalar: [
      { id: `a1`, tur: `bicim`, soru: `Tarihleri **01 Ocak 2024 Pazartesi** biçiminde gösterin.`, cozum: `gg aaaa yyyy gggg`, denemeDegerleri: [45292, 45383, 45657], ipuclari: [`gg gün, aaaa ay adı, yyyy yıl, gggg gün adı.`] },
      { id: `a2`, tur: `bicim`, soru: `Oranları **bir ondalıklı yüzde** olarak gösterin: 0,1234 → %12,3 değil **12,3%**.`, cozum: `0,0%`, denemeDegerleri: [0.1234, 0.5, 1.25, 0], ipuclari: [`0,0%`] },
      { id: `a3`, tur: `bicim`, soru: `On haneli telefon numaralarını **0 (532) 123 45 67** biçiminde gösterin (hücrede 5321234567 yazıyor).`, cozum: `0 (000) 000 00 00`, denemeDegerleri: [5321234567, 2121234567], ipuclari: [`Her rakam için 0 yer tutucusu; boşluk ve parantezler olduğu gibi yazılır.`] },
      { id: `a4`, tur: `secmeli`, soru: `Tablonun üstündeki başlığı A1:F1 boyunca ortalamak istiyorsunuz; tablo sonra sıralanıp filtrelenecek. Hangisi?`, secenekler: [`Birleştir ve Ortala`, `Seçim Boyunca Ortala (Ctrl+1 > Hizalama)`, `Başlığı C1'e boşluklarla yazmak`, `Metin kutusu eklemek`], dogru: 1, aciklama: `Görünüm aynıdır ama hücreler birleşmez; sıralama, kopyalama ve seçim bozulmaz.`, yanlisAciklama: { 0: `Birleşik hücreler sıralama ve kopyalamada hata çıkarır.`, 2: `Sütun genişliği değişince kayar.`, 3: `Hücreye bağlı olmaz, yazdırmada ve filtrede sorun çıkar.` } },
      { id: `a5`, tur: `secmeli`, soru: `Biçim Boyacısı'nı tek tıkla değil çift tıkla açmanın farkı nedir?`, secenekler: [`Daha çok biçim kopyalar`, `Esc'e basana kadar açık kalır; birden çok yere uygulanır`, `Formülleri de kopyalar`, `Fark yok`], dogru: 1, aciklama: `Tek tıkta bir kez uygulanıp kapanır; çift tıkta istediğiniz kadar hücreye uygularsınız.`, yanlisAciklama: { 0: `Kopyalanan biçim aynıdır.`, 2: `Biçim Boyacısı yalnız biçimi taşır.`, 3: `Kalıcılık farkı vardır.` } },
    ],
    sikHata: { yanlis: `Tutarı =YUVARLA yerine biçimle iki ondalık göstermek ve toplamın tutmadığını görmek`, dogru: `Hesapta YUVARLA, görünümde biçim`, neden: `Biçim yalnız görünüştür; 0,333 üç kez toplanınca 1,00 görünür ama hücreler 0,33 göründüğü için okuyan 0,99 bekler.` },
    mulakat: { soru: `Birleştirilmiş hücrelerden neden kaçınılır?`, cevap: `Sıralama ve filtreleme bozulur, kopyala-yapıştır boyut hatası verir, formül doldurmak ve seçmek zorlaşır, Power Query ve özet tablo birleşik başlıkları okuyamaz. Görünüm için Seçim Boyunca Ortala kullanırım.` },
  },

  /* ------------------------------------------------------------ Modül 2 */
  {
    id: `m2-d9`, modul: `m2`, baslik: `Kasa defteri: yürüyen bakiye ve KDV`, sure: 11,
    ozet: `Küçük işletmenin en sık Excel tablosu: giriş, çıkış, her satırda güncel bakiye; KDV dahil tutardan KDV hariç tutarı ve KDV'yi ayırmak; türe göre özet.`,
    hedefler: [`Yürüyen bakiyeyi genişleyen aralıkla hesaplamak`, `KDV dahil tutardan KDV hariç tutarı ve KDV'yi ayırmak`, `Gider türlerine göre toplam almak`],
    anlatim: [
      `Kasa sayfasının ilk satırı önceki aydan devreden kasa; sonraki her satır bir hareket: Giriş (D) ya da Çıkış (E), KDV dahil. **Bakiye** her satırda o güne kadarki girişler eksi çıkışlardır: **=TOPLA($D$2:D2)-TOPLA($E$2:E2)**. Başlangıç sabit ($D$2), bitiş kayar (D2): buna **genişleyen aralık** denir. Aşağı doldurunca D2:D3, D2:D4… olur.`,
      `Alternatif: ilk satıra =D2-E2, ikincisine =G2+D3-E3 yazmak. Çalışır ama satır silinince #BAŞV! verir ve iki farklı formül tutmak gerekir; genişleyen aralık tek formüldür.`,
      `**KDV dahil tutardan KDV hariç tutar**: tutar / (1 + oran). %20 KDV'li 18.400 TL → 18.400 / 1,2 = 15.333,33 TL; KDV = 18.400 − 15.333,33 = 3.066,67 TL. Sık hata: 18.400 × 0,8 = 14.720; bu yanlıştır, çünkü %20 hariç tutara eklenmişti.`,
      `Özet: **=ETOPLA(C2:C18;"Fatura";E2:E18)** fatura giderlerinin toplamıdır. Kasa defterinde bakiye hiç eksiye düşmemeli; düşüyorsa ya bir giriş eksik ya da tarih sırası yanlıştır. Kontrol: =MİN(G2:G18)>=0.`,
    ],
    ornek: { sayfa: `Kasa`, hucre: `G2`, formul: `=TOPLA($D$2:D2)-TOPLA($E$2:E2)`, aciklama: `İlk satırdaki bakiye; aşağı doldurunca her satırın güncel bakiyesi.` },
    alistirmalar: [
      { id: `a1`, soru: `Kasa sayfasında G2:G18'ye her satırın yürüyen bakiyesini yazın: o satıra kadar girişlerin toplamı eksi çıkışların toplamı.`, sayfa: `Kasa`, hedef: `G2:G18`, cozum: `=TOPLA($D$2:D2)-TOPLA($E$2:E2)`, gerekli: [`SUM`], ipuclari: [`Genişleyen aralık: $D$2:D2.`, `Başlangıç sabit, bitiş kayar.`] },
      { id: `a2`, soru: `H2:H18'ye hareketin KDV hariç tutarını yazın (tutar giriş ya da çıkış sütunundadır; KDV oranı F'de).`, sayfa: `Kasa`, hedef: `H2:H18`, cozum: `=(D2+E2)/(1+F2)`, bicim: `#.##0,00`, ipuclari: [`Satırda yalnız biri dolu: D2+E2 tutarı verir.`, `KDV hariç = tutar / (1 + oran).`] },
      { id: `a3`, soru: `I2:I18'ye hareketin KDV tutarını yazın.`, sayfa: `Kasa`, hedef: `I2:I18`, cozum: `=(D2+E2)-(D2+E2)/(1+F2)`, bicim: `#.##0,00`, ipuclari: [`KDV = tutar − KDV hariç tutar.`] },
      { id: `a4`, soru: `M2'ye fatura türündeki çıkışların toplamını yazın.`, sayfa: `Kasa`, hedef: `M2`, cozum: `=ETOPLA(C2:C18;"Fatura";E2:E18)`, gerekli: [`SUMIF`], ipuclari: [`ETOPLA(tür; "Fatura"; çıkış).`] },
    ],
    sikHata: { yanlis: `=D2*0,8 ile KDV hariç tutar`, dogru: `=D2/1,2`, neden: `%20 KDV hariç tutarın üzerine eklenmiştir; geri almak için 1,2'ye bölmek gerekir. 0,8 ile çarpmak hariç tutarı düşük bulur.` },
    mulakat: { soru: `Yürüyen bakiyeyi nasıl hesaplarsınız ve satır eklenince bozulmaması için ne yaparsınız?`, cevap: `=TOPLA($D$2:D2)-TOPLA($E$2:E2) gibi genişleyen aralıkla tek formül. Veriyi Excel Tablosu yaparım ki yeni satır eklendiğinde formül kendiliğinden yayılsın. Büyük veride (on binlerce satır) bu formül yavaşlar; o zaman önceki bakiye + giriş − çıkış ya da Power Query'de birikimli toplam kullanırım.` },
  },

  /* ------------------------------------------------------------ Modül 8 */
  {
    id: `m8-d9`, modul: `m8`, baslik: `Açılır listeye bağlı rapor: seçim, FİLTRE ve "Tümü"`, sure: 11,
    ozet: `Bir hücredeki seçime (açılır liste) göre tabloyu süzen tek formül. Listenin kaynağı BENZERSİZ ile taşan dizi; "Tümü" seçeneği koşulu devre dışı bırakır.`,
    hedefler: [`Veri doğrulama listesinin kaynağını taşan diziye bağlamak`, `Seçime göre FİLTRE ve özet kurmak`, `"Tümü" seçeneğini koşula eklemek`],
    anlatim: [
      `Rapor şablonu: üstte bir seçim hücresi (P1: kategori), altında o kategorinin satırları. Liste kaynağı için M2'ye **=SIRALA(BENZERSİZ(F2:F241))** yazın; P1'e **Veri > Veri Doğrulama > Liste**, Kaynak: **=$M$2#**. Yeni kategori gelince liste kendiliğinden uzar.`,
      `Seçime göre satırlar: **=FİLTRE(A2:K241;F2:F241=P1;"Kayıt yok")**. Özet: =ETOPLA(F2:F241;P1;H2:H241). Seçim değişince her şey değişir; formüle dokunmazsınız.`,
      `Kullanıcı "hepsini görmek" isteyebilir. Listeye "Tümü" ekleyin ve koşulu şöyle kurun: **(F2:F241=P1)+(P1="Tümü")**. P1 "Tümü" ise ikinci parça her satır için 1 olur ve hepsi geçer.`,
      `İki seçim (kategori ve kanal) VE ile çarpılır: **((F2:F241=P1)+(P1="Tümü"))*((E2:E241=P2)+(P2="Tümü"))**. Bu kalıp pano ve rapor şablonlarının temelidir.`,
    ],
    ornek: { sayfa: S, hucre: `M4`, formul: `=FİLTRE(A2:K241;F2:F241=P1;"Kayıt yok")`, hazirlik: { P1: `Kitap` }, aciklama: `P1'deki kategoriye ait bütün satırlar.` },
    alistirmalar: [
      { id: `a1`, soru: `P1'de seçilen kategori var. M4'e o kategorinin bütün satırlarını FİLTRE ile getirin; kayıt yoksa "Kayıt yok".`, sayfa: S, hedef: `M4`, okunan: `M4:W70`, cozum: `=FİLTRE(A2:K241;F2:F241=P1;"Kayıt yok")`, hazirlik: { O1: `Kategori`, P1: `Kitap` }, gerekli: [`FILTER`], durumlar: [{ P1: `Kitap` }, { P1: `Spor` }], ipuclari: [`FİLTRE(veri; koşul; "Kayıt yok").`] },
      { id: `a2`, soru: `M2'ye P1'de seçili kategorinin toplam adedini yazın.`, sayfa: S, hedef: `M2`, cozum: `=ETOPLA(F2:F241;P1;H2:H241)`, hazirlik: { O1: `Kategori`, P1: `Giyim` }, gerekli: [`SUMIF`], durumlar: [{ P1: `Giyim` }, { P1: `Hediye` }], ipuclari: [`Ölçüt P1.`] },
      { id: `a3`, soru: `P1'de kategori, P2'de kanal seçimi var; ikisi de "Tümü" olabilir. M4'e seçime uyan satırların ürün ve adedini (G:H) getirin.`, sayfa: S, hedef: `M4`, okunan: `M4:N240`, cozum: `=FİLTRE(G2:H241;((F2:F241=P1)+(P1="Tümü"))*((E2:E241=P2)+(P2="Tümü"));"Kayıt yok")`, hazirlik: { O1: `Kategori`, P1: `Kitap`, O2: `Kanal`, P2: `Tümü` }, gerekli: [`FILTER`], durumlar: [{ P1: `Kitap`, P2: `Tümü` }, { P1: `Tümü`, P2: `Mağaza` }, { P1: `Spor`, P2: `Web` }], ipuclari: [`Her seçim: (sütun=seçim)+(seçim="Tümü").`, `İki seçimi çarpın.`] },
      { id: `a4`, tur: `secmeli`, soru: `Açılır listenin kaynağı olarak =$M$2:$M$8 yerine =$M$2# yazmanın faydası nedir?`, secenekler: [`Liste alfabetik olur`, `M2'deki taşan dizi uzayıp kısaldıkça liste de değişir`, `Liste başka sayfada çalışır`, `Fark yok`], dogru: 1, aciklama: `# taşma başvurusudur; yeni kategori eklenince sabit aralık onu dışarıda bırakırdı.`, yanlisAciklama: { 0: `Sıralamayı SIRALA yapar.`, 2: `İkisi de başka sayfadan başvurulabilir.`, 3: `Veri değişince fark ortaya çıkar.` } },
    ],
    sikHata: { yanlis: `"Tümü" için ayrı bir EĞER dalı yazıp formülü ikiye katlamak`, dogru: `(sütun=seçim)+(seçim="Tümü")`, neden: `Her seçim için iki dal yazınca iki seçimde dört, üç seçimde sekiz formül olur; toplama yolu tek formülde kalır.` },
    mulakat: { soru: `Excel'de makrosuz, seçime göre değişen bir rapor nasıl kurulur?`, cevap: `Seçim hücrelerine veri doğrulama listesi (kaynağı BENZERSİZ ile taşan dizi), altta FİLTRE ve ÇOKETOPLA formülleri; "Tümü" için (sütun=seçim)+(seçim="Tümü") kalıbı. Excel 365 yoksa özet tablo ve dilimleyici ya da yardımcı sütunla İNDİS/KAÇINCI.` },
  },
  {
    id: `m8-d10`, modul: `m8`, baslik: `Klasik dizi formülleri (Ctrl+Shift+Enter)`, sure: 11,
    ozet: `Dinamik dizilerden önce dizi hesabı Ctrl+Shift+Enter ile yapılırdı ve eski kitaplarda hâlâ durur: benzersiz sayım, EĞER içinde MAK, son kaydı bulan ARA hilesi, BÜYÜK'e dizi vermek.`,
    hedefler: [`{=…} formüllerini okumak ve neden öyle yazıldığını anlamak`, `TOPLA(1/EĞERSAY(…)) ile benzersiz saymak`, `ARA(2;1/(koşul);sonuç) ile son kaydı bulmak`],
    anlatim: [
      `Excel 2019 ve öncesinde bir formül aralık üzerinde işlem yapacaksa Enter yerine **Ctrl+Shift+Enter** ile girilirdi ve Excel onu **{=…}** diye süslü parantezle gösterirdi. Excel 365 bunu kendiliğinden yapar; ama devraldığınız eski kitaplarda bu formüller durur ve aynı mantıkla okunur.`,
      `**Benzersiz sayım:** =TOPLA(1/EĞERSAY(C2:C241;C2:C241)). Bir müşteri 3 kez geçiyorsa her satırına 1/3 düşer, toplamı 1 olur. Kayan nokta yüzünden 81,0000000001 çıkabilir; YUVARLA ile sarın. Excel 365'te =SATIRSAY(BENZERSİZ(…)) daha açıktır.`,
      `**Koşullu en büyük:** =MAK(EĞER(F2:F241="Kitap";I2:I241)). EĞER koşula uymayanlara YANLIŞ verir, MAK onları atlar. ÇOKEĞERMAK gelmeden önceki yol buydu ve hâlâ ÇOKEĞER… ailesinin yapamadığı koşullarda (AY(tarih)=3) kullanılır.`,
      `**Son kayıt:** =ARA(2;1/(D2:D241="İstanbul");B2:B241). 1/(koşul) uyanlarda 1, diğerlerinde #SAYI/0! üretir. ARA 2'yi bulamaz, hataları atlayarak son 1'e döner ve aynı konumdaki tarihi verir. **İlk 3'ün toplamı:** =TOPLA(BÜYÜK(I2:I241;{1;2;3})).`,
    ],
    ornek: { sayfa: S, hucre: `M2`, formul: `=ARA(2;1/(D2:D241="İstanbul");B2:B241)`, bicim: `gg.aa.yyyy`, aciklama: `İstanbul'dan gelen son satırın tarihi.` },
    alistirmalar: [
      { id: `a1`, soru: `M2'ye kaç farklı müşteri olduğunu BENZERSİZ kullanmadan, TOPLA ve EĞERSAY ile yazın (sonucu tam sayıya yuvarlayın).`, sayfa: S, hedef: `M2`, cozum: `=YUVARLA(TOPLA(1/EĞERSAY(C2:C241;C2:C241));0)`, gerekli: [`COUNTIF`], yasak: [`UNIQUE`], ipuclari: [`Her satıra 1/tekrar sayısı düşer.`] },
      { id: `a2`, soru: `M2'ye Kitap kategorisindeki en yüksek birim fiyatı ÇOKEĞERMAK kullanmadan, MAK ve EĞER ile yazın.`, sayfa: S, hedef: `M2`, cozum: `=MAK(EĞER(F2:F241="Kitap";I2:I241))`, gerekli: [`MAX`, `IF`], yasak: [`MAXIFS`], ipuclari: [`EĞER koşula uymayanlara YANLIŞ verir; MAK onları atlar.`] },
      { id: `a3`, soru: `M2'ye Ankara'dan gelen son satırın tarihini ARA hilesiyle yazın.`, sayfa: S, hedef: `M2`, cozum: `=ARA(2;1/(D2:D241="Ankara");B2:B241)`, gerekli: [`LOOKUP`], bicim: `gg.aa.yyyy`, ipuclari: [`ARA(2; 1/(koşul); sonuç).`] },
      { id: `a4`, soru: `M2'ye en yüksek üç birim fiyatın toplamını tek formülle yazın.`, sayfa: S, hedef: `M2`, cozum: `=TOPLA(BÜYÜK(I2:I241;{1;2;3}))`, gerekli: [`LARGE`], ipuclari: [`BÜYÜK'e k olarak {1;2;3} verin.`] },
    ],
    sikHata: { yanlis: `Eski Excel'de {=…} formülünü Enter ile düzenleyip bozmak`, dogru: `Düzenledikten sonra Ctrl+Shift+Enter`, neden: `Excel 2019 ve öncesinde dizi formülü Enter ile kaydedilirse tek hücre gibi hesaplanır ve yanlış sonuç ya da #DEĞER! verir.` },
    mulakat: { soru: `Eski bir kitapta {=TOPLA(EĞER(…))} gördünüz. Ne yaparsınız?`, cevap: `Mantığını okurum: dizi üzerinde EĞER ile süzüp topluyor. Excel 365 kullanılıyorsa ÇOKETOPLA ya da FİLTRE ile daha okunur hâle getiririm; kitabı eski sürümle paylaşanlar varsa formülü korurum ve düzenlerken Ctrl+Shift+Enter gerektiğini nota yazarım.` },
  },

  /* ------------------------------------------------------------ Modül 12 */
  {
    id: `m12-d5`, modul: `m12`, baslik: `İnsan kaynakları göstergeleri`, sure: 12,
    ozet: `Personel listesinden yöneticinin sorduğu sayılar: belirli bir tarihte çalışan sayısı, yıl içinde ayrılan, gönüllü ayrılma oranı ve işe alım kaynağının başarısı.`,
    hedefler: [`Bir tarihteki çalışan sayısını tarih koşullarıyla hesaplamak`, `Ayrılma sayısı ve oranını bulmak`, `Kaynak bazında elde tutma oranını tablo olarak kurmak`],
    anlatim: [
      `"Şu tarihte kaç kişi çalışıyordu?" İşe girişi o tarihten önce **ve** (çıkışı boş **ya da** çıkışı o tarihten sonra) olanlar. YA DA iki sayımın toplamıdır: **=ÇOKEĞERSAY(G2:G161;"<="&P2;H2:H161;"")+ÇOKEĞERSAY(G2:G161;"<="&P2;H2:H161;">"&P2)**.`,
      `**Yıl içinde ayrılan:** çıkış tarihi yıl başı ile yıl sonu arasında olanlar: =ÇOKEĞERSAY(H2:H161;">="&TARİH(2023;1;1);H2:H161;"<="&TARİH(2023;12;31)).`,
      `**Devir hızı (turnover)** = yıl içinde ayrılan / ortalama çalışan; ortalama çalışan için yıl başı ve yıl sonu sayılarının ortalaması kullanılır. Gönüllü ayrılma oranı ayrılanların içindeki "gönüllü" payıdır; yüksekse işten memnuniyet sorulur, gönülsüz yüksekse işe alım kalitesi.`,
      `**Kaynak başarısı:** her işe alım kaynağından gelenlerin yüzde kaçı hâlâ çalışıyor: =ÇOKEĞERSAY(Kaynak;N2;Çıkış;"")/EĞERSAY(Kaynak;N2). Küçük gruplarda oran oynaktır; kişi sayısını da yanına yazın.`,
    ],
    ornek: { sayfa: `Personel`, hucre: `M2`, formul: `=ÇOKEĞERSAY(H2:H161;">="&TARİH(2023;1;1);H2:H161;"<="&TARİH(2023;12;31))`, aciklama: `2023'te ayrılan çalışan sayısı.` },
    alistirmalar: [
      { id: `a1`, soru: `Personel sayfasında M2'ye 2023 yılı içinde ayrılan çalışan sayısını yazın.`, sayfa: `Personel`, hedef: `M2`, cozum: `=ÇOKEĞERSAY(H2:H161;">="&TARİH(2023;1;1);H2:H161;"<="&TARİH(2023;12;31))`, gerekli: [`COUNTIFS`], ipuclari: [`İki koşul: >= yıl başı, <= yıl sonu.`] },
      { id: `a2`, soru: `P2'de bir tarih var. M2'ye o tarihte çalışan kişi sayısını yazın: işe girişi o tarih ya da öncesi, çıkışı boş ya da o tarihten sonra.`, sayfa: `Personel`, hedef: `M2`, cozum: `=ÇOKEĞERSAY(G2:G161;"<="&P2;H2:H161;"")+ÇOKEĞERSAY(G2:G161;"<="&P2;H2:H161;">"&P2)`, hazirlik: { O2: `Tarih`, P2: 44927 }, gerekli: [`COUNTIFS`], durumlar: [{ P2: 44927 }, { P2: 45291 }, { P2: 43466 }], ipuclari: [`YA DA: iki ÇOKEĞERSAY'ı toplayın.`, `Boş çıkış için ölçüt "".`] },
      { id: `a3`, soru: `M2'ye ayrılanların içinde gönüllü ayrılanların oranını yazın (Çıkış Türü I sütununda).`, sayfa: `Personel`, hedef: `M2`, cozum: `=EĞERSAY(I2:I161;"gönüllü")/BAĞ_DEĞ_SAY(H2:H161)`, bicim: `0%`, ipuclari: [`Ayrılan sayısı: çıkış tarihi olanlar (BAĞ_DEĞ_SAY).`] },
      { id: `a4`, soru: `N2:N7'de işe alım kaynakları var. O2:O7'ye her kaynaktan gelenlerin hâlâ çalışan oranını yazın.`, sayfa: `Personel`, hedef: `O2:O7`, cozum: `=ÇOKEĞERSAY($K$2:$K$161;N2;$H$2:$H$161;"")/EĞERSAY($K$2:$K$161;N2)`, hazirlik: KAYNAK, bicim: `0%`, ipuclari: [`Pay: kaynak = N2 VE çıkış boş. Payda: kaynak = N2.`] },
    ],
    sikHata: { yanlis: `Bir tarihteki çalışanı yalnız =BOŞLUKSAY(Çıkış) ile saymak`, dogru: `İşe giriş ve çıkışı o tarihe göre koşullamak`, neden: `BOŞLUKSAY bugün çalışanları sayar; geçmiş bir tarihte çalışıp sonra ayrılanları ve o tarihten sonra işe girenleri ayıramaz.` },
    mulakat: { soru: `Çalışan devir hızını nasıl hesaplarsınız?`, cevap: `Dönem içinde ayrılan sayısı / dönemin ortalama çalışan sayısı. Ortalama için dönem başı ve sonu sayısının ortalaması (ya da aylık sayıların ortalaması). Gönüllü ve gönülsüz ayrılmayı ayrı raporlarım, küçük birimlerde oranın yanına kişi sayısını yazarım.` },
  },

  /* ------------------------------------------------------------ Modül 16 */
  {
    id: `m16-d8`, modul: `m16`, baslik: `Finansal tablo analizi: yatay, dikey, trend`, sure: 12,
    ozet: `Gelir tablosunu üç açıdan okumak: bir yıldan diğerine değişim (yatay), her kalemin satışa oranı (dikey) ve baz yıla göre gelişim (trend yüzdeleri).`,
    hedefler: [`Yatay analizde yıllık değişim oranını hesaplamak`, `Dikey analizde her kalemi net satışlara oranlamak`, `Trend yüzdelerini tek formülle bütün tabloya yaymak`],
    anlatim: [
      `Gelir Tablosu sayfasında satırlarda kalemler, sütunlarda 2022–2024 (bin TL). **Yatay analiz** aynı kalemin yıllar arası değişimidir: **=(D2-C2)/C2** 2024'ün 2023'e göre değişim oranı. Satışlar %18 artarken giderler %21 arttıysa marj daralıyordur.`,
      `**Dikey analiz (yüzde yöntemi)** her kalemi aynı yılın net satışlarına oranlar: **=D2/D$2**. Satır numarası sabit ($2), çünkü bölen hep net satışlar satırıdır. "Satışların maliyeti satışın %65'i" gibi cümleler buradan çıkar ve farklı büyüklükteki şirketler karşılaştırılabilir.`,
      `**Trend yüzdeleri** bir baz yıla (2022 = %100) göre gelişimi gösterir: **=B2/$B2**, sağa ve aşağı doldurulur. Sütun sabit ($B), çünkü her hücre kendi satırının 2022 değerine bölünür. Net kâr %109 iken satışlar %148 ise büyüme kâra yansımamıştır.`,
      `Oranlar: brüt kâr marjı = brüt kâr / net satışlar, net kâr marjı = net kâr / net satışlar. Hepsi dikey analizin özel satırlarıdır.`,
    ],
    ornek: { sayfa: `Gelir Tablosu`, hucre: `E2`, formul: `=(D2-C2)/C2`, bicim: `0,0%`, aciklama: `Net satışların 2024'teki değişimi: %17,7.` },
    alistirmalar: [
      { id: `a1`, soru: `Gelir Tablosu sayfasında E2:E10'a her kalemin 2024'teki değişim oranını (2023'e göre) yazın.`, sayfa: `Gelir Tablosu`, hedef: `E2:E10`, cozum: `=(D2-C2)/C2`, bicim: `0,0%`, ipuclari: [`(yeni − eski) / eski.`] },
      { id: `a2`, soru: `F2:F10'a 2024'te her kalemin net satışlara oranını yazın (dikey analiz).`, sayfa: `Gelir Tablosu`, hedef: `F2:F10`, cozum: `=D2/D$2`, bicim: `0,0%`, ipuclari: [`Bölen hep net satışlar satırı: D$2.`] },
      { id: `a3`, soru: `G2:I10'a trend yüzdelerini yazın: her kalemin 2022, 2023 ve 2024 değeri kendi 2022 değerine bölünsün (tek formül, sağa ve aşağı).`, sayfa: `Gelir Tablosu`, hedef: `G2:I10`, ikiYon: true, cozum: `=B2/$B2`, bicim: `0%`, ipuclari: [`Sütun sabit: $B2. Satır kayar.`] },
      { id: `a4`, soru: `M2'ye 2024 net kâr marjını yazın: net kâr ÷ net satışlar. Kalemleri adlarıyla bulun (ETOPLA ya da ÇAPRAZARA), satır numarasına güvenmeyin.`, sayfa: `Gelir Tablosu`, hedef: `M2`, cozum: `=ÇAPRAZARA("Net kâr";A2:A10;D2:D10)/ÇAPRAZARA("Net satışlar";A2:A10;D2:D10)`, bicim: `0,0%`, ipuclari: [`Satırın yeri değişebilir; kalemi adından arayın.`] },
    ],
    sikHata: { yanlis: `=D2/D2 ile dikey analizi aşağı doldurmak`, dogru: `=D2/D$2`, neden: `Bölen de kayınca her kalem kendine bölünür ve hepsi %100 çıkar.` },
    mulakat: { soru: `Yatay ve dikey analizin farkı nedir, birlikte ne söyler?`, cevap: `Yatay analiz bir kalemin zaman içindeki değişimini, dikey analiz aynı dönemde kalemlerin satışa göre yapısını gösterir. Satışlar artarken maliyetin satışa oranı da artıyorsa (dikey) büyüme kârlılığı aşındırıyordur; trend yüzdeleri hangi kalemin satıştan hızlı büyüdüğünü tek bakışta gösterir.` },
  },

  /* ------------------------------------------------------------ Modül 21 */
  {
    id: `m21-d8`, modul: `m21`, baslik: `Onay kutuları ile görev listesi`, sure: 9,
    ozet: `Excel 365'te hücreye eklenen onay kutusu hücreye DOĞRU ya da YANLIŞ yazar. Tamamlama yüzdesi, kalan iş ve koşullu biçim bu değerden hesaplanır.`,
    hedefler: [`Onay kutusunun hücrede DOĞRU/YANLIŞ tuttuğunu bilmek`, `Tamamlama yüzdesini hesaplamak`, `Açık işlerin süresini toplamak`],
    anlatim: [
      `Excel 365'te **Ekle > Onay Kutusu** seçili hücrelere tıklanabilir kutular koyar. Kutu işaretlenince hücrenin değeri **DOĞRU**, boşken **YANLIŞ** olur. Eski "form denetimi" onay kutusundan farkı, değerin hücrenin kendisinde durmasıdır; bağlantı hücresi gerekmez.`,
      `Hesaplar sıradan mantıksal değer hesabıdır: tamamlanan sayısı **=EĞERSAY(F2:F9;DOĞRU)**, yüzde =tamamlanan / görev sayısı. Açık işlerin süresi **=ETOPLA(F2:F9;YANLIŞ;C2:C9)**.`,
      `Satırın tamamını gri yapmak için koşullu biçim formülü **=$F2** yeterlidir: değer DOĞRU olduğunda kural uygulanır.`,
      `Excel 365'in bir diğer yeni görünüm aracı **Hücre Odağı**dır (Görünüm sekmesi): seçili hücrenin satırını ve sütununu vurgular, geniş tabloda satır kaydırmayı önler. Yazdırmaya ve değere etkisi yoktur.`,
    ],
    ornek: { sayfa: `Görevler`, hucre: `H2`, formul: `=EĞERSAY(F2:F9;DOĞRU)/BAĞ_DEĞ_DOLU_SAY(A2:A9)`, hazirlik: TAMAM, bicim: `0%`, aciklama: `F sütunundaki işaretli kutuların oranı: %50.` },
    alistirmalar: [
      { id: `a1`, soru: `Görevler sayfasında F2:F9 onay kutusu (DOĞRU/YANLIŞ). H2'ye tamamlanma yüzdesini yazın.`, sayfa: `Görevler`, hedef: `H2`, cozum: `=EĞERSAY(F2:F9;DOĞRU)/BAĞ_DEĞ_DOLU_SAY(A2:A9)`, hazirlik: TAMAM, bicim: `0%`, durumlar: [{ F4: false }, { F4: true, F6: true }], ipuclari: [`EĞERSAY(F2:F9; DOĞRU) / görev sayısı.`] },
      { id: `a2`, soru: `G2:G9'a kutu işaretliyse "Bitti", değilse "Açık" yazın.`, sayfa: `Görevler`, hedef: `G2:G9`, cozum: `=EĞER(F2;"Bitti";"Açık")`, hazirlik: TAMAM, ipuclari: [`F2 zaten DOĞRU/YANLIŞ; =DOĞRU yazmaya gerek yok.`] },
      { id: `a3`, soru: `H3'e açık (işaretlenmemiş) görevlerin toplam süresini (C, gün) yazın.`, sayfa: `Görevler`, hedef: `H3`, cozum: `=ETOPLA(F2:F9;YANLIŞ;C2:C9)`, hazirlik: TAMAM, gerekli: [`SUMIF`], durumlar: [{ F4: false }, { F4: true }], ipuclari: [`Ölçüt YANLIŞ.`] },
      { id: `a4`, tur: `secmeli`, soru: `Onay kutusu işaretli satırları gri yapan koşullu biçim kuralının formülü hangisi? (Kutular F sütununda, kural A2:F9'a uygulanıyor)`, secenekler: [`=F2`, `=$F2`, `=$F$2`, `=F$2=DOĞRU`], dogru: 1, aciklama: `Sütun sabit ($F) olmalı ki satırdaki her hücre aynı kutuya baksın; satır göreli kalmalı ki her satır kendi kutusuna baksın.`, yanlisAciklama: { 0: `Sağdaki hücreler G2, H2'ye bakar.`, 2: `Her satır yalnız ilk kutuya bakar.`, 3: `Satır sabitlenince hep 2. satıra bakar.` } },
    ],
    sikHata: { yanlis: `=EĞERSAY(F2:F9;"DOĞRU")`, dogru: `=EĞERSAY(F2:F9;DOĞRU)`, neden: `Tırnak içindeki DOĞRU metindir; onay kutusu ise mantıksal değer tutar. (Excel ikisini de çoğu durumda eşler, ama mantıksal değerle yazmak niyeti açık eder ve metin hücreleriyle karışmaz.)` },
    mulakat: { soru: `Bir ekip görev takibini Excel'de yapıyor. Nasıl kurarsınız?`, cevap: `Excel Tablosu: görev, sorumlu, başlangıç, süre, durum (onay kutusu ya da liste). Tamamlama yüzdesi ve geciken iş sayısı formülle, koşullu biçimle geciken satırlar kırmızı. Ekip büyürse ya da birden çok kişi aynı anda yazıyorsa SharePoint listesi ya da bir iş takip aracına geçmeyi öneririm.` },
  },
  {
    id: `m21-d9`, modul: `m21`, baslik: `Yapay zekâyla formül yazmak ve doğrulamak`, sure: 10,
    ozet: `ChatGPT, Copilot gibi araçlar formülü çoğu zaman İngilizce ve virgülle verir; bazen yanlış verir. Türkçeye çevirmek, küçük bir örnekle doğrulamak ve veriyi göndermeden önce korumak.`,
    hedefler: [`İngilizce formülü Türkçe Excel yazımına çevirmek`, `Bağımsız değişken sırası gibi tipik yapay zekâ hatalarını yakalamak`, `Sonucu ikinci bir yolla doğrulamak`],
    anlatim: [
      `Yapay zekâ araçları formülü genellikle **İngilizce işlev adı ve virgülle** verir: =SUMIFS(H2:H241,F2:F241,"Kitap"). Türkçe Excel'de işlev adları Türkçe, ayırıcı **;**, ondalık **,** olmalıdır: =ÇOKETOPLA(H2:H241;F2:F241;"Kitap"). Kesit'teki TR ⇄ EN düğmesi bu çeviriyi yapar.`,
      `Sık hatalar: ETOPLA ile ÇOKETOPLA'nın **bağımsız değişken sırasını karıştırmak**, mutlak başvuruyu ($) unutmak, olmayan bir işlev uydurmak, tarih ölçütünü metin yazmak. Formül hata vermeden yanlış sonuç verebilir.`,
      `**Doğrulama:** sonucu ikinci bir yolla hesaplayın: özet tablo, filtre + durum çubuğundaki toplam ya da elle seçilmiş birkaç satır. İki yol aynı sayıyı veriyorsa formüle güvenin. Copilot da dahil hiçbir aracın cevabını kontrol etmeden rapora koymayın.`,
      `**Veri:** müşteri adı, telefon, maaş gibi kişisel ya da şirkete ait veriyi dış bir yapay zekâya göndermeyin. Soruyu sütun adları ve birkaç uydurma satırla sorun ya da veriyi önce maskeleyin.`,
    ],
    ornek: { sayfa: S, hucre: `M2`, formul: `=ÇOKETOPLA(H2:H241;F2:F241;"Kitap";K2:K241;"<>İptal")`, aciklama: `Yapay zekânın verdiği =SUMIFS(H2:H241,F2:F241,"Kitap",K2:K241,"<>İptal") formülünün Türkçe yazımı.` },
    alistirmalar: [
      { id: `a1`, soru: `Yapay zekâ şu formülü verdi: =SUMIFS(H2:H241,F2:F241,"Kitap",K2:K241,"<>İptal"). M2'ye Türkçe Excel yazımıyla yazın.`, sayfa: S, hedef: `M2`, cozum: `=ÇOKETOPLA(H2:H241;F2:F241;"Kitap";K2:K241;"<>İptal")`, gerekli: [`SUMIFS`], ipuclari: [`SUMIFS → ÇOKETOPLA, virgül → noktalı virgül.`] },
      { id: `a2`, soru: `"Spor kategorisinin toplam adedi" için yapay zekâ =ETOPLA(H2:H241;"Spor";F2:F241) önerdi ve sonuç 0 çıktı. M2'ye doğru formülü yazın.`, sayfa: S, hedef: `M2`, cozum: `=ETOPLA(F2:F241;"Spor";H2:H241)`, gerekli: [`SUMIF`], ipuclari: [`ETOPLA'da önce koşul aralığı, en son toplanan aralık.`] },
      { id: `a3`, soru: `Yapay zekâ "ortalama fiyatın KDV'li hâli" için =ROUND(AVERAGE(I2:I241)*1.2,2) verdi. M2'ye Türkçe yazımla yazın.`, sayfa: S, hedef: `M2`, cozum: `=YUVARLA(ORTALAMA(I2:I241)*1,2;2)`, gerekli: [`ROUND`, `AVERAGE`], ipuclari: [`1.2 → 1,2; ayırıcı ;.`] },
      { id: `a4`, tur: `secmeli`, soru: `Yapay zekânın yazdığı bir ÇOKETOPLA formülü raporda kullanılacak. En iyi doğrulama hangisi?`, secenekler: [`Formül hata vermiyorsa doğrudur`, `Aynı soruyu yapay zekâya tekrar sormak`, `Sonucu özet tablo ya da filtre + durum çubuğu toplamıyla karşılaştırmak`, `Formülü başka bir hücreye kopyalamak`], dogru: 2, aciklama: `Bağımsız bir yolla aynı sayıya ulaşmak en güvenilir doğrulamadır; hata vermeyen formül de yanlış sonuç verebilir.`, yanlisAciklama: { 0: `Yanlış aralık ya da sıra hata vermeden yanlış sonuç üretir.`, 1: `Aynı kaynak aynı hatayı tekrarlayabilir.`, 3: `Kopya aynı sonucu verir; doğrulamaz.` } },
    ],
    sikHata: { yanlis: `Yapay zekâya müşteri listesini olduğu gibi yapıştırmak`, dogru: `Sütun adları ve birkaç uydurma satırla sormak ya da veriyi maskelemek`, neden: `Kişisel veri dışarı çıkar (KVKK); formülü bulmak için gerçek veriye gerek yoktur.` },
    mulakat: { soru: `Yapay zekâ araçlarını Excel işinizde nasıl kullanırsınız?`, cevap: `Formül fikri, hata açıklaması ve VBA iskeleti için. Gelen formülü Türkçe yazıma çevirir, küçük bir örnekte ve ikinci bir yolla (özet tablo) doğrularım. Gerçek kişisel veriyi göndermem; soruyu yapı ve uydurma satırlarla sorarım.` },
  },
];
