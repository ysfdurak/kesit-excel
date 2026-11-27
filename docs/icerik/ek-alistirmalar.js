// Var olan derslere eklenen alıştırmalar (derinleştirme). Kimlikler e1, e2…; dersler.js bunları ilgili dersin sonuna ekler.
const KAT = { N1: `Kategori`, N2: `Elektronik`, N3: `Ev & Yaşam`, N4: `Giyim`, N5: `Hediye`, N6: `Kitap`, N7: `Kozmetik`, N8: `Spor` };
const S = `Satışlar`;
export const EK_ALISTIRMALAR = {
  'm1-d1': [
    { id: `e1`, soru: `M2'ye ilk iki siparişin (B2 ve B3) arasında kaç gün olduğunu yazın.`, sayfa: S, hedef: `M2`, cozum: `=B3-B2`, varyantsiz: true, ipuclari: [`Tarihler sayıdır; çıkarınca gün farkı çıkar.`] },
    { id: `e2`, tur: `secmeli`, soru: `B2 hücresinde 01.01.2024 görünüyor. Hücrenin biçimini Genel yaparsanız ne görürsünüz?`, secenekler: [`01.01.2024`, `45292`, `2024`, `#DEĞER!`], dogru: 1, aciklama: `Tarih, 1 Ocak 1900'den bu yana geçen gün sayısıdır; biçim kaldırılınca bu sayı görünür.`, yanlisAciklama: { 0: `Bu tarih biçiminin görüntüsüdür.`, 2: `Yalnız yıl değil, gün sayısı saklanır.`, 3: `Biçim değişikliği hata üretmez.` } },
  ],
  'm1-d2': [
    { id: `e1`, soru: `M2'ye ilk satırın indirim tutarını yazın: adet × birim fiyat × indirim.`, sayfa: S, hedef: `M2`, cozum: `=H2*I2*J2`, ipuclari: [`Üç hücreyi çarpın.`] },
    { id: `e2`, soru: `N2:N241'e birim fiyatın KDV hariç hâlini yazın (fiyat KDV dahil, oran %20): fiyat ÷ 1,2.`, sayfa: S, hedef: `N2:N241`, cozum: `=I2/1,2`, ipuclari: [`%20 eklenmiş fiyatı 1,2'ye bölün; 0,8 ile çarpmak yanlış olur.`] },
  ],
  'm1-d3': [
    { id: `e1`, soru: `N1'de indirim oranı (%10) var. M2:M241'e indirimli birim fiyatı yazın.`, sayfa: S, hedef: `M2:M241`, cozum: `=I2*(1-$N$1)`, hazirlik: { N1: 0.1 }, durumlar: [{ N1: 0.1 }, { N1: 0.25 }], ipuclari: [`Oran hücresi sabit: $N$1.`] },
    { id: `e2`, tur: `secmeli`, soru: `L2'deki =H2*$N$1 formülünü L3'e kopyaladınız. L3'teki formül hangisidir?`, secenekler: [`=H3*$N$1`, `=H3*$N$2`, `=H2*$N$1`, `=I3*$N$1`], dogru: 0, aciklama: `Göreli H2 bir satır aşağı inince H3 olur; $N$1 hiç kaymaz.`, yanlisAciklama: { 1: `$N$1'in satırı da sabittir.`, 2: `Göreli başvuru kayar.`, 3: `Aşağı kopyalamada sütun değişmez.` } },
  ],
  'm1-d4': [
    { id: `e1`, soru: `İnternette =COUNTIFS(F2:F241,"Kitap",E2:E241,"Web") formülünü buldunuz. M2'ye Türkçe Excel yazımıyla yazın.`, sayfa: S, hedef: `M2`, cozum: `=ÇOKEĞERSAY(F2:F241;"Kitap";E2:E241;"Web")`, gerekli: [`COUNTIFS`], ipuclari: [`COUNTIFS → ÇOKEĞERSAY, virgül → noktalı virgül.`] },
    { id: `e2`, soru: `=IFERROR(VLOOKUP(G2,Ürünler!B2:E41,4,FALSE),0) formülünü Türkçeye çevirip M2:M241'e yazın (aralığı sabitleyin).`, sayfa: S, hedef: `M2:M241`, cozum: `=EĞERHATA(DÜŞEYARA(G2;Ürünler!$B$2:$E$41;4;YANLIŞ);0)`, gerekli: [`IFERROR`, `VLOOKUP`], ipuclari: [`IFERROR → EĞERHATA, VLOOKUP → DÜŞEYARA, FALSE → YANLIŞ.`] },
  ],
  'm2-d1': [
    { id: `e1`, soru: `M2'ye ortalama birim fiyatı yazın.`, sayfa: S, hedef: `M2`, cozum: `=ORTALAMA(I2:I241)`, gerekli: [`AVERAGE`], ipuclari: [`ORTALAMA(I2:I241).`] },
    { id: `e2`, soru: `M2'ye şehri girilmiş satır sayısını yazın (D sütununda dolu hücreler).`, sayfa: S, hedef: `M2`, cozum: `=BAĞ_DEĞ_DOLU_SAY(D2:D241)`, gerekli: [`COUNTA`], varyantsiz: true, ipuclari: [`Metin sütunu: BAĞ_DEĞ_DOLU_SAY.`] },
  ],
  'm2-d2': [
    { id: `e1`, soru: `M2:M241'e birim fiyatı aşağı doğru en yakın 100'e yuvarlayın (459 → 400).`, sayfa: S, hedef: `M2:M241`, cozum: `=AŞAĞIYUVARLA(I2;-2)`, gerekli: [`ROUNDDOWN`], ipuclari: [`Eksi basamak sayısı virgülün soluna yuvarlar.`] },
    { id: `e2`, soru: `N2:N241'e satır tutarının (adet × fiyat × (1 − indirim)) ondalığını atın; yuvarlama yapmayın.`, sayfa: S, hedef: `N2:N241`, cozum: `=NSAT(H2*I2*(1-J2))`, gerekli: [`TRUNC`], ipuclari: [`NSAT ondalığı keser, yuvarlamaz.`] },
  ],
  'm2-d3': [
    { id: `e1`, soru: `M2:M241'e müşterinin liste fiyatının yüzde kaçını ödediğini yazın (indirim %15 ise %85).`, sayfa: S, hedef: `M2:M241`, cozum: `=1-J2`, bicim: `0%`, ipuclari: [`Ödenen oran = 1 − indirim.`] },
    { id: `e2`, soru: `Satışlar'da M2'ye Kitap kategorisinin toplam adet içindeki payını yazın.`, sayfa: S, hedef: `M2`, cozum: `=ETOPLA(F2:F241;"Kitap";H2:H241)/TOPLA(H2:H241)`, bicim: `0,0%`, ipuclari: [`Kitap adedi / toplam adet.`] },
  ],
  'm2-d4': [
    { id: `e1`, soru: `Bütçe sayfasında E2:E43'e hedeften sapma oranını yazın; hedef 0 ya da boşsa sonuç boş görünsün.`, sayfa: `Bütçe`, hedef: `E2:E43`, cozum: `=EĞERHATA((D2-C2)/C2;"")`, bicim: `0,0%`, ipuclari: [`Bölme hatasını EĞERHATA ile "" yapın.`] },
    { id: `e2`, tur: `secmeli`, soru: `Bir hücrede #SAYI/0! görüyorsunuz. Ne anlama gelir?`, secenekler: [`Sayı çok büyük`, `Sıfıra ya da boş hücreye bölme`, `İşlev adı yanlış`, `Başvurulan sayfa silinmiş`], dogru: 1, aciklama: `Payda 0 ya da boş. Kaynağı düzeltmek mi, EĞERHATA ile göstermek mi gerektiğine karar verin.`, yanlisAciklama: { 0: `Çok büyük sayı #SAYI! verir.`, 2: `Yanlış ad #AD? verir.`, 3: `Silinen başvuru #BAŞV! verir.` } },
  ],
  'm3-d1': [
    { id: `e1`, soru: `M2:M241'e adet 1'den büyükse "Çoklu", değilse "Tek" yazın.`, sayfa: S, hedef: `M2:M241`, cozum: `=EĞER(H2>1;"Çoklu";"Tek")`, gerekli: [`IF`], ipuclari: [`EĞER(H2>1; …; …).`] },
    { id: `e2`, soru: `N2:N241'e indirim varsa (J > 0) "İndirimli", yoksa boş yazın.`, sayfa: S, hedef: `N2:N241`, cozum: `=EĞER(J2>0;"İndirimli";"")`, gerekli: [`IF`], ipuclari: [`Boş için "".`] },
  ],
  'm3-d2': [
    { id: `e1`, soru: `M2:M241'e Web ya da Mobil'den gelen ve Teslim edilen satırlarda "Çevrimiçi teslim", diğerlerinde boş yazın.`, sayfa: S, hedef: `M2:M241`, cozum: `=EĞER(VE(YADA(E2="Web";E2="Mobil");K2="Teslim edildi");"Çevrimiçi teslim";"")`, ipuclari: [`VE'nin içinde YADA.`] },
    { id: `e2`, soru: `N2:N241'e kategori Kitap DEĞİLSE ve fiyat 1000'den büyükse DOĞRU, aksi hâlde YANLIŞ yazın.`, sayfa: S, hedef: `N2:N241`, cozum: `=VE(DEĞİL(F2="Kitap");I2>1000)`, gerekli: [`NOT`, `AND`], ipuclari: [`DEĞİL(F2="Kitap").`] },
  ],
  'm3-d3': [
    { id: `e1`, soru: `M2:M241'e indirim seviyesini yazın: %15 ve üstü "Yüksek", %5 ve üstü "Orta", 0'dan büyük "Düşük", 0 ise "Yok".`, sayfa: S, hedef: `M2:M241`, cozum: `=ÇOKEĞER(J2>=0,15;"Yüksek";J2>=0,05;"Orta";J2>0;"Düşük";DOĞRU;"Yok")`, gerekli: [`IFS`], ipuclari: [`Büyükten küçüğe sırala; en sonda DOĞRU.`] },
    { id: `e2`, soru: `N2:N241'e aynı kuralı iç içe EĞER ile yazın.`, sayfa: S, hedef: `N2:N241`, cozum: `=EĞER(J2>=0,15;"Yüksek";EĞER(J2>=0,05;"Orta";EĞER(J2>0;"Düşük";"Yok")))`, yasak: [`IFS`], ipuclari: [`Her EĞER'in "değilse" kısmına bir sonraki EĞER.`] },
  ],
  'm3-d4': [
    { id: `e1`, soru: `Personel sayfasında M2:M161'e Çıkış Türü (I) metin ise "Ayrılış nedeni var", değilse boş yazın.`, sayfa: `Personel`, hedef: `M2:M161`, cozum: `=EĞER(EMETİNSE(I2);"Ayrılış nedeni var";"")`, gerekli: [`ISTEXT`], bosKaynak: true, ipuclari: [`EMETİNSE(I2).`] },
    { id: `e2`, soru: `Satışlar'da M2:M241'e şehir boşsa DOĞRU, doluysa YANLIŞ yazın (EBOŞSA ile).`, sayfa: S, hedef: `M2:M241`, cozum: `=EBOŞSA(D2)`, gerekli: [`ISBLANK`], ipuclari: [`EBOŞSA tek başına DOĞRU/YANLIŞ verir.`] },
  ],
  'm4-d1': [
    { id: `e1`, soru: `M2'ye durumu "İade" olan satır sayısını yazın.`, sayfa: S, hedef: `M2`, cozum: `=EĞERSAY(K2:K241;"İade")`, gerekli: [`COUNTIF`], varyantsiz: true, ipuclari: [`EĞERSAY(K2:K241; "İade").`] },
    { id: `e2`, soru: `M2'ye adedi 2 ve üstü olan satır sayısını yazın.`, sayfa: S, hedef: `M2`, cozum: `=EĞERSAY(H2:H241;">=2")`, gerekli: [`COUNTIF`], ipuclari: [`Ölçüt ">=2".`] },
  ],
  'm4-d2': [
    { id: `e1`, soru: `M2'ye Giyim kategorisinin ortalama birim fiyatını yazın.`, sayfa: S, hedef: `M2`, cozum: `=EĞERORTALAMA(F2:F241;"Giyim";I2:I241)`, gerekli: [`AVERAGEIF`], ipuclari: [`EĞERORTALAMA(koşul; ölçüt; ortalama aralığı).`] },
    { id: `e2`, soru: `N2:N8'deki her kategori için O2:O8'e ortalama birim fiyatı yazın.`, sayfa: S, hedef: `O2:O8`, cozum: `=EĞERORTALAMA($F$2:$F$241;N2;$I$2:$I$241)`, hazirlik: { ...KAT, O1: `Ortalama fiyat` }, ipuclari: [`Ölçüt N2; aralıklar sabit.`] },
  ],
  'm4-d3': [
    { id: `e1`, soru: `M2'ye Mobil kanalından gelen Elektronik satırlarının ortalama birim fiyatını yazın.`, sayfa: S, hedef: `M2`, cozum: `=ÇOKEĞERORTALAMA(I2:I241;E2:E241;"Mobil";F2:F241;"Elektronik")`, gerekli: [`AVERAGEIFS`], ipuclari: [`Ortalama aralığı en başta.`] },
    { id: `e2`, soru: `M2'ye İzmir'den gelen, birim fiyatı 500 ve üstü olan satırların toplam adedini yazın.`, sayfa: S, hedef: `M2`, cozum: `=ÇOKETOPLA(H2:H241;D2:D241;"İzmir";I2:I241;">=500")`, gerekli: [`SUMIFS`], varyantsiz: true, ipuclari: [`İki koşul çifti.`] },
  ],
  'm4-d4': [
    { id: `e1`, soru: `M2'ye ürün adı "S" ile başlayan satır sayısını yazın.`, sayfa: S, hedef: `M2`, cozum: `=EĞERSAY(G2:G241;"S*")`, gerekli: [`COUNTIF`], varyantsiz: true, ipuclari: [`"S*" ile başlayan.`] },
    { id: `e2`, soru: `M2'ye 2024'ün ilk çeyreğinde (01.01–31.03) satılan toplam adedi yazın; tarihleri TARİH işleviyle verin.`, sayfa: S, hedef: `M2`, cozum: `=ÇOKETOPLA(H2:H241;B2:B241;">="&TARİH(2024;1;1);B2:B241;"<="&TARİH(2024;3;31))`, gerekli: [`SUMIFS`], ipuclari: [`">="&TARİH(…) ve "<="&TARİH(…).`] },
  ],
  'm5-d1': [
    { id: `e1`, soru: `M2:M241'e her satırdaki ürünün katalog stokunu (Ürünler sayfası, F) DÜŞEYARA ile getirin.`, sayfa: S, hedef: `M2:M241`, cozum: `=DÜŞEYARA(G2;Ürünler!$B$2:$F$41;5;YANLIŞ)`, gerekli: [`VLOOKUP`], ipuclari: [`B'den F'ye 5 sütun: stok 5. sütun.`] },
    { id: `e2`, soru: `N2:N241'e satırın brüt kâr marjını yazın: (birim fiyat − katalog maliyeti) ÷ birim fiyat. Maliyet Ürünler sayfasının E sütunundadır.`, sayfa: S, hedef: `N2:N241`, cozum: `=(I2-DÜŞEYARA(G2;Ürünler!$B$2:$E$41;4;YANLIŞ))/I2`, bicim: `0%`, ipuclari: [`Maliyet B:E aralığının 4. sütunu.`] },
  ],
  'm5-d2': [
    { id: `e1`, soru: `N1:O4'te adet kademesi tablosu var (1 küçük, 3 orta, 6 büyük sipariş). M2:M241'e her satırın sipariş büyüklüğünü yazın.`, sayfa: S, hedef: `M2:M241`, cozum: `=DÜŞEYARA(H2;$N$2:$O$4;2;DOĞRU)`, hazirlik: { N1: `Adet ≥`, O1: `Büyüklük`, N2: 1, O2: `Küçük`, N3: 3, O3: `Orta`, N4: 6, O4: `Büyük` }, ipuclari: [`Yaklaşık eşleşme: son bağımsız değişken DOĞRU.`] },
    { id: `e2`, tur: `secmeli`, soru: `Kademe tablosunda alt sınırlar 0, 500, 2000 yerine 2000, 500, 0 sırasıyla yazılmış. =DÜŞEYARA(I2;tablo;2;DOĞRU) ne yapar?`, secenekler: [`Doğru çalışır`, `Yanlış ya da #YOK sonuç verebilir; yaklaşık eşleşme artan sıra ister`, `Hep ilk satırı getirir`, `#DEĞER! verir`], dogru: 1, aciklama: `Yaklaşık eşleşme ikili arama yapar ve tablonun ilk sütununun artan sıralı olduğunu varsayar.`, yanlisAciklama: { 0: `Sıralama koşulu bozulduğu için sonuç güvenilmez.`, 2: `Sonuç tabloya ve değere göre değişir; tahmin edilemez.`, 3: `Hata vermez, sessizce yanlış sonuç verir.` } },
  ],
  'm5-d3': [
    { id: `e1`, soru: `M2:M241'e her satırdaki ürünün kategorisini katalogdan (Ürünler, C) İNDİS ve KAÇINCI ile getirin.`, sayfa: S, hedef: `M2:M241`, cozum: `=İNDİS(Ürünler!$C$2:$C$41;KAÇINCI(G2;Ürünler!$B$2:$B$41;0))`, gerekli: [`INDEX`, `MATCH`], ipuclari: [`İNDİS(kategoriler; KAÇINCI(ürün; ürünler; 0)).`] },
    { id: `e2`, soru: `Ürünler sayfasında H2'ye en yüksek stoklu ürünün adını İNDİS ve KAÇINCI ile yazın.`, sayfa: `Ürünler`, hedef: `H2`, cozum: `=İNDİS(B2:B41;KAÇINCI(MAK(F2:F41);F2:F41;0))`, gerekli: [`INDEX`, `MATCH`, `MAX`], ipuclari: [`Önce MAK ile en yüksek stoğu bulun, sonra konumunu.`] },
  ],
  'm5-d4': [
    { id: `e1`, soru: `M2:M241'e her satırdaki ürünün katalog maliyetini (Ürünler, E) ÇAPRAZARA ile getirin; bulunamazsa 0.`, sayfa: S, hedef: `M2:M241`, cozum: `=ÇAPRAZARA(G2;Ürünler!$B$2:$B$41;Ürünler!$E$2:$E$41;0)`, gerekli: [`XLOOKUP`], ipuclari: [`Bulunamadı bağımsız değişkeni 0.`] },
    { id: `e2`, soru: `Ürünler sayfasında H2'ye adı "Termos 750ml" olan ürünün kategori, fiyat ve maliyetini (C:E) tek ÇAPRAZARA ile taşırın.`, sayfa: `Ürünler`, hedef: `H2`, okunan: `H2:J2`, cozum: `=ÇAPRAZARA("Termos 750ml";B2:B41;C2:E41)`, gerekli: [`XLOOKUP`], ipuclari: [`Sonuç aralığı birden çok sütun olabilir.`] },
  ],
  'm5-d8': [
    { id: `e1`, soru: `M2'ye Kitap kategorisinin F sütununda ilk kez kaçıncı satırda (aralık içindeki konum) geçtiğini ÇAPRAZEŞLEŞTİR ile yazın.`, sayfa: S, hedef: `M2`, cozum: `=ÇAPRAZEŞLEŞTİR("Kitap";F2:F241)`, gerekli: [`XMATCH`], varyantsiz: true, ipuclari: [`ÇAPRAZEŞLEŞTİR(aranan; aralık) konum döndürür; varsayılan tam eşleşme.`] },
    { id: `e2`, soru: `M2'ye İstanbul'un D sütunundaki SON geçtiği konumu ÇAPRAZEŞLEŞTİR ile yazın.`, sayfa: S, hedef: `M2`, cozum: `=ÇAPRAZEŞLEŞTİR("İstanbul";D2:D241;0;-1)`, gerekli: [`XMATCH`], ipuclari: [`Eşleşme modu 0, arama modu -1 (sondan).`] },
  ],
  'm6-d1': [
    { id: `e1`, soru: `M2:M241'e ürün adının son 3 karakterini yazın.`, sayfa: S, hedef: `M2:M241`, cozum: `=SAĞDAN(G2;3)`, gerekli: [`RIGHT`], ipuclari: [`SAĞDAN(metin; 3).`] },
    { id: `e2`, soru: `N2:N241'e müşteri adının 2. karakterinden başlayan 3 karakteri yazın.`, sayfa: S, hedef: `N2:N241`, cozum: `=PARÇAAL(C2;2;3)`, gerekli: [`MID`], ipuclari: [`PARÇAAL(metin; başlangıç; uzunluk).`] },
  ],
  'm6-d2': [
    { id: `e1`, soru: `M2:M241'e ürün adında ilk boşluğun kaçıncı karakterde olduğunu yazın; boşluk yoksa 0.`, sayfa: S, hedef: `M2:M241`, cozum: `=EĞERHATA(BUL(" ";G2);0)`, gerekli: [`FIND`], ipuclari: [`Bulunamazsa BUL #DEĞER! verir.`] },
    { id: `e2`, soru: `N2:N241'e ürün adında "set" (büyük-küçük fark etmeksizin) geçiyorsa DOĞRU yazın.`, sayfa: S, hedef: `N2:N241`, cozum: `=ESAYIYSA(MBUL("set";G2))`, gerekli: [`SEARCH`, `ISNUMBER`], ipuclari: [`MBUL harf duyarsızdır; bulursa sayı döner.`] },
  ],
  'm6-d3': [
    { id: `e1`, soru: `Bayi sayfasında G3:G13'e bayi adındaki "Bayi" kelimesini silin (YERİNEKOY ile, kalan boşluğu da KIRP ile alın).`, sayfa: `Bayi`, hedef: `G3:G13`, cozum: `=KIRP(YERİNEKOY(A3;"Bayi";""))`, gerekli: [`SUBSTITUTE`], ipuclari: [`YERİNEKOY(metin; "Bayi"; "").`] },
    { id: `e2`, soru: `Müşteri ham sayfasında F2:F7'ye ad soyadı her kelimenin ilk harfi büyük olacak şekilde düzeltin.`, sayfa: `Müşteri ham`, hedef: `F2:F7`, cozum: `=YAZIM.DÜZENİ(B2)`, gerekli: [`PROPER`], ipuclari: [`YAZIM.DÜZENİ.`] },
  ],
  'm6-d4': [
    { id: `e1`, soru: `M2:M241'e "01.01.2024 tarihli sipariş: 3 adet" biçiminde cümle kurun (tarih B, adet H).`, sayfa: S, hedef: `M2:M241`, cozum: `=METNEÇEVİR(B2;"gg.aa.yyyy")&" tarihli sipariş: "&H2&" adet"`, ipuclari: [`Tarihi METNEÇEVİR ile metne çevirin; yoksa 45292 görünür.`] },
    { id: `e2`, soru: `N2:N241'e indirim oranını yüzde metni olarak yazın: 0,15 → "%15".`, sayfa: S, hedef: `N2:N241`, cozum: `=METNEÇEVİR(J2;"%0")`, gerekli: [`TEXT`], ipuclari: [`Biçim kodu "%0".`] },
  ],
  'm7-d1': [
    { id: `e1`, soru: `M2:M241'e siparişin gününü (ayın kaçı) yazın.`, sayfa: S, hedef: `M2:M241`, cozum: `=GÜN(B2)`, gerekli: [`DAY`], ipuclari: [`GÜN(tarih).`] },
    { id: `e2`, soru: `N2:N241'e siparişin bir sonraki ayın 1'i olan fatura tarihini TARİH ile yazın.`, sayfa: S, hedef: `N2:N241`, cozum: `=TARİH(YIL(B2);AY(B2)+1;1)`, gerekli: [`DATE`], bicim: `gg.aa.yyyy`, ipuclari: [`Ay+1; TARİH 13. ayı ertesi yılın ocağına çevirir.`] },
  ],
  'm7-d2': [
    { id: `e1`, soru: `Personel sayfasında M2:M161'e işe girişin bulunduğu ayın son gününü yazın.`, sayfa: `Personel`, hedef: `M2:M161`, cozum: `=SERİAY(G2;0)`, gerekli: [`EOMONTH`], bicim: `gg.aa.yyyy`, ipuclari: [`SERİAY(tarih; 0).`] },
    { id: `e2`, soru: `N2:N161'e 31.12.2024 itibarıyla kıdemi "x yıl y ay" biçiminde yazın.`, sayfa: `Personel`, hedef: `N2:N161`, cozum: `=ETARİHLİ(G2;TARİH(2024;12;31);"Y")&" yıl "&ETARİHLİ(G2;TARİH(2024;12;31);"YM")&" ay"`, gerekli: [`DATEDIF`], ipuclari: [`"Y" tam yıl, "YM" yıldan artan ay.`] },
  ],
  'm7-d3': [
    { id: `e1`, soru: `İzinler sayfasında G2:G201'e iznin başlangıcından 10 iş günü sonrasını (resmî tatiller hariç) yazın.`, sayfa: `İzinler`, hedef: `G2:G201`, cozum: `=İŞGÜNÜ(D2;10;Tatiller!$A$2:$A$35)`, gerekli: [`WORKDAY`], bicim: `gg.aa.yyyy`, ipuclari: [`İŞGÜNÜ(başlangıç; 10; tatiller).`] },
    { id: `e2`, soru: `Teslimat sayfasında M2'ye 1 Ocak – 30 Haziran 2024 arasındaki iş günü sayısını (tatiller hariç) yazın.`, sayfa: `Teslimat`, hedef: `M2`, cozum: `=TAMİŞGÜNÜ(TARİH(2024;1;1);TARİH(2024;6;30);Tatiller!$A$2:$A$35)`, gerekli: [`NETWORKDAYS`], varyantsiz: true, ipuclari: [`TAMİŞGÜNÜ(başlangıç; bitiş; tatiller).`] },
  ],
  'm7-d4': [
    { id: `e1`, soru: `Teslimat sayfasında M2:M181'e kuryenin restorandan alma süresini (sipariş anından alınmaya) tam dakika olarak yazın.`, sayfa: `Teslimat`, hedef: `M2:M181`, cozum: `=YUVARLA((G2-F2)*1440;0)`, ipuclari: [`Fark × 1440.`] },
    { id: `e2`, soru: `N2:N181'e sipariş saati 18 ile 21 arasındaysa (18 dahil, 21 hariç) "Akşam", değilse boş yazın.`, sayfa: `Teslimat`, hedef: `N2:N181`, cozum: `=EĞER(VE(SAAT(F2)>=18;SAAT(F2)<21);"Akşam";"")`, gerekli: [`HOUR`], ipuclari: [`SAAT(F2) 0–23 arası.`] },
  ],
  'm8-d1': [
    { id: `e1`, soru: `M2'ye satış yapılan ürünlerin tekrarsız listesini taşırın.`, sayfa: S, hedef: `M2`, okunan: `M2:M40`, cozum: `=BENZERSİZ(G2:G241)`, gerekli: [`UNIQUE`], ipuclari: [`BENZERSİZ(G2:G241).`] },
    { id: `e2`, soru: `L2'ye tüm satırların indirimli tutarını tek formülle taşırın: adet × fiyat × (1 − indirim).`, sayfa: S, hedef: `L2`, okunan: `L2:L241`, cozum: `=H2:H241*I2:I241*(1-J2:J241)`, ipuclari: [`Aralıklarla doğrudan işlem yapın.`] },
  ],
  'm8-d2': [
    { id: `e1`, soru: `M2'ye birim fiyatı 3000 TL'den yüksek satırların ürün, şehir ve fiyatını (G, D, I sütunlarını bu sırayla) taşırın.`, sayfa: S, hedef: `M2`, okunan: `M2:O20`, cozum: `=FİLTRE(SÜTUNSEÇ(A2:K241;7;4;9);I2:I241>3000)`, gerekli: [`FILTER`], ipuclari: [`Önce sütunları seçin, sonra filtreleyin.`] },
    { id: `e2`, soru: `M2'ye Kitap YA DA Spor kategorisindeki satırların ürün adını taşırın.`, sayfa: S, hedef: `M2`, okunan: `M2:M80`, cozum: `=FİLTRE(G2:G241;(F2:F241="Kitap")+(F2:F241="Spor"))`, gerekli: [`FILTER`], ipuclari: [`YA DA: koşulları toplayın.`] },
  ],
  'm8-d3': [
    { id: `e1`, soru: `Satışlar'da M2'ye şehirlerin tekrarsız listesini Z'den A'ya sıralı taşırın.`, sayfa: S, hedef: `M2`, okunan: `M2:M15`, cozum: `=SIRALA(BENZERSİZ(D2:D241);;-1)`, gerekli: [`SORT`, `UNIQUE`], ipuclari: [`SIRALA(dizi; ; -1).`] },
    { id: `e2`, soru: `Ürünler sayfasında H2'ye en pahalı 3 ürünün adını, en pahalıdan başlayarak taşırın.`, sayfa: `Ürünler`, hedef: `H2`, okunan: `H2:H4`, cozum: `=AL(SIRALAÖLÇÜT(B2:B41;D2:D41;-1);3)`, gerekli: [`SORTBY`, `TAKE`], ipuclari: [`Fiyata göre azalan, sonra AL(…; 3).`] },
  ],
  'm8-d4': [
    { id: `e1`, soru: `M2'ye LET ile Kitap kategorisinin toplam cirosunu yazın: önce kategori koşulunu (k), sonra tutarı (t) adlandırın.`, sayfa: S, hedef: `M2`, cozum: `=LET(k;F2:F241="Kitap";t;H2:H241*I2:I241;TOPLA(k*t))`, gerekli: [`LET`], ipuclari: [`LET(ad1; değer1; ad2; değer2; hesap).`] },
    { id: `e2`, soru: `N2'ye LET ile ortalama birim fiyatın üstündeki satır sayısını yazın (ortalamayı bir kez hesaplayın).`, sayfa: S, hedef: `N2`, cozum: `=LET(o;ORTALAMA(I2:I241);EĞERSAY(I2:I241;">"&o))`, gerekli: [`LET`], ipuclari: [`Ortalamayı o adıyla saklayın.`] },
  ],
  'm9-d1': [
    { id: `e1`, soru: `Bayi sayfasında I3:I13'e Tutar (D) hücresi sayı olarak çevrilemiyorsa "Kontrol et", çevrilebiliyorsa boş yazın.`, sayfa: `Bayi`, hedef: `I3:I13`, cozum: `=EĞER(EHATALIYSA(SAYIDEĞERİ(D3;",";"."));"Kontrol et";"")`, gerekli: [`ISERROR`], ipuclari: [`EHATALIYSA(SAYIDEĞERİ(…)).`] },
    { id: `e2`, soru: `Bayi sayfasında J3'e çevrilebilen tutarların toplamını tek formülle yazın.`, sayfa: `Bayi`, hedef: `J3`, cozum: `=TOPLA(EĞERHATA(SAYIDEĞERİ(D3:D13;",";".");0))`, varyantsiz: true, ipuclari: [`SAYIDEĞERİ aralığa uygulanır; hataları 0 yapıp toplayın.`] },
  ],
  'm9-d2': [
    { id: `e1`, soru: `Müşteri ham sayfasında G2:G7'ye e-posta (küçük harfe çevrilmiş) listede birden çok kez geçiyorsa "Yinelenen" yazın.`, sayfa: `Müşteri ham`, hedef: `G2:G7`, cozum: `=EĞER(TOPLA.ÇARPIM(--(KÜÇÜKHARF($C$2:$C$7)=KÜÇÜKHARF(C2)))>1;"Yinelenen";"")`, ipuclari: [`EĞERSAY harf duyarsızdır ama boşluklu ya da farklı biçimli kayıtlar için önce standartlaştırın.`] },
    { id: `e2`, soru: `Satışlar'da M2'ye kaç farklı sipariş numarası olduğunu yazın.`, sayfa: S, hedef: `M2`, cozum: `=SATIRSAY(BENZERSİZ(A2:A241))`, gerekli: [`UNIQUE`, `ROWS`], varyantsiz: true, ipuclari: [`Bir sipariş birden çok satırdan oluşabilir.`] },
  ],
  'm9-d3': [
    { id: `e1`, soru: `Ürün ham sayfasında F2:F10'a ürün adını yazın (koddan sonraki kısım).`, sayfa: `Ürün ham`, hedef: `F2:F10`, cozum: `=PARÇAAL(B2;BUL(" ";B2)+1;100)`, ipuclari: [`İlk boşluktan sonrası.`] },
    { id: `e2`, soru: `Ürün ham sayfasında D2:D10'a kategoriyi doldurun; bu kez üst satırdaki sonuca bakmadan, A sütununda o satıra kadarki son dolu değeri ÇAPRAZARA ile sondan arayarak bulun.`, sayfa: `Ürün ham`, hedef: `D2:D10`, cozum: `=ÇAPRAZARA("*";$A$2:A2;$A$2:A2;"";2;-1)`, gerekli: [`XLOOKUP`], ipuclari: [`Genişleyen aralık $A$2:A2, joker "*" ve sondan arama.`] },
  ],
  'm9-d4': [
    { id: `e1`, soru: `Personel sayfasında N2:N161'e doğum yılı 1950'den küçük ya da 2008'den büyükse "Yaş kontrol", değilse boş yazın. (Veriye iki hatalı kayıt eklendi.)`, sayfa: `Personel`, hedef: `N2:N161`, hazirlik: { D5: 1945, D9: 2010 }, cozum: `=EĞER(YADA(D2<1950;D2>2008);"Yaş kontrol";"")`, ipuclari: [`YADA ile iki sınır.`] },
    { id: `e2`, soru: `Personel sayfasında O2'ye sicil numarası (A) listede birden çok kez geçen satır sayısını yazın. (Veriye bir yinelenen sicil eklendi.)`, sayfa: `Personel`, hedef: `O2`, hazirlik: { A7: 5 }, cozum: `=TOPLA.ÇARPIM(--(EĞERSAY(A2:A161;A2:A161)>1))`, varyantsiz: true, ipuclari: [`EĞERSAY'a ölçüt olarak bütün listeyi verin.`] },
  ],
  'm19-d1': [
    { id: `e1`, tur: `secmeli`, soru: `Gelişmiş Filtre ölçüt alanında Şehir başlığı altına alt alta İzmir ve Ankara yazdınız. Sonuç?`, secenekler: [`Hem İzmir hem Ankara olan satırlar (hiçbiri)`, `İzmir ya da Ankara olan satırlar`, `Yalnız İzmir`, `Hata`], dogru: 1, aciklama: `Ölçüt alanında alt alta satırlar YA DA demektir.`, yanlisAciklama: { 0: `VE için aynı satıra yazılırdı.`, 2: `İkinci satır da bir koşuldur.`, 3: `Geçerli bir ölçüt alanıdır.` } },
  ],
  'm19-d2': [
    { id: `e1`, tur: `secmeli`, soru: `Gelişmiş Filtre'de "Yalnızca benzersiz kayıtlar" işaretlendi, ölçüt alanı boş. Ne olur?`, secenekler: [`Hiç kayıt gelmez`, `Bütün sütunları aynı olan tekrar eden satırlar bir kez gelir`, `Yalnız ilk sütuna göre tekilleştirir`, `Excel ölçüt ister`], dogru: 1, aciklama: `Benzersizlik seçilen bütün sütunlara göredir; ölçüt yoksa her kayıt değerlendirilir.`, yanlisAciklama: { 0: `Ölçüt yoksa her kayıt geçer.`, 2: `Bir sütuna göre tekillik için yalnız o sütunu liste aralığı olarak seçin.`, 3: `Ölçüt isteğe bağlıdır.` } },
  ],
  'm19-d4': [
    { id: `e1`, tur: `secmeli`, soru: `Hızlı Doldurma ile ad soyaddan adları ayırdınız. Kaynak sütundaki bir ad değişirse ne olur?`, secenekler: [`Sonuç kendiliğinden güncellenir`, `Sonuç değişmez; Hızlı Doldurma değer yazar, formül değil`, `Hata verir`, `Sütun silinir`], dogru: 1, aciklama: `Hızlı Doldurma tek seferlik bir dönüşümdür. Güncellenmesi gereken işler için formül ya da Power Query kullanın.`, yanlisAciklama: { 0: `Formül olmadığı için güncellenmez.`, 2: `Değerler olduğu gibi kalır.`, 3: `Hiçbir şey silinmez.` } },
  ],
  'm19-d5': [
    { id: `e1`, tur: `secmeli`, soru: `Alt Toplam komutunu çalıştırmadan önce ne yapılmalı?`, secenekler: [`Tabloyu Excel Tablosuna çevirmek`, `Veriyi gruplanacak sütuna göre sıralamak`, `Özet tablo kurmak`, `Boş satırlar eklemek`], dogru: 1, aciklama: `Alt Toplam gruplanacak sütunda değer her değiştiğinde ara toplam ekler; veri sıralı değilse aynı grup birden çok parçaya bölünür. Excel Tablosunda Alt Toplam kullanılamaz, önce aralığa dönüştürülür.`, yanlisAciklama: { 0: `Excel Tablosunda komut kapalıdır.`, 2: `Alt Toplam özet tablodan bağımsızdır.`, 3: `Komut satırları kendisi ekler.` } },
  ],
  'm21-d2': [
    { id: `e1`, tur: `secmeli`, soru: `Bir ekip "kırmızı boyalı satırlar acil" diye işaretliyor. Raporda bu satırları saymanın en sağlam yolu?`, secenekler: [`Renge göre filtreleyip ALTTOPLAM ile saymak`, `Bir "Öncelik" sütunu ekleyip "Acil" yazmak ve EĞERSAY ile saymak`, `Makroyla rengi okumak`, `Gözle saymak`], dogru: 1, aciklama: `Renk veri değildir; formüller rengi göremez. Bilgiyi bir sütuna yazınca sayım, filtre ve özet tablo çalışır; renk isteniyorsa koşullu biçimle o sütundan üretilir.`, yanlisAciklama: { 0: `Bir seferlik çalışır ama tekrarlanabilir değildir.`, 2: `Çalışır ama gereksiz karmaşık.`, 3: `Hataya açık.` } },
  ],
  'm21-d3': [
    { id: `e1`, tur: `secmeli`, soru: `=KÖPRÜ("#'Satışlar'!A1";"Satışlara git") ne yapar?`, secenekler: [`Satışlar sayfasının A1 hücresine giden bir bağlantı oluşturur`, `Satışlar'ı yeni sekmede açar`, `A1'deki değeri gösterir`, `Hata verir; # kullanılamaz`], dogru: 0, aciklama: `# ile başlayan adres kitap içi bir konumdur. İçindekiler sayfası bu yolla kurulur.`, yanlisAciklama: { 1: `Kitap içi bağlantı sayfaya gider, yeni pencere açmaz.`, 2: `İkinci bağımsız değişken görünen metindir.`, 3: `# kitap içi bağlantının biçimidir.` } },
  ],
};
