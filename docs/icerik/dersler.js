// Müfredat. Ders gövdeleri dersler-1 … dersler-N.js dosyalarında; sıra aşağıdaki sıralamayla kurulur.
import { DERSLER_1 } from './dersler-1.js';
import { DERSLER_2 } from './dersler-2.js';
import { DERSLER_3 } from './dersler-3.js';
import { DERSLER_4 } from './dersler-4.js';
import { DERSLER_5 } from './dersler-5.js';
import { DERSLER_6 } from './dersler-6.js';
import { DERSLER_7 } from './dersler-7.js';
import { DERSLER_8 } from './dersler-8.js';
import { DERSLER_9 } from './dersler-9.js';
import { DERSLER_10 } from './dersler-10.js';
import { DERSLER_11 } from './dersler-11.js';
import { EK_ALISTIRMALAR } from './ek-alistirmalar.js';
import { EK_ALISTIRMALAR_2 } from './ek-alistirmalar-2.js';
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
  { id: 'm18', no: 18, baslik: 'Modern formüller: LAMBDA, dizi ve tahmin', ozet: 'Kendi işlevini yazmak, satır satır hesap, birikim, formülle özet tablo, diziyi biçimlendirmek, eğim ve tahmin.', seviye: 'ileri' },
  { id: 'm19', no: 19, baslik: 'Veri araçları', ozet: 'Gelişmiş Filtre, benzersiz kayıtlar, 3B başvuru ve Birleştir, Hızlı Doldurma, özel sıralama ve Alt Toplam.', seviye: 'orta' },
  { id: 'm20', no: 20, baslik: 'Pano tasarımı ve özel grafikler', ozet: 'Pano süreci, madde, ibre ve ilerleme halkası, Pareto, Gantt, kelebek, halter, vurgu ve hedef çizgisi.', seviye: 'ileri' },
  { id: 'm21', no: 21, baslik: 'Ofis pratikleri, güvenlik ve paylaşım', ozet: 'Kısayol ve Git > Özel, renge göre filtre, köprü, birimli biçim, tanımlayıcı istatistik, şifreleme, yazdırma ve PowerPoint.', seviye: 'orta' },
  { id: 'm22', no: 22, baslik: 'Veritabanı işlevleri', ozet: 'VSEÇTOPLA, VSEÇSAY, VSEÇORT, VSEÇMAK, VAL: ölçüt alanıyla VE/YA DA, metin ölçütleri ve araç seçimi.', seviye: 'orta' },
];
const _sira = d => { const m = /^m(\d+)-d(\d+)$/.exec(d.id); return m ? [MODULLER.findIndex(x => x.id === d.modul), Number(m[2])] : [999, 0]; };
// Dersler modül sırasına, modül içinde ders numarasına göre (sonradan eklenen dosyalar araya girer)
const _ham = [...DERSLER_1, ...DERSLER_2, ...DERSLER_3, ...DERSLER_4, ...DERSLER_5, ...DERSLER_6, ...DERSLER_7, ...DERSLER_8, ...DERSLER_9, ...DERSLER_10, ...DERSLER_11]
  .sort((a, b) => { const x = _sira(a), y = _sira(b); return x[0] - y[0] || x[1] - y[1]; });
// Derinleştirme: var olan derslere sonradan eklenen alıştırmalar (ek-alistirmalar.js)
const _ek = id => [...(EK_ALISTIRMALAR[id] || []), ...(EK_ALISTIRMALAR_2[id] || [])];
export const DERSLER = _ham.map(d => _ek(d.id).length ? { ...d, alistirmalar: [...d.alistirmalar, ..._ek(d.id)] } : d);
