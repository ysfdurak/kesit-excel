// Müfredat: 17 modül. Ders gövdeleri dersler-1/2/3/4/5.js dosyalarında.
import { DERSLER_1 } from './dersler-1.js';
import { DERSLER_2 } from './dersler-2.js';
import { DERSLER_3 } from './dersler-3.js';
import { DERSLER_4 } from './dersler-4.js';
import { DERSLER_5 } from './dersler-5.js';
export const MODULLER = [
  { id: 'm1', no: 1, baslik: "Excel'in mantığı", ozet: 'Hücre, tür, formül, $ ve Türkçe/İngilizce yazım.', seviye: 'temel' },
  { id: 'm2', no: 2, baslik: 'Temel hesaplar', ozet: 'Özet işlevleri, yuvarlama, oran ve hata değerleri.', seviye: 'temel' },
  { id: 'm3', no: 3, baslik: 'Mantık ve kurallar', ozet: 'EĞER, VE/YADA, kademeli kurallar, bilgi işlevleri.', seviye: 'temel' },
  { id: 'm4', no: 4, baslik: 'Koşullu özet', ozet: 'EĞERSAY, ETOPLA, ÇOKETOPLA, joker ve tarih ölçütleri.', seviye: 'temel' },
  { id: 'm5', no: 5, baslik: 'Arama ve eşleştirme', ozet: 'DÜŞEYARA, kademe tablosu, İNDİS+KAÇINCI, ÇAPRAZARA.', seviye: 'orta' },
  { id: 'm6', no: 6, baslik: 'Metinle çalışmak', ozet: 'Parçalama, arama, temizleme, birleştirme ve METNEÇEVİR.', seviye: 'orta' },
  { id: 'm7', no: 7, baslik: 'Tarih ve saat', ozet: 'Seri sayı, ay/çeyrek, iş günü ve tatiller, süre hesabı.', seviye: 'orta' },
  { id: 'm8', no: 8, baslik: 'Dinamik diziler', ozet: 'Taşma, FİLTRE, BENZERSİZ, SIRALA, SIRALI ve LET.', seviye: 'orta' },
  { id: 'm9', no: 9, baslik: 'Veri temizleme (formülle)', ozet: 'Metne dönmüş sayılar, yinelenenler, tutarsız yazım.', seviye: 'orta' },
  { id: 'm10', no: 10, baslik: 'Özet tablo (Pivot)', ozet: 'Satır, sütun, değer, filtre, tarih gruplama ve yüzde.', seviye: 'ileri' },
  { id: 'm11', no: 11, baslik: 'Power Query', ozet: 'Adım adım dönüştürme, birleştirme, unpivot ve M kodu.', seviye: 'ileri' },
  { id: 'm12', no: 12, baslik: 'Rapora dönüştürmek', ozet: 'TOPLA.ÇARPIM, ALTTOPLAM, kontrol formülleri ve vaka.', seviye: 'ileri' },
  { id: 'm13', no: 13, baslik: 'Görselleştirme', ozet: 'Grafik seçimi, bütün türler, pivot grafik, dilimleyici, koşullu biçim, mini grafik ve pano.', seviye: 'ileri' },
  { id: 'm14', no: 14, baslik: 'Makro (VBA)', ozet: 'Kaydedici, Range ve son satır, If, biçim, Function ve Office Scripts.', seviye: 'ileri' },
  { id: 'm15', no: 15, baslik: 'Kitap tasarımı ve denetim', ozet: 'Excel Tablosu, adlar, veri doğrulama, özel biçim, formül denetimi ve koruma.', seviye: 'ileri' },
  { id: 'm16', no: 16, baslik: 'Senaryo ve finans', ozet: 'Taksit ve ödeme planı, NBD ve İVO, Hedef Ara, Veri Tablosu, Senaryo, Çözücü.', seviye: 'ileri' },
  { id: 'm17', no: 17, baslik: 'İleri pano ve pivot', ozet: 'Hesaplanmış alan, ayrıntıya inme, ÖZETVERİAL, form denetimleri, dinamik grafik, veri modeli.', seviye: 'ileri' },
];
export const DERSLER = [...DERSLER_1, ...DERSLER_2, ...DERSLER_3, ...DERSLER_4, ...DERSLER_5];
