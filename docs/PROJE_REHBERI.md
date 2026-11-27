# Kesit Excel · Proje rehberi

> Yaşayan belge. Kod değiştikçe aynı commit'te güncellenir. Amaç: kodu kim yazmış olursa olsun projeyi baştan sona anlatabilmek, mülakatta savunabilmek ve güvenle değiştirebilmek.
> Ortak altyapı (GitHub, Pages, güvenlik temeli, lisans) için: `ysfdurak.com` deposundaki `docs/GUVENLIK_TEMELI.md` ve altyapı el kitabı.

---

## 1. Bir bakışta

| | |
|---|---|
| **Ne** | Tarayıcıda çalışan Türkçe Excel eğitimi: kendi formül motoru, 61 ders, 124 denetlenen alıştırma; özet tablo, Power Query, görselleştirme (grafik, pivot grafik, koşullu biçim, pano) ve VBA makro atölyeleri; yerel MCP sunucusu (7 araç) |
| **Kimin için** | Excel'i işte kullanacak herkes; özellikle veri analisti, BI, operasyon/planlama, finans, BT iş analisti ve ofis rolleri. Kesit ailesinin (SQL, Power BI, Python, İstatistik) beşinci üyesi |
| **Canlı** | https://ysfdurak.github.io/kesit-excel/ (depo açılıp Pages etkinleşince) |
| **Depo** | `ysfdurak/kesit-excel` |
| **Durum** | 0.2.0 · yerelde tamam, testler yeşil (79), güvenlik taraması temiz; depo açılmayı bekliyor. Makrolar gerçek Excel'de örneklemle denenecek (§7) |
| **Sunucu** | Yok (GitHub Pages). VPS gerekmiyor; gerekçe §6 |

**Tek cümle:** "Excel formülünü ezberletmek yerine Kesit verisinde yazdırıyor; cevabı gördüğünüz tabloda ve sayıları değiştirilmiş gizli bir kopyada denetleyip hatanın nedenini söylüyor."

---

## 2. Sorun ve kararlar

**Sorun.** Türkçe Excel öğrenmenin üç engeli var:
1. İnternetteki örneklerin çoğu İngilizce (`SUMIF`, `,`); Türkçe Excel'e yapıştırınca çalışmıyor.
2. Alıştırma sitelerinin çoğu sonucu kontrol eder, formülü değil. Sonucu elle yazan da geçer.
3. Pivot ve Power Query "tıkla gör" araçlarıdır; arkada ne olduğu (ÇOKETOPLA, M kodu) görünmez.

**Kararlar ve nedenleri**

| Karar | Neden | Vazgeçilen |
|---|---|---|
| Formül motorunu **sıfırdan yazmak** | Türkçe adlar, `;` ayırıcı, Türkçe METNEÇEVİR, i/İ gibi davranışlar hazır kütüphanelerde yok; dış bağımlılık CSP ve lisansı da zorlaştırırdı | HyperFormula (GPL/ticari lisans, büyük), formula.js (yalnız işlevler, ayrıştırıcı yok) |
| **Gizli varyant** ile denetim | Sonucu elle yazmak, satır sırasına güvenmek, `$` unutmak görünür tabloda tutabilir; aynı yapıda farklı sayılarla tutmaz | Yalnız sonuç karşılaştırma (hileye açık), formül metni karşılaştırma (doğru ama farklı yazılmış formülü reddeder) |
| Doğrulama için **LibreOffice** | Excel'i sunucuda çalıştıramayız; LibreOffice başsız çalışır ve Excel uyumludur | Elle hesaplanmış beklenenler (ölçeklenmez) |
| Power Query'yi **adım seçerek** öğretmek | Excel'de de kullanıcı M yazmaz, tıklar; M'i okumayı öğrenmek yeter | M yorumlayıcısı yazmak (Kesit Power BI'daki 5 MB'lık yorumlayıcı yeniden kullanılamadı) |
| **Kesit ortak verisi** | Aile tutarlılığı: aynı Anadolu Market SQL'de, Python'da, burada | Uydurma küçük tablolar |
| **Statik site + MCP** | Hesap ve kalıcı ortak veri yok; tek çekirdek hem web hem MCP | Sunuculu sürüm (gereksiz maliyet ve güvenlik yüzeyi) |
| Kapsam dışı (V1) | VBA, Power Pivot/DAX, M'i elle yazmak, grafik çizimi | Kapsam belgesinde gerekçeli |

---

## 3. Mimari ve veri akışı

```
                      ┌──────────────────────── docs/ (GitHub Pages) ────────────────────────┐
 Tarayıcı ──hash──▶   │ js/app.js ─▶ js/sayfalar.js ─▶ js/izgara.js / pivot-ui.js / sorgu-ui.js│
                      │                       │                    │                         │
                      │                       ▼                    ▼                         │
                      │        icerik/ (dersler, veri, roller)   motor/ ◀───────────────┐    │
                      │                                          formul.js  (belirteç→AST→değer)
                      │                                          islevler.js (131 işlev)│    │
                      │                                          kitap.js  (sayfa, taşma, döngü)
                      │                                          pivot.js · sorgu.js · denetci.js
                      └──────────────────────────────────────────────────────────────────┘    │
 Claude Desktop ──stdio──▶ mcp/server.mjs ── import ──────────────────────────────────────────┘
```

**Bir formülün yolculuğu** (`=ETOPLA(F2:F241;"Kitap";H2:H241)`):
1. **Yazım tespiti** (`yazimBul`): dizgi ve `{…}` dışında `;` varsa, işlev adı Türkçeyse, `DOĞRU/YANLIŞ` geçiyorsa ya da parantez dışında `,` varsa Türkçe. Bu örnek `;` içerdiği için Türkçe.
2. **Belirteçlere ayırma** (`belirtec`): `fn ETOPLA`, `(`, `ref F2:F241`, `sep`, `str "Kitap"`, … Her belirteç kaynak metindeki konumunu (`bas`, `son`) taşır; çeviri ve `$` kaydırma bu konumlarla metni yerinde değiştirir, kullanıcının boşlukları korunur.
3. **Ayrıştırma** (`ayristir`, Pratt ayrıştırıcı): öncelik tablosu `IKILI` (karşılaştırma 1, `&` 2, `+-` 3, `*/` 4, `^` 5). Tekli eksi üsten önce bağlanır (Excel'de `-2^2 = 4`); bütün ikili işleçler soldan birleşir (`2^3^2 = 64`).
4. **Değerlendirme** (`degerlendir`): AST düğümü → değer. Başvuru düğümü `Bas` nesnesi döner; işlev onu isterse `coz` ile `Dizi`ye çevirir. Böylece `SATIR(C5)` başvurunun kendisini, `TOPLA(C5)` değerini görür.
5. **Taşma** (`Kitap.tasir`): sonuç 1×1'den büyük bir `Dizi` ise komşu hücrelere yazılır; yol dolu ise `#TAŞMA!`.

**Neden Pratt ayrıştırıcı?** Her işlecin bir "bağlanma gücü" vardır; döngü daha güçlü işleçleri önce toplar. 15 satırlık tek bir `ifade(min)` işlevi tüm öncelik ve birleşme kurallarını taşır. Özyinelemeli iniş (her öncelik düzeyi için ayrı işlev) de olurdu ama daha uzun.

---

## 4. Teknoloji seçimleri

| Alan | Seçim | Neden |
|---|---|---|
| Arayüz | Saf JS ES modülleri, derleme yok | Kesit ailesiyle aynı; Pages'te doğrudan çalışır, bağımlılık güncellemesi yok |
| DOM | Kendi `h()` yardımcısı, `innerHTML` hiç yok | CSP `style-src 'self'` ve XSS: metin her zaman `textContent` |
| Stil | Tek CSS, satır içi stil özniteliği yok | CSP. Dinamik kenar çizgileri CSSOM ile (`el.style.boxShadow`), bu CSP'ye takılmaz |
| Depolama | `localStorage` (`kesit-excel-v1`), JSON yedek | Hesapsız; yedek içe alınırken yalnız beklenen alanlar kabul edilir |
| Çevrimdışı | Service worker: önce ağ, sonra önbellek | Yeni sürüm hemen gelir, bağlantı yoksa son kopya |
| MCP | `@modelcontextprotocol/sdk` 1.32.2, `zod` 4.6.7, stdio | Diğer 1. aşama projeleriyle aynı sürümler |
| Test | `node --test`, Playwright (elle), LibreOffice + openpyxl | Sıfır bağımlılıklı test koşucusu; LibreOffice bağımsız bir hakem |

---

## 5. Kod turu

### 5.1 `motor/formul.js` (ayrıştırıcı ve değerlendirici)
- **`Hata`, `H`, `HATA_TR`**: Excel hatası bir değerdir (atılmaz, yayılır). İç kod İngilizce (`#DIV/0!`), gösterim Türkçe (`#BÖL/0!`).
- **`Dizi`**: 2B değer; `al(r,c)` yayma (broadcasting) kuralını uygular: 1 satırlık dizi her satıra, 1 sütunluk her sütuna uyar. `=H2:H241*I2:I241` bu yüzden çalışır.
- **`TR_EN`**: Türkçe → İngilizce işlev adları. Tersini `EN_TR` üretir. `islevAdi` `_xlfn.` önekini ve `İ→I` farkını da çözer.
- **`kaydir(formul, dr, dc)`**: Aşağı doldurmanın kalbi. Göreli başvuruları kaydırır, `$` olanları tutar, tablo dışına düşeni `#BAŞV!` yapar. Belirteç konumlarıyla çalıştığı için dizgi içindeki `"A1"` metnine dokunmaz.
- **`cevir(formul, hedef)`**: Yalnız işlev adı, ayırıcı, ondalık, mantıksal ve hata belirteçlerini yerinde değiştirir.

> ⚠️ **Şöyle daha iyi olur:** `formul.js` 400 satırı geçti ve `TR_EN` tablosu da içinde. Tabloyu `motor/adlar.js`'e taşımak hem okunurluğu artırır hem de MCP'nin yalnız adlara ihtiyaç duyduğu yerlerde daha küçük bir içe aktarma sağlar.

### 5.2 `motor/islevler.js` (131 işlev)
- `tanim(ad, fn, { tembel })`: `tembel` işlevler (EĞER, EĞERHATA, ÇOKEĞER, ELEMAN, LET, SATIR) bağımsız değişkenleri **değerlendirilmemiş** AST olarak alır. Böylece `=EĞER(A1=0;0;1/A1)` hiç `#BÖL/0!` üretmez ve LET ad tanımlayabilir.
- `yay(fn)`: tek değerli bir işlevi diziye yayar: `=SOLDAN(A2:A5;2)` dört sonuç taşırır (Excel 365 davranışı).
- **Ölçüt** (`olcut`): `">1000"`, `"<>"`, `""`, `"E*"`, `"~*"`. Sayı ölçütü yalnız sayılarla, metin ölçütü yalnız metinlerle eşleşir (Excel gibi: `"5"` metni sayı 5'e eşit sayılmaz).
- **Yuvarlama** (`yuvarlaYon`): `2,675` ikili kayan noktada `2,67499…` olduğu için `Math.round(x*100)/100` yanlış sonuç verir. Kaydırma ondalık gösterimle yapılır (`'2.675e2'`), sonra 15 anlamlı basamağa indirilir.
- **İş günü** (`isgunu`, `tamIsgunu`): hafta sonu maskesi Pazartesi'den başlayan 7 elemanlı dizi; `İŞGÜNÜ.ULUSL`'nin 1–17 kodları ve `"0000011"` metni aynı maskeye çevrilir.

### 5.3 `motor/kitap.js` (çalışma kitabı)
- Hücre: `{ v }` değer ya da `{ f, agac, hata }` formül. Formül yazılırken bir kez ayrıştırılır.
- **Tembel hesap ve döngü**: `formulHesapla` sonucu önbelleğe yazar; hesaplanmakta olan hücre `hesapta` kümesindedir, ona yeniden gelinirse `#DÖNGÜ`.
- **Taşma okuma sırası**: boş bir hücre okunurken solundaki ve üstündeki formüller önce hesaplanır (`oncekiCapalar`), çünkü o hücre bir taşma alanının parçası olabilir.
- `yazGiris`: kullanıcı "1.234,5" ya da "15.03.2025" yazarsa Excel gibi sayıya/tarihe çevirir.

### 5.4 `motor/denetci.js` (alıştırma denetimi)
1. Formül ayrıştırılır; zorunlu işlev (`gerekli`) ve yasak işlev kontrolü.
2. **Görünen tabloda** öğrenci formülü ve çözüm aynı kitaplarda hesaplanır, hedef (ya da taşma için `okunan`) alanı karşılaştırılır. Fark varsa ilk farklı hücre adresiyle söylenir; ilk satır doğru, aşağısı yanlışsa `$` uyarısı eklenir.
3. **Gizli varyant** (`varyant`): satırlar karıştırılır; sayısal sütunlar ±%40, tarihler ±10 gün, yüzdeler yeniden; metin sütunları **sütunun kendi değerlerinden yeniden örneklenir**; boşların %8'i dolar ya da boşalır; satırların ~%5'i düşer. Kimlik sütunları (No, Sicil, Kod) korunur.
4. Görünen tabloda tutup varyantta tutmazsa: formülde hiç başvuru yoksa "elle yazmışsınız", varsa "verinin bir özelliğine dayanıyor".

> **Ders (Kasım 2026):** Varyant ilk sürümde metin sütunlarını yalnız **karıştırıyordu**. Karıştırma "kaç satır Mobil?" sorusunun cevabını değiştirmez; elle yazılmış 103 geçiyordu. Ders testine "sabit cevap gizli denemede yakalanmalı" kuralı eklenince iki alıştırma bunu gösterdi; sonra satır sayısını soran bir alıştırma (240) aynı açığı satır düşürmenin gerekli olduğunu gösterdi. **Bunu teknik test değil, "hile yapan öğrenci" gözüyle yazılmış bir test buldu.**

### 5.5 `motor/pivot.js` ve `motor/sorgu.js`
- `pivot(tablo, yapi)`: satır/sütun anahtarları Excel gibi büyük/küçük harften bağımsız gruplanır; tarih alanı ay/çeyrek/yıl gruplanır; `goster` yüzde dönüşümünü yapar.
- `esdegerFormul`: bir pivot hücresinin ÇOKETOPLA/ÇOKEĞERSAY/ÇOKEĞERORTALAMA karşılığını üretir. **Test, 56 hücrenin hepsinde bu formülü motorda hesaplayıp pivotla aynı sayıyı verdiğini doğrular**; yani "pivot bir formüldür" iddiası kanıtlıdır.
- `ADIMLAR`: her Power Query adımı `{ ad, etiket, alanlar, uygula, m }`. `uygula` tabloyu dönüştürür, `m` M satırını yazar. Tür değiştirme `tr-TR` kültürüyle: "1.250,50" → 1250,5, "2024-02-30" → hata hücresi (Power Query tarihi kaydırmaz, Excel'in TARİH işlevinin aksine).

> **Ders:** `ifadeDerle(ifade, …)` içinde `function ifade()` adlı bir iç işlev vardı. JS işlev bildirimlerini yukarı taşıdığı için parametre gölgelendi ve `String(ifade)` işlevin kaynak kodunu döndürdü ("beklenmeyen karakter: f"). Parametre adı değiştirildi, koda not düşüldü.

### 5.6 Arayüz (`docs/js/`)
- `izgara.js`: formül yazılırken (`refModu`) imleç bir işleçten sonraysa hücre tıklaması başvuru ekler; Shift ile aralığa genişler; dokunmatikte ikinci dokunuş genişletir. `F4` döngüsü `A1 → $A$1 → A$1 → $A1`. Öneri listesi `ISLEV_BILGI`'den; söz dizimi ipucu imlecin içinde olduğu işlevi ve kaçıncı bağımsız değişkende olduğunu parantez derinliğini sayarak bulur.
- `yardim.js`: `h()` DOM kurucusu ve `yerlestir()`. **Ders:** `Element.append(dizi)` diziyi düzleştirmez, `"[object HTMLElement],…"` yazar; `append(null)` de "null" yazar. İlk ölçümde 5 sayfa boş göründü; `yerlestir` ikisini de düzeltir.
- `[hidden]{display:none!important}`: `.btn{display:inline-flex}` `hidden` özniteliğini eziyordu; tek hücreli alıştırmada "Aşağı doldur" görünüyordu.

### 5.7 `motor/grafik.js` (15 grafik türü, SVG)

**İçeride ne oluyor?** Grafik üç adımda çizilir:

```
aralık (2B değerler) ─┐
                      ├─► veri { kategoriler, seriler[{ad, degerler}] } ─► grafikCiz(veri, secenek) ─► SVG metni
özet tablo (pivot) ───┘        aralikVerisi / pivotVerisi                     türüne göre: eksenli, pasta,
                                                                              dagilim, selale, histogram, kutu, agac…
```

- `aralikVerisi`: ilk sütun kategori, sayısal sütunlar seri. **Tarih biçimli sütun seri olmaz**, kategori olur (Bütçe'de "Ay" seri sayılınca grafiğe 45.000'lik bir çizgi giriyordu). Seri yönü "otomatik"te Excel gibi: seri sayısı kategoriden fazlaysa çevirir.
- `pivotVerisi`: Genel Toplam satırı ve sütunu atılır (Excel'in pivot grafiği de çizmez; çizseydi diğer çubukları ezerdi).
- **Renk iki kipte:** tarayıcıda `class="g-s0"` (CSS değişkeni, tema değişince renk değişir), indirmede `bagimsiz: true` ile `fill="#257de0"` gömülü (SVG dosyası CSS'siz açılır). Palet dataviz becerisinin doğrulanmış sabit sıralı paletidir; açık ve koyu tema ayrı adımlardır, otomatik ters çevirme değil.
- **Bir hata ve dersi:** Sınıf kipinde bir öğe hem dolgu hem kenar sınıfı alıyordu: `class="g-s0" stroke-width="2" class="g-yz"`. HTML bunu sessizce yutar, ama SVG'yi `DOMParser('image/svg+xml')` ile **XML** olarak okuyoruz; XML'de çift öznitelik hatadır ve bütün grafik yerine bir `parsererror` belgesi gelir. Tarayıcı bu hata belgesini satır içi `<style>` ile çizmeye çalışınca CSP ihlali olarak konsola düştü; asıl neden oradan bulundu. Çözüm `sinifBirlestir()` son geçişi, test: `tests/gorsel.test.mjs` 15 tür × 2 kip × 3 veri × 2 ayar ile her etikette çift öznitelik ve kaçış denetler.
- `grafikDenetle(kural, veri, secenek, beklenenVeri)`: türün izinli olup olmadığı, yığın, eksenin 0'dan başlaması, pasta dilim sayısı, başlık, ikincil eksen, seri sayısı ve verinin çözümle aynı olması. Hatalar dizisi döner; arayüz ilkini, sonra "Ayrıca: …" diye diğerlerini gösterir.

> 💡 **Şöyle daha iyi olur:** Kategori adları uzun olduğunda yatay çubukta sol boşluk karakter sayısıyla tahmin ediliyor (`6,4 px × harf`). Türkçe geniş harflerde (Ğ, Ş) birkaç piksel taşabilir. Gerçek ölçüm için SVG'yi çizip `getComputedTextLength()` ile ikinci geçiş yapılabilir; bu, motoru tarayıcıya bağlar ve MCP'de çalışmaz. Şimdilik tahmin + kırpma yeterli.

### 5.8 `motor/kosullu.js` (koşullu biçim ve mini grafik)
- `kosulluUygula(kitap, sayfa, kurallar)` hücre başına bir **görünüm** nesnesi döner: `{stil, cubuk, renk, simge}`. Izgara onu CSS sınıfı ve CSSOM ile çizer (`kb-kirmizi`, veri çubuğu için `backgroundImage` gradyanı, renk ölçeği için `color-mix`). Denetçi aynı nesneyi karşılaştırır; görsel ile denetim aynı veriden gelir.
- **Formülle kural:** formül alanın sol üst hücresine göre yazılır, her hücre için `kaydir()` ile kaydırılır ve `kitap.formulDegerlendir(sayfa, r, c, formül)` ile hücreye yazmadan hesaplanır. Bu yüzden `$` hatası Excel'deki gibi davranır: `=D2<C2*0,9` A2:D43'te her sütunda başka sütuna bakar ve satırın bir kısmı boyanır. Test bunu doğrular.
- Kural sırası: ilk kural kazanır (Excel'in Kural Yöneticisi gibi); veri çubuğu, renk ve simge ayrı katmanlardır, dolguyla birlikte görünebilir.
- `miniGrafik()`: çizgi (en yüksek yeşil, en düşük kırmızı nokta), sütun, kazanç/kayıp.

### 5.9 `motor/vba.js` (VBA yorumlayıcısı)

**Neden yazıldı?** Kullanıcı "her şeyi versin, gerekirse benim bilgisayarda test ederiz" dedi. Makro dersini yalnız okuma metni yapmak, formül derslerindeki "yaz, denetle, gizli kopyada yakala" döngüsünü kırardı. VBA'nın tamamı (COM nesne modeli) tarayıcıda olamaz; ders ve mülakatta gereken alt küme yazıldı, gerisi açık hata verir ve `.bas` ile gerçek Excel'e gider.

```
kod ─► belirteçler ─► ayrıştırıcı (Sub/Function → deyim ağacı) ─► Makro.calistir(alt)
        ' yorum, _ satır devamı,        If/For/Do/Select/With…          Range/Cells/WorksheetFunction
        ; → , (Debug.Print)             işlem önceliği tablosu           ─► Kitap (aynı formül motoru)
```

- **İşlem önceliği** (yüksekten düşüğe): `^`, tekli `-`, `* /`, `\`, `Mod`, `+ -`, `&`, karşılaştırma, `Not`, `And`, `Or/Xor`. Tuzak: VBA'da `-2^2 = -4` (Excel formülünde 4). Testte ikisi de var; mülakat sorusu olarak güzeldir.
- **Excel'e sadakat:** renkler BGR tamsayı (255 kırmızı), `Round` banker yuvarlaması, metin karşılaştırması büyük-küçük harfe duyarlı, `CStr(1,5)` Türkçe bölgede "1,5". `.Formula` İngilizce formül ister, `.FormulaLocal` Türkçe; ikisi de aynı formül motoruna çevrilerek yazılır.
- **WorksheetFunction** çağrısı bir formül ağacı (AST) kurup `kitap.formulDegerlendirAgac()` ile hesaplanır: VBA'dan ÇOKETOPLA ile hücreden ÇOKETOPLA aynı koddur.
- **Sınırlar:** 2 milyon adım, 300.000 hücre yazma. Sonsuz döngü "döngü değişkeni artıyor mu?" iletisiyle durur. Dosya, ağ, `Shell`, `CreateObject` yoktur; bu bir güvenlik sınırıdır, eksiklik değil (MCP'de de aynı).
- **Kaydedici** (`js/makro-ui.js`): ızgaranın `sec` ve `uygula` yöntemleri örtülür; her seçim `Range("L2").Select`, her yazma `ActiveCell.FormulaR1C1 = "=RC[-4]*RC[-3]"` olur. Biçim düğmeleri önce VBA satırını **çalıştırır**, sonra kayda ekler; ekranda görülen biçim ile kod aynı yoldan gelir. "Aşağıya doldur" bilerek `Range("L2:L241")` gibi sabit adres yazar: Excel kaydedicisi de öyle yapar ve Ders 14.2'nin konusu budur.
- **`.bas` kod sayfası:** Türkçe Windows'ta VBA düzenleyicisi dosyayı Windows-1254 okur. UTF-8 yazılsa "ş" "ÅŸ" olur. `basDosyasi()` harfleri 1254'e çevirir; çeviremediği karakter sayısını söyler.

**Makro denetimi ve uzayan gizli kopya.** Formül alıştırmalarında gizli kopya %5 satır **düşürür**. Makroda bu yetmiyordu: `For r = 2 To 241` kısa veride boş satırlara 0 yazıyor, denetçi boşla 0'ı eşit sayıyordu ve sabit son satır **yakalanmıyordu**. Testi yazınca görüldü (`yanlis` alanı: kasıtlı yanlış çözüm). Çözüm: makro varyantı veriyi %10 **uzatır** (`varyant(…, { uzat: true })`) ve okunan alan verinin yeni uzunluğuna kadar genişler. Şimdi sabit 241, eklenen satırları atladığı için yakalanıyor. Formül alıştırmalarında uzatma bilerek kapalı: `D2:D241` gibi sabit aralıklı doğru formüller yanlışlıkla kalırdı.

> ⚠️ **Bu yapı uygun değil, şöyle uygulanır:** Gizli kopya fikri her alıştırma türünde aynı değil. "Cevabı elle yazmak" formülde sabit sayıdır, makroda sabit satır numarasıdır, grafikte ise varyant gerekmez (veri aralığı ve tür kural olarak denetlenir). Yeni bir tür eklerken önce "bu türde hile ne olur?" sorusunu yazın, varyantı ona göre seçin; testte kasıtlı yanlış çözümle doğrulayın.

### 5.10 Görselleştirme ve makro arayüzü
- `grafik-ui.js` `GrafikAlani`: kaynak (aralık ya da kilitli pivot), türler aileye göre gruplu (`optgroup`), yığın, başlık, eksen en az, gösterge, veri etiketi, ikincil eksen, eğilim; **tablo görünümü** (ekran okuyucu ve kopyalama), `<title>`'dan araç ipucu, SVG/PNG indirme (PNG: bağımsız SVG tuvale çizilir; CSP `img-src blob:` izinli).
- **Genişlik dersi:** grafik, öğe sayfaya eklenmeden çizildiği için `clientWidth` 0 geliyordu; 700 px'e çizilip telefonda 320 px'e küçülünce yazılar 5 px oldu. `genislikBul()` ana alanın genişliğinden tahmin eder.
- **DOM dersi:** girişin `change` olayı odak kaybıyla gelir. Aynı anda alan yeniden çiziliyorsa kaldırılan odaklı giriş tekrar `change` tetikler ve `temizle()` döngüsü "node is no longer a child" hatası verir. İki önlem: `temizle()` artık `replaceChildren()` (tek işlem), grafik yeniden çizimi `setTimeout(0)` ile ertelenir.
- `pivot-ui.js`: dilimleyiciler (tık tek seçer, Ctrl+tık ekler; dokunmatikte her dokunuş açar/kapatır), pivot grafik düğmesi. `pano-ui.js`: ortak dilimleyiciler, KPI (dilimleyiciyle süzülür, "tümünün %…'ü"), en çok 4 grafik. `kosullu-ui.js`: Kural Yöneticisi benzeri liste + form. `makro-ui.js`: düzenleyici (Tab girinti, Esc+Tab çıkış, Ctrl+Enter çalıştır), Sub seçici, çıktı, hata satırına git, kaydedici, `.bas` ve veri kitabı.
- Ders sayfası yeni türleri `YENI_TURLER` tablosundan kurar: her kurucu `{ el, denetle() }` döner. Yeni bir tür eklemek bu tabloya bir giriş eklemektir.

---

## 6. Sunucu ve yayın

- **GitHub Pages**, kökten. `index.html` + `yonlendir.js` → `docs/`. Satır içi betik yok (diğer Kesit depolarındaki satır içi yönlendirmeden farklı; CSP gereği).
- **CSP** (`docs/index.html` meta): `default-src 'self'; script-src 'self'; style-src 'self'; … object-src 'none'; form-action 'none'`. Pages başlık eklemeye izin vermediği için HSTS, `X-Frame-Options` gibi başlıklar yok; `github.io` HTTPS'i zorlar.
- **VPS neden gerekmiyor?** Kalıcı ortak veri, giriş, sunucu tarafı hesap yok. **VPS ne zaman gerekir?** Öğretmen paneli (öğrenci ilerlemesini toplamak), sınıf/kurum hesapları, ortak sıralama ya da yapay zekâ ile formül açıklama eklenirse.
- **Ölçüm:** yok. Proje "veri cihazdan çıkmaz" sözü veriyor; karar `ysfdurak.com/sunucu/olcum/kapsam.json` → `soz`.
- **Güvenlik taraması:** `tara.py --audit` temiz; depo adı haftalık tarama listesinde (PR #84).

---

## 7. Testler

| Katman | Ne | Sayı |
|---|---|---|
| Motor birim | TR/EN eşdeğerliği (tüm vakalar + geri çeviri), kaydırma, çeviri biçimi, taşma ve engel, döngü, bozuk formüller, sınırlar, Türkçe harf, Türkçe giriş | 9 test |
| LibreOffice | 146 formül LibreOffice 24.2'de hesaplanır ve karşılaştırılır; 31 vaka elle (LO'da olmayan Excel 365 işlevleri, Türkçe BÜYÜKHARF, Türkçe METNEÇEVİR, örtük kesişimsiz dizi) | 177/177 |
| Dersler | Her örnek hatasız; her çözüm denetçiden geçer; tek hücreli sayısal alıştırmada sabit cevap **gizli denemede** yakalanır; hedefin ilk satırı boş bir kaynağa bakmaz. Grafikte başlangıç ayarı geçmez; koşullu biçimde boş kural, panoda boş pano, makroda boş Sub geçmez; sabit son satırlı makro (`yanlis`) gizli kopyada yakalanır | 62 test, 124 alıştırma |
| Görselleştirme ve makro | 15 grafik türü geçerli XML, tarih sütunu kategori, histogram ve çeyrekler, `$` kaydırmalı koşullu kural, pano KPI süzmesi, ders örneği makrolar, R1C1, `.bas` 1254 | 7 test |
| MCP | 7 araç (grafik SVG gömülü renk, makro yalıtılmış kopya ve hata satırı, yeni alıştırma türleri), TR/EN aynı sonuç, taşma, CSV izinli klasör, dış yol reddi, sabit cevabın gizli denemede yakalanması | 1 test, 30+ doğrulama |
| Arayüz (Playwright, elle) | 19 sayfa × 390/1350 px: konsol hatası 0, yatay taşma 0; uçtan uca: öneri → tıkla-başvuru → F4 → aşağı doldur → Denetle → pivot → Power Query | örneklem |

**Örneklem testi (bu oturum)**

| Adım | Beklenen | Gözlenen | Durum |
|---|---|---|---|
| Ders 4.3, `=ÇOKET` yaz, Tab | `=ÇOKETOPLA(` | aynı | ✓ |
| H2'ye tık, Shift+H241 | `H2:H241` eklenir, söz dizimi "toplam_aralığı" vurgulu | aynı | ✓ |
| Doğru formül, Denetle | "Doğru… gizli denemede" | aynı | ✓ |
| Ders 1.3, `=I2/N1` aşağı doldur, Denetle | #BÖL/0! açıklaması + ipucu | aynı | ✓ |
| Pivot Şehir × Adet, ilk hücre | Eşdeğer ÇOKETOPLA | aynı | ✓ |
| Bayi: 3 adım, Denetle | "Doğru" + M kodu | aynı | ✓ |
| 390 px, Ders 4.2 | Hedef M2 ilk ekranda görünür | düzeltmeden sonra görünür | ✓ |

**Örneklem testi (0.2.0, Playwright, 1350 ve 390 px)**

| Adım | Beklenen | Gözlenen | Durum |
|---|---|---|---|
| Görselleştirme atölyesi 4 sekme + Makro, iki genişlik | Konsol hatası 0, yatay taşma 0 | ilk ölçümde panoda CSP hatası ve 507 px taşma (çift öznitelik, §5.7); düzeltmeden sonra 0 | ✓ |
| Ders 13.1 a2: pastayla Denetle, sonra A1:D5 + sütun + başlık | Önce tür hatası, sonra "Doğru" | aynı | ✓ |
| Ders 13.3 a1: Kategori × Adet, Kanal dilimleyicisi Mağaza, pivot grafik çubuk | "Doğru" | aynı | ✓ |
| Ders 13.4 a2: formülle kural `=$D2<$C2*0,9` | 32 kırmızı hücre (8 satır × 4), "Doğru" | aynı | ✓ |
| Ders 14.2: `For r = 2 To 241` | Görünen tabloda tutar, gizli kopyada yakalanır | aynı | ✓ |
| Kaydedici: L1'e başlık, L2'ye formül, aşağı doldur, A1:L1 kalın | R1C1 kod, `Range("L2:L241")`, kalın başlık; sıfırla + çalıştır aynı sonucu verir | aynı | ✓ |
| SVG, PNG ve `.bas` indirme | Dosyalar iner; `.bas` `Attribute VB_Name` ile başlar | aynı | ✓ |
| Koyu tema: pano ve renk ölçeği | Okunur kontrast | aynı | ✓ |

> 🧪 **Burada bir test daha yapalım (sizin bilgisayarda):** `docs/indir/kesit-excel-veri.xlsx`'i açıp `.xlsm` kaydedin; Makro atölyesinden beş örnek makroyu (Merhaba, Tutar sütunu, İptalleri boya, Kategori özeti, Formül yazdır) `.bas` olarak alıp Alt+F11 > Dosya Al ile içeri alın ve çalıştırın. Bakılacaklar: Türkçe harfler düzgün mü (1254), `FormulaLocal` Türkçe Excel'de çalışıyor mu, sonuçlar Kesit'teki tabloyla aynı mı. Fark çıkarsa motor değil Excel haklıdır; vakayı `tests/` altına ekleyelim.
> 🧪 **Burada bir test daha yapalım:** Gerçek Türkçe Excel'de (Windows, Türkiye bölge ayarı) 10 dersin çözüm formülünü yapıştırıp sonuçları karşılaştırmak. LibreOffice bağımsız bir hakem ama Türkçe yerelleştirmeyi (METNEÇEVİR kodları, dizi sabiti ayırıcıları) sınayamıyor. Özellikle `METNEÇEVİR(B2;"aaaa yyyy")` ve `{…}` dizi sabitleri.
> 🧪 **Bir test daha:** Android telefonda (Chrome) bir alıştırmayı yalnız dokunarak çözmek: klavye açıkken hücreye dokunmak başvuru ekliyor mu, ızgara kaydırması formül çubuğunu ekrandan atıyor mu?

---

## 8. Kullanıcı gözüyle inceleme

**Teşhis:** Teknik olarak her şey çalışıyordu ama telefonda öğrenci nereye yazacağını göremiyordu.

| Rol | Bulgu | Karar |
|---|---|---|
| Öğrenci (390 px) | Hedef hücre (M2) ekranın 700 px sağında; ızgara A sütunuyla açılıyor | Izgara açılınca hedef hücreye kayar; hücre seçimi kaydırma kutusunun içinde görünür kalır |
| Öğrenci (390 px) | Ders sayfası modülün 4 dersinin listesiyle açılıyor, içerik bir ekran aşağıda | Telefonda liste katlanır ("Modüldeki 4 ders") |
| Öğrenci (390 px) | Formül çubuğunda ad kutusu kendi satırında, alan dar | Ad kutusu + düğmeler bir satır, formül alanı tam genişlik |
| Tasarımcı | Başvurulan aralığın her hücresi ayrı çerçeveli, tablo kalabalık | Excel gibi: içi açık renk, yalnız dış kenar çizgili |
| Erişilebilirlik | Klavyeyle hücre seçilemiyor | Ad kutusuna adres yaz + Enter; ızgarada ok tuşları, Enter formül çubuğuna geçer |
| Alan uzmanı (Excel eğitmeni) | Arife cümlesi kafa karıştırıcı | Yeniden yazıldı: İŞGÜNÜ arifeyi tam gün düşer; şirket kuralı farklıysa Süre = 1 satırları ayrı verilir |
| Alan uzmanı | Hata dersinin 2. alıştırması önceki dersin TOPLA'sının tekrarı | EĞERORTALAMA + EĞERHATA ile gerçek bir "eşleşme yoksa" durumu |
| Alan uzmanı | Pivotta boş şehir "" olarak görünüyor | Veride boş metin gerçek boşa çevrildi, pivot "(boş)" yazar |
| Mülakatçı | 5 dakikada değer: ana sayfa "Denetle" adımını ve gizli kopyayı söylüyor | Değişiklik yok |

**Ders:** Hedef hücrenin görünmemesi gibi sorunları birim testleri yakalamaz; telefonda görevle gezmek gerekir.

> 💡 **Şöyle daha iyi olur:** Alıştırma ızgarası 240 satırın hepsini çiziyor (yaklaşık 3.400 hücre). Telefonda akıcı, ama 8 alıştırmalı bir derste 25.000 hücreye çıkar. Görünür satırları çizen sanal bir ızgara ya da "ilk 50 satır + daha fazla göster" daha hafif olur.

---

## 9. Bilinen sınırlar ve sonraki adımlar

- **Yok:** `M2#` taşma başvurusu, adlandırılmış aralık, Tablo başvurusu, DOLAYLI/KAYDIR, finans/mühendislik işlevleri, Power Pivot/DAX.
- **VBA alt kümesi:** Chart/PivotTable nesneleri, UserForm, olay yordamları (Worksheet_Change), sınıf modülleri, dosya/Outlook/`CreateObject` yok; açık hata verir. `MsgBox(…, vbYesNo)` tarayıcıda hep "Evet" döner.
- **Grafik:** Excel'in görünümü birebir değil; tür, veri ve kararlar aynı. Dilimleyici tarih alanında yok (Excel'de Zaman Çizelgesi). Pivot grafikte sıralama alfabetik; "büyükten küçüğe" için sıralama seçeneği sonraki adım.
- **Bilinçli fark:** `#DÖNGÜ` ve `#FORMÜL` gösterimi; dizi sabitinde her zaman `,`/`;`.
- **Sonraki:** ders okuma sayfaları (`ders/`, arama motorları için, kardeşlerdeki gibi), Kesit merkez sayfasına (`ysfdurak.github.io`) ve kardeşlerin ekosistem menüsüne bağlantı, gerçek Türkçe Excel'de örneklem testi, `M2#` desteği, sanal ızgara.

---

## 10. Mülakat soruları

**S: Neden kendi formül motorunu yazdın, hazır kütüphane yok mu?**
C: Var ama hiçbiri Türkçe işlev adlarını, `;` yazımını, Türkçe METNEÇEVİR kodlarını ve i/İ davranışını bilmiyor; çoğu da büyük ya da lisansı uygun değil. Motor üç katmandan oluşuyor: belirteçlere ayırma, Pratt ayrıştırıcıyla AST, AST'yi değerlendiren yorumlayıcı. `eval` kullanmıyor. Doğruluğu LibreOffice'e karşı 146 formülle sınıyorum.

**S: Öğrencinin sonucu elle yazmasını nasıl engelliyorsun?**
C: Engellemiyorum, yakalıyorum. Formül aynı yapıda ama sayıları, metin dağılımı ve satır sayısı değiştirilmiş gizli bir tabloda da çözümle karşılaştırılıyor. Elle yazılmış sayı orada tutmuyor. Bunun işe yaradığını da test ediyorum: ders testi her tek hücreli alıştırmada sabit cevabın özellikle gizli denemede yakalandığını doğruluyor. İlk sürümde metinleri yalnız karıştırdığım için sayma sorularında açık vardı; test bunu buldu.

**S: `=-2^2` motorunda kaç?**
C: 4, Excel gibi; tekli eksi üsten önce bağlanıyor. `2^3^2` de 64 çünkü Excel üssü soldan birleştiriyor. İkisi de birim testinde ve LibreOffice karşılaştırmasında var.

**S: Türkçe mi İngilizce mi yazıldığını nasıl anlıyorsun?**
C: Dizgi ve dizi sabiti dışında `;` varsa Türkçe. Yoksa işlev adına bakıyorum: Türkçe bir ad varsa Türkçe. `DOĞRU/YANLIŞ` ya da parantez dışında virgül (`=A2*0,9`) varsa yine Türkçe. Son kuralı bir ders testi buldu: `=$D2<$C2*0,9` İngilizce sanılıp "fazladan bir şey var" hatası veriyordu.

**S: Pivot tablonun doğru olduğunu nasıl kanıtladın?**
C: Her pivot hücresi için eşdeğer ÇOKETOPLA formülünü üretiyorum ve testte o formülü motorla hesaplayıp pivot sonucuyla karşılaştırıyorum: 56/56. Kullanıcı da arayüzde hücreye tıklayınca bu formülü görüyor; pivotun formülden farklı bir şey olmadığını öğreniyor.

**S: Neden sunucu yok, ilerleme nerede?**
C: Tarayıcıda. Hesap yok, kişisel veri toplanmıyor; yedek dosyasıyla başka cihaza taşınıyor. Öğretmen paneli istenirse sunucu ve VPS gerekir; o zaman oturum, KVKK ve yedek de gelir.

**S: MCP sunucusu web ile aynı sonucu verdiğinden nasıl eminsin?**
C: Aynı modülleri içe aktarıyor (`docs/motor`). MCP testi web'deki denetçiyle aynı alıştırmayı denetliyor, Türkçe ve İngilizce formülün aynı sonucu verdiğini kontrol ediyor.

---

**S: Tarayıcıda VBA nasıl çalışıyor, güvenli mi?**
C: Kendi yazdığım bir yorumlayıcıyla. Kod belirteçlere ayrılıyor, deyim ağacına çevriliyor ve hücre işlemleri formül motorunun çalışma kitabına gidiyor. `eval` yok; dosya, ağ, `Shell`, `CreateObject` hiç tanımlı değil, adım ve hücre sınırı sonsuz döngüyü durduruyor. Desteklenmeyen nesne açık hata veriyor; kullanıcı kodu `.bas` olarak gerçek Excel'e alabiliyor.

**S: Makro alıştırmasında "son satırı sabit yazma" hatasını nasıl yakalıyorsun?**
C: Makroyu iki kez çalıştırıyorum: görünen tabloda ve satırları %10 uzatılmış, değerleri değiştirilmiş gizli bir kopyada; ikisinde de sonucu çözüm makrosunun sonucuyla karşılaştırıyorum. İlk sürümde kopya kısalıyordu ve sabit 241 boş satırlara 0 yazıp geçiyordu; kasıtlı yanlış çözümle yazdığım test bunu gösterdi, kopyayı uzatarak düzelttim.

**S: Grafik alıştırmasını nasıl denetliyorsun? Görsel bir şeyi denetlemek zor değil mi?**
C: Görüntüyü değil kararları denetliyorum: tür sorunun ailesine uygun mu, veri aralığı çözümle aynı veriyi veriyor mu, yığın, eksenin 0'dan başlaması, pasta dilim sayısı, başlık, ikincil eksen. Kötü grafik alıştırmaları yanlış ayarla başlıyor; testte başlangıç ayarının denetimden geçmediğini de doğruluyorum.

**S: Koşullu biçimde formül neden sol üst hücreye göre yazılır, sen bunu nasıl uyguladın?**
C: Excel formülü her hücre için göreli başvuru kurallarıyla kaydırır. Ben de formülü alanın sol üst hücresine göre alıp her hücre için formül motorundaki `kaydir()` ile kaydırıyor, hücreye yazmadan hesaplıyorum. Böylece `$` unutulunca Excel'deki yanlış boyamanın aynısı oluyor ve öğrenci hatayı görüyor.

---

## 11. Kendini test et

<details><summary>1. `kaydir('=C2*$D$1', 3, 0)` ne döner?</summary>`=C5*$D$1`: göreli C2 üç satır kayar, mutlak $D$1 kalmaz.</details>
<details><summary>2. Varyantta neden yalnız satır karıştırmak yetmez?</summary>Sayma ve toplama sırasız işlemlerdir; karıştırma cevabı değiştirmez. Değerler yeniden örneklenmeli, satır sayısı da değişmeli.</details>
<details><summary>3. `EĞER` neden "tembel" işlev?</summary>Seçilmeyen dal hiç hesaplanmamalı: `=EĞER(A1=0;0;1/A1)` A1=0 iken #BÖL/0! üretmemeli.</details>
<details><summary>4. `2,675`'i iki basamağa yuvarlarken `Math.round(x*100)/100` neden yanlış?</summary>2,675 ikili kayan noktada 2,67499… saklanır; 267,499… aşağı yuvarlanır. Kaydırma ondalık gösterimle yapılmalı.</details>
<details><summary>5. Pivot ile "Toplam" yerine "Say" ne zaman seçilir?</summary>Kimlik numaraları (Sipariş No) ve metin alanlarda; toplamları anlamsızdır.</details>
<details><summary>7. VBA'da `-2^2` kaç, Excel formülünde kaç?</summary>VBA'da -4 (üs önce), Excel formülünde 4 (tekli eksi önce).</details>
<details><summary>8. `RGB(255, 255, 0)` hangi tamsayı?</summary>65535: kırmızı + yeşil×256 + mavi×65536 = 255 + 65280.</details>
<details><summary>9. Grafik neden telefonda minicik yazıyla çıkıyordu?</summary>Öğe sayfaya eklenmeden önce genişliği 0 okunuyordu; 700 px'e çizilip ölçeklendi. Genişlik ana alandan tahmin edildi.</details>
<details><summary>10. SVG'de çift `class` özniteliği neden bütün grafiği bozar?</summary>SVG XML olarak ayrıştırılıyor; XML'de çift öznitelik ayrıştırma hatasıdır, tarayıcı grafik yerine hata belgesi döndürür.</details>
<details><summary>6. CSP `style-src 'self'` iken kenar çizgisi nasıl renkleniyor?</summary>CSSOM ile (`td.style.boxShadow = …`); CSP satır içi `style` özniteliğini engeller, CSSOM'u engellemez.</details>

---

## 12. Elle yapılacak alıştırma ve 5 dakikalık demo

**Alıştırma (30 dk):** motora kendi elinle yeni bir işlev ekle: `KAREKÖKPİ` (İngilizcesi SQRTPI, √(x·π)). Dört dosyaya dokunacaksın; her birinin rolünü bu sırada görürsün.
1. `docs/motor/islevler.js`: `tanim('SQRTPI', yay(([x]) => { const n = N(x); return hataMi(n) ? n : n < 0 ? H.SAYI : Math.sqrt(n * Math.PI); }));`
2. `docs/motor/formul.js` → `TR_EN`: `'KAREKÖKPİ': 'SQRTPI'`.
3. `docs/icerik/islev-bilgi.js`: bir satır (örnek `=KAREKÖKPİ(2)`).
4. `tests/vakalar.json` → `lo`: `"=SQRTPI(2)"`.
5. `npm test` ve `python3 tools/lo_karsilastir.py`: 178/178 olmalı. İşlev rehberinde görünmeli.

**Alıştırma 2 (20 dk, makro):** Makro atölyesine yeni bir örnek ekle: `ORNEK_MAKROLAR` (`docs/js/sayfalar.js`) içine "Boş hücreleri say" makrosu. A sütunundan son satırı bul, Şehir (D) sütununda boş olanları say, MsgBox ile göster. Sonra `.bas` indirip gerçek Excel'de aynı sayıyı aldığını gör (Satışlar'da boş şehir var). İpucu: `If IsEmpty(Cells(r, 4).Value) Then`; `IsEmpty` yoksa `Cells(r, 4).Value = ""`.

**Alıştırma 3 (15 dk, grafik):** `docs/icerik/dersler-4.js`'teki Ders 13.6'ya dördüncü bir "kötü grafik" ekle: 180 noktalı çizgi grafik ve her noktada veri etiketi (`veriEtiketi: true`, kural `veriEtiketiYok`). `npm test` başlangıç ayarının geçmediğini doğrulamalı.

**5 dakikalık demo akışı**
1. Ana sayfa (20 sn): "Türkçe Excel, Kesit verisi, cevap gizli bir kopyada da denetleniyor."
2. Ders 4.3 (90 sn): `=ÇOKET` yaz, öneri; hücreye tıklayarak aralık; söz dizimi vurgusu; Denetle.
3. Aynı derste sonucu elle yaz (`=31`), Denetle → "gizli denemede tutmadı" (40 sn).
4. Ders 1.3 (40 sn): `$` unutulmuş formül, aşağı doldur, #BÖL/0! ve ipucu.
5. Özet tablo (40 sn): Şehir × Adet, hücreye tıkla → eşdeğer ÇOKETOPLA.
6. Power Query (40 sn): Bayi raporu, üç adım, M kodu.
7. MCP (30 sn): Claude'a "bu formülü İngilizceye çevir" ve "şu formülüm doğru mu".
8. Görselleştirme (40 sn): Ders 13.6'da kesik eksenli sütun grafik, kutuyu boşalt; panoda Kanal dilimleyicisi, KPI'lar birlikte değişir.
9. Makro (40 sn): kaydediciyi başlat, formül yaz, aşağı doldur; koddaki `L2:L241`'i göster, Ders 14.2'de sabit 241'in gizli kopyada yakalandığını göster.

---

## 13. Değişiklik günlüğü

- **2026-11-27 · 0.1.0** İlk sürüm. Motor (131 işlev, LibreOffice 177/177), 48 ders, 99 alıştırma, pivot ve Power Query atölyeleri, MCP (5 araç). Güvenlik taraması temiz, ölçüm yok (`soz`). Kullanıcı gözüyle inceleme: hedef hücreye kaydırma, mobil ders listesi, formül çubuğu, klavye erişimi, kenar çizgileri, arife metni, iki alıştırma. Bulunan ve düzeltilen hatalar: üs birleşmesi (sağdan → soldan), `0,9` yazım tespiti, `ifade` gölgelenmesi, `append` dizileri, `[hidden]` ezilmesi, varyantın sayma sorularındaki açığı, boş şehir.
- **2026-11-27 · 0.2.0** Görselleştirme ve makro: Modül 13 (7 ders: grafik seçimi, 15 tür, pivot grafik ve dilimleyici, koşullu biçim, veri çubuğu/renk ölçeği/simge/mini grafik, kötü grafiği düzeltme, pano vakası) ve Modül 14 (6 ders: kaydedici, Range ve son satır, If/Select Case, biçim, Function ve WorksheetFunction, Office Scripts ve güvenlik). Yeni motorlar `grafik.js`, `kosullu.js`, `vba.js`; atölyeler Görselleştirme (4 sekme) ve Makro; MCP `grafik_ciz`, `makro_calistir`. Makro varyantı uzayan kopya. Veri kitabı `docs/indir/kesit-excel-veri.xlsx`. 61 ders, 124 alıştırma, 79 test, LibreOffice 177/177, tarama temiz.
