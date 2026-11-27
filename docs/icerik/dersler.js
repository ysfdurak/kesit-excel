// Müfredat: 12 modül. Ders gövdeleri dersler-1/2/3.js dosyalarında.
import { DERSLER_1 } from './dersler-1.js';
import { DERSLER_2 } from './dersler-2.js';
import { DERSLER_3 } from './dersler-3.js';
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
];
export const DERSLER = [...DERSLER_1, ...DERSLER_2, ...DERSLER_3];
