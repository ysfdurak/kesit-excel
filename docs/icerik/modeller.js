// Modül 15–17 için küçük model sayfaları (Kesit verisinden değil, elle kurulmuş). Formüller Türkçe yazılır.
// Ham sayfalar A1'den başlar; satır dizisindeki sıra = Excel satırı. Tablo sayfaları (Kayıt) başlık + satır biçimindedir.

const bos = n => Array(n).fill(null);
// Kredi: tutar, faiz, vade → taksit. Hedef Ara, Veri Tablosu ve Senaryo Yöneticisi bu modelle çalışır.
const KREDI = [
  ['Forklift kredisi', null, null, null],
  bos(4),
  ['Kredi tutarı', 1800000, null, 'Yıldız Ev & Yaşam yeni elektrikli forklift için banka kredisi'],
  ['Yıllık faiz', 0.36, null, 'Aylık faiz = yıllık / 12'],
  ['Vade (ay)', 24, null, null],
  ['Aylık taksit', '=DEVRESEL_ÖDEME(B4/12;B5;-B3)', null, 'DEVRESEL_ÖDEME eksi döndürür: ödenen para. -B3 ile artı yapılır'],
  ['Toplam ödeme', '=B6*B5', null, null],
  ['Toplam faiz', '=B7-B3', null, null],
  bos(4),
  ['Taksit', 'Faiz', 'Anapara', 'Kalan borç'],
  ...Array.from({ length: 24 }, (_, i) => [i + 1, null, null, null]),
];
// Yatırım: forklift satın almak mı, kiralamak mı? Nakit akışları ve iskonto oranı
const YATIRIM = [
  ['Forklift: satın al mı, kirala mı?', null, null, null, null, null, null],
  bos(7),
  ['İskonto oranı (yıllık)', 0.3, null, null, null, null, null],
  bos(7),
  ['Yıl', 0, 1, 2, 3, 4, 5],
  ['Satın al: nakit akışı', -2400000, -90000, -90000, -110000, -110000, 520000],
  ['Kirala: nakit akışı', 0, -780000, -780000, -780000, -780000, -780000],
  ['Otomasyon: tasarruf', -950000, 310000, 340000, 360000, 380000, 400000],
  bos(7),
  ['Amortisman', 'Değer', null, null, null, null, null],
  ['Maliyet', 2400000, null, null, null, null, null],
  ['Hurda değeri', 300000, null, null, null, null, null],
  ['Ömür (yıl)', 5, null, null, null, null, null],
];
// Fiyat: başabaş ve kâr hedefi (Hedef Ara)
const FIYAT = [
  ['Depo hizmeti: aylık kâr modeli', null],
  bos(2),
  ['Varsayım', 'Değer'],
  ['Palet başı ücret', 38],
  ['Aylık palet hareketi', 26000],
  ['Palet başı değişken gider', 21],
  ['Aylık sabit gider', 395000],
  ['Gelir', '=B4*B5'],
  ['Değişken gider', '=B6*B5'],
  ['Aylık kâr', '=B8-B9-B7'],
];
// Üretim: ürün karması (Çözücü, doğrusal)
const URETIM = [
  ['Atölye: ürün karması', null, null, null, null, null],
  bos(6),
  ['', 'Masa', 'Sandalye', 'Dolap', null, null],
  ['Üretim adedi', 0, 0, 0, null, null],
  ['Birim kâr (₺)', 1200, 350, 1800, null, null],
  bos(6),
  ['Kaynak', 'Masa', 'Sandalye', 'Dolap', 'Kullanılan', 'Kapasite'],
  ['Montaj (saat)', 3, 1.2, 4.5, '=TOPLA.ÇARPIM($B$4:$D$4;B8:D8)', 500],
  ['Boya (saat)', 2, 0.5, 3, '=TOPLA.ÇARPIM($B$4:$D$4;B9:D9)', 300],
  ['Ahşap (m²)', 4, 1.5, 6, '=TOPLA.ÇARPIM($B$4:$D$4;B10:D10)', 800],
  bos(6),
  ['Talep üst sınırı', 80, 200, 40, null, null],
  bos(6),
  ['Toplam kâr', '=TOPLA.ÇARPIM(B4:D4;B5:D5)', null, null, null, null],
];
// Vardiya: haftalık forklift operatörü planı. Her operatör art arda 5 gün çalışır, 2 gün izinlidir (döngüsel hafta).
// Bir günde çalışan = o gün ve önceki 4 günde işe başlayanlar. En az kişiyle günlük talebi karşıla (tamsayı).
const GUN = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'], SUT = ['B', 'C', 'D', 'E', 'F', 'G', 'H'];
const VARDIYA = [
  ['Depo haftalık vardiya planı: forklift operatörü (5 gün çalış, 2 gün izin)', null, null, null, null, null, null, null],
  Array(8).fill(null),
  ['Gün', ...GUN],
  ['Bu gün işe başlayan', 0, 0, 0, 0, 0, 0, 0],
  ['Çalışan operatör', ...SUT.map((_, j) => '=' + [0, 1, 2, 3, 4].map(k => SUT[(j - k + 7) % 7] + '4').join('+'))],
  ['Gereken operatör', 17, 13, 15, 19, 14, 16, 11],
  Array(8).fill(null),
  ['Toplam operatör', '=TOPLA(B4:H4)', null, null, null, null, null, null],
  ['Haftalık maliyet (₺)', '=B8*9800', null, null, null, null, null, null],
];
// Denetim: hatalı bir bütçe özeti. Formül denetimiyle hatanın kaynağını bulun.
const DENETIM = [
  ['Bölge', 'Ocak', 'Şubat', 'Mart', 'Çeyrek'],
  ['Marmara', 412000, 398500, 431200, '=TOPLA(B2:D2)'],
  ['Ege', 288400, 301900, 296300, '=TOPLA(B3:D3)'],
  ['İç Anadolu', 251700, 247300, 262800, '=TOPLA(B4:C4)'],
  ['Akdeniz', 199300, '204.600', 211900, '=TOPLA(B5:D5)'],
  ['Karadeniz', 143800, 139200, 151600, '=TOPLA(B6:D6)'],
  ['Toplam', '=TOPLA(B2:B6)', '=TOPLA(C2:C6)', '=TOPLA(D2:D6)', '=TOPLA(E2:E6)'],
  ['Kontrol', null, null, null, '=TOPLA(B7:D7)-E7'],
  bos(5),
  ['Pay', '=B2/$B$7', '=C2/$C$7', '=D2/D7', null],
  [null, '=B3/$B$7', '=C3/$C$7', '=D3/D8', null],
];
// Listeler: bağımlı açılır liste için kategori → ürün listeleri (adlar: Elektronik, Giyim, Kitap, Spor)
const LISTELER = [
  ['Kategoriler', 'Elektronik', 'Giyim', 'Kitap', 'Spor'],
  ['Elektronik', 'Kulaklık', 'Tişört', 'Roman', 'Mat'],
  ['Giyim', 'Akıllı saat', 'Kot pantolon', 'Defter', 'Dambıl'],
  ['Kitap', 'Powerbank', 'Mont', 'Ajanda', 'Pilates topu'],
  ['Spor', 'Oyuncu mouse', 'Spor ayakkabı', null, 'Su matarası'],
];
// Kayıt: sipariş giriş formu (veri doğrulama). Bazı satırlar bilerek kurala uymuyor.
const KANAL = ['Web', 'Mobil', 'Mağaza'], KAT = ['Elektronik', 'Giyim', 'Kitap', 'Spor'];
const URUN = { Elektronik: ['Kulaklık', 'Akıllı saat', 'Powerbank', 'Oyuncu mouse'], Giyim: ['Tişört', 'Kot pantolon', 'Mont', 'Spor ayakkabı'], Kitap: ['Roman', 'Defter', 'Ajanda'], Spor: ['Mat', 'Dambıl', 'Pilates topu', 'Su matarası'] };
const KAYIT_SATIR = Array.from({ length: 30 }, (_, i) => {
  const no = 9001 + i, tarih = 45870 + (i * 7) % 29, kanal = KANAL[i % 3], kat = KAT[(i * 5) % 4], adet = 1 + (i * 7) % 9, ind = [0, 0.05, 0.1, 0.15, 0.2][i % 5];
  return [no, tarih, kanal, kat, adet, ind, URUN[kat][(i * 3) % URUN[kat].length]];
});
KAYIT_SATIR[2][6] = 'Kulaklık'; KAYIT_SATIR[2][3] = 'Kitap'; KAYIT_SATIR[16][3] = 'Spor'; KAYIT_SATIR[16][6] = 'Mont';
// Hatalar: boşluklu kanal, yazım hatası, sıfır ve kesirli adet, aşırı indirim, gelecekteki tarih, yinelenen sipariş no
KAYIT_SATIR[3][2] = 'web '; KAYIT_SATIR[11][2] = 'Magaza'; KAYIT_SATIR[7][4] = 0; KAYIT_SATIR[18][4] = 2.5; KAYIT_SATIR[22][4] = 60;
KAYIT_SATIR[5][5] = 0.45; KAYIT_SATIR[26][5] = 0.6; KAYIT_SATIR[14][1] = 45930; KAYIT_SATIR[20][0] = 9010;


// ---- Modül 18–20 ----
// İade nedenleri (Pareto): büyükten küçüğe sıralı değil; Pareto grafiği kendisi sıralar
const IADELER = [['Yanlış ürün gönderildi', 48], ['Hasarlı ürün', 12], ['Beden uymadı', 64], ['Geç teslim', 30], ['Eksik parça', 9], ['Renk farklı', 5], ['Fikir değişikliği', 4], ['Diğer', 3]];
// Üç aylık kategori özeti: aynı düzen (3B başvuru için), ama Mart'ta satır sırası farklı (Birleştir/ETOPLA dersinin tuzağı)
const KAT7 = ['Elektronik', 'Ev & Yaşam', 'Giyim', 'Hediye', 'Kitap', 'Kozmetik', 'Spor'];
const ay = (adet, ciro) => KAT7.map((k, i) => [k, adet[i], ciro[i]]);
const OCAK = ay([182, 240, 310, 75, 128, 96, 140], [612400, 286300, 248900, 41200, 30700, 52800, 119600]);
const SUBAT = ay([165, 226, 284, 140, 117, 104, 133], [548900, 270100, 230400, 77900, 28100, 57200, 112300]);
const MART_SIRA = [2, 0, 6, 4, 1, 5, 3]; // Giyim, Elektronik, Spor, Kitap, Ev & Yaşam, Kozmetik, Hediye
const MART = MART_SIRA.map(i => [KAT7[i], [201, 258, 335, 88, 131, 112, 151][i], [671900, 302800, 270100, 48600, 31900, 61400, 128800][i]]);
const CEYREK = [['Kategori', 'Çeyrek adet'], ...KAT7.map(k => [k, null]), [null, null], ['Toplam', null]];
// Depo taşıma projesi (Gantt ve özel sıralama). Başlangıç tarih seri sayısı: 06.01.2025 = 45663
const GOREVLER = [
  ['Yeni depo sözleşmesi', 45663, 5, 'Satın alma', 'Yüksek'],
  ['Raf yerleşim planı', 45670, 8, 'Operasyon', 'Yüksek'],
  ['Raf montajı', 45680, 15, 'Tedarikçi', 'Orta'],
  ['WMS adres tanımları', 45684, 6, 'BT', 'Yüksek'],
  ['Personel eğitimi', 45695, 4, 'İK', 'Orta'],
  ['Stok sayımı', 45699, 2, 'Operasyon', 'Yüksek'],
  ['Taşıma', 45701, 5, 'Lojistik', 'Yüksek'],
  ['Eski depo teslimi', 45708, 3, 'İdari işler', 'Düşük'],
];
// Bölge depoları: günlük sevk (palet), hedef ve madde grafiği bantları (kötü/orta üst sınırları)
const BOLGELER = [['İzmir', 410, 450, 300, 400], ['Ankara', 318, 400, 260, 350], ['İstanbul Avrupa', 655, 620, 450, 560], ['İstanbul Anadolu', 540, 600, 420, 520], ['Bursa', 228, 250, 170, 220]];
// İki vardiyanın kalite ölçüleri (%): kelebek grafiği
const VARDIYALAR = [['Zamanında sevk', 94, 88], ['Doğru toplama', 99.1, 98.4], ['Ekipman kullanımı', 72, 81], ['Devamlılık', 96, 91], ['Eğitim tamamlama', 85, 64]];
// Aylık sipariş talebi ve personel (tahmin, eğim, korelasyon). Ay: ayın ilk günü (01.01.2024 = 45292)
const AY_BAS = [45292, 45323, 45352, 45383, 45413, 45444, 45474, 45505, 45536, 45566, 45597, 45627, 45658, 45689, 45717, 45748, 45778, 45809, 45839, 45870, 45901, 45931, 45962, 45992];
const SEZON = [-320, -410, -60, 40, 120, 90, 60, 20, 180, 260, 640, 880];
const TALEP = AY_BAS.map((t, i) => { const sip = Math.round(4300 + 86 * i + SEZON[i % 12] + [37, -52, 18, -11, 44, -29][i % 6]); return [t, sip, Math.round(sip / 148 + [0.4, -0.6, 0.2, 0.9, -0.3, 0][i % 6]), i + 1]; });

export const MODELLER = {
  'Kredi': { satirlar: KREDI, ham: true },
  'Yatırım': { satirlar: YATIRIM, ham: true },
  'Fiyat': { satirlar: FIYAT, ham: true },
  'Üretim': { satirlar: URETIM, ham: true },
  'Vardiya': { satirlar: VARDIYA, ham: true },
  'Denetim': { satirlar: DENETIM, ham: true },
  'Listeler': { satirlar: LISTELER, ham: true },
  'İadeler': { basliklar: ['Neden', 'Adet'], satirlar: IADELER },
  'Ocak': { basliklar: ['Kategori', 'Adet', 'Ciro'], satirlar: OCAK, bicim: [null, '#.##0', '#.##0'] },
  'Şubat': { basliklar: ['Kategori', 'Adet', 'Ciro'], satirlar: SUBAT, bicim: [null, '#.##0', '#.##0'] },
  'Mart': { basliklar: ['Kategori', 'Adet', 'Ciro'], satirlar: MART, bicim: [null, '#.##0', '#.##0'] },
  'Çeyrek': { satirlar: CEYREK, ham: true },
  'Görevler': { basliklar: ['Görev', 'Başlangıç', 'Süre (gün)', 'Sorumlu', 'Öncelik'], satirlar: GOREVLER, bicim: [null, 'gg.aa.yyyy', null, null, null] },
  'Bölgeler': { basliklar: ['Bölge', 'Gerçekleşen', 'Hedef', 'Kötü', 'Orta'], satirlar: BOLGELER },
  'Vardiyalar': { basliklar: ['Ölçüt', 'A vardiyası', 'B vardiyası'], satirlar: VARDIYALAR },
  'Talep': { basliklar: ['Ay', 'Sipariş', 'Personel', 'Ay no'], satirlar: TALEP, bicim: ['aaa yyyy', '#.##0', null, null] },
  'Kayıt': { basliklar: ['Sipariş No', 'Tarih', 'Kanal', 'Kategori', 'Adet', 'İndirim', 'Ürün'], satirlar: KAYIT_SATIR, bicim: [null, 'gg.aa.yyyy', null, null, null, '0%', null] },
};
