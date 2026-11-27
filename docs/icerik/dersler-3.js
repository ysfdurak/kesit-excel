// Modül 9–12: veri temizleme, özet tablo, Power Query, raporlama.
// Bayi (ham; 1 başlık, 2 sütun adları, 3–13 veri: A Bayi, B Şehir, C Tarih, D Tutar, E Not)
// Müşteri ham (1 sütun adları, 2–7 veri: A MusteriNo, B Ad Soyad, C E-posta, D KayitTarihi)
// Ürün ham (A Kategori, B Ürün Kodu ve Adı, C Fiyat; 2–10)   Hedef (A Kategori, B Oca, C Şub, D Mar; 2–5)
// Bütçe (A Kategori, B Ay, C Hedef, D Gerçekleşen; 2–43)
const BAYI_TEMEL = [{ tip: 'ustSatirKaldir', n: 1 }, { tip: 'basligiYukselt' }, { tip: 'bosSatirKaldir' }];
const BAYI_TEMIZ = [...BAYI_TEMEL, { tip: 'kirp', sutunlar: ['Şehir'] }, { tip: 'harf', sutunlar: ['Şehir'], mod: 'ilk' }, { tip: 'yinelenenKaldir', sutunlar: [] },
  { tip: 'degerDegistir', sutun: 'Tutar', eski: '-', yeni: '' }, { tip: 'turDegistir', sutun: 'Tutar', tur: 'number' }, { tip: 'turDegistir', sutun: 'Tarih', tur: 'date' }, { tip: 'hataKaldir', sutunlar: ['Tarih'] }];

export const DERSLER_3 = [
  // ---------------------------------------------------------------- M9 Veri temizleme
  {
    id: 'm9-d1', modul: 'm9', baslik: 'Metne dönmüş sayı ve tarih', sure: 10,
    ozet: '"1.250,50" ekranda sayı gibi görünür ama metindir; toplamda yoktur. SAYIDEĞERİ ve TARİHSAYISI onu geri çevirir.',
    hedefler: ['Metin olarak saklanan sayıyı ve tarihi fark etmek', 'SAYIDEĞERİ ile ayırıcıları belirterek çevirmek', 'Çevrilemeyen değeri EĞERHATA ile işaretlemek'],
    anlatim: [
      'Bayilerden gelen rapor bir metin dosyasından alınmış; Tutar sütunundaki her değer metin. =TOPLA(D3:D13) sıfır verir ve hata da vermez. En tehlikeli veri sorunu budur: sessizce yanlış sonuç.',
      '**SAYIDEĞERİ(metin; ondalık_ayırıcı; grup_ayırıcı)** ayırıcıları sizin söylediğiniz biçimde okur: =SAYIDEĞERİ("1.250,50";",";".") → 1250,5. SAYIYAÇEVİR bilgisayarın bölge ayarına güvenir; veri başka ülkeden geliyorsa yanılabilir.',
      'Bazı satırlarda "-" ya da boş var. SAYIDEĞERİ("-") hata verir. Bunu sıfıra çevirmek mi, boş bırakmak mı? "Kasa kapalı" satırının tutarı 0 değil, **bilinmiyor**dur; boş bırakmak ortalamayı korur. =EĞERHATA(SAYIDEĞERİ(D3;",";".");"").',
      'Tarih metinleri için **TARİHSAYISI**: =TARİHSAYISI("05.01.2024") → 45296. "bilinmiyor" çevrilemez ve hata verir; hücre biçimini tarih yapmayı unutmayın.',
      'Tek seferlik bir dosyada formül yeterli. Aynı rapor her ay geliyorsa Power Query (Modül 11) aynı temizliği bir kez tanımlar ve her ay tek tuşla tekrarlar.',
    ],
    ornek: { sayfa: 'Bayi', hucre: 'G3', formul: '=EĞERHATA(SAYIDEĞERİ(D3;",";".");"")', aciklama: '"1.250,50" metni 1250,5 sayısına döner.' },
    alistirmalar: [
      { id: 'a1', soru: 'Bayi sayfasında G3:G13\'e Tutar\'ın sayı hâlini yazın; çevrilemeyen (- gibi) değerlerde boş metin ("") kalsın.', sayfa: 'Bayi', hedef: 'G3:G13', cozum: '=EĞERHATA(SAYIDEĞERİ(D3;",";".");"")', gerekli: ['NUMBERVALUE'], ipuclari: ['Ondalık ayırıcı virgül, grup ayırıcı nokta.', 'EĞERHATA ile "-" satırını boş bırakın.'] },
      { id: 'a2', soru: 'Bayi sayfasında H3:H13\'e Tarih\'in tarih (seri sayı) hâlini yazın; çevrilemeyenlerde boş metin.', sayfa: 'Bayi', hedef: 'H3:H13', cozum: '=EĞERHATA(TARİHSAYISI(C3);"")', bicim: 'gg.aa.yyyy', gerekli: ['DATEVALUE'], ipuclari: ['TARİHSAYISI("05.01.2024") bir seri sayı verir.'] },
    ],
    sikHata: { yanlis: 'Metin sütununu TOPLA ile toplayıp 0\'ı "satış yok" sanmak', dogru: 'Önce =ESAYIYSA(D3) ile türü kontrol etmek, sonra çevirmek', neden: 'TOPLA metni hata vermeden atlar.' },
    mulakat: { soru: 'SAYIYAÇEVİR ile SAYIDEĞERİ arasında ne fark var?', cevap: 'SAYIYAÇEVİR metni bilgisayarın bölge ayarına göre okur; "1,250.50" Türkiye ayarında hata ya da yanlış sayı olur. SAYIDEĞERİ ondalık ve grup ayırıcısını parametre olarak alır, bu yüzden verinin geldiği ülkeye göre güvenle çevirir.' },
  },
  {
    id: 'm9-d2', modul: 'm9', baslik: 'Yinelenen kayıtları bulmak', sure: 9,
    ozet: 'Aynı satır iki kez gelmiş. Silmeden önce işaretleyin: yinelenen mi, yoksa gerçekten iki ayrı kayıt mı?',
    hedefler: ['Genişleyen aralıkla (A$2:A2) kaçıncı tekrar olduğunu bulmak', 'Tekrarsız kayıt sayısını BENZERSİZ ile almak', 'Neyin "aynı" sayılacağına karar vermek'],
    anlatim: [
      'Müşteri listesinde 102 numaralı müşteri iki kez var; biri büyük harfli e-postayla. Satırı silmeden önce işaretlemek gerekir, çünkü bazen iki kayıt gerçekten farklıdır (aynı adlı iki kişi).',
      '**Genişleyen aralık** hilesi: =EĞERSAY($A$2:A2;A2). Aralığın başı sabit, sonu satırla birlikte iner. Her satır "bu değeri buraya kadar kaç kez gördüm?" sorusunu cevaplar. 1 ilk görülüş, 2 ve üstü tekrardır.',
      'Bunu açıklamaya çevirin: =EĞER(EĞERSAY($A$2:A2;A2)>1;"Yinelenen";""). Excel\'in "Yinelenenleri Kaldır" düğmesi aynı işi yapar ama neyi sildiğini göstermez.',
      'Kaç farklı müşteri var? =SATIRSAY(BENZERSİZ(C2:C241)). Toplam satırla farkı yinelenen satır sayısıdır.',
      'Neyin aynı olduğuna siz karar verirsiniz: müşteri numarası mı, ad mı, e-posta mı? E-posta ile karşılaştıracaksanız önce KÜÇÜKHARF(KIRP()) ile tek tipe getirin.',
    ],
    ornek: { sayfa: 'Müşteri ham', hucre: 'F2', formul: '=EĞER(EĞERSAY($A$2:A2;A2)>1;"Yinelenen";"")', aciklama: 'İkinci 102 satırı "Yinelenen" olarak işaretlenir.' },
    alistirmalar: [
      { id: 'a1', soru: 'Müşteri ham sayfasında F2:F7\'ye müşteri numarası (A) daha önceki satırlarda geçtiyse "Yinelenen", ilk kez geçiyorsa boş metin yazın.', sayfa: 'Müşteri ham', hedef: 'F2:F7', cozum: '=EĞER(EĞERSAY($A$2:A2;A2)>1;"Yinelenen";"")', ipuclari: ['Genişleyen aralık: $A$2:A2.', 'EĞERSAY sonucu 1\'den büyükse tekrar.'] },
      { id: 'a2', soru: 'Satışlar sayfasında M2\'ye kaç farklı müşteri alışveriş yaptığını yazın.', sayfa: 'Satışlar', hedef: 'M2', cozum: '=SATIRSAY(BENZERSİZ(C2:C241))', ipuclari: ['BENZERSİZ tekrarsız liste verir, SATIRSAY onu sayar.'] },
    ],
    sikHata: { yanlis: '=EĞERSAY($A$2:$A$7;A2)>1 ile işaretlemek', dogru: '=EĞERSAY($A$2:A2;A2)>1', neden: 'Tam aralık her iki kopyayı da işaretler; hangisinin tutulacağı belli olmaz. Genişleyen aralık ilkini temiz bırakır.' },
    mulakat: { soru: 'Bir listede yinelenen kayıtları silmeden önce ne yaparsınız?', cevap: 'Anahtarı belirlerim (numara mı, e-posta mı), anahtarı temizlerim (KIRP, KÜÇÜKHARF), genişleyen aralıkla işaretlerim ve işaretlenenlerden bir örneği gözle kontrol ederim. Sonra silerim ya da Power Query\'de Kaldırılan Yinelenenler adımıyla kalıcı hâle getiririm; adım kaydı neyin neden silindiğini belgeler.' },
  },
  {
    id: 'm9-d3', modul: 'm9', baslik: 'Birleşik hücreden ayırmak ve boşları doldurmak', sure: 10,
    ozet: 'Kod ile ad aynı hücrede; kategori yalnız grubun ilk satırında yazılı. İki klasik "Excel\'den gelen rapor" sorunu.',
    hedefler: ['Kod ve adı boşluktan ayırmak', 'Boş kategori hücresini üstteki değerle doldurmak', 'Formülle doldurmanın sınırını bilmek'],
    anlatim: [
      'Ürün ham sayfasında B sütunu "E01 Kablosuz Kulaklık" gibi: kod ve ad birleşik. İlk boşluğa kadar kod, sonrası ad: =SOLDAN(B2;BUL(" ";B2)-1) ve =PARÇAAL(B2;BUL(" ";B2)+1;100). Excel 365\'te =ÖNCEKİMETİN(B2;" ").',
      'Kategori yalnız grubun ilk satırında yazılmış, altı boş. Bu biçim ekranda okunur ama süzme, pivot ve ETOPLA için kullanılamaz: boş satırlar hiçbir kategoriye ait değildir.',
      'Formülle doldurma: D2\'ye =EĞER(A2="";D1;A2) yazıp aşağı doldurun. Satır kendi kategorisi varsa onu, yoksa **bir üstteki sonucu** alır. D1 başlık satırı olduğu için ilk veri satırında A2 dolu olmalıdır.',
      'Bu bir yardımcı sütundur. Kalıcı yapmak için sütunu kopyalayıp "Değer olarak yapıştır" yapılır; Power Query\'de aynı iş "Aşağı Doldur" adımıdır ve kaynağa dokunmaz.',
    ],
    ornek: { sayfa: 'Ürün ham', hucre: 'D2', formul: '=EĞER(A2="";D1;A2)', aciklama: 'Boş kategori üstteki satırdan alınır.' },
    alistirmalar: [
      { id: 'a1', soru: 'Ürün ham sayfasında D2:D10\'a her satırın kategorisini yazın: A doluysa A, boşsa bir üstteki D değeri.', sayfa: 'Ürün ham', hedef: 'D2:D10', cozum: '=EĞER(A2="";D1;A2)', ipuclari: ['Koşul A2="".', 'Boşsa D1, doluysa A2.'] },
      { id: 'a2', soru: 'Ürün ham sayfasında E2:E10\'a ürün kodunu (ilk boşluktan önceki kısım) yazın.', sayfa: 'Ürün ham', hedef: 'E2:E10', cozum: '=SOLDAN(B2;BUL(" ";B2)-1)', ipuclari: ['BUL(" ";B2) boşluğun konumu.'] },
    ],
    sikHata: { yanlis: 'Boş kategori satırlarını ETOPLA\'ya sokmak', dogru: 'Önce yardımcı sütunla doldurmak', neden: 'Boş hücreler hiçbir ölçüte uymaz; grup toplamları eksik çıkar.' },
    mulakat: { soru: 'Birleştirilmiş hücreli ya da yalnız ilk satırı dolu bir raporu analize nasıl hazırlarsınız?', cevap: 'Birleştirmeleri kaldırır, boşları üstteki değerle doldururum (formül, Git > Özel > Boşluklar ya da Power Query Aşağı Doldur), birleşik alanları ayırırım ve her sütunun tek bir türde tek bir bilgi taşıdığı düz bir tabloya çeviririm. Tekrarlanan raporlarda bunu Power Query adımlarına koyarım.' },
  },
  {
    id: 'm9-d4', modul: 'm9', baslik: 'Kontrol sütunları: veri kurallarını test etmek', sure: 9,
    ozet: 'Raporu yayımlamadan önce verinin kurallara uyduğunu formülle test edin: çıkış tarihi varsa çıkış türü de olmalı.',
    hedefler: ['İş kuralını DOĞRU/YANLIŞ formülüne çevirmek', 'Kurala uymayan satırları saymak', 'Kontrolü raporun yanına koymak'],
    anlatim: [
      'Her veri setinin yazılı olmayan kuralları vardır: çıkış tarihi olan çalışanın çıkış türü de olmalı, işe giriş doğum tarihinden en az 18 yıl sonra olmalı, teslim zamanı sipariş zamanından sonra olmalı.',
      'Kuralı bir **kontrol sütununa** yazın: =EĞER(VE(DEĞİL(EBOŞSA(H2));EBOŞSA(I2));"Çıkış türü eksik";""). Boş sonuç "sorun yok" demektir.',
      'Raporun üstüne tek bir sayı koyun: kurala uymayan satır sayısı. =ÇOKEĞERSAY(H2:H161;"<>";I2:I161;""). "<>" dolu, "" boş demektir. Bu sayı 0 değilse rapor gönderilmez.',
      'Bu yaklaşım teknik değil, süreçtir: veri her geldiğinde aynı kontroller çalışır ve sonuç belgelenir. Mülakatta "verinin doğruluğundan nasıl emin olursunuz?" sorusunun somut cevabıdır.',
    ],
    ornek: { sayfa: 'Personel', hucre: 'L2', formul: '=EĞER(VE(DEĞİL(EBOŞSA(H2));EBOŞSA(I2));"Çıkış türü eksik";"")', aciklama: 'Kurala uymayan satırı açıklamayla işaretler.' },
    alistirmalar: [
      { id: 'a1', soru: 'Personel sayfasında L2:L161\'e kural kontrolü yazın: Çıkış (H) doluyken Çıkış Türü (I) boşsa "Çıkış türü eksik", değilse boş metin.', sayfa: 'Personel', hedef: 'L2:L161', cozum: '=EĞER(VE(DEĞİL(EBOŞSA(H2));EBOŞSA(I2));"Çıkış türü eksik";"")', bosKaynak: true, ipuclari: ['İki koşul: H dolu (DEĞİL(EBOŞSA(H2))) ve I boş (EBOŞSA(I2)).'] },
      { id: 'a2', soru: 'Personel sayfasında M2\'ye Çıkış dolu ama Çıkış Türü boş olan satır sayısını tek formülle yazın.', sayfa: 'Personel', hedef: 'M2', cozum: '=ÇOKEĞERSAY(H2:H161;"<>";I2:I161;"")', gerekli: ['COUNTIFS'], ipuclari: ['"<>" dolu, "" boş demektir.'] },
    ],
    sikHata: { yanlis: 'Kontrolü yalnız gözle yapmak', dogru: 'Kuralı formüle yazıp ihlal sayısını raporun üstüne koymak', neden: '160 satırda göz bir istisnayı kaçırır; formül her yeni veride aynı testi yapar.' },
    mulakat: { soru: 'Bir İK raporunu yöneticiye göndermeden önce hangi kontrolleri yaparsınız?', cevap: 'Satır sayısı beklenenle aynı mı, anahtar (sicil) tekrarsız mı, zorunlu alanlar dolu mu, tarih sırası mantıklı mı (giriş < çıkış), kategoriler beklenen listede mi. Her birini bir kontrol formülüne yazar, ihlal sayılarını raporun üstünde gösteririm.' },
  },

  // ---------------------------------------------------------------- M10 Özet tablo
  {
    id: 'm10-d1', modul: 'm10', baslik: 'Özet tablonun mantığı: satır ve değer', sure: 10,
    ozet: 'Pivot, ETOPLA tablosunu sürükle-bırakla kurar. Her hücresi aslında bir ÇOKETOPLA\'dır.',
    hedefler: ['Satır alanı ve değer alanı seçmek', 'Toplam, Say ve Ortalama arasında seçim yapmak', 'Pivot hücresinin eşdeğer formülünü okumak'],
    anlatim: [
      'Özet tablo (PivotTable) dört alandan oluşur: **Satırlar**, **Sütunlar**, **Değerler** ve **Filtreler**. Satıra Kategori, değere Adet koyunca her kategori için toplam adet hesaplanır.',
      'Arkadaki hesap Modül 4\'te yazdığınız formülün aynısıdır. Kesit\'te bir pivot hücresine tıkladığınızda o hücrenin **eşdeğer formülü** görünür: =ÇOKETOPLA(Satışlar!$H$2:$H$241;Satışlar!$F$2:$F$241;"Kitap"). Pivot bir sihir değil, hızlı yazılmış formüllerdir.',
      'Değer alanının özeti değiştirilebilir: **Toplam** sayıları toplar, **Say** dolu hücreleri sayar (sipariş sayısı için), **Ortalama**, **En Büyük**, **En Küçük**. Metin bir alanı değere koyarsanız Excel otomatik olarak Say seçer.',
      'Pivot kaynağı düz bir tablo olmalıdır: tek başlık satırı, boş satır ve birleştirilmiş hücre yok, her sütunda tek tür. Bu yüzden temizlik modülü pivottan önce gelir.',
      'Satır tutarı (Adet × Fiyat) kaynakta yoksa pivot onu toplayamaz. Kaynağa bir yardımcı sütun eklemek en basit yoldur.',
    ],
    ornek: { tur: 'pivot', sayfa: 'Satışlar', yapi: { satir: 'Kategori', degerler: [{ alan: 'Adet', ozet: 'toplam' }] }, aciklama: 'Kategori başına toplam adet.' },
    alistirmalar: [
      { id: 'a1', tur: 'pivot', soru: 'Satışlar\'dan şehir başına toplam adedi gösteren bir özet tablo kurun.', sayfa: 'Satışlar', cozum: { satir: 'Şehir', degerler: [{ alan: 'Adet', ozet: 'toplam' }] }, ipuclari: ['Satır: Şehir, Değer: Adet (Toplam).'] },
      { id: 'a2', tur: 'pivot', soru: 'Kanal başına sipariş satırı sayısını gösterin (Sipariş No alanını Say ile özetleyin).', sayfa: 'Satışlar', cozum: { satir: 'Kanal', degerler: [{ alan: 'Sipariş No', ozet: 'say' }] }, ipuclari: ['Sipariş No bir sayıdır ama toplamak anlamsız; Say seçin.'] },
    ],
    sikHata: { yanlis: 'Sipariş numarası alanını Toplam ile özetlemek', dogru: 'Say ile özetlemek', neden: 'Kimlik numaralarının toplamı anlamsızdır; Excel sayısal alanda varsayılan olarak Toplam seçer.' },
    mulakat: { soru: 'Pivot tablo ile ÇOKETOPLA formüllerinden oluşan bir özet arasında nasıl seçim yaparsınız?', cevap: 'Keşif ve hızlı yeniden düzenleme için pivot; biçimi sabit, başka hesaplara bağlanacak ya da hücre hücre denetlenecek bir rapor için formül. Pivot yeniden düzenlenince hücre adresleri değişir, formülle kurulan tabloda değişmez. Sonuçları birbirine karşı kontrol etmek de iyi bir alışkanlıktır.' },
  },
  {
    id: 'm10-d2', modul: 'm10', baslik: 'Sütun alanı ve filtre', sure: 10,
    ozet: 'Kategori × Kanal çapraz tablosu ve yalnız teslim edilen siparişler. İki boyutlu özet ve süzme.',
    hedefler: ['Sütun alanıyla çapraz tablo kurmak', 'Filtre alanıyla belirli kayıtları seçmek', 'Genel Toplam satırını ve sütununu okumak'],
    anlatim: [
      'Sütun alanına Kanal koyunca her kategori satırı Web, Mobil ve Mağaza için ayrı hücrelere bölünür. Sağda **Genel Toplam** sütunu satırın toplamını, en altta Genel Toplam satırı sütunun toplamını verir.',
      '**Filtre** alanı tabloyu belirli kayıtlarla sınırlar. Ciro raporunda İptal ve İade satırları çıkarılmalıdır: Durum filtresinde yalnız "Teslim edildi" ve "Gönderildi"yi seçin.',
      'Filtre eşdeğer formüle de yansır: ÇOKETOPLA\'ya bir aralık-ölçüt çifti daha eklenir. Kesit\'te bir hücreye tıklayıp bunu görün.',
      'Çapraz tabloda bir alan 5–7 değerden fazlaysa (şehir gibi) sütuna değil satıra koyun; geniş tablo okunmaz ve telefonda sığmaz.',
    ],
    ornek: { tur: 'pivot', sayfa: 'Satışlar', yapi: { satir: 'Kategori', sutun: 'Kanal', degerler: [{ alan: 'Adet', ozet: 'toplam' }], filtreler: [{ alan: 'Durum', degerler: ['Teslim edildi', 'Gönderildi'] }] }, aciklama: 'Gerçekleşen siparişlerde kategori × kanal adet.' },
    alistirmalar: [
      { id: 'a1', tur: 'pivot', soru: 'Satırda Kategori, sütunda Kanal, değerde toplam Adet olan çapraz tabloyu kurun.', sayfa: 'Satışlar', cozum: { satir: 'Kategori', sutun: 'Kanal', degerler: [{ alan: 'Adet', ozet: 'toplam' }] }, ipuclari: ['Sütun alanına Kanal.'] },
      { id: 'a2', tur: 'pivot', soru: 'Yalnız "İptal" durumundaki satırların şehir başına toplam adedini gösterin.', sayfa: 'Satışlar', cozum: { satir: 'Şehir', degerler: [{ alan: 'Adet', ozet: 'toplam' }], filtreler: [{ alan: 'Durum', degerler: ['İptal'] }] }, ipuclari: ['Filtre: Durum = İptal.'] },
    ],
    sikHata: { yanlis: 'Ciro pivotunu iptal ve iadeler dahil kurmak', dogru: 'Durum filtresiyle gerçekleşen siparişleri seçmek', neden: 'İptal edilen sipariş ciro değildir; rapor gerçekleşmeyen satışı da sayar.' },
    mulakat: { soru: 'Pivot tablo verisi güncellendi ama tablo değişmedi. Neden?', cevap: 'Pivot, kaynak verinin bir önbelleğinden hesaplanır; Yenile (Alt+F5) gerekir. Kaynağa yeni satır eklendiyse ve kaynak sabit bir aralıksa (A1:K241) yeni satırlar hiç görülmez; kaynağı Excel Tablosu (Ctrl+T) yapmak aralığın kendiliğinden büyümesini sağlar.' },
  },
  {
    id: 'm10-d3', modul: 'm10', baslik: 'Tarihi gruplamak: ay, çeyrek, yıl', sure: 9,
    ozet: 'Günlük tarihleri aya ya da çeyreğe toplamak için yardımcı sütun gerekmez: pivot tarihi gruplar.',
    hedefler: ['Tarih alanını aya ve çeyreğe göre gruplamak', 'Aylık trendi tablo olarak okumak', 'Gruplamanın eşdeğer formülünü anlamak'],
    anlatim: [
      'Tarihi satıra koyarsanız her gün ayrı bir satır olur. **Gruplama** ile Ay, Çeyrek ya da Yıl seçilir; Excel 365 tarihi çoğu zaman otomatik olarak gruplar.',
      'Ay gruplaması hem yılı hem ayı tutar: Ocak 2024 ile Ocak 2025 ayrı satırlardır. Ay adını metin olarak üretip pivotlamanın (Modül 7) aksine sıra da doğrudur.',
      'Eşdeğer formülde ay bir tarih aralığına dönüşür: ">="&TARİH(2024;3;1) ve "<"&TARİH(2024;4;1). Modül 4\'te öğrendiğiniz kalıp.',
      'Aylık tabloyu sütuna ay, satıra kategori koyarak kurmak klasik bir yönetim raporudur. Ay sayısı 12\'yi geçiyorsa ayları satıra alın.',
    ],
    ornek: { tur: 'pivot', sayfa: 'Satışlar', yapi: { satir: 'Tarih', degerler: [{ alan: 'Adet', ozet: 'toplam' }], grupla: { Tarih: 'ay' } }, aciklama: 'Aylık toplam adet.' },
    alistirmalar: [
      { id: 'a1', tur: 'pivot', soru: 'Satırda ay (Tarih alanı aya göre gruplanmış), değerde toplam Adet olan tabloyu kurun.', sayfa: 'Satışlar', cozum: { satir: 'Tarih', degerler: [{ alan: 'Adet', ozet: 'toplam' }], grupla: { Tarih: 'ay' } }, ipuclari: ['Satır: Tarih, gruplama: Ay.'] },
      { id: 'a2', tur: 'pivot', soru: 'Satırda Kategori, sütunda çeyrek (Tarih çeyreğe göre), değerde toplam Adet olan tabloyu kurun.', sayfa: 'Satışlar', cozum: { satir: 'Kategori', sutun: 'Tarih', degerler: [{ alan: 'Adet', ozet: 'toplam' }], grupla: { Tarih: 'ceyrek' } }, ipuclari: ['Sütun: Tarih, gruplama: Çeyrek.'] },
    ],
    sikHata: { yanlis: 'METNEÇEVİR(B2;"aaaa") sütununu pivota koymak', dogru: 'Tarih alanını aya göre gruplamak', neden: 'Ay adı metni alfabetik sıralanır ve yılları birleştirir.' },
    mulakat: { soru: 'Pivotta tarihi gruplayamıyorsanız sebebi ne olabilir?', cevap: 'Tarih sütununda en az bir metin ya da boş hücre vardır; Excel sütunu tarih olarak görmez. ESAYIYSA ile kontrol eder, metin tarihleri çevirir (TARİHSAYISI ya da Power Query tür değiştirme) ve pivotu yenilerim.' },
  },
  {
    id: 'm10-d4', modul: 'm10', baslik: 'Değerleri yüzde olarak göstermek', sure: 9,
    ozet: 'Aynı sayıları "toplamın yüzdesi" olarak göstermek, hangi kategorinin büyük olduğunu tek bakışta söyler.',
    hedefler: ['Genel toplamın yüzdesi gösterimini kullanmak', 'Satır toplamının yüzdesini çapraz tabloda okumak', 'Yüzdelerin hangi tabana göre hesaplandığını söylemek'],
    anlatim: [
      'Değer alanında **Değerleri Farklı Göster** seçeneği hesaplanmış sayıyı bir tabana böler. **Genel toplamın %\'si**: her hücre ÷ tüm tablonun toplamı. Kitap %27 ise satılan her dört üründen biri kitaptır.',
      'Çapraz tabloda **Satır toplamının %\'si** her satırı kendi içinde %100 yapar: "Elektronik satışlarının yüzde kaçı Web\'den?" Sütun yüzdesi ise "Web satışlarının yüzde kaçı Elektronik?" sorusunun cevabıdır. Aynı tablo, iki farklı soru.',
      'Raporda tabanı mutlaka yazın. "Web %48" tek başına "Web satışların %48\'i mi, yoksa Web\'in büyümesi mi?" diye okunabilir.',
      'Toplam ve yüzde birlikte daha anlaşılırdır: aynı alanı değerlere iki kez ekleyip birini yüzde gösterin.',
    ],
    ornek: { tur: 'pivot', sayfa: 'Satışlar', yapi: { satir: 'Kategori', degerler: [{ alan: 'Adet', ozet: 'toplam' }], goster: 'genelYuzde' }, aciklama: 'Kategori payları.' },
    alistirmalar: [
      { id: 'a1', tur: 'pivot', soru: 'Kanal başına toplam Adedi genel toplamın yüzdesi olarak gösterin.', sayfa: 'Satışlar', cozum: { satir: 'Kanal', degerler: [{ alan: 'Adet', ozet: 'toplam' }], goster: 'genelYuzde' }, ipuclari: ['Gösterim: Genel toplamın %.'] },
      { id: 'a2', tur: 'pivot', soru: 'Satırda Kategori, sütunda Kanal olan adet tablosunda her kategorinin kanal dağılımını görmek için satır toplamının yüzdesini gösterin.', sayfa: 'Satışlar', cozum: { satir: 'Kategori', sutun: 'Kanal', degerler: [{ alan: 'Adet', ozet: 'toplam' }], goster: 'satirYuzde' }, ipuclari: ['Her satır %100 olmalı.'] },
    ],
    sikHata: { yanlis: 'Satır yüzdesini sütun yüzdesi gibi okumak', dogru: 'Hangi toplamın %100 olduğuna bakmak', neden: 'Satır yüzdesinde her satır, sütun yüzdesinde her sütun %100\'dür; cevapladıkları soru farklıdır.' },
    mulakat: { soru: '"Mobil kanalın payı arttı" cümlesini bir pivottan nasıl doğrularsınız?', cevap: 'Satıra ay, sütuna kanal koyar ve satır toplamının yüzdesini gösteririm; her ay içinde Mobil\'in payı okunur. Payın artması mutlak satışın arttığı anlamına gelmez; aynı tabloyu adet olarak da gösterir, iki okumayı birlikte veririm.' },
  },

  // ---------------------------------------------------------------- M11 Power Query
  {
    id: 'm11-d1', modul: 'm11', baslik: 'Power Query\'ye giriş: adım kaydı', sure: 10,
    ozet: 'Power Query temizliği adım adım kaydeder. Gelecek ay aynı dosya gelince tek tuşla tekrarlar.',
    hedefler: ['Sorgu, adım ve önizleme kavramlarını bilmek', 'Üst satırları kaldırıp ilk satırı başlık yapmak', 'Adımın ürettiği M satırını okumak'],
    anlatim: [
      'Formülle temizlik sonucu hücrelere yazar; Power Query ise **ne yaptığınızı** kaydeder. Her tıklama sağdaki **Uygulanan Adımlar** listesine bir satır ekler. Kaynak dosya değişince Yenile\'ye basarsınız, aynı adımlar yeniden çalışır.',
      'Bayi raporunun ilk satırı bir başlık metni, ikinci satırı sütun adları. Üç adımla düz bir tabloya dönüşür: **Üst satırları kaldır (1)**, **İlk satırı başlık yap**, **Boş satırları kaldır**.',
      'Her adım arkada bir **M** satırı yazar: Table.Skip(Kaynak, 1), Table.PromoteHeaders(…). M yazmanız gerekmez, ama okuyabilmek bir adımın neden hata verdiğini anlamayı sağlar. Kesit her adımın M kodunu altta gösterir.',
      'Power Query kaynağı değiştirmez. Sonucu yeni bir sayfaya tablo olarak yükler; ham dosya olduğu gibi kalır. Bu, "temizlerken veriyi bozdum" riskini ortadan kaldırır.',
    ],
    ornek: { tur: 'sorgu', sayfa: 'Bayi', adimlar: BAYI_TEMEL, aciklama: 'Üç adımda başlık satırı yerine oturur, boş satır gider.' },
    alistirmalar: [
      { id: 'a1', tur: 'sorgu', soru: 'Bayi sayfasını sütun adları başlıkta olan ve boş satırı olmayan bir tabloya çevirin.', sayfa: 'Bayi', cozum: BAYI_TEMEL, ipuclari: ['Önce 1 üst satırı kaldırın.', 'Sonra ilk satırı başlık yapın, en son boş satırları kaldırın.'] },
      { id: 'a2', tur: 'sorgu', soru: 'Müşteri ham sayfasında ilk satırı başlık yapın ve E-posta sütununu tamamen küçük harfe çevirin.', sayfa: 'Müşteri ham', cozum: [{ tip: 'basligiYukselt' }, { tip: 'harf', sutunlar: ['E-posta'], mod: 'kucuk' }], ipuclari: ['İlk satır zaten sütun adları; üst satır kaldırmayın.'] },
    ],
    sikHata: { yanlis: 'Başlığı yükseltmeden önce sütun adına göre işlem yapmaya çalışmak', dogru: 'Önce İlk satırı başlık yap', neden: 'Yükseltmeden önce sütunlar Column1, Column2 diye adlanır.' },
    mulakat: { soru: 'Power Query\'yi formüllere göre ne zaman tercih edersiniz?', cevap: 'Aynı temizlik düzenli tekrar ediyorsa (her ay gelen rapor), veri birden çok dosyadan birleşiyorsa ya da kaynak büyükse. Adımlar belgelenir, kaynak değişmez, yenileme tek tuştur. Tek seferlik küçük bir düzeltmede formül daha hızlıdır.' },
  },
  {
    id: 'm11-d2', modul: 'm11', baslik: 'Tür değiştirme, kırpma ve hatalar', sure: 11,
    ozet: 'Metin tutarlar sayıya, metin tarihler tarihe. Çevrilemeyen hücreler Error olur; onları bilerek ele alın.',
    hedefler: ['Kırp ve harf düzeni adımlarını uygulamak', 'Türü tr-TR kültürüyle değiştirmek', 'Hatalı satırları görmek ve kaldırmak'],
    anlatim: [
      '**Kırp** baştaki ve sondaki boşlukları siler; **Büyük/Küçük Harf > Her Sözcüğün İlk Harfi Büyük** yazımı tek tipe getirir. " istanbul " ve "İstanbul" artık aynı değerdir; bu sayede **Yinelenenleri Kaldır** iki Merkez Bayi satırından birini siler.',
      '**Veri türü** değiştirme Power Query\'nin en önemli adımıdır. Tür değiştirirken **kültür** (yerel ayar) seçilir: tr-TR\'de "1.250,50" 1250,5 olur. Kültür yanlışsa 1,2505 ya da hata çıkar.',
      '"-" değeri sayıya çevrilemez. Önce **Değeri Değiştir** ile "-" yerine boş (null) yazın: tutar bilinmiyor demektir. "bilinmiyor" tarihi ise çevrilemez ve hücre **Error** olur.',
      'Error\'lu satırı ne yapacağınız iş kararıdır: kaldırmak mı, yerine boş koymak mı? Bu derste tarihi bilinmeyen satır analizden çıkarılıyor: **Hataları Kaldır**. Kaç satırın gittiğini not edin; raporda yazılmalıdır.',
    ],
    ornek: { tur: 'sorgu', sayfa: 'Bayi', adimlar: BAYI_TEMIZ, aciklama: 'Şehir tek tip, tutar sayı, tarih tarih; tarihi okunmayan satır çıkarıldı.' },
    alistirmalar: [
      { id: 'a1', tur: 'sorgu', soru: 'Bayi raporunu temizleyin: başlık ve boş satırlar (önceki ders), Şehir kırpılmış ve her sözcüğün ilk harfi büyük, yinelenen satırlar kaldırılmış, Tutar\'daki "-" boş yapılıp sayıya, Tarih tarihe çevrilmiş, tarihi hatalı satır kaldırılmış.', sayfa: 'Bayi', cozum: BAYI_TEMIZ, ipuclari: ['Yinelenenleri kırpma ve harf düzeninden sonra kaldırın; yoksa " istanbul " ile "İstanbul" farklı sayılır.', '"-" değerini türü değiştirmeden önce boşaltın.'] },
      { id: 'a2', tur: 'sorgu', soru: 'Müşteri ham sayfasında ilk satırı başlık yapın, E-posta\'yı küçük harfe çevirin, yinelenenleri kaldırın ve KayitTarihi\'ni tarihe çevirin; geçersiz tarihli (30 Şubat) satırı kaldırın.', sayfa: 'Müşteri ham', cozum: [{ tip: 'basligiYukselt' }, { tip: 'harf', sutunlar: ['E-posta'], mod: 'kucuk' }, { tip: 'yinelenenKaldir', sutunlar: [] }, { tip: 'turDegistir', sutun: 'KayitTarihi', tur: 'date' }, { tip: 'hataKaldir', sutunlar: ['KayitTarihi'] }], ipuclari: ['Küçük harfe çevirmeden önce iki 102 satırı farklıdır.'] },
    ],
    sikHata: { yanlis: 'Yinelenenleri temizlikten önce kaldırmak', dogru: 'Önce kırp ve harf düzeni, sonra yinelenenleri kaldır', neden: 'Power Query karşılaştırmada boşluğa ve harfe duyarlıdır; temizlenmemiş kopyalar ayrı satır sayılır.' },
    mulakat: { soru: 'Power Query\'de tür değiştirme adımı neden bazen başka bilgisayarda hata verir?', cevap: 'Kültür belirtilmemişse çevirme o bilgisayarın bölge ayarına göre yapılır. Türkçe ayarlı bilgisayarda doğru okunan "1.250,50", İngilizce ayarlıda farklı okunur. Adımda kültürü açıkça (tr-TR) vermek sorgunun her yerde aynı sonucu üretmesini sağlar.' },
  },
  {
    id: 'm11-d3', modul: 'm11', baslik: 'Aşağı doldurma, sütun bölme, özetlemeyi kaldırma', sure: 11,
    ozet: 'Rapor biçimindeki tabloları analiz biçimine çeviren üç adım: boşları doldur, birleşik sütunu böl, geniş tabloyu uzat.',
    hedefler: ['Aşağı Doldur ile boş grup hücrelerini doldurmak', 'Sütunu sınırlayıcıya göre bölmek', 'Diğer Sütunların Özetlemesini Kaldır ile geniş tabloyu uzun yapmak'],
    anlatim: [
      'Ürün ham tablosunda kategori yalnız grubun ilk satırında. **Aşağı Doldur** boş hücreyi üstteki değerle doldurur; Modül 9\'daki formülün tek tıklık hâlidir.',
      '**Sütunu Böl > Sınırlayıcıya göre** "E01 Kablosuz Kulaklık" değerini ilk boşluktan iki sütuna ayırır: Kod ve Ürün. "En soldaki sınırlayıcıda" seçilmelidir; her boşlukta bölerseniz "Kablosuz Kulaklık" da ikiye ayrılır.',
      'Hedef tablosunda aylar sütun başlığı: Kategori, Oca, Şub, Mar. Bu **geniş** biçim okunur ama pivotlanmaz ve yeni ay eklenince yapı değişir. **Diğer Sütunların Özetlemesini Kaldır** (Unpivot) Kategori\'yi sabit tutar, diğer sütunları Ay ve Hedef adlı iki sütuna indirir: her satır bir kategori-ay.',
      'Uzun biçim bir veri tabanının ve pivotun beklediği biçimdir. "Bir sütun = bir değişken" kuralını hatırlayın: Oca, Şub, Mar ayrı değişkenler değil, Ay değişkeninin değerleridir.',
    ],
    ornek: { tur: 'sorgu', sayfa: 'Hedef', adimlar: [{ tip: 'ozetKaldir', sabit: ['Kategori'], nitelik: 'Ay', deger: 'Hedef' }], aciklama: 'Geniş hedef tablosu kategori-ay satırlarına iner.' },
    alistirmalar: [
      { id: 'a1', tur: 'sorgu', soru: 'Ürün ham tablosunda Kategori\'yi aşağı doldurun ve "Ürün Kodu ve Adı" sütununu ilk boşluktan Kod ve Ürün olarak ikiye bölün.', sayfa: 'Ürün ham', cozum: [{ tip: 'asagiDoldur', sutunlar: ['Kategori'] }, { tip: 'sutunBol', sutun: 'Ürün Kodu ve Adı', ayirici: ' ', adlar: 'Kod, Ürün' }], ipuclari: ['Bölmede yeni adları "Kod, Ürün" diye yazın.'] },
      { id: 'a2', tur: 'sorgu', soru: 'Hedef tablosunu Kategori sabit kalacak şekilde uzun biçime çevirin; yeni sütunlar Ay ve Hedef olsun.', sayfa: 'Hedef', cozum: [{ tip: 'ozetKaldir', sabit: ['Kategori'], nitelik: 'Ay', deger: 'Hedef' }], ipuclari: ['Diğer Sütunların Özetlemesini Kaldır; sabit: Kategori.'] },
    ],
    sikHata: { yanlis: 'Aylar sütunlarını tek tek seçip özetlemeyi kaldırmak', dogru: 'Kategori\'yi seçip Diğer Sütunların Özetlemesini Kaldır', neden: 'Seçilen sütunlar adlarıyla kaydedilir; gelecek ay Nis sütunu eklenince sorgu onu görmez. "Diğer" seçeneği yeni sütunları da kapsar.' },
    mulakat: { soru: 'Geniş ve uzun veri biçimi arasındaki farkı ve neden önemli olduğunu anlatın.', cevap: 'Genişte bir değişkenin değerleri sütun başlığıdır (aylar yan yana); uzunda her satır bir gözlemdir (kategori, ay, değer). Pivot, filtre, grafik ve veri tabanları uzun biçimi bekler; yeni dönem eklemek yapıyı değiştirmez. Power Query\'de Unpivot ile çeviririm.' },
  },
  {
    id: 'm11-d4', modul: 'm11', baslik: 'Sorguları birleştirmek ve gruplamak', sure: 12,
    ozet: 'DÜŞEYARA\'nın Power Query karşılığı Birleştir (Merge); ETOPLA\'nınki Grupla. Kârı kategoriye göre tek sorguda hesaplayın.',
    hedefler: ['Birleştir ile başka tablodan sütun getirmek', 'Özel sütunla satır kârı hesaplamak', 'Grupla ile kategori toplamı almak'],
    anlatim: [
      '**Sorguları Birleştir** iki tabloyu anahtar sütunla eşleştirir: Satışlar\'daki Ürün ile Ürünler\'deki Ürün. **Sol dış** birleştirmede Satışlar\'ın her satırı kalır, eşleşen Ürünler satırından istenen sütunlar (Maliyet) gelir; eşleşmeyenlerde boş kalır. **İç** birleştirme yalnız eşleşenleri tutar.',
      '**Özel Sütun** her satır için bir ifade hesaplar: [Adet] * ([Birim Fiyat] - [Maliyet]). Köşeli parantez sütun adıdır; formül çubuğundaki Excel formülüne benzer ama hücre adresi yoktur, her zaman "bu satırın" değeridir.',
      '**Grupla** ETOPLA ve pivotun Power Query karşılığıdır: Kategori\'ye göre grupla, Kâr\'ı topla. Sonuç kategori başına tek satırdır.',
      'Bu üç adımlı sorgu, Satışlar ya da Ürünler her değiştiğinde Yenile ile yeniden hesaplanır. M kodunda Table.NestedJoin, Table.AddColumn ve Table.Group satırlarını görün; ileride bir başkasının sorgusunu okurken bu adlar size yol gösterir.',
      '**Sorgu Ekle** (Append) ise aynı yapıdaki tabloları alt alta koyar: Ocak ve Şubat bayi raporları gibi.',
    ],
    ornek: { tur: 'sorgu', sayfa: 'Satışlar', adimlar: [{ tip: 'birlestir', anahtar: 'Ürün', tablo: 'Ürünler', digerAnahtar: 'Ürün', getir: 'Maliyet', tur: 'solDis' }, { tip: 'ozelSutun', ad: 'Kâr', ifade: '[Adet] * ([Birim Fiyat] - [Maliyet])' }, { tip: 'grupla', anahtar: 'Kategori', islem: 'toplam', deger: 'Kâr', ad: 'Toplam Kâr' }], aciklama: 'Kategori başına brüt kâr; üç adım.' },
    alistirmalar: [
      { id: 'a1', tur: 'sorgu', soru: 'Satışlar\'a Ürünler\'den Maliyet sütununu getirin (sol dış birleştirme, anahtar her iki tabloda Ürün), sonra Kâr adlı özel sütun ekleyin: [Adet] * ([Birim Fiyat] - [Maliyet]).', sayfa: 'Satışlar', cozum: [{ tip: 'birlestir', anahtar: 'Ürün', tablo: 'Ürünler', digerAnahtar: 'Ürün', getir: 'Maliyet', tur: 'solDis' }, { tip: 'ozelSutun', ad: 'Kâr', ifade: '[Adet] * ([Birim Fiyat] - [Maliyet])' }], ipuclari: ['Birleştir: diğer tablo Ürünler, getirilecek sütun Maliyet.', 'Özel sütun ifadesinde sütun adları köşeli parantez içinde.'] },
      { id: 'a2', tur: 'sorgu', soru: 'Önceki sorguya Kategori\'ye göre gruplama ekleyin: Kâr toplamı "Toplam Kâr" adıyla.', sayfa: 'Satışlar', sirasiz: true, cozum: [{ tip: 'birlestir', anahtar: 'Ürün', tablo: 'Ürünler', digerAnahtar: 'Ürün', getir: 'Maliyet', tur: 'solDis' }, { tip: 'ozelSutun', ad: 'Kâr', ifade: '[Adet] * ([Birim Fiyat] - [Maliyet])' }, { tip: 'grupla', anahtar: 'Kategori', islem: 'toplam', deger: 'Kâr', ad: 'Toplam Kâr' }], ipuclari: ['Grupla: anahtar Kategori, işlem Toplam, değer Kâr.'] },
    ],
    sikHata: { yanlis: 'İç birleştirmeyle eşleşmeyen satırları fark etmeden kaybetmek', dogru: 'Sol dış birleştirip eşleşmeyenleri (boş Maliyet) saymak', neden: 'Katalogda olmayan bir ürünün satışları iç birleştirmede sessizce kaybolur; toplam ciro düşer.' },
    mulakat: { soru: 'Power Query\'de Birleştir ile Ekle arasındaki fark nedir?', cevap: 'Birleştir (Merge) yanlara sütun ekler: iki tabloyu bir anahtarla eşleştirir, SQL JOIN ya da DÜŞEYARA gibi. Ekle (Append) alta satır ekler: aynı yapıdaki tabloları üst üste koyar, SQL UNION gibi. Birleştirmede tür (sol dış, iç, tam) seçimi eşleşmeyen satırların ne olacağını belirler.' },
  },

  // ---------------------------------------------------------------- M12 Rapor
  {
    id: 'm12-d1', modul: 'm12', baslik: 'TOPLA.ÇARPIM: yardımcı sütunsuz hesap', sure: 10,
    ozet: 'Satır satır çarpıp toplar. Ciroyu ve koşullu ciroyu yardımcı sütun eklemeden tek formülle verir.',
    hedefler: ['TOPLA.ÇARPIM ile çarpımların toplamını almak', 'Koşulu (F="Kitap") 1/0 dizisi olarak çarpıma katmak', 'ÇOKETOPLA\'nın yetmediği yerde kullanmak'],
    anlatim: [
      '**TOPLA.ÇARPIM(dizi1; dizi2; …)** dizilerin karşılıklı elemanlarını çarpar ve toplar: toplam ciro =TOPLA.ÇARPIM(H2:H241;I2:I241). İndirimle: =TOPLA.ÇARPIM(H2:H241;I2:I241;1-J2:J241).',
      'Koşul da bir dizidir: (F2:F241="Kitap") DOĞRU/YANLIŞ üretir, çarpıma girince 1/0 olur. Kitap cirosu: **=TOPLA.ÇARPIM((F2:F241="Kitap")*H2:H241*I2:I241)**. Koşullu çarpımda tek bağımsız değişken ve * kullanın; noktalı virgülle ayrı verilen mantıksal dizi 0 sayılır.',
      'ÇOKETOPLA bir sütunu toplar; toplanacak şey iki sütunun çarpımıysa yetmez. TOPLA.ÇARPIM bu boşluğu doldurur ve ayrıca "ay = 3" gibi hesaplanmış koşullar kabul eder: (AY(B2:B241)=3).',
      'Excel 365\'te aynı işi =TOPLA((F2:F241="Kitap")*H2:H241*I2:I241) de yapar. TOPLA.ÇARPIM eski sürümlerde de çalıştığı için paylaşılan dosyalarda hâlâ tercih edilir.',
    ],
    ornek: { sayfa: 'Satışlar', hucre: 'M2', formul: '=TOPLA.ÇARPIM(H2:H241;I2:I241;1-J2:J241)', aciklama: 'İndirimli toplam ciro, yardımcı sütun yok.' },
    alistirmalar: [
      { id: 'a1', soru: 'M2\'ye tüm satırların indirimli toplam cirosunu tek formülle yazın: Σ Adet × Birim Fiyat × (1 − İndirim).', sayfa: 'Satışlar', hedef: 'M2', cozum: '=TOPLA.ÇARPIM(H2:H241;I2:I241;1-J2:J241)', gerekli: ['SUMPRODUCT'], ipuclari: ['Üç dizi: adet, fiyat, 1-indirim.'] },
      { id: 'a2', soru: 'M2\'ye Mart ayındaki (herhangi bir yıl) siparişlerin brüt cirosunu (Adet × Birim Fiyat) yazın.', sayfa: 'Satışlar', hedef: 'M2', cozum: '=TOPLA.ÇARPIM((AY(B2:B241)=3)*H2:H241*I2:I241)', gerekli: ['SUMPRODUCT'], ipuclari: ['Koşul: AY(B2:B241)=3.', 'Koşulu * ile çarpıma katın.'] },
    ],
    sikHata: { yanlis: '=TOPLA.ÇARPIM(F2:F241="Kitap";H2:H241)', dogru: '=TOPLA.ÇARPIM((F2:F241="Kitap")*H2:H241)', neden: 'Ayrı bağımsız değişken olarak verilen DOĞRU/YANLIŞ dizisi sayıya çevrilmez, 0 sayılır; sonuç 0 olur.' },
    mulakat: { soru: 'TOPLA.ÇARPIM ile ÇOKETOPLA arasında hangisini ne zaman seçersiniz?', cevap: 'Toplanan değer tek bir sütunsa ve koşullar doğrudan sütun değerleriyse ÇOKETOPLA: daha hızlı ve okunur. Toplanan değer bir çarpımsa (adet × fiyat) ya da koşul hesaplanmış bir ifadeyse (ay, metnin ilk harfi) TOPLA.ÇARPIM. Çok büyük aralıklarda TOPLA.ÇARPIM yavaşlar; tam sütun (A:A) vermem.' },
  },
  {
    id: 'm12-d2', modul: 'm12', baslik: 'Kontrol toplamları ve ALTTOPLAM', sure: 9,
    ozet: 'İki yoldan hesaplanan aynı sayı tutmalı. Tutmuyorsa rapor gönderilmez. ALTTOPLAM filtrelenmiş listede doğru toplar.',
    hedefler: ['Bir kontrol toplamı (iki yoldan aynı sayı) kurmak', 'Farkı 0 olması gereken bir kontrol hücresi yazmak', 'ALTTOPLAM\'ın TOPLA\'dan farkını bilmek'],
    anlatim: [
      'Bir rapordaki her önemli sayıyı **iki farklı yoldan** hesaplayın: kategori toplamlarının toplamı genel toplama eşit olmalı. =TOPLA(H2:H241)-TOPLA(ETOPLA(F2:F241;BENZERSİZ(F2:F241);H2:H241)) 0 vermiyorsa bir kategori adı yanlış yazılmış ya da bir satır kategorisizdir.',
      'Kontrol hücresini raporun üstüne koyun ve koşullu biçimle 0 değilse kırmızı yapın. Bu küçük alışkanlık, yöneticiye yanlış sayı gitmesini önleyen en ucuz sigortadır.',
      '**ALTTOPLAM(işlev_no; aralık)** iki şey yapar: listede başka ALTTOPLAM sonuçları varsa onları atlar (ara toplamlar iki kez sayılmaz) ve Excel\'de filtre uygulandığında yalnız görünen satırları hesaplar. 9 toplam, 1 ortalama, 3 dolu sayma; 109 gibi 100\'lü kodlar elle gizlenen satırları da dışarıda bırakır.',
      'Filtreli bir listenin altına TOPLA koyarsanız gizli satırlar da toplanır ve ekranda gördüğünüzle uyuşmaz. Tablo (Ctrl+T) toplam satırı bu yüzden ALTTOPLAM kullanır.',
    ],
    ornek: { sayfa: 'Satışlar', hucre: 'M2', formul: '=TOPLA(H2:H241)-TOPLA(ETOPLA(F2:F241;BENZERSİZ(F2:F241);H2:H241))', aciklama: 'Kontrol: 0 olmalı.' },
    alistirmalar: [
      { id: 'a1', soru: 'M2\'ye Adet sütununun ALTTOPLAM ile toplamını yazın (işlev numarası 9).', sayfa: 'Satışlar', hedef: 'M2', cozum: '=ALTTOPLAM(9;H2:H241)', gerekli: ['SUBTOTAL'], ipuclari: ['9 = TOPLA.'] },
      { id: 'a2', soru: 'Bütçe sayfasında M2\'ye kontrol formülü yazın: Gerçekleşen sütununun toplamı ile kategori bazlı ETOPLA toplamlarının toplamı arasındaki fark (0 olmalı).', sayfa: 'Bütçe', hedef: 'M2', cozum: '=TOPLA(D2:D43)-TOPLA(ETOPLA(A2:A43;BENZERSİZ(A2:A43);D2:D43))', varyantsiz: true, ipuclari: ['ETOPLA\'ya ölçüt olarak BENZERSİZ(A2:A43) verin; her kategori için toplam döner.', 'Sonuç 0 değilse kategorisiz satır var.'] },
    ],
    sikHata: { yanlis: 'Filtreli listenin altına =TOPLA(…) koymak', dogru: '=ALTTOPLAM(9;…)', neden: 'TOPLA gizli satırları da toplar; ekrandaki satırlarla uyuşmaz.' },
    mulakat: { soru: 'Bir raporun sayılarının doğru olduğundan nasıl emin olursunuz?', cevap: 'Her ana sayıyı iki bağımsız yoldan hesaplarım (formül ve pivot, ya da detay toplamı ve özet toplamı) ve farkı 0 olması gereken kontrol hücreleri koyarım; satır sayısını kaynakla karşılaştırırım; birkaç satırı elle hesaplarım. Kontrol hücreleri raporla birlikte kalır, her güncellemede yeniden çalışır.' },
  },
  {
    id: 'm12-d3', modul: 'm12', baslik: 'Koşullu biçimlendirme kuralı yazmak', sure: 9,
    ozet: 'Koşullu biçim bir formüldür: her hücre için DOĞRU/YANLIŞ. Satırın tamamını boyamak için sütunu $ ile sabitleyin.',
    hedefler: ['Koşullu biçim kuralını formül olarak yazmak', 'Tüm satırı boyamak için karma başvuru ($D2) kullanmak', 'Kuralı önce bir hücrede denemek'],
    anlatim: [
      'Koşullu Biçimlendirme > Yeni Kural > **Formül kullan** seçeneği her hücre için bir formül çalıştırır; DOĞRU dönen hücre biçimlenir. Formül, seçili alanın **sol üst hücresi** için yazılır, Excel diğerlerine kaydırır.',
      'Bütçe\'de hedefin altında kalan satırların **tamamını** kırmızı yapmak için A2:D43 seçilir ve kural **=$D2<$C2** yazılır. Sütunlar $ ile sabit, satır serbest: her hücre kendi satırının D ve C değerine bakar. $ olmazsa B sütunundaki hücre C ile B\'yi karşılaştırır.',
      'Kuralı doğrudan Koşullu Biçimlendirme penceresine yazmak hata ayıklamayı zorlaştırır. Önce boş bir sütuna aynı formülü yazın ve DOĞRU/YANLIŞ sonuçlarını görün; doğruysa kurala kopyalayın.',
      'Rapor kuralları: uyarı rengi için tek bir renk seçin, tüm sayfayı boyamayın. Kırmızı yalnız "aksiyon gerekiyor" demek olmalı.',
    ],
    ornek: { sayfa: 'Bütçe', hucre: 'E2', formul: '=$D2<$C2', aciklama: 'Hedefin altında kalan satırda DOĞRU. Bu formül A2:D43\'e kural olarak verilir.' },
    alistirmalar: [
      { id: 'a1', soru: 'Bütçe sayfasında E2:E43\'e koşullu biçim kuralını deneme formülü olarak yazın: gerçekleşen hedefin %90\'ından azsa DOĞRU. Sütunları $ ile sabitleyin (kural A:D alanına uygulanacak).', sayfa: 'Bütçe', hedef: 'E2:E43', cozum: '=$D2<$C2*0,9', ipuclari: ['=$D2<$C2*0,9.', 'Sütun harfinin önüne $; satır numarasına değil.'] },
      { id: 'a2', soru: 'Satışlar sayfasında L2:L241\'e kural formülü yazın: iptal edilmiş ve birim fiyatı 1000 TL\'den yüksek satırlar DOĞRU.', sayfa: 'Satışlar', hedef: 'L2:L241', cozum: '=VE($K2="İptal";$I2>1000)', ipuclari: ['VE ile iki koşul.', '$K2 ve $I2: satır serbest, sütun sabit.'] },
    ],
    sikHata: { yanlis: 'Satır kuralını =D2<C2 diye yazmak', dogru: '=$D2<$C2', neden: 'Kural sağdaki sütunlara kayınca E2<D2, F2<E2 karşılaştırılır; satırın yalnız bir kısmı boyanır.' },
    mulakat: { soru: 'Koşullu biçimlendirmede bir satırın tamamını bir hücrenin değerine göre nasıl boyarsınız?', cevap: 'Tüm tabloyu seçer, Formül kullan kuralına sol üst hücre için =$K2="İptal" gibi sütunu sabit, satırı göreli bir formül yazarım. Excel kuralı her hücre için kaydırır; sütun sabit olduğu için hepsi aynı satırdaki K hücresine bakar.' },
  },
  {
    id: 'm12-d4', modul: 'm12', baslik: 'Vaka: aylık bütçe özeti', sure: 14,
    ozet: 'Öğrendiklerinizi birleştirin: kategori bazında hedef, gerçekleşen ve sapma; en kötü kategori ve yöneticiye tek cümle.',
    hedefler: ['Ham tablodan kategori özetini tek formülle üretmek', 'En büyük sapmayı bulmak', 'Sonucu bir cümleye dönüştürmek'],
    anlatim: [
      'Senaryo: finans ekibi her ay başında 2024 ilk yarı bütçe tablosundan kategori bazlı bir özet istiyor. Yönetici tabloyu değil, bir cümleyi okuyacak: "En çok hangi kategori hedefin altında, ne kadar?"',
      '**Adım 1, sapma**: her satır için Gerçekleşen − Hedef. Pozitif hedefin üstü demektir.',
      '**Adım 2, özet**: kategori başına toplam hedef, toplam gerçekleşen ve sapma oranı. LET ile tek formül: kategori listesi, iki ETOPLA ve bir oran; YATAYYIĞ ile yan yana.',
      '**Adım 3, en kötü kategori**: sapmaların en küçüğünü (MİN) bulup KAÇINCI ile konumunu, İNDİS ile adını alın.',
      '**Adım 4, cümle**: ="En büyük açık "&kategori&" kategorisinde: "&METNEÇEVİR(-sapma;"#.##0")&" TL." Bu cümle her ay veri değişince kendiliğinden güncellenir. Son olarak kontrol toplamını (Ders 12.2) ekleyin.',
    ],
    ornek: { sayfa: 'Bütçe', hucre: 'H2', formul: '=LET(k;SIRALA(BENZERSİZ(A2:A43));h;ETOPLA(A2:A43;k;C2:C43);g;ETOPLA(A2:A43;k;D2:D43);YATAYYIĞ(k;h;g;(g-h)/h))', aciklama: 'Kategori, hedef, gerçekleşen, sapma oranı: dört sütunluk özet, tek formül.' },
    alistirmalar: [
      { id: 'a1', soru: 'Bütçe sayfasında E2:E43\'e sapma tutarını yazın: Gerçekleşen − Hedef.', sayfa: 'Bütçe', hedef: 'E2:E43', cozum: '=D2-C2', ipuclari: ['Pozitif sonuç hedefin üstü demektir.'] },
      { id: 'a2', soru: 'Bütçe sayfasında H2\'ye kategorileri alfabetik sırayla, yanlarında toplam hedef, toplam gerçekleşen ve sapma oranı ((g−h)/h) olacak şekilde tek formülle taşırın (dört sütun).', sayfa: 'Bütçe', hedef: 'H2', okunan: 'H2:K10', cozum: '=LET(k;SIRALA(BENZERSİZ(A2:A43));h;ETOPLA(A2:A43;k;C2:C43);g;ETOPLA(A2:A43;k;D2:D43);YATAYYIĞ(k;h;g;(g-h)/h))', gerekli: ['LET'], ipuclari: ['Önce kategori listesine ad verin (k).', 'ETOPLA\'ya k\'yi ölçüt olarak verin; YATAYYIĞ ile dört sütunu birleştirin.'] },
      { id: 'a3', soru: 'Bütçe sayfasında M2\'ye toplamda hedefin en çok altında kalan (Gerçekleşen − Hedef toplamı en küçük olan) kategorinin adını yazın.', sayfa: 'Bütçe', hedef: 'M2', cozum: '=LET(k;BENZERSİZ(A2:A43);s;ETOPLA(A2:A43;k;D2:D43)-ETOPLA(A2:A43;k;C2:C43);İNDİS(k;KAÇINCI(MİN(s);s;0)))', ipuclari: ['Kategori başına sapma dizisi: ETOPLA(gerçekleşen) − ETOPLA(hedef).', 'İNDİS(k; KAÇINCI(MİN(s); s; 0)).'] },
    ],
    sikHata: { yanlis: 'Özeti elle kopyalanmış sayılarla kurmak', dogru: 'Özeti kaynak tablodan formülle üretmek', neden: 'Gelecek ay veri değişince elle kopyalanan sayılar eski kalır ve kimse fark etmez.' },
    mulakat: { soru: 'Bu vakayı yöneticiye nasıl sunarsınız?', cevap: 'Tek cümleyle başlarım (en büyük açık hangi kategoride, ne kadar), altında dört sütunluk özet tablo, en altta kontrol toplamı. Tablodaki sayılar formülle kaynağa bağlıdır; gelecek ay yalnız veri güncellenir. Neyi bilmediğimi de yazarım: hedefler nasıl belirlendi, iade dahil mi.' },
  },
];
