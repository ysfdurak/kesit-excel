// Modül 1–4: temel, hesap, mantık, koşullu özet.
// Sayfalar: Satışlar (A Sipariş No, B Tarih, C Müşteri, D Şehir, E Kanal, F Kategori, G Ürün, H Adet, I Birim Fiyat, J İndirim, K Durum; 2–241)
//           Ürünler (A Ürün No, B Ürün, C Kategori, D Fiyat, E Maliyet, F Stok; 2–41)
export const DERSLER_1 = [
  // ---------------------------------------------------------------- M1 Excel'in mantığı
  {
    id: 'm1-d1', modul: 'm1', baslik: 'Hücre, adres ve değer türleri', sure: 8,
    ozet: 'Her hücrenin bir adresi ve bir türü var: sayı, metin, tarih, mantıksal. Hesap hataların çoğu türden çıkar.',
    hedefler: ['Hücre adresini (B7) ve aralığı (A2:K241) okumak', 'Sayı ile sayı gibi görünen metni ayırmak', 'Tarihin aslında bir sayı olduğunu görmek'],
    anlatim: [
      'Excel bir ızgaradır: sütunlar harfle (A, B, … Z, AA), satırlar sayıyla adlanır. **B7** "B sütunu, 7. satır" demektir. İki köşe arasına iki nokta koyunca aralık olur: **A2:K241** Satışlar tablosunun tüm verisidir.',
      'Her hücre dört türden birini taşır. **Sayı** sağa yaslanır ve hesaba girer. **Metin** sola yaslanır; "1.250" yazılmış ama metin olarak gelmiş bir tutar toplanmaz. **Mantıksal** DOĞRU ya da YANLIŞ\'tır. **Tarih** ise ayrı bir tür değildir: Excel tarihi 1 Ocak 1900\'den bu yana geçen gün sayısı olarak saklar ve biçimle gösterir.',
      'Bu son nokta önemli: Satışlar sayfasında B2 "01.01.2024" görünür ama içinde **45292** vardır. İki tarihi çıkarınca gün farkı, tarihe 30 ekleyince 30 gün sonrası çıkar. Saat de günün kesridir: 0,5 öğlen 12.00\'dir.',
      'Bir hücrenin gerçekte ne tuttuğunu görmek için hücreyi seçip formül çubuğuna bakın. Kesit ızgarasında seçili hücrenin türü formül çubuğunun yanında yazar.',
    ],
    ornek: { sayfa: 'Satışlar', hucre: 'M2', formul: '=B3-B2', aciklama: 'İki sipariş tarihi arasındaki gün farkı: tarihler sayı olduğu için çıkarma doğrudan çalışır.' },
    alistirmalar: [
      { id: 'a1', soru: 'M2 hücresine ilk siparişin (B2) 30 gün sonrasını veren formülü yazın.', sayfa: 'Satışlar', hedef: 'M2', cozum: '=B2+30', bicim: 'gg.aa.yyyy', ipuclari: ['Tarih bir sayıdır; gün eklemek için toplama yeter.', 'B2 hücresine başvurun, tarihi elle yazmayın.'] },
      { id: 'a2', soru: 'M2 hücresine ilk satırın tutarını (Adet × Birim Fiyat) yazın.', sayfa: 'Satışlar', hedef: 'M2', cozum: '=H2*I2', ipuclari: ['Adet H, birim fiyat I sütununda.', 'Çarpma işleci * işaretidir.'] },
    ],
    sikHata: { yanlis: 'Tarihi =01.01.2024+30 diye yazmak', dogru: '=B2+30 ya da =TARİH(2024;1;1)+30', neden: 'Formülde 01.01.2024 bir tarih değil, okunamayan bir ifadedir. Tarihi hücreden ya da TARİH işleviyle alın.' },
    mulakat: { soru: 'Excel tarihi nasıl saklar? Bunun pratik sonucu nedir?', cevap: 'Tarih, 1900 başından bu yana geçen gün sayısıdır; saat günün kesridir. Bu yüzden tarihler çıkarılabilir, toplanabilir, sıralanabilir ve koşullarda büyük/küçük ile karşılaştırılabilir. Metin olarak gelen tarihler bunların hiçbirini yapamaz; önce sayıya çevrilmeleri gerekir.' },
  },
  {
    id: 'm1-d2', modul: 'm1', baslik: 'İlk formül: işleçler ve öncelik', sure: 8,
    ozet: 'Formül = ile başlar. İşlem sırası matematiktekiyle aynıdır, ama Excel\'e özgü iki tuzak var.',
    hedefler: ['+ − * / ^ & ve % işleçlerini kullanmak', 'Parantezle işlem sırasını yönetmek', '-2^2 ve & tuzaklarını bilmek'],
    anlatim: [
      'Formül her zaman **=** ile başlar. Başında = olmayan "H2*I2" bir metindir, hesaplanmaz. Formülün sonucu hücrede, kendisi formül çubuğunda görünür.',
      'İşleçler: **+ − * /** dört işlem, **^** üs, **&** metin birleştirme, **%** yüzde (5% = 0,05). Karşılaştırma işleçleri **= <> < > <= >=** DOĞRU/YANLIŞ üretir.',
      'Öncelik sırası: önce parantez, sonra yüzde, üs, çarpma-bölme, toplama-çıkarma, en son & ve karşılaştırma. Satır tutarını indirimle hesaplarken parantez şarttır: **=H2*I2*(1-J2)**. Parantezsiz =H2*I2*1-J2 önce çarpar, sonra çıkarır; sonuç neredeyse aynı görünür ama yanlıştır.',
      'İki Excel tuzağı: **-2^2** Excel\'de 4 çıkar, çünkü eksi işareti üsten önce uygulanır (matematikte −4). **2^3^2** soldan hesaplanır: (2^3)^2 = 64. Şüphedeyseniz parantez koyun; okuyan kişi de rahat eder.',
    ],
    ornek: { sayfa: 'Satışlar', hucre: 'M2', formul: '=H2*I2*(1-J2)', aciklama: 'İndirimli satır tutarı. Parantez olmadan indirim yanlış uygulanır.' },
    alistirmalar: [
      { id: 'a1', soru: 'L sütununa her satırın indirimli tutarını yazın. L2\'ye formülü yazıp L241\'e kadar doldurun (Kesit\'te "Aşağı doldur").', sayfa: 'Satışlar', hedef: 'L2:L241', cozum: '=H2*I2*(1-J2)', ipuclari: ['Tutar = Adet × Birim Fiyat × (1 − İndirim).', 'İndirim yüzde olarak saklanır: 0,1 = %10.'] },
      { id: 'a2', soru: 'M2 hücresine ilk satırdaki ürün adı ile şehri arasında " - " olacak şekilde birleştirin (ör. "Termos 750ml - İzmir").', sayfa: 'Satışlar', hedef: 'M2', cozum: '=G2&" - "&D2', ipuclari: ['Birleştirme işleci &.', 'Metin parçaları çift tırnak içinde yazılır.'] },
    ],
    sikHata: { yanlis: '=H2*I2*1-J2', dogru: '=H2*I2*(1-J2)', neden: 'Çarpma çıkarmadan önce yapılır; indirim tutardan değil 1\'den düşülmeli.' },
    mulakat: { soru: '=-2^2 Excel\'de kaç verir, neden?', cevap: '4. Excel\'de tekli eksi işareti üs işleminden önce uygulanır, yani (−2)^2 hesaplanır. Matematik kuralını istiyorsanız =-(2^2) yazarsınız.' },
  },
  {
    id: 'm1-d3', modul: 'm1', baslik: 'Göreli ve mutlak başvuru ($)', sure: 10,
    ozet: 'Formül kopyalanınca başvurular kayar. $ işareti neyin kaymayacağını söyler. Excel\'deki en yaygın hata buradan çıkar.',
    hedefler: ['Göreli (A1), mutlak ($A$1) ve karma (A$1, $A1) başvuruyu ayırmak', 'F4 ile $ eklemek', 'Sabit bir hücreye (kur, oran) bağlı formülü doğru kopyalamak'],
    anlatim: [
      'L2\'deki **=H2*I2** formülünü L3\'e kopyalayınca Excel onu **=H3*I3** yapar. Excel başvuruyu "iki sütun solumdaki hücre" diye hatırlar; buna **göreli başvuru** denir. Çoğu zaman istenen budur.',
      'Ama bazen bir hücre sabit kalmalıdır: KDV oranı, döviz kuru, hedef. O hücreye **$** konur: **$N$1** kopyalanınca hiç kaymaz. $ yalnız sütunun önündeyse (**$N1**) sütun sabit, satır kayar; yalnız satırın önündeyse (**N$1**) satır sabit, sütun kayar. Bunlara **karma başvuru** denir ve çapraz tablolarda kullanılır.',
      'Formül yazarken başvurunun üstündeyken **F4**\'e basmak sırasıyla $N$1 → N$1 → $N1 → N1 arasında dolaşır. Kesit\'in formül çubuğunda da F4 aynı işi yapar.',
      'Belirti hep aynıdır: ilk satır doğru, aşağısı yanlış ya da 0. Bunu görünce ilk bakılacak yer $ işaretleridir.',
    ],
    ornek: { sayfa: 'Satışlar', hucre: 'L2', formul: '=H2*I2*$N$1', aciklama: 'N1\'deki oran (1,2) tüm satırlarda aynı kalır; H2 ve I2 her satırda kayar.', hazirlik: { N1: 1.2, M1: 'KDV çarpanı' } },
    alistirmalar: [
      { id: 'a1', soru: 'N1 hücresinde KDV çarpanı (1,2) var. L sütununa KDV dahil satır tutarını yazın: Adet × Birim Fiyat × N1. L2\'den L241\'e doldurun.', sayfa: 'Satışlar', hedef: 'L2:L241', cozum: '=H2*I2*$N$1', hazirlik: { N1: 1.2, M1: 'KDV çarpanı' }, ipuclari: ['N1 hiçbir satırda değişmemeli.', 'F4 ile N1\'i $N$1 yapın.'] },
      { id: 'a2', soru: 'N1\'de dolar kuru (32,5) var. L sütununa birim fiyatın dolar karşılığını yazın (I ÷ kur), L2:L241.', sayfa: 'Satışlar', hedef: 'L2:L241', cozum: '=I2/$N$1', hazirlik: { N1: 32.5, M1: 'USD kuru' }, ipuclari: ['Bölen hücre sabit kalmalı.', 'Kur hücresine $ koymazsanız L3 boş bir hücreye (N2) böler: #BÖL/0!.'] },
    ],
    sikHata: { yanlis: '=I2/N1 formülünü aşağı kopyalamak', dogru: '=I2/$N$1', neden: 'Kopyalanınca N1 → N2, N3… olur; boş hücreye bölmek #BÖL/0! verir.' },
    mulakat: { soru: 'Karma başvuruya (A$1) ne zaman ihtiyaç duyarsınız?', cevap: 'Bir formülü hem sağa hem aşağı kopyalarken: örneğin satırlarda ürünler, sütunlarda aylar olan bir çarpım tablosunda fiyat sütunu ($B2) ve ay başlığı satırı (C$1) sabitlenir. Böylece tek formül tüm tabloyu doldurur.' },
  },
  {
    id: 'm1-d4', modul: 'm1', baslik: 'Türkçe ve İngilizce Excel: adlar ve ayırıcılar', sure: 7,
    ozet: 'Aynı formül Türkçe Excel\'de =ETOPLA(A:A;"x";B:B), İngilizcede =SUMIF(A:A,"x",B:B) yazılır. İnternetteki örneklerin çoğu İngilizcedir.',
    hedefler: ['Türkçe ve İngilizce işlev adlarını eşlemek', 'Ayırıcı farkını (; ve ,) ve ondalık farkını bilmek', 'İngilizce bir formülü Türkçeye çevirmek'],
    anlatim: [
      'Excel işlev adlarını arayüz diline göre gösterir. Dosyanın içinde formüller hep İngilizce saklanır, açan kişinin Excel\'i kendi diline çevirir. Yani Türkçe Excel\'de yazdığınız ETOPLA, İngilizce Excel\'de SUMIF görünür; dosya bozulmaz.',
      'Fark ayırıcıdadır ve bölge ayarından gelir. Türkiye ayarında ondalık virgüldür (1,5), bu yüzden bağımsız değişkenler **noktalı virgülle** ayrılır: =YUVARLA(2,675;2). İngilizcede ondalık noktadır, ayırıcı virgüldür: =ROUND(2.675,2).',
      'Kesit ikisini de anlar: formülde ; varsa ya da işlev adı Türkçeyse Türkçe yazım sayılır. Formül çubuğundaki **TR/EN** düğmesi formülü bir dilden ötekine çevirir. İnternette bulduğunuz bir İngilizce formülü yapıştırıp çevirerek öğrenebilirsiniz.',
      'Dikkat: Microsoft\'un Türkçe yardım sayfaları bile örnekleri çoğu zaman virgülle yazar. Türkçe Excel\'e yapıştırınca "Bu formülde bir sorun var" uyarısı alırsanız ilk bakılacak yer ayırıcıdır.',
    ],
    ornek: { sayfa: 'Satışlar', hucre: 'M2', formul: '=SUMIF(F2:F241,"Kitap",H2:H241)', aciklama: 'İngilizce yazım da çalışır. TR/EN düğmesiyle =ETOPLA(F2:F241;"Kitap";H2:H241) hâline gelir.' },
    alistirmalar: [
      { id: 'a1', soru: 'İnternetten şu formülü buldunuz: =ROUND(AVERAGE(I2:I241),2). M2\'ye Türkçe yazımla yazın.', sayfa: 'Satışlar', hedef: 'M2', cozum: '=YUVARLA(ORTALAMA(I2:I241);2)', gerekli: ['ROUND', 'AVERAGE'], ipuclari: ['ROUND = YUVARLA, AVERAGE = ORTALAMA.', 'Türkçede ayırıcı ; işaretidir.'] },
      { id: 'a2', soru: 'M2\'ye Kitap kategorisinde satılan toplam adedi Türkçe işlevle yazın.', sayfa: 'Satışlar', hedef: 'M2', cozum: '=ETOPLA(F2:F241;"Kitap";H2:H241)', ipuclari: ['SUMIF\'in Türkçesi ETOPLA.', 'Önce kategorinin olduğu aralık, sonra ölçüt, en son toplanacak aralık.'] },
    ],
    sikHata: { yanlis: 'Türkçe Excel\'e =ROUND(A1,2) yapıştırmak', dogru: '=YUVARLA(A1;2)', neden: 'Türkçe Excel ROUND\'u tanımaz (#AD?) ve virgülü ondalık sanar.' },
    mulakat: { soru: 'Türkçe Excel\'de hazırladığınız dosyayı İngilizce Excel kullanan bir meslektaşınız açarsa formüller bozulur mu?', cevap: 'Hayır. Formüller dosyada dilden bağımsız (İngilizce) saklanır; her Excel kendi diline çevirerek gösterir. Bozulabilecek olan METNEÇEVİR gibi biçim kodlarıdır ("gg.aa.yyyy" İngilizcede "dd.mm.yyyy"); bunlar metin olduğu için çevrilmez.' },
  },

  // ---------------------------------------------------------------- M2 Temel hesaplar
  {
    id: 'm2-d1', modul: 'm2', baslik: 'TOPLA, ORTALAMA, MİN, MAK, BAĞ_DEĞ_SAY', sure: 9,
    ozet: 'Beş temel özet işlevi. Hangisinin boşu, metni, sıfırı nasıl saydığını bilmek sonucu değiştirir.',
    hedefler: ['Temel özet işlevlerini aralıkla kullanmak', 'BAĞ_DEĞ_SAY ile BAĞ_DEĞ_DOLU_SAY farkını bilmek', 'Boş ve 0 hücrenin ortalamaya etkisini görmek'],
    anlatim: [
      '**TOPLA** sayıları toplar, **ORTALAMA** ortalamasını alır, **MİN** ve **MAK** en küçük ve en büyük sayıyı verir. Hepsi aralık alır: =TOPLA(H2:H241).',
      'Saymanın iki yolu var: **BAĞ_DEĞ_SAY** yalnız sayı içeren hücreleri, **BAĞ_DEĞ_DOLU_SAY** boş olmayan her hücreyi sayar. Sipariş sayısını müşteri adı sütunundan sayacaksanız BAĞ_DEĞ_DOLU_SAY gerekir; BAĞ_DEĞ_SAY metni görmez ve 0 verir.',
      'Bu işlevler aralıktaki metni ve boş hücreyi atlar, ama **0 olan hücreyi sayar**. Satış girilmemiş günü boş bırakmak ortalamayı yükseltir, 0 yazmak düşürür. Hangisi doğru? İş sorusuna bağlı: "satış olan günlerin ortalaması" mı, "tüm günlerin" mi?',
      'Durum sütununda İptal ve İade satırları da var. Bu derste tüm satırları kullanıyoruz; yalnız gerçekleşen satışları saymak koşullu özet modülünün konusu.',
    ],
    ornek: { sayfa: 'Satışlar', hucre: 'M2', formul: '=ORTALAMA(I2:I241)', aciklama: 'Ortalama birim fiyat. MİN ve MAK ile yan yana koyunca dağılım hakkında fikir verir.' },
    alistirmalar: [
      { id: 'a1', soru: 'M2\'ye toplam satılan adedi yazın.', sayfa: 'Satışlar', hedef: 'M2', cozum: '=TOPLA(H2:H241)', ipuclari: ['Adet H sütununda.'] },
      { id: 'a2', soru: 'M2\'ye tablodaki sipariş satırı sayısını müşteri adı sütunundan (C) sayın.', sayfa: 'Satışlar', hedef: 'M2', cozum: '=BAĞ_DEĞ_DOLU_SAY(C2:C241)', gerekli: ['COUNTA'], ipuclari: ['C sütunu metin; BAĞ_DEĞ_SAY metni saymaz.'] },
      { id: 'a3', soru: 'M2\'ye en pahalı birim fiyat ile en ucuz birim fiyat arasındaki farkı yazın.', sayfa: 'Satışlar', hedef: 'M2', cozum: '=MAK(I2:I241)-MİN(I2:I241)', ipuclari: ['İki işlevin sonucunu çıkarın.'] },
    ],
    sikHata: { yanlis: '=BAĞ_DEĞ_SAY(C2:C241) ile müşteri saymak', dogru: '=BAĞ_DEĞ_DOLU_SAY(C2:C241)', neden: 'BAĞ_DEĞ_SAY yalnız sayıları sayar; metin sütununda 0 verir.' },
    mulakat: { soru: 'Bir sütunda boş hücreler ve 0 değerleri var. ORTALAMA ikisine nasıl davranır?', cevap: 'Boş hücreleri yok sayar, 0\'ları sayar. Bu yüzden eksik veriyi 0 ile doldurmak ortalamayı düşürür. Hangisinin doğru olduğu iş sorusuna bağlıdır; raporda varsayımı yazmak gerekir.' },
  },
  {
    id: 'm2-d2', modul: 'm2', baslik: 'Yuvarlama: YUVARLA ve ailesi', sure: 8,
    ozet: 'Biçimle yuvarlamak yalnız görüntüyü değiştirir; YUVARLA değeri değiştirir. Toplamlar bu yüzden "tutmaz".',
    hedefler: ['YUVARLA, YUKARIYUVARLA, AŞAĞIYUVARLA ve TAVANAYUVARLA.MATEMATİK\'i seçmek', 'Biçim yuvarlaması ile değer yuvarlamasını ayırmak', 'Koli/palet gibi yukarı yuvarlama işlerini çözmek'],
    anlatim: [
      'Hücre biçimini "2 ondalık" yapmak sayıyı **göstermeyi** değiştirir, içindeki değeri değil. Faturada satırları 2 ondalık gösterip toplamı ayrıca hesaplarsanız kuruş farkları çıkar. Değerin kendisini yuvarlamak için **YUVARLA(sayı; basamak)** kullanılır.',
      'Basamak 0 tam sayıya, 2 kuruşa, **-2 yüzlere** yuvarlar: =YUVARLA(1234,56;-2) → 1200. Yarım (0,5) her zaman sıfırdan uzağa gider: 2,5 → 3, −2,5 → −3.',
      '**YUKARIYUVARLA** her zaman sıfırdan uzağa, **AŞAĞIYUVARLA** sıfıra doğru yuvarlar. Depoda 25 adet ürün 12\'lik kolilere giriyorsa koli sayısı =YUKARIYUVARLA(25/12;0) = 3\'tür; YUVARLA 2 verir ve bir koli eksik kalır.',
      '**TAVANAYUVARLA.MATEMATİK(sayı; kat)** bir sayının katına yukarı yuvarlar: fiyatları 50 kuruşun katına çekmek, vardiya süresini 15 dakikaya yuvarlamak gibi.',
    ],
    ornek: { sayfa: 'Satışlar', hucre: 'M2', formul: '=YUVARLA(H2*I2*(1-J2);2)', aciklama: 'İndirimli tutar kuruşa yuvarlanır; toplamlar bu değerlerle tutarlı olur.' },
    alistirmalar: [
      { id: 'a1', soru: 'L sütununa indirimli satır tutarını kuruşa (2 basamak) yuvarlanmış olarak yazın, L2:L241.', sayfa: 'Satışlar', hedef: 'L2:L241', cozum: '=YUVARLA(H2*I2*(1-J2);2)', gerekli: ['ROUND'], ipuclari: ['Önce tutarı hesaplayın, sonra YUVARLA ile sarın.'] },
      { id: 'a2', soru: 'Her siparişteki ürünler 4\'lü paketlerde gönderiliyor. L sütununa gereken paket sayısını yazın (Adet ÷ 4, yukarı yuvarlanmış), L2:L241.', sayfa: 'Satışlar', hedef: 'L2:L241', cozum: '=YUKARIYUVARLA(H2/4;0)', ipuclari: ['5 ürün 2 paket ister.', 'YUVARLA 5/4\'ü 1 yapar; yetmez.'] },
    ],
    sikHata: { yanlis: 'Hücre biçimiyle 2 ondalık gösterip toplamın tuttuğunu varsaymak', dogru: 'Değeri =YUVARLA(…;2) ile yuvarlamak', neden: 'Biçim yalnız görüntüyü değiştirir; toplam yuvarlanmamış değerlerden hesaplanır.' },
    mulakat: { soru: 'Raporda satırların toplamı alttaki toplamla 1 kuruş tutmuyor. Neden olabilir?', cevap: 'Satırlar biçimle yuvarlanmış gösteriliyor ama değerleri daha çok ondalık taşıyor; toplam gerçek değerlerden hesaplanıyor. Çözüm satır değerlerini YUVARLA ile yuvarlamak ya da toplamı yuvarlanmış satırlardan almaktır. Hangi yöntemin kullanılacağı muhasebe kuralına göre seçilir.' },
  },
  {
    id: 'm2-d3', modul: 'm2', baslik: 'Oran, pay ve değişim yüzdesi', sure: 9,
    ozet: 'Pay = parça ÷ bütün, değişim = (yeni − eski) ÷ eski. Bütünü sabitlemek için $ gerekir.',
    hedefler: ['Bir değerin toplam içindeki payını hesaplamak', 'Hedefe göre gerçekleşme ve sapma yüzdesi bulmak', 'Yüzde biçimi ile değeri ayırmak'],
    anlatim: [
      'Pay hesabı bir bölmedir: **parça ÷ bütün**. Hücre biçimini yüzde yapınca 0,25 "%25" görünür; değer yine 0,25\'tir. Formüle ×100 eklemeyin, sonra yüzde biçimi verirseniz %2500 görürsünüz.',
      'Her satırın toplam içindeki payını hesaplarken bütün tek bir hücredir ve sabit kalmalıdır: =H2/TOPLA($H$2:$H$241). $ unutulursa aralık her satırda bir aşağı kayar ve paylar gittikçe büyür.',
      'Bütçe sayfasında hedef ve gerçekleşen var. **Gerçekleşme oranı** = Gerçekleşen ÷ Hedef; **sapma** = (Gerçekleşen − Hedef) ÷ Hedef. Sapma pozitifse hedefin üstündesiniz. Hedef 0 olabilecekse bölmeyi EĞERHATA ile korumak gerekir.',
      'Yönetici için tek cümle şöyle kurulur: "Mart\'ta Elektronik hedefin %12 üstünde." Yüzde tek başına yetmez; aynı satıra tutar farkını da koymak yorumu kolaylaştırır.',
    ],
    ornek: { sayfa: 'Bütçe', hucre: 'E2', formul: '=(D2-C2)/C2', aciklama: 'Hedefe göre sapma. Yüzde biçimiyle %12 gibi görünür.' },
    alistirmalar: [
      { id: 'a1', soru: 'Bütçe sayfasında E sütununa her satırın sapma oranını yazın: (Gerçekleşen − Hedef) ÷ Hedef, E2:E43.', sayfa: 'Bütçe', hedef: 'E2:E43', cozum: '=(D2-C2)/C2', ipuclari: ['Parantez olmadan önce bölme yapılır.'] },
      { id: 'a2', soru: 'Satışlar sayfasında L sütununa her satırın adedinin toplam adet içindeki payını yazın, L2:L241.', sayfa: 'Satışlar', hedef: 'L2:L241', cozum: '=H2/TOPLA($H$2:$H$241)', ipuclari: ['Bütün = TOPLA(H2:H241).', 'Toplam aralığı kopyalanırken kaymamalı.'] },
    ],
    sikHata: { yanlis: '=H2/TOPLA(H2:H241) formülünü aşağı kopyalamak', dogru: '=H2/TOPLA($H$2:$H$241)', neden: 'Aralık her satırda kayar; son satırda bütün yalnız kendisi olur ve pay %100 çıkar.' },
    mulakat: { soru: 'Geçen yıl 80, bu yıl 100 satış oldu. Artış yüzdesi nedir? Ters yönde (100\'den 80\'e) düşüş yüzdesi aynı mıdır?', cevap: 'Artış (100−80)/80 = %25. Düşüş (80−100)/100 = −%20. Aynı değildir, çünkü taban değişir. Raporlarda tabanı (neye göre) açıkça yazmak gerekir.' },
  },
  {
    id: 'm2-d4', modul: 'm2', baslik: 'Hata değerleri ve EĞERHATA', sure: 9,
    ozet: '#BÖL/0!, #YOK, #DEĞER!, #BAŞV!, #AD? Her biri ayrı bir şey söyler. Gizlemeden önce okuyun.',
    hedefler: ['Beş temel hata değerinin nedenini tanımak', 'EĞERHATA ve EĞERYOKSA ile hatayı karşılamak', 'Hatayı gizlemenin riskini bilmek'],
    anlatim: [
      '**#BÖL/0!** sıfıra ya da boş hücreye bölmedir. **#YOK** aranan değerin bulunamamasıdır (DÜŞEYARA, KAÇINCI). **#DEĞER!** yanlış türdür: metinle toplama gibi. **#BAŞV!** silinmiş ya da tablonun dışına düşen başvurudur. **#AD?** Excel\'in tanımadığı bir addır: yanlış yazılmış işlev ya da tırnaksız metin.',
      'Hata zincirleme yayılır: bir hücredeki #YOK onu kullanan TOPLA\'yı da #YOK yapar. Bu iyi bir şeydir; sorunu saklamaz.',
      '**EĞERHATA(değer; hata_ise)** herhangi bir hatayı yakalayıp yerine başka değer koyar. Sapma oranında hedef 0 ise "—" yazdırmak meşrudur. Ama her şeyi EĞERHATA ile sarmak gerçek yazım hatalarını da gizler: işlev adını yanlış yazsanız bile sonuç "—" olur.',
      'Daha güvenlisi **EĞERYOKSA**: yalnız #YOK\'u karşılar. Aramalarda "bulunamadı" demek için onu kullanın; diğer hatalar görünür kalsın.',
    ],
    ornek: { sayfa: 'Bütçe', hucre: 'E2', formul: '=EĞERHATA((D2-C2)/C2;"—")', aciklama: 'Hedef 0 olsaydı #BÖL/0! yerine — görünür.' },
    alistirmalar: [
      { id: 'a1', soru: 'Bütçe sayfasında E sütununa gerçekleşme oranını (Gerçekleşen ÷ Hedef) yazın; hata olursa 0 göstersin. E2:E43.', sayfa: 'Bütçe', hedef: 'E2:E43', cozum: '=EĞERHATA(D2/C2;0)', gerekli: ['IFERROR'], ipuclari: ['=EĞERHATA(hesap; hata_ise).'] },
      { id: 'a2', soru: 'Satışlar sayfasında N1\'de bir durum adı var ("Kayıp"). M2\'ye bu durumdaki satırların ortalama birim fiyatını EĞERORTALAMA ile yazın. Böyle bir durum yoksa ortalama #BÖL/0! verir; o zaman 0 görünsün.', sayfa: 'Satışlar', hedef: 'M2', cozum: '=EĞERHATA(EĞERORTALAMA(K2:K241;N1;I2:I241);0)', hazirlik: { N1: 'Kayıp', M1: 'Durum' }, gerekli: ['IFERROR', 'AVERAGEIF'], varyantsiz: true, ipuclari: ['EĞERORTALAMA(K2:K241; N1; I2:I241) eşleşen satır yoksa sıfıra böler.', 'Dışına EĞERHATA(…; 0) yazın. N1\'e "İptal" yazıp sonucun değiştiğini görün.'] },
    ],
    sikHata: { yanlis: 'Tüm formülleri =EĞERHATA(…;"") ile sarmak', dogru: 'Beklenen hatayı karşılamak (EĞERYOKSA) ya da nedenini düzeltmek', neden: 'Yazım hataları ve bozuk başvurular da boş görünür; rapor sessizce yanlış olur.' },
    mulakat: { soru: 'EĞERHATA ile EĞERYOKSA arasındaki fark nedir, hangisini tercih edersiniz?', cevap: 'EĞERHATA her hatayı, EĞERYOKSA yalnız #YOK\'u yakalar. Aramalarda "bulunamadı" durumu beklenen tek hatadır; onu EĞERYOKSA ile karşılarım. Böylece yanlış sütun numarası (#BAŞV!) ya da tür hatası (#DEĞER!) gizlenmez.' },
  },

  // ---------------------------------------------------------------- M3 Mantık
  {
    id: 'm3-d1', modul: 'm3', baslik: 'EĞER: koşula göre sonuç', sure: 9,
    ozet: 'EĞER bir soru sorar ve cevaba göre iki sonuçtan birini yazar. Koşul her zaman DOĞRU/YANLIŞ üretir.',
    hedefler: ['EĞER\'in üç bağımsız değişkenini kurmak', 'Metin ve sayı karşılaştırmasını doğru yazmak', 'Sonuç olarak hesap (yalnız metin değil) döndürmek'],
    anlatim: [
      '**=EĞER(koşul; doğruysa; yanlışsa)**. Koşul bir karşılaştırmadır: I2>1000, K2="İptal", H2>=3. Metin tırnak içinde yazılır; karşılaştırma büyük/küçük harfe duyarsızdır ("iptal" = "İptal").',
      'Sonuçlar yalnız metin olmak zorunda değildir. Kargo ücreti kuralı: "Tutar 500 TL ve üstüyse kargo bedava, değilse 49,90" → =EĞER(H2*I2>=500;0;49,9). Sonuç sayı olduğu için toplanabilir.',
      'Yanlışsa kısmını boş bırakırsanız Excel YANLIŞ yazar. Boş görünmesini istiyorsanız "" (boş metin) verin. Ama dikkat: "" bir metindir; o sütunu TOPLA atlar, ama "=" ile karşılaştırma ve BAĞ_DEĞ_DOLU_SAY onu dolu sayar.',
      'Koşulu doğrudan da yazabilirsiniz: =I2>1000 hücreye DOĞRU/YANLIŞ yazar. Önce koşulu ayrı bir sütunda görmek, büyük formüllerde hatayı bulmanın en hızlı yoludur.',
    ],
    ornek: { sayfa: 'Satışlar', hucre: 'L2', formul: '=EĞER(H2*I2>=500;0;49,9)', aciklama: '500 TL ve üstü siparişe kargo bedava.' },
    alistirmalar: [
      { id: 'a1', soru: 'L sütununa birim fiyatı 1000 TL\'den büyükse "Yüksek", değilse "Normal" yazın. L2:L241.', sayfa: 'Satışlar', hedef: 'L2:L241', cozum: '=EĞER(I2>1000;"Yüksek";"Normal")', gerekli: ['IF'], ipuclari: ['Koşul: I2>1000.'] },
      { id: 'a2', soru: 'L sütununa Durum "İptal" ise 0, değilse indirimli tutarı (H×I×(1−J)) yazın. L2:L241. (İade de eklemek bir sonraki dersin konusu.)', sayfa: 'Satışlar', hedef: 'L2:L241', cozum: '=EĞER(K2="İptal";0;H2*I2*(1-J2))', ipuclari: ['Koşul K2="İptal".', 'Doğruysa 0, yanlışsa tutar.'] },
    ],
    sikHata: { yanlis: '=EĞER(K2=İptal;0;1)', dogru: '=EĞER(K2="İptal";0;1)', neden: 'Tırnaksız İptal bir ad sanılır ve #AD? hatası verir.' },
    mulakat: { soru: 'EĞER\'in yanlışsa kısmına "" yazmanın yan etkisi var mı?', cevap: 'Var. "" boş metindir, gerçek boş hücre değildir. TOPLA onu atlar ama BAĞ_DEĞ_DOLU_SAY sayar, EBOŞSA YANLIŞ döner, sayı bekleyen bir formül #DEĞER! verebilir. Sayısal bir sütunda 0 ya da YOK() daha güvenlidir.' },
  },
  {
    id: 'm3-d2', modul: 'm3', baslik: 'VE, YADA, DEĞİL: koşulları birleştirmek', sure: 8,
    ozet: 'İki koşul birden mi, biri yeter mi? VE ile YADA EĞER\'in içine koşul olarak girer.',
    hedefler: ['VE ile tüm koşulları, YADA ile en az birini aramak', 'EĞER içinde birleşik koşul kurmak', 'Aralık koşulunu (500–1000 arası) VE ile yazmak'],
    anlatim: [
      '**VE(k1; k2; …)** hepsi doğruysa, **YADA(k1; k2; …)** en az biri doğruysa DOĞRU verir. **DEĞİL(k)** tersine çevirir.',
      'Kampanya kuralı: "Elektronik kategorisinde ve Web kanalından gelen siparişler" → =VE(F2="Elektronik";E2="Web"). "İptal ya da iade" → =YADA(K2="İptal";K2="İade").',
      'Aralık koşulu sık yapılan hatadır. "Fiyat 500 ile 1000 arasında" Excel\'de 500<=I2<=1000 diye yazılamaz; **=VE(I2>=500;I2<=1000)** yazılır.',
      'Birleşik koşul EĞER\'in ilk bağımsız değişkenine konur: =EĞER(YADA(K2="İptal";K2="İade");0;H2*I2). Okunurluk için önce koşulu ayrı bir sütunda deneyin.',
    ],
    ornek: { sayfa: 'Satışlar', hucre: 'L2', formul: '=EĞER(YADA(K2="İptal";K2="İade");0;H2*I2*(1-J2))', aciklama: 'Gerçekleşmeyen siparişler ciroya girmez.' },
    alistirmalar: [
      { id: 'a1', soru: 'L sütununa iptal ya da iade olan siparişlerde 0, diğerlerinde indirimli tutarı yazın. L2:L241.', sayfa: 'Satışlar', hedef: 'L2:L241', cozum: '=EĞER(YADA(K2="İptal";K2="İade");0;H2*I2*(1-J2))', gerekli: ['OR'], ipuclari: ['YADA iki koşulu birleştirir.'] },
      { id: 'a2', soru: 'L sütununa birim fiyatı 500 ile 1000 arasında (iki uç dahil) olan satırlarda "Orta", diğerlerinde boş metin ("") yazın. L2:L241.', sayfa: 'Satışlar', hedef: 'L2:L241', cozum: '=EĞER(VE(I2>=500;I2<=1000);"Orta";"")', gerekli: ['AND'], ipuclari: ['500<=I2<=1000 Excel\'de çalışmaz.', 'VE(I2>=500; I2<=1000).'] },
    ],
    sikHata: { yanlis: '=EĞER(500<=I2<=1000;…)', dogru: '=EĞER(VE(I2>=500;I2<=1000);…)', neden: 'Excel önce 500<=I2\'yi DOĞRU/YANLIŞ yapar, sonra onu 1000 ile karşılaştırır; sonuç her zaman DOĞRU çıkar.' },
    mulakat: { soru: '=YADA(K2="İptal";"İade") neden her zaman DOĞRU döner?', cevap: 'İkinci koşul K2="İade" değil, yalnız "İade" metnidir. YADA metni mantıksal değere çeviremez ve hata verir ya da tek başına değerlendirilir. Her koşul tam bir karşılaştırma olmalıdır: YADA(K2="İptal";K2="İade").' },
  },
  {
    id: 'm3-d3', modul: 'm3', baslik: 'Çok kademeli kurallar: iç içe EĞER ve ÇOKEĞER', sure: 10,
    ozet: 'Üç ve daha fazla sonuç gerekiyorsa ÇOKEĞER okunur kalır. Sıra önemlidir: ilk doğru koşul kazanır.',
    hedefler: ['İç içe EĞER ile kademeli sınıflama yapmak', 'Aynı kuralı ÇOKEĞER ile yazmak', 'Koşul sırasının sonuca etkisini görmek'],
    anlatim: [
      'Fiyat segmenti: 2000 ve üstü "Premium", 500 ve üstü "Orta", altı "Ekonomik". İç içe EĞER ile: =EĞER(I2>=2000;"Premium";EĞER(I2>=500;"Orta";"Ekonomik")). Her yeni kademe bir EĞER ve bir kapanış parantezi daha demektir.',
      '**ÇOKEĞER(koşul1; değer1; koşul2; değer2; …)** aynı kuralı düz yazar: =ÇOKEĞER(I2>=2000;"Premium";I2>=500;"Orta";DOĞRU;"Ekonomik"). Son koşulun DOĞRU olması "hiçbiri değilse" demektir; yazmazsanız eşleşmeyen satırlar #YOK verir.',
      '**Sıra her şeydir.** Excel koşulları soldan sağa dener ve ilk doğruda durur. I2>=500\'ü önce yazarsanız 3499 TL\'lik saat de "Orta" olur, çünkü 3499 de 500\'den büyüktür. Büyükten küçüğe ya da en özelden en genele doğru sıralayın.',
      'Kademe sayısı 4–5\'i geçiyorsa kuralları ayrı bir tabloya koyup DÜŞEYARA ile yaklaşık eşleşme yapmak (Arama modülü) daha iyidir: kural değişince formüle dokunmazsınız.',
    ],
    ornek: { sayfa: 'Satışlar', hucre: 'L2', formul: '=ÇOKEĞER(I2>=2000;"Premium";I2>=500;"Orta";DOĞRU;"Ekonomik")', aciklama: 'Üç kademeli fiyat segmenti.' },
    alistirmalar: [
      { id: 'a1', soru: 'L sütununa fiyat segmentini yazın: I ≥ 2000 "Premium", I ≥ 500 "Orta", diğerleri "Ekonomik". L2:L241.', sayfa: 'Satışlar', hedef: 'L2:L241', cozum: '=ÇOKEĞER(I2>=2000;"Premium";I2>=500;"Orta";DOĞRU;"Ekonomik")', ipuclari: ['Büyük eşikten başlayın.', 'ÇOKEĞER\'de son koşul DOĞRU = "geri kalan hepsi".'] },
      { id: 'a2', soru: 'L sütununa sipariş büyüklüğünü yazın: Adet 5 ve üstü "Toptan", 2–4 "Çoklu", 1 "Tekil". L2:L241.', sayfa: 'Satışlar', hedef: 'L2:L241', cozum: '=ÇOKEĞER(H2>=5;"Toptan";H2>=2;"Çoklu";DOĞRU;"Tekil")', ipuclari: ['Önce en büyük eşik.'] },
    ],
    sikHata: { yanlis: '=ÇOKEĞER(I2>=500;"Orta";I2>=2000;"Premium";…)', dogru: 'Büyük eşik önce: I2>=2000, sonra I2>=500', neden: 'İlk doğru koşul kazanır; 2000 üstü değerler de 500 koşulunu sağlar ve hiçbir satır Premium olmaz.' },
    mulakat: { soru: '7 kademeli bir prim kuralını formüle nasıl koyarsınız?', cevap: 'İç içe EĞER ya da uzun ÇOKEĞER yerine kademe tablosu kurarım (alt sınır ve prim oranı) ve DÜŞEYARA/ÇAPRAZARA ile yaklaşık eşleşme yaparım. Kural değişince yalnız tablo güncellenir, formüller aynı kalır ve kuralın kendisi okunur.' },
  },
  {
    id: 'm3-d4', modul: 'm3', baslik: 'Bilgi işlevleri: EBOŞSA, ESAYIYSA, EMETİNSE', sure: 8,
    ozet: 'Veri temizliğinin ilk adımı: hangi hücre boş, hangisi metne dönmüş sayı? Bilgi işlevleri bunu satır satır söyler.',
    hedefler: ['EBOŞSA ile eksik veriyi işaretlemek', 'ESAYIYSA ile metin olarak gelmiş sayıyı yakalamak', 'Bilgi işlevini EĞER ile birlikte kullanmak'],
    anlatim: [
      '**EBOŞSA(hücre)** gerçekten boşsa DOĞRU verir. "" döndüren bir formül boş sayılmaz; o hücre için ="" karşılaştırması daha doğrudur.',
      '**ESAYIYSA(hücre)** sayıysa DOĞRU verir. Dışarıdan gelen veride "1.250,50" metin olarak gelmiş olabilir; ekranda sayı gibi görünür, ama toplamda yoktur. ESAYIYSA ile bir kontrol sütunu kurup YANLIŞ olanları saymak, raporu yayımlamadan önce yapılacak en ucuz testtir.',
      '**EMETİNSE**, **EHATALIYSA**, **EYOKSA** aynı aileden. Hepsi DOĞRU/YANLIŞ verir; EĞER ile sonucu açıklamaya çevirebilirsiniz: =EĞER(EBOŞSA(H8);"Personel çıkış tarihi yok";"").',
      'Personel sayfasında Çıkış sütunu yalnız ayrılanlarda doludur. "Hâlâ çalışıyor mu?" sorusunun cevabı =EBOŞSA(H2)\'dir.',
    ],
    ornek: { sayfa: 'Personel', hucre: 'L2', formul: '=EĞER(EBOŞSA(H2);"Çalışıyor";"Ayrıldı")', aciklama: 'Çıkış tarihi boşsa kişi hâlâ şirkette.' },
    alistirmalar: [
      { id: 'a1', soru: 'Personel sayfasında L sütununa çıkış tarihi (H) boşsa "Çalışıyor", doluysa "Ayrıldı" yazın. L2:L161.', sayfa: 'Personel', hedef: 'L2:L161', cozum: '=EĞER(EBOŞSA(H2);"Çalışıyor";"Ayrıldı")', gerekli: ['ISBLANK'], bosKaynak: true, ipuclari: ['EBOŞSA(H2) DOĞRU ise kişi ayrılmamıştır.'] },
      { id: 'a2', soru: 'Personel sayfasında M2\'ye hâlâ çalışan kişi sayısını yazın (Çıkış sütunu boş olanlar).', sayfa: 'Personel', hedef: 'M2', cozum: '=BOŞLUKSAY(H2:H161)', ipuclari: ['Boş hücre sayan işlev BOŞLUKSAY.', 'Alternatif: =ÇOKEĞERSAY(H2:H161;"")'] },
    ],
    sikHata: { yanlis: '"" döndüren formül sütununda EBOŞSA ile boş aramak', dogru: '=A2="" ya da UZUNLUK(A2)=0', neden: 'EBOŞSA yalnız içinde hiçbir şey olmayan hücrede DOĞRU verir; "" bir metindir.' },
    mulakat: { soru: 'Bir sütunun toplamı beklenenden düşük çıkıyor. Nasıl teşhis edersiniz?', cevap: 'Yanına =ESAYIYSA(A2) kontrol sütunu ekler, YANLIŞ olanları sayarım; genelde metin olarak gelmiş sayılar çıkar. Ayrıca BAĞ_DEĞ_SAY ile BAĞ_DEĞ_DOLU_SAY\'ı karşılaştırırım; fark metne dönmüş hücre sayısıdır. Sonra SAYIYAÇEVİR/SAYIDEĞERİ ya da Power Query tür değiştirme ile düzeltirim.' },
  },

  // ---------------------------------------------------------------- M4 Koşullu özet
  {
    id: 'm4-d1', modul: 'm4', baslik: 'EĞERSAY: koşula uyanları saymak', sure: 9,
    ozet: 'Kaç sipariş İstanbul\'dan? Kaç satır 1000 TL üstü? EĞERSAY aralığa bakar ve ölçüte uyanı sayar.',
    hedefler: ['EĞERSAY ile metin ve sayı ölçütü yazmak', 'Karşılaştırmalı ölçütü (">1000") tırnakla yazmak', 'Ölçütü hücreden almak (">"&N1)'],
    anlatim: [
      '**=EĞERSAY(aralık; ölçüt)**. Ölçüt bir değer olabilir: =EĞERSAY(D2:D241;"İstanbul"). Büyük/küçük harf fark etmez.',
      'Karşılaştırma ölçütleri **tırnak içinde** yazılır: ">1000", "<=5", "<>İptal" (İptal olmayan). Bu bir metindir; Excel onu okuyup karşılaştırmaya çevirir.',
      'Eşik bir hücredeyse işleç ile hücre **& ile birleştirilir**: =EĞERSAY(I2:I241;">"&N1). ">N1" yazarsanız Excel "N1" metninden büyük olanları arar ve 0 verir.',
      'Boş hücreleri saymak için ölçüt "" (boş), dolu hücreler için "<>" yazılır.',
    ],
    ornek: { sayfa: 'Satışlar', hucre: 'M2', formul: '=EĞERSAY(D2:D241;"İstanbul")', aciklama: 'İstanbul\'dan gelen sipariş satırı sayısı.' },
    alistirmalar: [
      { id: 'a1', soru: 'M2\'ye Mobil kanalından gelen satır sayısını yazın.', sayfa: 'Satışlar', hedef: 'M2', cozum: '=EĞERSAY(E2:E241;"Mobil")', gerekli: ['COUNTIF'], ipuclari: ['Kanal E sütununda.'] },
      { id: 'a2', soru: 'N1\'de bir fiyat eşiği (1000) var. M2\'ye birim fiyatı bu eşikten büyük olan satır sayısını yazın.', sayfa: 'Satışlar', hedef: 'M2', cozum: '=EĞERSAY(I2:I241;">"&N1)', hazirlik: { N1: 1000, M1: 'Eşik' }, ipuclari: ['Ölçüt: ">"&N1.', '">N1" yazarsanız N1 metniyle karşılaştırılır.'] },
    ],
    sikHata: { yanlis: '=EĞERSAY(I2:I241;">N1")', dogru: '=EĞERSAY(I2:I241;">"&N1)', neden: 'Tırnak içindeki N1 bir hücre değil, metindir.' },
    mulakat: { soru: 'EĞERSAY ölçütü neden tırnak içinde yazılır?', cevap: 'Ölçüt bağımsız değişkeni bir metin olarak alınır ve Excel onu işleç ile değere ayırır. Bu sayede ">1000" gibi bir koşul tek bağımsız değişkenle verilebilir. Eşik hücredeyse işleç metni ile hücre değeri & ile birleştirilir.' },
  },
  {
    id: 'm4-d2', modul: 'm4', baslik: 'ETOPLA ve EĞERORTALAMA', sure: 9,
    ozet: 'Koşula uyan satırların toplamı ya da ortalaması. ETOPLA\'da toplanacak aralık en sondadır.',
    hedefler: ['ETOPLA ile kategori toplamı almak', 'Koşul ve toplam aralığının aynı boyda olmasını sağlamak', 'Bir özet tablosunu formülle doldurmak'],
    anlatim: [
      '**=ETOPLA(koşul_aralığı; ölçüt; toplam_aralığı)**. Kitap kategorisinin toplam adedi: =ETOPLA(F2:F241;"Kitap";H2:H241). Toplam aralığını yazmazsanız koşul aralığı toplanır (=ETOPLA(I2:I241;">1000") 1000 üstü fiyatların toplamı).',
      'Koşul ve toplam aralığı **aynı satırlardan** başlamalı ve aynı uzunlukta olmalıdır. F2:F241 ile H3:H242 yazarsanız Excel hata vermez; bir satır kaymış toplar ve sonuç sessizce yanlış olur.',
      '**EĞERORTALAMA** aynı düzende ortalama alır: =EĞERORTALAMA(F2:F241;"Giyim";I2:I241).',
      'Küçük bir özet tablosu kurmak için kategorileri bir sütuna yazıp yanına ETOPLA koyun ve ölçütü o hücreden alın: =ETOPLA($F$2:$F$241;N2;$H$2:$H$241). Aralıklara $ koymak tabloyu aşağı doldurmayı mümkün kılar.',
    ],
    ornek: { sayfa: 'Satışlar', hucre: 'M2', formul: '=ETOPLA(F2:F241;"Kitap";H2:H241)', aciklama: 'Kitap kategorisinde satılan toplam adet.' },
    alistirmalar: [
      { id: 'a1', soru: 'M2\'ye Elektronik kategorisinin toplam adedini yazın.', sayfa: 'Satışlar', hedef: 'M2', cozum: '=ETOPLA(F2:F241;"Elektronik";H2:H241)', gerekli: ['SUMIF'], ipuclari: ['Koşul F sütununda, toplanan H.'] },
      { id: 'a2', soru: 'N2:N8\'de kategori adları var. O2:O8\'e her kategorinin toplam adedini yazın (O2\'ye yazıp aşağı doldurun).', sayfa: 'Satışlar', hedef: 'O2:O8', cozum: '=ETOPLA($F$2:$F$241;N2;$H$2:$H$241)', hazirlik: { N1: 'Kategori', O1: 'Adet', N2: 'Elektronik', N3: 'Ev & Yaşam', N4: 'Giyim', N5: 'Hediye', N6: 'Kitap', N7: 'Kozmetik', N8: 'Spor' }, ipuclari: ['Ölçüt N2 hücresi; aşağı inince N3, N4 olmalı.', 'Veri aralıkları kaymamalı: $ koyun.'] },
    ],
    sikHata: { yanlis: '=ETOPLA(H2:H241;"Kitap";F2:F241)', dogru: '=ETOPLA(F2:F241;"Kitap";H2:H241)', neden: 'ETOPLA\'da önce koşulun arandığı aralık, en son toplanacak aralık gelir (ÇOKETOPLA\'da tersi).' },
    mulakat: { soru: 'ETOPLA\'da koşul aralığı ile toplam aralığı farklı boyda olursa ne olur?', cevap: 'Excel hata vermez; toplam aralığını koşul aralığı boyutunda, sol üst köşesinden başlayarak yeniden boyutlandırır. Aralıklar farklı satırdan başlıyorsa toplam kayar ve sessizce yanlış olur. Bu yüzden ÇOKETOPLA daha güvenlidir: boyut farklıysa #DEĞER! verir.' },
  },
  {
    id: 'm4-d3', modul: 'm4', baslik: 'ÇOKETOPLA ve ÇOKEĞERSAY: birden çok koşul', sure: 10,
    ozet: 'Kategori ve kanal ve durum: ÇOKETOPLA tüm koşulları VE ile birleştirir. Raporların bel kemiği.',
    hedefler: ['ÇOKETOPLA ile iki ve daha fazla koşul kurmak', 'Argüman sırasını (toplam aralığı başta) doğru yazmak', 'YADA mantığını iki ÇOKETOPLA\'nın toplamıyla kurmak'],
    anlatim: [
      '**=ÇOKETOPLA(toplam_aralığı; aralık1; ölçüt1; aralık2; ölçüt2; …)**. ETOPLA\'nın tersine **toplam aralığı en baştadır**. Elektronik ve Web: =ÇOKETOPLA(H2:H241;F2:F241;"Elektronik";E2:E241;"Web").',
      'Tüm koşullar **VE** ile birleşir: satır hepsini sağlamalıdır. **ÇOKEĞERSAY** aynı mantıkla sayar, toplam aralığı yoktur: =ÇOKEĞERSAY(F2:F241;"Kitap";K2:K241;"Teslim edildi").',
      'YADA gerekiyorsa (Web ya da Mobil) iki ÇOKETOPLA toplanır ya da ölçüt dizisi kullanılır: =TOPLA(ÇOKETOPLA(H2:H241;E2:E241;{"Web";"Mobil"})). Dizi sabitinde **;** satır ayırır ve her Excel\'de aynıdır. Sütun ayırıcı bölge ayarına bağlıdır: İngilizce ayarda virgül {"Web","Mobil"}, Türkçe ayarda ters bölü {"Web"\\"Mobil"}. Bu yüzden tek boyutlu listelerde ; kullanın; Kesit iki sütun yazımını da kabul eder.',
      'Aralık boyları farklıysa ÇOKETOPLA #DEĞER! verir. Bu iyi bir şeydir: ETOPLA\'daki sessiz kaymayı engeller.',
    ],
    ornek: { sayfa: 'Satışlar', hucre: 'M2', formul: '=ÇOKETOPLA(H2:H241;F2:F241;"Elektronik";E2:E241;"Web")', aciklama: 'Web kanalından satılan Elektronik adedi.' },
    alistirmalar: [
      { id: 'a1', soru: 'M2\'ye İstanbul\'dan gelen ve durumu "Teslim edildi" olan satırların toplam adedini yazın.', sayfa: 'Satışlar', hedef: 'M2', cozum: '=ÇOKETOPLA(H2:H241;D2:D241;"İstanbul";K2:K241;"Teslim edildi")', gerekli: ['SUMIFS'], ipuclari: ['Toplam aralığı (H) en başta.', 'İki aralık-ölçüt çifti.'] },
      { id: 'a2', soru: 'M2\'ye Kitap kategorisinde birim fiyatı 100 TL\'den düşük satır sayısını yazın.', sayfa: 'Satışlar', hedef: 'M2', cozum: '=ÇOKEĞERSAY(F2:F241;"Kitap";I2:I241;"<100")', gerekli: ['COUNTIFS'], ipuclari: ['Sayma işi: ÇOKEĞERSAY.', 'Ölçüt "<100".'] },
      { id: 'a3', soru: 'M2\'ye İptal ya da İade olan satırların toplam adedini tek formülle yazın.', sayfa: 'Satışlar', hedef: 'M2', cozum: '=ETOPLA(K2:K241;"İptal";H2:H241)+ETOPLA(K2:K241;"İade";H2:H241)', ipuclari: ['Aynı sütunda iki farklı değer: VE değil YADA.', 'İki toplamı + ile birleştirin.'] },
    ],
    sikHata: { yanlis: '=ÇOKETOPLA(K2:K241;"İptal";K2:K241;"İade";H2:H241)', dogru: '=ETOPLA(K2:K241;"İptal";H2:H241)+ETOPLA(K2:K241;"İade";H2:H241)', neden: 'ÇOKETOPLA koşulları VE ile bağlar; aynı hücre hem İptal hem İade olamaz, sonuç 0 olur.' },
    mulakat: { soru: 'ÇOKETOPLA ile YADA koşulunu nasıl kurarsınız?', cevap: 'ÇOKETOPLA yalnız VE yapar. Aynı sütunda iki değer için iki ÇOKETOPLA toplarım ya da ölçüt olarak dizi verip TOPLA ile sararım: =TOPLA(ÇOKETOPLA(H:H;E:E;{"Web","Mobil"})). Farklı sütunlarda YADA ise (A ya da B koşulu) çift sayımı önlemek için TOPLA.ÇARPIM ya da FİLTRE kullanırım.' },
  },
  {
    id: 'm4-d4', modul: 'm4', baslik: 'Ölçüt söz dizimi: joker ve tarih aralığı', sure: 10,
    ozet: '"*saat*" içinde saat geçen, ">="&TARİH(2024;3;1) Mart başından sonra. Aylık rapor bu iki kalıpla yazılır.',
    hedefler: ['* ve ? jokerleriyle metin ölçütü yazmak', 'Tarih aralığını iki koşulla kurmak', 'Ay başı ve ay sonunu hücreden almak'],
    anlatim: [
      'Metin ölçütlerinde **\\*** "herhangi bir dizi", **?** "tek karakter" demektir. "Kitap\\*" Kitap ile başlayan, "\\*saat\\*" içinde saat geçen, "????" tam dört harfli. Gerçek bir yıldız aramak için önüne ~ koyun: "~*".',
      'Tarih ölçütleri karşılaştırmadır ve tarih sayı olduğu için iki koşulla aralık kurulur: Mart 2024 → =ÇOKETOPLA(H2:H241;B2:B241;">="&TARİH(2024;3;1);B2:B241;"<"&TARİH(2024;4;1)).',
      'Bitişi "<" ile bir sonraki ayın ilk günü yazmak, "<=31 Mart" yazmaktan daha güvenlidir: Şubat\'ın kaç gün çektiğini düşünmezsiniz ve saatli tarihlerde (31.03 14:00) son gün kaçmaz.',
      'Rapor ayını bir hücreye koyarsanız (N1 = 01.03.2024) formül her ay için çalışır: ">="&N1 ve "<"&SERİTARİH(N1;1).',
    ],
    ornek: { sayfa: 'Satışlar', hucre: 'M2', formul: '=ÇOKETOPLA(H2:H241;B2:B241;">="&TARİH(2024;3;1);B2:B241;"<"&TARİH(2024;4;1))', aciklama: 'Mart 2024\'te satılan adet.' },
    alistirmalar: [
      { id: 'a1', soru: 'M2\'ye ürün adında "Krem" geçen satırların toplam adedini yazın (Nemlendirici Krem, Güneş Kremi…).', sayfa: 'Satışlar', hedef: 'M2', cozum: '=ETOPLA(G2:G241;"*Krem*";H2:H241)', ipuclari: ['Joker: "*Krem*" adın herhangi bir yerinde Krem geçenler.'] },
      { id: 'a2', soru: 'N1\'de rapor ayının ilk günü var (01.04.2024). M2\'ye o ay satılan toplam adedi yazın; formül N1 değişince başka ay için de çalışsın.', sayfa: 'Satışlar', hedef: 'M2', cozum: '=ÇOKETOPLA(H2:H241;B2:B241;">="&N1;B2:B241;"<"&SERİTARİH(N1;1))', hazirlik: { N1: 45383, M1: 'Rapor ayı' }, ipuclari: ['Başlangıç: ">="&N1.', 'Bitiş: bir sonraki ayın ilk günü, SERİTARİH(N1;1).'] },
    ],
    sikHata: { yanlis: '=ÇOKETOPLA(H:H;B:B;">=01.03.2024")', dogru: '">="&TARİH(2024;3;1) ya da ">="&N1', neden: 'Tarihin metin olarak yazılması bölge ayarına bağlıdır; başka bilgisayarda yanlış okunabilir.' },
    mulakat: { soru: 'Aylık raporda bitiş koşulunu neden "<=ay sonu" yerine "<sonraki ay başı" yazarsınız?', cevap: 'Ay sonunu hesaplamak gerekmez ve tarih saat içeriyorsa (31.03.2024 15:30) "<=31.03.2024" o günü dışarıda bırakır, çünkü 31.03.2024 gece yarısıdır. "<01.04.2024" ayın tamamını kesin kapsar.' },
  },
];
