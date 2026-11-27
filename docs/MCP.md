# Kesit Excel MCP sunucusu

Kesit Excel'in formül motoru ve alıştırmaları, Claude Desktop gibi MCP istemcilerinin kullanabileceği yerel bir sunucu olarak da çalışır. Web uygulamasıyla **aynı kodu** kullanır (`docs/motor/`, `docs/icerik/`); iki taraf ayrı ayrı bakım istemez.

## Kurulum

```bash
git clone https://github.com/ysfdurak/kesit-excel
cd kesit-excel/mcp && npm ci
```

Node 20 ya da üstü gerekir. `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "kesit-excel": {
      "command": "node",
      "args": ["/tam/yol/kesit-excel/mcp/server.mjs", "/Users/siz/Belgeler/excel"]
    }
  }
}
```

Sondaki klasör(ler) **izinli klasörlerdir**: `formul_hesapla` yalnız bunların içindeki `.csv`/`.tsv`/`.txt` dosyalarını okuyabilir (en fazla 5 MB). Klasör verilmezse ev klasörü kullanılır. Sunucu dosya **yazmaz**, ağa çıkmaz.

## Araçlar

| Araç | Girdi | Çıktı |
|---|---|---|
| `formul_hesapla` | `formul`; isteğe bağlı `sayfa`, `hucre`, `veri` (satırlar, ilk satır başlık) ya da `csv_dosya` | `sonuc`, Türkçe `gosterim`, taşan dizinin boyutu ve ilk 50 satırı, kullanılan işlevler (TR/EN), hata açıklaması |
| `formul_cevir` | `formul`, `hedef` (`tr`/`en`) | Çevrilmiş formül (boşluklar korunur) |
| `islev_bilgisi` | `ad` ya da `ara` / `kategori` | Söz dizimi, açıklama, örnek, işlevin geçtiği dersler |
| `alistirma_getir` | `ders` (m4-d3), `alistirma` (a1), `cozum_goster`; ya da `rol` | Soru, sayfa ve sütunlar, hedef hücre, ipuçları; rolün ders sırası |
| `alistirma_denetle` | `ders`, `alistirma` ve `formul` / `pivot` / `adimlar` | `tamam`, açıklama, gizli denemede yakalandı mı, ipucu, (Power Query için) M kodu |

Hazır sayfalar: Satışlar, Ürünler, Personel, İzinler, Teslimat, Bütçe, Tatiller, Bayi, Müşteri ham, Ürün ham, Hedef. Kendi veriniz `Veri` sayfasına A1'den yazılır; metin değerler Türkçe girişe göre çevrilir ("1.250,50" → 1250,5; "15.03.2025" → tarih).

## Örnek konuşmalar

- "Satışlar sayfasında Web kanalından gelen Kitap adedini Türkçe formülle hesapla." → `formul_hesapla`
- "Bu formülü İngilizce Excel'e çevir: =EĞER(DÜŞEYARA(A2;$F$2:$G$9;2;YANLIŞ)>1,5;"evet";"hayır")" → `formul_cevir`
- "Finans rolü için ders sırasını ver, sonra 12.4'ün ikinci alıştırmasını getir." → `alistirma_getir`
- "Şu formülüm doğru mu: =ETOPLA(F2:F241;"Elektronik";H2:H241)" → `alistirma_denetle`

## Güvenlik

- Yalnız okuma: dosya yazma aracı yok, tüm araçlar `readOnlyHint`.
- İzinli klasör denetimi gerçek yol (`realpath`) üzerinden yapılır; sembolik bağla dışarı çıkılamaz.
- Formül uzunluğu 4000 karakter, iç içe işlev 64, dizi 200.000 hücre, CSV 5 MB ile sınırlı; motor `eval` kullanmaz.
