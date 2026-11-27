// Çalışma kitabındaki sayfa adları → veri tabloları. Derslerdeki "sayfa" alanı bu adları kullanır.
import { TABLOLAR } from './veri.js';
import { MODELLER } from './modeller.js';
export const SAYFA_ANAHTAR = { 'Satışlar': 'satislar', 'Ürünler': 'urunler', 'Personel': 'personel', 'İzinler': 'izinler', 'Teslimat': 'teslimat', 'Bütçe': 'butce', 'Tatiller': 'tatiller', 'Bayi': 'bayi', 'Müşteri ham': 'musteri_ham', 'Ürün ham': 'urun_ham', 'Hedef': 'hedef' };
// Veri sayfaları (Kesit verisinden) + model sayfaları (Kredi, Üretim, Vardiya… elle kurulmuş, formüllü)
export const SAYFALAR = { ...Object.fromEntries(Object.entries(SAYFA_ANAHTAR).map(([ad, k]) => [ad, TABLOLAR[k]])), ...MODELLER };
