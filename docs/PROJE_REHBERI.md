# Kesit Excel · Proje rehberi

> Yaşayan belge. Kod değiştikçe aynı commit'te güncellenir. Amaç: kodu kim yazmış olursa olsun projeyi baştan sona anlatabilmek, mülakatta savunabilmek ve güvenle değiştirebilmek.
> Ortak altyapı (GitHub, Pages, güvenlik temeli, lisans) için: `ysfdurak.com` deposundaki `docs/GUVENLIK_TEMELI.md` ve altyapı el kitabı.

---

## 1. Bir bakışta

| | |
|---|---|
| **Ne** | Tarayıcıda çalışan Türkçe Excel eğitimi: kendi formül motoru (202 işlev, LAMBDA, düzenli ifadeler ve veritabanı işlevleri dahil), 152 ders, 492 denetlenen alıştırma, her ders için indirilebilir Excel kitabı; özet tablo, Power Query, görselleştirme (grafik, pivot grafik, koşullu biçim, pano), VBA makro, kitap tasarımı (Tablo, ad, veri doğrulama, özel biçim, formül denetimi) ve durum çözümlemesi (finans, Hedef Ara, Veri Tablosu, Senaryo, Çözücü), modern formüller (LAMBDA, GRUPLAÖLÇÜT, tahmin), veri araçları (Gelişmiş Filtre, 3B başvuru) ve pano grafikleri (madde, ibre, Pareto, Gantt); yerel MCP sunucusu (8 araç) |
| **Kimin için** | Excel'i işte kullanacak herkes; özellikle veri analisti, BI, operasyon/planlama, finans, BT iş analisti ve ofis rolleri. Kesit ailesinin (SQL, Power BI, Python, İstatistik) beşinci üyesi |
| **Canlı** | https://ysfdurak.github.io/kesit-excel/ (27.11.2026'dan beri; kök adres `docs/`'a yönlendirir) |
| **Depo** | `ysfdurak/kesit-excel` |
| **Durum** | 0.9.0 · depo açık, CI yeşil; testler 221, LibreOffice 291/291, güvenlik taraması temiz; gerçek Excel'de (LTSC İngilizce/Türkçe menü ve Türkçe web Excel 365) örneklem yapıldı (§7.x–7.z); 0.7.0–0.9.0 içeriği gerçek Excel'de henüz denenmedi (§5.20–5.22) |
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
- **`Hata`, `H`, `HATA_TR`**: Excel hatası bir değerdir (atılmaz, yayılır). İç kod İngilizce (`#DIV/0!`), gösterim Türkçe (`#SAYI/0!`).
- **`Dizi`**: 2B değer; `al(r,c)` yayma (broadcasting) kuralını uygular: 1 satırlık dizi her satıra, 1 sütunluk her sütuna uyar. `=H2:H241*I2:I241` bu yüzden çalışır.
- **`TR_EN`**: Türkçe → İngilizce işlev adları. Tersini `EN_TR` üretir. `islevAdi` `_xlfn.` önekini ve `İ→I` farkını da çözer.
- **`kaydir(formul, dr, dc)`**: Aşağı doldurmanın kalbi. Göreli başvuruları kaydırır, `$` olanları tutar, tablo dışına düşeni `#BAŞV!` yapar. Belirteç konumlarıyla çalıştığı için dizgi içindeki `"A1"` metnine dokunmaz.
- **`cevir(formul, hedef)`**: Yalnız işlev adı, ayırıcı, ondalık, mantıksal ve hata belirteçlerini yerinde değiştirir.

> ⚠️ **Şöyle daha iyi olur:** `formul.js` 400 satırı geçti ve `TR_EN` tablosu da içinde. Tabloyu `motor/adlar.js`'e taşımak hem okunurluğu artırır hem de MCP'nin yalnız adlara ihtiyaç duyduğu yerlerde daha küçük bir içe aktarma sağlar.

### 5.2 `motor/islevler.js` (202 işlev)
- `tanim(ad, fn, { tembel })`: `tembel` işlevler (EĞER, EĞERHATA, ÇOKEĞER, ELEMAN, LET, SATIR) bağımsız değişkenleri **değerlendirilmemiş** AST olarak alır. Böylece `=EĞER(A1=0;0;1/A1)` hiç `#SAYI/0!` üretmez ve LET ad tanımlayabilir.
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

### 5.7 `motor/grafik.js` (23 grafik türü, SVG; 0.4.0 eklemeleri §5.16)

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

### 5.11 Kitap tasarımı: Tablo, ad, biçim, doğrulama, denetim (0.3.0)

**Yapılandırılmış başvuru (`formul.js` + `kitap.js`).** Belirteçleyici `[` görünce `koseliOku()` ile köşeli bloğu tek bir `tref` belirteci olarak okur: `Satışlar[Adet]`, `[@Adet]`, `[@[Birim Fiyat]]`, `Satışlar[[#Başlıklar];[Adet]]`, `[[Adet]:[Tutar]]`. Değerlendirici bunu `kitap.tabloBasvuru()`'ya verir; o da tabloyu bulur ve sıradan bir aralığa çevirir. `@` "bu satır" demek: formülün yazıldığı satırdaki tek hücre. Tablo adı sayfa adıdır (boşluk `_` olur); `kitap.tablo()` her veri sayfasını kendiliğinden tablo yapar.

```
=TOPLA(Satışlar[Adet])      → Satışlar!H2:H241 (satır eklenince kendisi uzar)
=[@Adet]*[@[Birim Fiyat]]   → H5*I5 (formül 5. satırdaysa)
```

**Adlar.** `kitap.adTanimla('KDV', '0,2')` ya da `'=Satışlar!$H$2:$H$241'`. Ad kuralı Excel'inki: harf/`_` ile başlar, hücre adresine benzemez (`KDV1` değil `A1` reddedilir), boşluk yok. Belirteçleyici bilinmeyen bir sözcüğü önce işlev, sonra ad olarak dener.

**DOLAYLI / KAYDIR.** DOLAYLI metni çalışma anında başvuruya çevirir, bu yüzden kitaba bir ayrıştırıcı kancası (`basvuruAyristiriciKur`) verilir. KAYDIR *tembel* işlevdir: ilk bağımsız değişkeni değer değil başvuru olarak alır. İkisi de "uçucu"dur; Excel'de her değişiklikte yeniden hesaplanır, büyük kitabı yavaşlatır. Derste bu yüzden önce Tablo, sonra FİLTRE önerilir.

**Özel sayı biçimi (`bicim.js`).** Biçim kodu en çok 4 bölüm: `pozitif;negatif;sıfır;metin`. Ayrıca `[Kırmızı]` renk, `[>=1000000]` koşul, `"₺"` tırnaklı metin, `#.##0,` binle ölçekleme (sondaki her ayırıcı 1000'e böler), `%`, `0,00E+00`, `@`. Kod Türkçe (`.` binlik, `,` ondalık) ya da İngilizce olabilir; kodun kendisinden anlaşılır. Önemli ders: **biçim değeri değiştirmez**, yalnız görünümü. `1234567` hücresi `#.##0,0.. "M"` ile `1,2 M` görünür ama TOPLA hâlâ 1234567 toplar. Alıştırma da bunu ölçer: denetçi hem metni hem değerin değişmediğini sınar.

**Veri doğrulama (`dogrulama.js`).** Kural `{tur, op, deger1, deger2, liste, formul, stil}`. Liste `Web;Mobil` gibi yazılır ya da `=$M$2:$M$4` / `=DOLAYLI($C2)` ile bir alana bağlanır (bağımlı liste). Uyarı stili Excel'deki gibi üçlü: **Durdur** girişi reddeder, **Uyarı** sorar, **Bilgi** yalnız bildirir. "Geçersiz verileri işaretle" (`gecersizler()`) kural eklemeden önce girilmiş eski veriyi bulur; çünkü doğrulama yalnız yeni girişi denetler. Kayıt sayfasına bilerek 6 hata koydum (`web`, `-3`, 31.13 gibi).

**Formül denetimi.** `etkileyenler()` formülün başvurduğu hücreler (AST'deki başvuru düğümleri), `etkilenenler()` tersi (kitaptaki tüm formüller taranır). `formulAdimlari()` "Formülü Değerlendir" penceresinin karşılığıdır: en içteki alt ifadeyi hesaplayıp yerine koyar, adım adım. EĞER'de yalnız seçilen dal hesaplanır, tıpkı Excel'deki gibi. Denetim sayfasında üç kasıtlı hata var: yanlış aralık, metin olarak saklanmış sayı (`"204.600"`), `$` unutulduğu için aşağı kayan bölen.

> 💡 **Şöyle daha iyi olur:** Gözcü Penceresi (Watch Window) yok. `etkilenenler()` zaten hazır; formül çubuğunun altına "izlenen hücreler" şeridi eklemek küçük bir iş.

### 5.12 Senaryo ve finans (`senaryo.js`, finans işlevleri)

**Finans işlevleri** tek bir denklem etrafında döner (para birimi zaman değeri):

```
BD·(1+r)^n + ödeme·((1+r)^n − 1)/r + GD = 0
```

DEVRESEL_ÖDEME, BD, GD bu denklemi doğrudan çözer; TAKSİT_SAYISI logaritmayla; FAİZ_ORANI ve İÇ_VERİM_ORANI ise kapalı çözümü olmadığı için `kokBul()` ile (önce Newton, ıraksarsa ikiye bölme). **İşaret kuralı** öğrencinin en sık hatası: kasaya giren para artı, çıkan eksi. Kredi tutarı artı verilirse taksit eksi çıkar; Excel de böyle. NBD'nin tuzağı da derste: NBD ilk nakit akışını bir dönem iskonto eder, bu yüzden 0. yıl yatırımı içine değil dışına yazılır: `=NBD(r;C6:G6)+B6`.

**Hedef Ara.** Tek değişkenli kök bulma: `f(x) = hedefHücre(x) − hedefDeğer`. Önce sekant (iki deneme noktasından doğru çizip sıfırı tahmin), olmazsa aralığı genişletip işaret değiştiren iki nokta bulunca ikiye bölme. Her denemede kitap kopyasında değişen hücre yazılır ve bağımlı formüller yeniden hesaplanır. Sonuç çözüm formülüyle değil **sonucun kendisiyle** denetlenir: bulunan değeri koyunca hedef hücre hedef değere ±0,01 yakın mı?

**Veri Tablosu ve Senaryo.** Veri Tablosu bir ya da iki girdi hücresini sırayla değiştirip her birleşimde çıktı hücresini okur (Excel'deki `{=TABLO()}`'nun yaptığı). Senaryo özeti, adlandırılmış girdi kümelerini sırayla uygular ve sonuç hücrelerini yan yana yazar. İkisi de kitabı değiştirmez; kopyada çalışır.

**Çözücü.** Doğrusal programlama: amaç ve kısıtlar değişkenlerin doğrusal fonksiyonları ise **Simplex** yeter.
1. Doğrusallık denetimi: kitabı her değişkeni 0, 1, 2 yaparak hesaplıyorum; katsayılar tutmuyorsa (ör. `B4*C4`) "doğrusal değil" diyorum. Excel burada GRG Doğrusal Olmayan'a geçer; ben açıkça reddediyorum.
2. Katsayıları sayısal türevle çıkarıyorum (formülü okumak yerine çalıştırarak), sonra iki aşamalı Simplex: Aşama 1 yapay değişkenlerle olurlu bir başlangıç bulur, Aşama 2 amacı iyileştirir. Döngüyü Bland kuralı önler.
3. Tamsayı kısıtı varsa **dal-sınır**: LP çözümünde kesirli bir değişken (ör. 3,4) varsa iki alt problem açılır (≤3 ve ≥4), en iyisi tutulur.

Vakalar bilerek kesirli çıkacak şekilde seçildi: Üretim LP 185.555,56 → tamsayı 185.500; Vardiya (5 gün çalış, 2 gün izin) LP 22,33 → tamsayı 23 operatör. İlk denemede katsayılar "tamamen birimsel" (TU) bir matris verdi; LP zaten tamsayı çıktı ve "tamsayı kısıtını unutan öğrenci" yakalanamadı. Test bunu yakaladı, modeli değiştirdim.

### 7.x Gerçek Excel'de örneklem (27.11.2026, kullanıcının bilgisayarı)

Ortam: Windows, Excel **Office LTSC** (2021 sınıfı), menüler **İngilizce**, Windows bölge ayarı **Türkçe** (ondalık virgül, ayırıcı `;`). Önce dosya aktarılamadığı için veri ve model sayfaları panodan yapıştırıldı ve bir VBA makrosuyla kuruldu; sonra kullanıcı veri kitabını ve `.bas` dosyasını indirdi, ikisi Excel'in kendi Aç ve Import pencereleriyle açıldı (`.Formula` İngilizce yazımla); Hedef Ara, Çözücü, veri doğrulama ve Power Query menülerden çalıştırıldı.

| Konu | Kesit | Excel | Sonuç |
| --- | --- | --- | --- |
| 9 hesap işlevi (TOPLA.ÇARPIM, ALTTOPLAM, BASIKLIK, ÇARPIKLIK, TRIMMEAN, BENZERSİZ, FİLTRE, SIRALA) | 12 satırlık Satışlar | aynı | ✓ |
| `METNEÇEVİR(B2;"aaaa yyyy")` | Ocak 2024 | Ocak 2024 (`mmmm` çalışmıyor) | ✓ |
| DEVRESEL_ÖDEME (Kredi B6) | 106.285,35 | aynı | ✓ |
| Hedef Ara: Fiyat B10=0 (B5) · B10=150.000 (B4) · Kredi B6=80.000 (B3) | 23.235,29 · 41,96 · 1.354.843,37 | aynı | ✓ |
| Veri Tablosu (vade × faiz, 4×4) | 16 değer | aynı, hücrede `=TABLE(B5;B4)` | ✓ |
| Çözücü Üretim (tamsayı) | 185.500 (64/110/39) | **varsayılan %1 toleransla 185.400**; %0 ile 185.500 (79/110/29) | ⚠ ders metnine not |
| Çözücü Vardiya | 23 | 23 (başka bir karışım) | ✓ |
| Makrolar: Tutar, İptalleri boya, Kategori özeti | | aynı; Türkçe İ ve `#,##0.00` doğru | ✓ |
| `FormulaLocal = "=EĞER(...;...)"` | çalışır | **#NAME?**: İngilizce menülü Excel `IF` ister | ⚠ makro yorumu düzeltildi |
| Excel Tablosu `Satışlar`, `=TOPLA(Satışlar[Adet])` | 22 | 22 | ✓ |
| 3B başvuru `Ocak:Mart!B2:B8` · `Ocak:Mart!B2` | 3.616 · 682 | aynı | ✓ |
| Gelişmiş Filtre: VE, YA DA, önek ("Eski"), boş ölçüt satırı, benzersiz | 3 · 3 · 2 · 12 · 6 satır | aynı satırlar | ✓ |
| Birleştir (Ocak+Şubat+Mart, sol sütun) | 7 kategori | aynı toplamlar, Excel Mart'ın sırasını kullanıyor | ✓ |
| Özet tablo Kanal × Adet | 8 / 11 / 3 | aynı; etiketler menü dilinde (Row Labels, Grand Total) | ✓ |
| Power Query: Gruplandır (Kanal, Toplam Adet) | `Table.Group(... List.Sum([Adet]), type number)` | aynı sonuç, Excel `type nullable number` yazar | ✓ |
| Veri doğrulama: liste `Web;Mobil;Mağaza`, 1–50 tamsayı, EĞERSAY benzersiz | C5, C13, E9, E20, E24, A11, A22 | aynı 7 hücre | ✓ |
| Koşullu biçim `=$I2>1000` | I10 | I10 | ✓ |
| Biçim `#.##0 "adet"`, `0,0 "lt"`, `%0,0`, `gg.aa.yyyy`, `gggg` | | aynı | ✓ |
| `#.##0, "bin"` | 1.250.000, bin | aynı (ölçeklemiyor) | ⚠ ders metni `#.##0,` diyordu, `#.##0.` yapıldı |
| `[Kırmızı]` | kırmızı | **reddedildi**; `[Red]` çalışır | ⚠ renk adı menü dilini izler, ders metnine not |
| `dd.mm.yyyy` | 01.01.2024 | **00.mm.2024** (Türkçe ayarda d dakika) | ⚠ ders metnine not |
| Dizi sabiti sütun ayırıcı | `,` | **`\`** (`{1\2\3}`) | ⚠ motor `\` yazımını da kabul ediyor |
| TRIMRANGE, TEXTBEFORE, REGEX, PERCENTOF, LAMBDA ailesi, GRUPLAÖLÇÜT | var | #NAME? (bu sürümde yok) | sınanamadı |
| Veri kitabı `kesit-excel-veri.xlsx` (indirilen dosya) | 29 sayfa, 16 Excel Tablosu | Korumalı görünümde açıldı, **onarım uyarısı yok**; 29 sayfa, 16 tablo; tek hata hücresi `Denetim!D11` (#DIV/0!, dersin bilerek koyduğu hata) | ✓ |
| Kitapta Kredi!B6 · `TOPLA(Satışlar[Adet])` · Fiyat!B10 | 106.285,35 · 371 · 47.000 | aynı | ✓ |
| `KesitMakro.bas` (VBA > File > Import File) | 1254 kod sayfası | içeri alındı; MsgBox'ta "Satışlar sayfasındasınız" Türkçe harfleri doğru | ✓ |
| 5 örnek makro tam veride | 240 satır, 31 iptal, Elektronik 39 / Giyim 47 / Kitap 118 / Spor 37, L toplamı 210.964,25 | aynı; Formül yazdır'daki FormulaLocal `EĞER` İngilizce menüde #NAME? (yukarıdaki satır) | ✓ |

**Ders:** Kural "her şey Türkçe" değil: **ayırıcılar ve tarih harfleri Windows bölge ayarını, işlev ve renk adları ile özet tablo etiketleri Excel'in menü dilini izler.** Kesit Türkçe menülü Excel'i varsayıyordu; İngilizce menülü ama Türkçe bölgeli Excel (Türkiye'de şirket bilgisayarlarında yaygın) iki tarafı karıştırıyor.

### 7.y Türkçe menülü Excel'de örneklem (27.11.2026, aynı bilgisayar)

Microsoft'un Office dil paketi (tr-tr, 64 bit) kuruldu, Excel'in görüntüleme dili Türkçe yapıldı, sınamadan sonra yine İngilizceye alındı. Yöntem: bir makro Kesit'in Türkçe–İngilizce ad tablosundaki (`TR_EN`) **191 adın** her birini İngilizce yazımla (`.Formula`) hücreye yazdı ve Excel'in Türkçe karşılığını (`.FormulaLocal`) okuyup Kesit'in adıyla karşılaştırdı. Ardından Türkçe adlar doğrudan (`FormulaLocal`) yazıldı; hata metinleri, renk adları ve özet tablo başlıkları okundu.

| Konu | Kesit (önce) | Türkçe Excel | Sonuç |
| --- | --- | --- | --- |
| 191 ad, LTSC'de bulunanlar | 166 ad | 166'sı **birebir aynı** (EĞER, DÜŞEYARA, ÇAPRAZARA, ETARİHLİ, TOPLA.ÇARPIM…) | ✓ |
| Tabloda olmayan `TRIMMEAN` | TRIMMEAN (İngilizce kalıyordu) | **KIRPORTALAMA** | ⚠ eklendi, Ders 21.5 ve işlev rehberi Türkçe adla |
| `PI` | PI() | **Pİ()** (noktalı İ); PI() yazınca da çalışır | ⚠ Kesit artık Pİ gösterir |
| `RANK` | SIRA() | **RANK()**; `=SIRA(...)` → #AD? | ⚠ düzeltildi |
| Kesit'in fazladan kabul ettiği adlar | SEÇ, MAKEĞER, MİNEĞER, ORTALAMAEĞER, YAZIMDÜZENİ | hepsi #AD? ya da yazılamıyor (doğrusu ELEMAN, ÇOKEĞERMAK, ÇOKEĞERMİN, EĞERORTALAMA, YAZIM.DÜZENİ) | ⚠ kaldırıldı: Kesit de #AD? verir |
| Sıfıra bölme hatası | #BÖL/0! | **#SAYI/0!** (`#BÖL/0!` formüle yazılamıyor) | ⚠ motor, 6 ders metni ve testler düzeltildi |
| Diğer hatalar | #YOK, #SAYI!, #BAŞV!, #DEĞER!, #AD?, DOĞRU/YANLIŞ | aynı | ✓ |
| Renk adları | Kırmızı, Mavi, Yeşil, Macenta… | `[Kırmızı] [Mavi] [Yeşil] [Pembe] [Siyah] [Beyaz] [Camgöbeği] [Sarı] [Renk10]`; magenta = **Pembe** | ⚠ Pembe eklendi, ders notu genişletildi |
| Özet tablo başlıkları | `Toplam / Adet`, `En Büyük / Birim Fiyat` | **Toplam Adet**, Say Adet, Ortalama Birim Fiyat, **Mak** Birim Fiyat, **Min** Birim Fiyat; Satır Etiketleri, Genel Toplam, (boş) | ⚠ başlıklar Excel gibi yapıldı |
| Excel 365'e özgü 18 işlev (ÖNCEKİMETİN, GRUPLAÖLÇÜT, SÜTUNA, AL, DÜŞEYYIĞ, NORMİFADE…) ve LAMBDA ailesi | var | bu sürümde yok | sınanamadı |

**Ders:** Ad tablosunu elle yazmak yerine Excel'in kendisine sordurmak (191 ad, 10 saniye) altı hatayı birden buldu; bunların ikisi (`SIRA`, `#BÖL/0!`) ders metninde de vardı ve öğrenciye yanlış ad öğretiyordu. "Kolay anlaşılsın" diye eklenen takma adlar (SEÇ, MAKEĞER) Excel'de çalışmadığı için zararlıydı. Yeni testler: `motor.test.mjs` "Türkçe Excel adları", `model.test.mjs` "pivot başlıkları".

### 7.z Türkçe web Excel'de 365 işlevleri (27.11.2026)

Kullanıcı Microsoft hesabıyla web Excel'e girdi; boş bir kitapta (OneDrive'da `Book.xlsx`) her aday ad `=SATIRSAY(…)` içinde yazıldı: sayı dönerse ad geçerli, #AD? dönerse geçersiz. Bulunamayan adlar otomatik tamamlama listesinden ve İşlev ekle > Mantıksal kategorisinden okundu. Microsoft'un Türkçe destek sayfaları bu iş için güvenilir değil: aynı işlev bir sayfada Türkçe, ötekinde İngilizce adla geçiyor, bazı adlar (SÜTUNKAYDIR, YÜZDEOFBAKİYE, NORMİFADETEST) Excel'de hiç yok.

| İşlev | Kesit (önce) | Türkçe Excel 365 | Sonuç |
| --- | --- | --- | --- |
| TEXTBEFORE/AFTER/SPLIT, GROUPBY, PIVOTBY, TOCOL, TOROW, WRAPROWS, WRAPCOLS, EXPAND, REGEXREPLACE, REGEXEXTRACT, TAKE, DROP, VSTACK, HSTACK, CHOOSECOLS, CHOOSEROWS | ÖNCEKİMETİN … SÜTUNSAR, GENİŞLET, NORMİFADEDEĞİŞTİR, AL, BIRAK… | 19'u birebir aynı | ✓ |
| LAMBDA, LET, MAP, BYROW, BYCOL, SCAN, REDUCE, PERCENTOF | İngilizce ad | Türkçede de İngilizce ad | ✓ |
| REGEXTEST | REGEXTEST | **NORMİFADESINA** | ⚠ düzeltildi |
| MAKEARRAY | MAKEARRAY | **DİZİOLUŞTUR** | ⚠ düzeltildi |
| TRIMRANGE | TRIMRANGE | **KIRPARALIĞI** | ⚠ düzeltildi |
| ISOMITTED | ISOMITTED | **ATLANMIŞ** (otomatik tamamlamada çıkmıyor; İşlev ekle aramasında "eksik" ile bulundu); `LAMBDA(x;[y];EĞER(ATLANMIŞ(y);"yok";"var"))(1)` → yok, `(1;2)` → var | ⚠ düzeltildi |
| GRUPLAÖLÇÜT toplam satırı | a 4 · b 2 · Toplam 6 | aynı, etiket "Toplam" | ✓ |
| `NORMİFADEAYIKLA("a1b22c333";"[0-9]+";1)` | alt alta 1, 22, 333 | **yan yana** 1 · 22 · 333 | ⚠ motor ve ders metni düzeltildi |
| Dizi sabiti `{1;2;3}` | 3 satır | web Excel'de **1 satır 3 sütun**; `{1\2\3}` 3 satır | ⚠ ders metni düzeltildi (masaüstü ile web tersine) |

**Ders:** Belge yerine Excel'in kendisine sormak yine kazandırdı: 3 yanlış ad ve bir ayırıcı farkı. Masaüstü (Türkçe bölge) ile web Excel'in dizi sabiti ayırıcıları tersine çıktı; bu yüzden ders artık "yönün önemli olduğu yerde SATIRSAY ile deneyin" diyor.

> ✅ Excel 365 işlev adlarının hepsi gerçek Türkçe Excel'de doğrulandı. Kalan elle denemeler kullanıcıda: Android'de dokunarak bir alıştırma, grafiği PNG indirip sunumda netlik; yayından sonra canlı adres ve güvenlik başlıkları.

> 💡 **Şöyle daha iyi olur:** `npm test` yalnız 3 test dosyasını çalıştırıyordu (model, görsel ve modern testleri CI'da hiç koşmuyordu). Artık `tests/*.test.mjs` hepsini çalıştırıyor: 155 test.

> 🧪 **Burada bir test daha yapalım (sizin bilgisayarda):** Kredi, Üretim ve Vardiya sayfalarını gerçek Excel'e kopyalayıp Hedef Ara ve Çözücü'yü (Simplex LP, "Kısıtlanmamış değişkenleri negatif olmayan yap" açık) çalıştırın. Beklenen: taksit 106.285,35; Üretim 185.500 (tamsayı); Vardiya 23.

### 5.13 İleri pivot ve pano (0.3.0)

- **Hesaplanmış alan tuzağı:** `='Birim Fiyat'*Adet` alanı pivotta her satırda değil, **toplamlar** üzerinde hesaplanır: TOPLA(Fiyat) × TOPLA(Adet). Ciro anlamsız büyür. Motor da bilerek böyle hesaplıyor; ders bu farkı gösterip doğru yolu (kaynakta Tutar sütunu ya da Power Pivot'ta SUMX) öğretiyor.
- **Ayrıntıya inme:** pivot hücresine çift tık, o hücreyi oluşturan kaynak satırları (`ayrinti()`) gösterir; en çok 60 satır.
- **ÖZETVERİAL:** `pivotYerlestir()` pivotu bir sayfaya yazar ve `kitap.pivotlar`'a kaydeder; `=ÖZETVERİAL("Adet";$A$3;"Şehir";"İzmir")` bu kayıttan okur. Pivot düzeni değişse de doğru hücreyi bulur; pivota tıklayınca Excel'in bu formülü kendiliğinden yazmasının nedeni bu.
- **Form denetimleri:** açılan kutu, onay kutusu, kaydırma çubuğu, seçenek düğmesi bir hücreye bağlanır ve o hücreye *değer* yazar (açılan kutu metin değil **sıra numarası** yazar; İNDİS ile metne çevrilir: sık hata). Denetçi her durumu sırayla dener (`durumlar`): formül her denetim değerinde doğru mu?

### 5.14 Modern formüller: LAMBDA ve yardımcıları (0.4.0)

**LAMBDA bir değer türüdür.** `formul.js`'te `Lambda` sınıfı üç şey taşır: parametre adları, gövde ağacı (AST) ve tanımlandığı andaki LET değişkenleri (**kapanış**). `=LAMBDA(x;x*2)` hesaplanınca bir sayı değil bu nesne çıkar; hücreye böyle bir nesne düşerse `kitap.js` onu `#HESAP!` yapar (Excel de öyle yapar).

Bir LAMBDA üç yoldan çağrılır:

| Yazım | Ayrıştırıcıda | Değerlendiricide |
|---|---|---|
| `=LAMBDA(x;x*2)(5)` | İşlev düğümünden sonra gelen `(` yeni bir **`cagir`** düğümü açar | `f` hesaplanır, Lambda ise `lambdaCagir()` |
| `=MARJ(D2;E2)` (Ad Yöneticisi) | `MARJ` bilinen bir işlev değil, `ad: null` olan işlev düğümü | Önce LET değişkenleri, sonra `kitap.adDegeri()`; Lambda bulunursa çağrılır, yoksa `#AD?` |
| `=BYROW(B2:D5;TOPLA)` ("eta") | `TOPLA` parantezsiz, yani `ad` belirteci | Ad bulunamazsa ve bir yerleşik işlevin adıysa `new Lambda(null, null, null, 'SUM')` |

`lambdaCagir()`: parametre sayısı tutmazsa `#DEĞER!`; kapanışı kopyalayıp parametreleri ekler, gövdeyi o değişkenlerle değerlendirir, sonra eski değişkenleri geri koyar (`try/finally`: hata olsa da sızıntı yok). Özyineleme 256 derinlikte `#SAYI!` ile kesilir.

**Yardımcılar** (`islevler.js`) hep aynı kalıptır: diziyi gez, her parça için `cagirTek()` ile LAMBDA'yı çağır, sonucun **tek değer** olduğunu denetle (dizi dönerse `#HESAP!`: Excel "diziler dizisi"ni desteklemez).

```
MAP(a;b;λ)      → her (r,c) için λ(a[r,c], b[r,c])
BYROW(d;λ)      → her satır için λ(satır)          → R×1
SCAN(b;d;λ)     → birikim = λ(birikim, x), her adımı yaz
REDUCE(b;d;λ)   → aynı döngü, yalnız son birikim
MAKEARRAY(R;C;λ)→ λ(r, c)
```

**GRUPLAÖLÇÜT** dört adımda çalışır: (1) başlık kipi (boşsa "ilk satır metin, altı sayı" ise başlık var sayılır), (2) filtre dizisiyle satırları süz, (3) satır alanındaki değer birleşimlerine göre grupla (anahtar: büyük harfe çevrilmiş değerlerin JSON'u, Türkçe i/İ doğru), (4) sırala, her grup için her değer sütununu LAMBDA'ya ver, ara ve genel toplamı ekle. ÖZETÖLÇÜT aynı gruplamayı satır ve sütun alanında ayrı yapıp kesişimleri hesaplar.

**3B başvuru** (`Ocak:Mart!B2`): belirteçleyici `Ad:Ad!` desenini tanır ve başvuruya `sayfa2` ekler. Değerlendirici kitaptaki **sekme sırasına** göre aradaki her sayfanın aynı alanını alt alta dizer; TOPLA/ORTALAMA/MAK bu diziyi toplar. Kaydırma (`kaydir()`) sayfa önekine dokunmadığı için 3B başvuru da aşağı doldurulunca doğru kayar.

> 💡 **Şöyle daha iyi olur:** Excel'de 3B başvuru yalnız bazı işlevlerde geçerlidir (ETOPLA 3B almaz). Kesit diziye çevirdiği için her işlevde çalışıyor; ileride desteklenmeyen işlevde `#DEĞER!` verilebilir.

### 5.15 Gelişmiş Filtre (`motor/veriaraclari.js`)

Ölçüt alanının ilk satırı liste başlıklarıyla eşlenir (büyük/küçük harf duyarsız; bulunamayan başlık açık hata verir). Her alt satır bir **VE grubu**, gruplar arası **YA DA**. Bir hücrenin koşulu `kosul()` ile EĞERSAY'ın ölçüt dilinden kurulur, iki Excel inceliğiyle:

- Düz metin **"ile başlar"**: `İstanbul` → `=İstanbul*`. Tam eşleşme için hücreye `="=İstanbul"` yazılır (tek başına `=İstanbul` bir formüldür ve `#AD?` verir; testte bu da sınandı).
- Boş ölçüt satırı boş bir VE grubudur, `[].every()` her zaman doğru döndüğü için **her kaydı geçirir**. Bu Excel'in davranışı ve en sık hatası; denetçi bunu ayrıca söylüyor.

Denetçi (`gelismisFiltreDenetle`) öğrencinin ölçüt hücrelerini kitaba yazar, filtreyi çalıştırır ve **satır numaralarını** çözümünkilerle karşılaştırır; yani başlığı farklı yazan ama aynı satırları bulan da doğru sayılır.

### 5.16 Pano grafikleri (0.4.0)

| Tür | Nasıl çiziliyor | Excel'de karşılığı |
|---|---|---|
| Pareto | Seriyi büyükten küçüğe sırala, birikimli payı sağ eksende çiz, %80 kesikli; eşiğin sağı soluk | Ekle > İstatistik > Pareto |
| Madde | Bantlar (gri tonları, sondan başa açılan), ince gerçekleşen çubuk, kalın hedef çizgisi, sağda yüzde | Yığılmış çubuk + ikincil eksen + hata çubuğu |
| İbre | Yarım halka iz, değere kadar dolu yay, ibre çizgisi, hedef çentiği | Halka + pasta birleşimi |
| İlerleme | Halka iz + yay, ortada yüzde; %100'ü geçen yeşil | Halka grafik, iki dilim |
| Gantt | Başlangıçtan süre kadar çubuk; tarih ekseni haftalık | Yığılmış çubuk, ilk parça dolgusuz |
| Kelebek | Ortada etiket, iki seri zıt yönde | Bir seri eksiye çevrilmiş yığılmış çubuk |
| Halter | İki nokta ve aralarında çizgi | Dağılım + hata çubuğu |
| Güneş | İç halka üst kırılım, dış halka alt; iki metin sütunu "Üst › Alt" olur | Ekle > Hiyerarşi > Güneş Patlaması |

**Geometri dersi:** bütün halka ve yaylar tek bir `yay(cx, cy, r1, r2, a1, a2)` işleviyle çizilir. İlk sürümde %120'lik ilerleme halkası **boş** çıktı: tam turda yayın başlangıç ve bitiş noktası (0,1 px'e yuvarlanınca) aynı noktaya düşüyor, SVG de başı sonu aynı olan yayı hiç çizmiyor. Çözüm: yarımdan büyük halkayı iki yarım yay olarak çizmek. Test bunu yeşil dolgunun varlığıyla sınıyor.

**Vurgu ve hedef çizgisi** eksenli grafiğe seçenek olarak eklendi: `vurgu: 'enBuyuk'` tek serideki en büyük çubuğu tam renkte bırakıp ötekileri `fill-opacity=0.28` yapar ve değerini yazar; `hedefCizgisi` ölçeğe dahil edilir (çizgi ekran dışına düşmesin) ve kesikli çizilir. Gantt için tarih sütunları seriye dahil edilmeli; bu yüzden `aralikVerisi()` `tarihSeri` seçeneği aldı (diğer grafiklerde tarih sütunu seri olmaz, yoksa 45.663 gibi sayılar çizilir).

### 5.17 Eksiklerin tamamlanması (0.5.0)

**Taşma başvurusu `M2#`.** Belirteçleyici başvurudan hemen sonra gelen `#`'i başvurunun parçası sayar (`tasan: true`); `kaydir()` de `#`'i korur. Değerlendirici önce çapa hücreyi hesaplatır, sonra kitabın **taşma boyutu** kaydına (`kitap.tasmaBoyut`, her hesaplamada sıfırlanır) bakıp `Bas` döndürür. Çapa taşmıyorsa `#BAŞV!`. Kayıt `formulHesapla()` içinde, `tasir()` başarılı olunca tutulur; `#TAŞMA!` olan çapa kayda girmez.

**İsteğe bağlı LAMBDA parametresi.** `LAMBDA(a;[b];…)` içindeki `[b]`, belirteçleyicide zaten var olan tablo başvurusu okuyucusundan (`koseliOku`) geçer; LAMBDA bu düğümü "tabloya bağlı olmayan, tek sütunlu tref" olarak tanır ve isteğe bağlı parametre sayar. Çağrıda eksik ya da boş verilen isteğe bağlı parametreler değişken ortamına özel bir anahtarla (`ATLANAN`) not edilir; `ISOMITTED(b)` tembel bir işlevdir, değeri değil bu notu okur.

> 💡 **Şöyle daha iyi olur:** Tref'i parametre olarak yeniden yorumlamak pratik ama dolaylı. Belirteçleyiciye "LAMBDA içindeyken [x] parametredir" bağlamı eklemek daha açık olurdu; mülakatta bunu "bilerek seçilmiş kısa yol" olarak anlatın.

**Düzenli ifadeler.** Excel PCRE2 kullanır; Kesit JavaScript `RegExp` (`u` bayrağıyla) kullanır. Karakter sınıfı, niceleyici, grup, ileriye/geriye bakış (`(?<=^.)`) ikisinde de aynıdır; PCRE2'ye özgü özyineleme ve koşullu gruplar yoktur. Hatalı desen `#DEĞER!`, eşleşme yoksa `#YOK`.

**PERCENTOF ve iki parametreli özet.** Excel GRUPLAÖLÇÜT'e iki parametreli bir işlev verilince ona (grubun değerleri, bütün süzülmüş değerler) çiftini geçirir; PERCENTOF bu yüzden pay hesaplayabilir. Kesit'te `ikili` bayrağı yerleşik PERCENTOF ya da iki parametreli LAMBDA için açılır.

**Birleştir** (`veriaraclari.js` → `birlestir`): etiket yoksa satır/sütun **konumuna** göre, Sol sütun/Üst satır işaretliyse **etikete** göre (Türkçe büyük harf anahtarıyla) eşler; bir kaynakta olmayan etiket listeye eklenir. Denetçi etiket sırasını önemsemez (satırları sıralayıp karşılaştırır).

**Zaman Çizelgesi** (`pano-ui.js`): tarih alanının ayları (yyyymm) sıralanır; seçilen aralığa düşen **tarih değerlerinin listesi** özet tabloya sıradan bir filtre olarak gider, yani pivot motoruna dokunmadan eklendi. Telefonda ay düğmeleri yatay kayar (ilk sürüm kabı 425 px'e itiyordu; `min-width:0` ile düzeldi).

**Gözcü Penceresi** (`izgara.js`): seçili hücre listeye eklenir; her `guncelle()` sonrasında formül ve değer yeniden yazılır.

**Bilinçli olarak eklenmeyenler:** harita grafiği (Excel'de Bing çevrimiçi hizmetine bağlı, Kesit'in "veri cihazdan çıkmaz" ilkesiyle çelişir; il sınırı verisi de ≈200 KB), TAHMİN.ETS (Excel'in AAA parametre seçimi yayımlanmış değil; yakın ama farklı sonuç yanıltır), Hızlı Doldurma'nın desen tahmini (yanlış tahmin sessizdir; ders formül karşılığını öğretiyor), kamera aracı ve resimli arama (ekran görüntüsüne dayalı, öğretme değeri düşük).


### 5.18 Türkçe kurslardan gelen ofis pratikleri (0.6.0)

**KÖPRÜ (HYPERLINK).** Motor köprüyü açmaz, yalnız **görünen adı** döndürür (verilmemişse hedef metni). Gezinme Kesit'in ızgarasında anlamsız olduğu için denetçi sonucu ve `gerekli: ['HYPERLINK']` ile işlevin kullanıldığını denetler.

**FORMÜLMETNİ (FORMULATEXT).** Bağımsız değişken değer değil **başvuru** olmalı: işlev `Bas` nesnesini alır, `kitap.icerik()` ile hücrenin ham girişini okur. `=` ile başlamıyorsa #YOK (Excel de böyle). Rehber örneği EĞERHATA ile sarıldı, çünkü boş A1'de #YOK verir ve "örnek hatasız" testi bunu yakaladı.

**ÇARPIKLIK, BASIKLIK, TRIMMEAN.** Ortak `momentler()` yardımcısı n, ortalama ve örneklem standart sapmasını verir; formüller Excel'in örneklem düzeltmeli tanımıdır (BASIKLIK'ta `-3(n-1)²/((n-2)(n-3))` terimi). TRIMMEAN her uçtan `taban(n·p/2)` değer atar; Microsoft'un örneği (3,7778) ve LibreOffice ile aynı.

> ✅ **0.6.4'te çözüldü:** TRIMMEAN'ın Türkçe adı gerçek Türkçe Excel'de **KIRPORTALAMA** çıktı (§7.y); `TR_EN`'e eklendi, ders ve işlev rehberi Türkçe adı kullanıyor.

**Neden çoğu ders seçmeli?** Şifreleme, Belge Denetçisi, yazdırma ve PowerPoint bağlantısı tarayıcıdaki ızgarada taklit edilemez; taklit etmek "yaptım sandım" yanılgısı yaratır. Bunlar karar soruları olarak sorulur (hangi koruma gerçekten korur?), uygulanabilen her şey (seri, köprü, birim biçimi, istatistik, renk kuralını sayma) ise denetlenen alıştırmadır.


### 5.19 Veri kitabı: gerçek Excel'de aynı sayfalar (0.6.2)

`tools/kitap_olustur.py` önce yalnız Kesit ortak verisini (12 sayfa) yazıyordu; 0.3–0.6'da eklenen 17 model sayfası (Kredi, Bölgeler, Talep…) kitapta yoktu ve başlıklı sayfalar Excel Tablosu değildi. Yani `=TOPLA(Satışlar[Adet])` gibi ders çözümleri gerçek Excel'de #AD? verirdi.

- **Model sayfaları:** `tools/modeller_dok.mjs` `modeller.js`'i okuyup formülleri motorun kendi çevirmeniyle (`cevir(…, 'en')`) İngilizce yazıma çevirir: `.xlsx` formülü her zaman İngilizce saklar, Türkçe Excel açarken Türkçe gösterir.
- **Tablolar:** başlıklı her sayfa, Kesit'teki adla (`motor/kitap.js → tablo()`: sayfa adı, boşluk yerine `_`) bir Excel Tablosu olur.
- **Doğrulama:** kitap LibreOffice'te yeniden hesaplatıldı; 14 deneme formülü (Tablo başvurusu, 3B başvuru, model sayfaları, NBD) ve model sayfalarındaki 35 formül hücresinin hepsi Kesit'le aynı.

> 💡 **Ders:** "İndir" düğmesi teknik olarak çalışıyordu; eksik, dosyanın derslerle uyuşmamasıydı. Bunu bir test değil, "bu dosyayla dersi gerçek Excel'de yapabilir miyim?" sorusu buldu. Sayfa eklendiğinde kitabı yeniden üretmek NASIL.md'de iş adımı olarak yazılı.

> 🧪 **Burada bir test daha yapalım (sizin bilgisayarda):** Kitabı Türkçe Excel'de açın; Kredi!B6'da `=DEVRESEL_ÖDEME(B4/12;B5;-B3)` görünmeli ve 106.285 vermeli; boş bir hücreye `=TOPLA(Satışlar[Adet])` yazın: 371.

### 5.20 İçerik güçlendirme, veritabanı işlevleri ve Excel'de çalışma kitabı (0.7.0)

Kullanıcı içeriğe baktı ve üç şey söyledi: temel seviye için içerik az, veritabanı işlevleri (VSEÇTOPLA ailesi) yok, alıştırmalar gerçek Excel'e indirilebilmeli. Karar: hem derinlik hem konu hem alıştırma artacak; indirme ders başına ve tek kitap olarak.

**Ne eklendi?**

| | Önce | Sonra |
|---|---|---|
| Ders | 111 (temel/orta modülde 4'er) | 152 (temel/orta 1–9. modülde 8'er) |
| Alıştırma | 250 (temel/orta derste 2'şer) | 492 (temel/orta derste en az 4) |
| Modül | 21 | 22 (Veritabanı işlevleri, 5 ders) |
| İşlev | 190 | 202 |

- **Yeni dersler** `icerik/dersler-8.js` (Modül 1–4), `dersler-9.js` (5–9), `dersler-10.js` (22). Konu seçimi tekrarı önlemek için var olan ders başlıkları ve alıştırmaları listelenerek yapıldı (ör. karışık başvuru, ORTANCA, İLKEŞLEŞEN, iki yönlü arama, ISO hafta, DÜŞEYYIĞ, eşleme tablosuyla temizlik).
- **Var olan derslere alıştırma** `icerik/ek-alistirmalar.js`: kimlikler `e1, e2`; `dersler.js` bunları dersin sonuna ekler. Ayrı dosya tutmanın nedeni: eski ders dosyalarına dokunmadan geri alınabilir ve gözden geçirilebilir olması.
- **Sıralama:** dersler artık dosya sırasına değil modül ve ders numarasına göre sıralanır (`dersler.js` → `_sira`); yoksa 1.4'ten sonra 2.1 gelir, 1.5 en sona düşerdi.

**Veritabanı işlevleri** (`motor/islevler.js` → `vtSec`): VSEÇTOPLA, VSEÇORT, VSEÇSAY, VSEÇSAYDOLU, VSEÇMAK, VSEÇMİN, VSEÇÇARP, VAL, VSEÇSTDSAPMA(S), VSEÇVAR(S). Türkçe adlar Microsoft'un Türkçe işlev sayfalarından alındı. Ölçüt alanı Gelişmiş Filtre ile aynı kuralla çalışır: aynı satır VE, alt satır YA DA, düz metin "ile başlar". LibreOffice iki noktada Excel'den farklı (düz metni tam eşleşme sayar; VAL birden çok kayıtta #DEĞER! verir), bu iki vaka `vakalar.json`'da "elle" listesinde. Formüllü (başlıksız) ölçüt desteklenmez.

**Yol üstünde bulunan iki motor hatası** (testler geçiyordu, içerik yazarken çıktı):

1. **İki yönlü doldurma denetlenmiyordu.** `denetci.js → yerlestir` aralık hedefinde formülü yalnız ilk sütunda aşağı dolduruyordu. N2:R21 gibi bir tablonun yalnız N sütunu denetleniyordu; `$` yanlış konmuş bir formül geçebilirdi. Çözüm: alıştırmaya `ikiYon: true`; denetçi sağa da doldurur. Taşan formüllerde kullanılmaz (sağdaki hücreler taşmayı engellerdi).
2. **METNEÇEVİR sayı kodları.** `=METNEÇEVİR(176;"00000")` "176" veriyordu (Excel: 00176); Türkçe `#.##0` binlik kodu 1234567'yi "1234567,000" gösteriyordu; `#.##0.` ölçeklemesi ve `[Kırmızı]` renk kodu da çalışmıyordu. `tarih.js → sayiBicim` düzeltildi, `motor.test.mjs`'e vaka eklendi. (Hücre biçimlendirmede kullanılan `bicim.js` zaten doğruydu; iki ayrı biçimlendirici vardı.)

> 💡 **Ders:** "Çözüm kendisiyle karşılaştırılınca hep geçer." Testler her alıştırmanın çözümünün denetçiden geçtiğini sınıyordu; ama çözüm ile öğrenci aynı hatayı yapınca (ikisinin de yalnız ilk sütunu denetleniyor, ikisinde de "176" çıkıyor) test yeşil kalır. Bu yüzden yeni alıştırmaların çözümleri ayrıca hesaplatılıp ilk değerlerine gözle bakıldı (`node tools/cozum_kontrol.mjs "^m9"` ile). Böylece "veride hiç ihlal olmadığı için hep boş dönen kontrol" gibi işe yaramaz alıştırmalar da yakalandı; o derslerde veriye bilinçli hatalı kayıtlar eklendi (`hazirlik` ile, ders metninde de söyleniyor).

**Excel'de çalışma kitabı** (`js/xlsx-yaz.js`, `js/alistirma-kitabi.js`):

```
dersKitabi(ders)                 tumKitap(DERSLER)
  Görevler (soru, hedef, ipucu)    Görevler (492 alıştırma, hazırlık metni)
  Alıştırma 1..n (hazırlıklı)      bütün veri sayfaları (Excel Tablosu)
  başvurulan veri sayfaları        Çözümler
  Çözümler (TR, EN, beklenen)
        │
        ▼
xlsxDosyalari → XML parçaları → zip (CompressionStream 'deflate-raw', yoksa STORE) → Blob → indirme
```

- **Neden tarayıcıda?** 152 dersin dosyasını önceden üretip depoya koymak ~5 MB eder ve içerik her değişince yeniden üretilmesi unutulur. Tarayıcıda üretilen dosya her zaman dersle aynıdır; modül ilk tıklamada yüklenir (`import()`), açılışı yavaşlatmaz. Bir ders kitabı ~50 KB, tek kitap ~170 KB; üretim 100 ms'nin altında.
- **.xlsx nedir?** Bir zip: `[Content_Types].xml`, `xl/workbook.xml` (sayfa listesi, tanımlı adlar), `xl/worksheets/sheetN.xml` (hücreler), `xl/styles.xml`, `xl/tables/tableN.xml`. Formül `<f>` içinde **İngilizce** yazımla saklanır, Türkçe Excel açınca Türkçe gösterir. Excel 2010 sonrası işlevler `_xlfn.` önekiyle saklanır (önek yoksa #AD?). `fullCalcOnLoad` ile Excel açılışta hesaplar; dosyada önbellek değer yok.
- **Kararlar:** hazırlıkta taşan bir formül (BENZERSİZ) varsa dosyaya yazılmaz, Görevler'de "M2'ye önce … yazın" yönergesine çevrilir: dinamik dizi formülü dosyada ayrı bir meta veri ister, düz yazılırsa Excel `@` ekleyip tek değer gösterir. Yapılandırılmış başvurulu alıştırmalar (`Satışlar[Adet]`) kopya sayfada değil tablolu asıl sayfada çözülür. LAMBDA adları dosyaya yazılmaz, Ad Yöneticisi yönergesi verilir. Çalışma sayfalarındaki formüllerde METNEÇEVİR kodu Türkçe kalır (kitap Türkçe Excel içindir); Çözümler'in İngilizce sütununda kod da çevrilir ("gg.aa.yyyy" → "dd.mm.yyyy").
- **Doğrulama:** 152 kitabın her alıştırma sayfasına İngilizce çözüm yazılıp LibreOffice'te hesaplatıldı: 248'i "beklenen" ile aynı; kalan 19 fark LibreOffice'e özgü (İngilizce ay adı, Türkçe İ, 365 işlevleri yok, örtük kesişim). Bu sırada bir üretici hatası bulundu ve düzeltildi: başlık satırı olan "ham" sayfalar (Hedef, Ürün ham) başlıksız yazılıyor, veri bir satır kayıyordu. Aynı hata 0.6.2'deki **veri kitabında** da vardı (`tools/kitap_olustur.py`), o da düzeltildi.
- **Test:** `tests/kitap.test.mjs` (her dersin kitabı üretiliyor, sayfa adları geçerli, zip açılıyor, tanımlı ad ve tablo var, taşan hazırlık yönergeye dönüşüyor, İngilizce çözümde Türkçe ad ve `_xlfn` kalmıyor).

> 🧪 **Burada bir test daha yapalım (sizin bilgisayarda):** (1) Herhangi bir dersin kitabını indirip Türkçe Excel'de açın: "Onar" uyarısı çıkmamalı, sarı hücreye çözümü yazınca Çözümler'deki beklenen sonuç gelmeli. (2) Veritabanı işlevlerinin Türkçe adlarını Excel'de bir kez yazın: VSEÇTOPLA, VSEÇSAY, VAL; özellikle **VSEÇSTDSAPMAS** ve **VSEÇVARS** (Microsoft sayfasında başlık olarak görüldü ama Excel'e sorulmadı) **[doğrulanacak]**. (3) Ders 22.4'te ölçüt hücresine ="=Kitap" yazınca tam eşleşme olduğunu görün.

> ⚠️ **Şöyle daha iyi olur:** Modül 10–21 (ileri) dersleri hâlâ 2–3 alıştırmalı olanlar var; araç alıştırmaları (pivot, grafik, Çözücü) daha pahalı yazıldığı için bu turda yalnız kavram soruları eklendi. Bir sonraki turda ileri modüllere de dördüncü alıştırma eklenebilir.

---

### 5.21 Eğitmen müfredatlarıyla tamamlama (0.8.0)

Kullanıcı Mustafa Bolat, Ömer Bağcı, Faruk Çubukçu ve Udemy'deki Türkçe Excel kurslarının konularına bakılmasını, eksiklerin ve alıştırmaların eklenmesini istedi. Karşılaştırma tablosu §9.y'de. Bu bölüm koddaki karşılığını anlatır.

**Yeni dersler** (`docs/icerik/dersler-11.js`, 9 ders): 1.9 Kopyala, Özel Yapıştır, Bul/Değiştir · 1.10 Hücre biçimlendirme temelleri · 2.9 Kasa defteri ve KDV · 8.9 Açılır listeye bağlı rapor ("Tümü" kalıbı) · 8.10 Klasik dizi formülleri · 12.5 İK göstergeleri · 16.8 Finansal tablo analizi (yatay, dikey, trend) · 21.8 Onay kutuları · 21.9 Yapay zekâyla formül. 5.8'e ÇAPRAZEŞLEŞTİR alıştırmaları eklendi.

**Yeni model sayfaları** (`modeller.js`): `Kasa` (17 hareket, ilk satır "Devir"; devir olmadan bakiye eksiye düşüyordu) ve `Gelir Tablosu` (9 kalem × 2022–2024).

**Motorda ne değişti?**
- `TRANSPOSE` (DEVRİK_DÖNÜŞÜM; nokta yazımı da kabul edilir) ve vektör biçimli `LOOKUP` (ARA). ARA hataları atlayıp son ≤ eşleşmeyi bulur; `=ARA(2;1/(koşul);sonuç)` kalıbı bu yüzden "koşulu sağlayan son kaydı" verir.
- `LARGE`/`SMALL` dizi k kabul eder: `=TOPLA(BÜYÜK(aralık;{1;2;3}))` ilk üçün toplamı.
- Özel biçimde metin grupları: `0 (000) 000 00 00` telefon, `"No: "000` sıra numarası. `bicim.js` → `sayiYaz` içindeki `aradaMetin` dalı rakamları sağdan gruplara dağıtır.
- Denetçide `ikiYon`: 2B doldurma hedeflerinde (ör. trend analizi G2:I10) formül hem sağa hem aşağı doldurulup her hücre denetlenir; önceki sürüm yalnız ilk sütuna bakıyordu.

**Alıştırma sayısı:** `docs/icerik/ek-alistirmalar-2.js` ileri modüllerde 1–2 alıştırmalı 39 derse alıştırma ekledi (pivot, makro, formül, seçmeli). Artık her derste en az 3 alıştırma var; `DERSLER.filter(d => d.alistirmalar.length < 3)` boş döner. Toplam 161 ders, 577 alıştırma.

**Bu yapı neden böyle?** Ek alıştırmalar ders dosyalarına gömülmedi, kimliğe göre (`'m14-d2': [...]`) ayrı dosyada tutulup `dersler.js`'te birleştiriliyor. Böylece ders metni ile alıştırma çoğaltma işi ayrı commit'lerde incelenebiliyor. Dezavantaj: bir dersin bütün alıştırmalarını görmek için iki dosyaya bakmak gerekir. Kural: yeni derste alıştırmalar dersin içinde yazılır, ek dosya yalnız var olan dersleri büyütmek içindir.

> **Burada bir test daha yapalım:** 8.10'daki klasik dizi formülleri (MAK(EĞER), TOPLA(1/EĞERSAY)) Excel 365'te doğrudan çalışır; Excel 2019 ve öncesinde ve LibreOffice'te Ctrl+Shift+Enter ister. İndirilen kitapta LibreOffice bunları 0 hesapladı. Gerçek Excel'de (LTSC) bir kitap açıp sonucu denetleyin.

> **Şöyle daha iyi olur:** Harita grafiği ve VBA olayları (Worksheet_Change) eğitmen müfredatlarında var ama motorda karşılığı yok; şimdilik eklenmedi. Olaylar için makro atölyesine "hücre değişince çalış" tetikleyicisi eklenebilir.

### 5.22 Özet tablo gösterimleri, değer filtresi ve koşullu grafikler (0.9.0)

Kullanıcı Bilengo ve Momentum Plus kurslarına ve eğitmenlerin kendi sitelerine de bakılmasını istedi. İki sitenin pivot kursları (21 ve 34 ders) bizim 4 derslik özet tablo modülümüzü açıkça geride bırakıyordu. Grafik kursunda da Excel'in yardımcı seriyle yapılan grafikleri (waffle, eşiğe göre renk, zirve–dip) vardı. Karşılaştırma tablosu §9.z'de.

**Pivot motorunda ne değişti?** (`docs/motor/pivot.js`)
- `goster` için beş yeni değer: `fark`, `farkYuzde`, `birikimli`, `birikimliYuzde`, `sira`. Hepsi satır alanı boyunca, **görünen sıraya göre** hesaplanır. Excel'deki "temel alan = satır alanı, temel öğe = (önceki)" ayarının karşılığıdır. Genel Toplam satırı bu gösterimlerde `null` (boş) döner. Satır alanı yoksa motor hata verir; çünkü "önceki öğe" tanımsızdır.
- `sirala: { gore: 'deger', yon }`: satırlar son sütuna (sütun alanı varsa Genel Toplam sütununa) göre sıralanır. Sıralama gösterimden **önce** yapılır, yoksa değişen toplam yanlış sırada birikir.
- `ilk: { n, yon }`: değer filtresi. Önce filtresiz pivot hesaplanır, en büyük/küçük N öğe seçilir. Sonra satır alanına bu öğeleri süzen bir filtre eklenip pivot yeniden hesaplanır. Böylece **Genel Toplam yalnız görünenleri** toplar (Excel'in varsayılanı). Sınırda eşitlik varsa eşit öğelerin hepsi alınır, Excel de öyle yapar.
- `satirAnahtarlari` artık sıralanmış sırayı döndürür. Böylece ayrıntıya inme ve eşdeğer formül, tıklanan satırla eşleşir.

**Grafik motorunda ne değişti?** (`docs/motor/grafik.js`)
- `vurgu: 'ikiUc'`: tek serili sütun, çubuk ve çizgide en büyük değer yeşil, en küçük değer kırmızı olur, ötekiler solar. Çizgide yalnız bu iki noktaya değer yazılır. `vurgu` artık çizgi grafikte de çalışıyor.
- `esik`: tek seride eşik ve üstü yeşil, altı kırmızı. Excel'de bunun karşılığı iki yardımcı seri ve %100 seri çakışmasıdır (Ders 20.9'da formülüyle öğretiliyor).
- `waffle` türü: 10×10 kare; en çok 4 kategori. Seri 1 gerçekleşen (ya da 0–1 oran), varsa seri 2 hedef.

**Yeni dersler** (`docs/icerik/dersler-12.js`): 10.5 Değerleri farklı göster · 10.6 Sıralama ve İlk 10 · 10.7 Rapor düzeni, boş hücreler, yenileme, Rapor Filtresi Sayfaları · 10.8 Hesaplanmış öğe ve İK vakası · 20.9 Koşullu renkli grafik, zirve–dip, waffle · 21.10 Excel 365 pratikleri (resimden veri, kurtarma, Hızlı Analiz, bağlantılı veri türleri).

**Yolda bulunan hata:** Ders kitaplarını üreten `alistirma-kitabi.js`, Excel 2010–2013'te gelen dört işlevi (`NUMBERVALUE`, `WORKDAY.INTL`, `NETWORKDAYS.INTL`, `FORMULATEXT`) `_xlfn.` öneki olmadan yazıyordu. Bugün yalnız Ders 9.1'in (ve yeni 21.10'un) alıştırma kitabı SAYIDEĞERİ kullanıyor; o kitapta Excel #AD? gösterebilirdi. Öteki üç işlev şimdilik bir alıştırmada yok, önek ileride eklenecekler için. Önek eklendi. Not: bu ortamdaki LibreOffice `_xlfn.NUMBERVALUE` yazımını okumuyor, bu yüzden karşılaştırma aracı (`lo_karsilastir.py`) öneksiz bırakıldı. Gerçek Excel önekli yazımı bekler **[doğrulanacak]**.

> **Burada bir test daha yapalım:** Türkçe Excel'de gösterim adları: "Farkı", "% Farkı", "Değişen Toplam", "% Değişen Toplam", "En Büyükten En Küçüğe Sırala" **[doğrulanacak]**. Ders 9.1 ya da 21.10'un kitabını gerçek Excel'de açıp SAYIDEĞERİ sonucunun #AD? olmadığına bakın.

> **Şöyle daha iyi olur:** Hesaplanmış öğe motorda yok, yalnız seçmeli sorularla anlatılıyor. Mustafa Bolat'ın VBA UserForm + Access kursundaki form tasarımı da makro atölyesinde yok (VBA yorumlayıcısı form çizmiyor). İkisi ileride ayrı bir iş olarak eklenebilir.

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
| LibreOffice | 203 formül LibreOffice 24.2'de hesaplanır ve karşılaştırılır (0.3.0'da 41 finans/DOLAYLI/KAYDIR/ADRES, 0.4.0'da 16 regresyon/SIKLIK/TOPLAMA eklendi); 52 vaka elle (LAMBDA yardımcıları, GRUPLAÖLÇÜT ve dizi biçimlendirme LO 24.2'de yok; TOPLAMA'nın dizi biçimi ve farklı uzunluklu EĞİM'de Excel belgesine uyduk) (FAİZ_ORANI'nın çözümsüz vakasında Excel #SAYI!, LO #YOK verir: Excel'e uyduk) (LO'da olmayan Excel 365 işlevleri, Türkçe BÜYÜKHARF, Türkçe METNEÇEVİR, örtük kesişimsiz dizi) | 262/262 |
| Dersler | Her örnek hatasız; her çözüm denetçiden geçer; tek hücreli sayısal alıştırmada sabit cevap **gizli denemede** yakalanır; hedefin ilk satırı boş bir kaynağa bakmaz. Grafikte başlangıç ayarı geçmez; koşullu biçimde boş kural, panoda boş pano, makroda boş Sub geçmez; sabit son satırlı makro (`yanlis`) gizli kopyada yakalanır | 105 test, 231 alıştırma |
| Görselleştirme ve makro | 15 grafik türü geçerli XML, tarih sütunu kategori, histogram ve çeyrekler, `$` kaydırmalı koşullu kural, pano KPI süzmesi, ders örneği makrolar, R1C1, `.bas` 1254 | 7 test |
| Model (0.3.0) | Tablo/ad başvurusu, DOLAYLI/KAYDIR/ADRES, özel biçim (30 vaka), doğrulama ve bağımlı liste, formül adımları, Hedef Ara, Veri Tablosu, Çözücü (LP ve tamsayı ayrı sonuç vermeli), hesaplanmış alan, ayrıntı, ÖZETVERİAL, işlev rehberi örnekleri | 9 test |
| Modern (0.4.0–0.5.0) | LAMBDA (çağrı, ad, LET kapanışı, eta, parametre sayısı, hücrede #HESAP!), MAP/BYROW/BYCOL/SCAN/REDUCE/MAKEARRAY, GRUPLAÖLÇÜT (başlık, toplam, sıralama, ara toplam, filtre), ÖZETÖLÇÜT, SÜTUNA/SATIRSAR/GENİŞLET, regresyon ve SIKLIK, 3B başvuru, Gelişmiş Filtre (VE/YA DA, ile başlar, =tam, boş satır, benzersiz), isteğe bağlı parametre ve ISOMITTED, M2# ve TRIMRANGE, düzenli ifadeler, PERCENTOF, Birleştir (konum ve etiket), Zaman Çizelgesi kuralı, 8 yeni grafik türü (iki kipte geçerli SVG, NaN yok, çift class yok, %100+ halka dolu), vurgu ve hedef çizgisi, Mart sırası tuzağı | 14 test |
| MCP | 8 araç (`durum_cozumle` dahil) (grafik SVG gömülü renk, makro yalıtılmış kopya ve hata satırı, yeni alıştırma türleri), TR/EN aynı sonuç, taşma, CSV izinli klasör, dış yol reddi, sabit cevabın gizli denemede yakalanması | 1 test, 30+ doğrulama |
| Arayüz (Playwright, elle) | 19 sayfa × 390/1350 px: konsol hatası 0, yatay taşma 0; uçtan uca: öneri → tıkla-başvuru → F4 → aşağı doldur → Denetle → pivot → Power Query | örneklem |

**Örneklem testi (bu oturum)**

| Adım | Beklenen | Gözlenen | Durum |
|---|---|---|---|
| Ders 4.3, `=ÇOKET` yaz, Tab | `=ÇOKETOPLA(` | aynı | ✓ |
| H2'ye tık, Shift+H241 | `H2:H241` eklenir, söz dizimi "toplam_aralığı" vurgulu | aynı | ✓ |
| Doğru formül, Denetle | "Doğru… gizli denemede" | aynı | ✓ |
| Ders 1.3, `=I2/N1` aşağı doldur, Denetle | #SAYI/0! açıklaması + ipucu | aynı | ✓ |
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

**Örneklem testi (0.3.0, Playwright, 1350 ve 390 px)**

| Adım | Beklenen | Gözlenen | Durum |
|---|---|---|---|
| 20 yeni ders sayfası, 1350 px | Konsol hatası 0 | aynı | ✓ |
| 15.3 a1: Liste kuralı `Web;Mobil;Mağaza`, Geçersiz verileri işaretle | `web` ve boşluklu kayıt halkalı, "Doğru" | aynı | ✓ |
| 15.6: Denetim sayfası, D11'de Etkileyenleri izle + Formülü değerlendir | D3 ve D8 vurgulu; adım adım `#SAYI/0!` | aynı | ✓ |
| 16.4: Hedef Ara, B10=0, B4 değişsin | Başa baş ücret, "Doğru" | aynı | ✓ |
| 16.6: Çözücü, tamsayı kısıtı olmadan | LP sonucu, "tamsayı kısıtı eksik" | aynı | ✓ |
| 17.1: hesaplanmış alan, çift tık ayrıntı | Şişkin ciro, ayrıntı tablosu | aynı | ✓ |
| 17.3: onay kutusu H2, H5 formülü | Her iki durumda doğru | aynı | ✓ |
| 6 yeni ders, 390 px | Yatay taşma 0, form kutuları tek sütun | aynı | ✓ |

**Örneklem testi (0.4.0, Playwright)**

| Adım | Beklenen | Gözlenen | Durum |
|---|---|---|---|
| 19 yeni ders × 1350 ve 390 px | Konsol hatası 0, yatay taşma 0 | aynı | ✓ |
| 19.1 a2: yalnız İzmir satırı, Denetle | 2 kayıt, "YA DA satırı eksik" | ilk sürümde ileti "ile başlar" diyordu; düzeltildi | ✓ |
| 19.1 a2: Ankara satırını ekle, ölçüt M1:N3 | "Doğru… 4 kayıt" | aynı | ✓ |
| 18.1 a1: MARJ = LAMBDA(…) | "Doğru… =MARJ(…)" | ilk sürümde kutu örneği "=Satışlar!$H$2:$H$241" idi; LAMBDA örneğine çevrildi | ✓ |
| 18.4 a1: GRUPLAÖLÇÜT taşması | Kanal, Mağaza, Mobil, Web, Toplam | aynı | ✓ |
| 19.3 a2: `=TOPLA(Ocak:Mart!B2)` | Yakalanır (Mart sırası farklı) | "sizin 682, beklenen 548" | ✓ |
| 20.6: vurgu ve 6.000 hedef çizgisi | Doğru, çizgi görünür | aynı | ✓ |

**Örneklem testi (0.5.0, Playwright)**

| Adım | Beklenen | Gözlenen | Durum |
|---|---|---|---|
| 19.3 a4: üç aralık, etiketsiz Denetle | "konuma göre toplar… Sol sütun" | aynı | ✓ |
| Aynı, Üst satır + Sol sütun | 7 satır, "Doğru" | aynı | ✓ |
| 20.8 örnek: Oca, sonra Mar | KPI 371 → 183, "Oca 24 – Mar 24", 3 ay seçili | aynı | ✓ |
| 20.8 a1: başlık, Zaman Çizelgesi, Kanal, KPI, grafik | "Doğru" | aynı | ✓ |
| 15.6: D11 Gözcüye ekle | D11, =D3/D8, #SAYI/0! | aynı | ✓ |
| 18.1 a3: KDVLİ isteğe bağlı oran | "Doğru" | aynı | ✓ |
| 18.9 a3: e-posta maskeleme | A***@Gmail.com, "Doğru" | aynı | ✓ |
| 20.8 × 390 px | Yatay taşma 0 | ilk ölçümde 425 px; düzeltildi | ✓ |

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

**0.2.0 turu (görselleştirme ve makro eklendikten sonra):** 21 sayfa × 390/1350 px ölçüldü; konsol hatası ve yatay taşma 0.

| Rol | Bulgu (ölçüm) | Karar |
|---|---|---|
| Yönetici (390 px, Pano) | İlk ekranı iki dilimleyicinin 15 düğmesi kaplıyor, KPI kutuları ekranın altında | Dar ekranda dilimleyiciler açılır bölümde ("Dilimleyiciler (2) · 1 filtre açık"), KPI'lar ilk ekranda |
| Günlük kullanıcı (390 px, Makro) | "Çalıştır" ilk ekranda yok: düzenleyici 250 px, düğme altında | Düğme satırı düzenleyicinin hemen altına, telefonda düzenleyici 150 px |
| İlk kez gelen (390 px) | Alt sekmedeki "Atölye" yalnız Formül atölyesine gidiyor; diğer dört atölyeye yalnız ☰ menüden ulaşılıyor ve sekme vurgusu kayboluyor | Her atölyenin başında beş atölye arasında geçiş satırı; bütün atölyelerde "Atölye" sekmesi vurgulu |
| Tasarımcı | Kenar menüsünde "Uygula ve hazırlan" grubu 9 kalem: atölyeler ile başvuru sayfaları karışık | İki grup: Atölyeler (5) ve Başvuru ve hazırlık (4); adresler aynı |
| Alan uzmanı (Excel eğitmeni) | Pano dilimleyicisi her tıkta ekliyor, özet tablodaki dilimleyici ise Excel gibi tek seçiyor: aynı uygulamada iki davranış | İkisi de Excel gibi: tık tek seçer, Ctrl+tık ekler, dokunmatikte her dokunuş açar/kapatır |
| Erişilebilirlik | Görselleştirme sekmeleri `role="tab"` ama ok tuşlarıyla geçilmiyor | Sol/sağ ok ile sekme değişir, odak yeni sekmeye geçer |
| Tasarımcı | KPI başlığı "Kayıt sayısı · Sipariş No" kaldır düğmesinin altına giriyor | Başlığa sağ boşluk |
| Herkes | Kenar menüsü altında sürüm "0.1" yazıyordu | 0.2 |

> 💡 **Şöyle daha iyi olur:** İşlev rehberi telefonda 27.800 px (131 işlev alt alta) ve Mülakat sayfası 11.900 px, içinde hiç kontrol yok. Bir içindekiler listesi ya da kategori sekmeleri ikisini de kısaltır. Bu tur yalnız yeni ekranlara baktı; bu iki sayfa ayrı bir iş olarak bekliyor.

> 💡 **Şöyle daha iyi olur:** Alıştırma ızgarası 240 satırın hepsini çiziyor (yaklaşık 3.400 hücre). Telefonda akıcı, ama 8 alıştırmalı bir derste 25.000 hücreye çıkar. Görünür satırları çizen sanal bir ızgara ya da "ilk 50 satır + daha fazla göster" daha hafif olur.

**0.4.0 turu (19 yeni ders):** 19 ders × 390/1350 px ölçüldü (konsol hatası 0, yatay taşma 0), altı alıştırma görevle çözüldü.

| Rol | Bulgu | Karar |
|---|---|---|
| Günlük kullanıcı (Gelişmiş Filtre) | Yalnız İzmir satırını yazınca ileti "düz metin ile başlar" diyor; asıl eksik Ankara satırı | Eksik kayıtta "YA DA satırı eksik ya da koşul fazla", fazla kayıtta VE/YA DA ve ="=metin" ipucu; hiç kayıt yoksa VE açıklaması |
| Günlük kullanıcı (LAMBDA adı) | Ad kutusunun örneği "=Satışlar!$H$2:$H$241": LAMBDA alıştırmasında yanlış yöne çekiyor | Çözüm LAMBDA ise örnek "=LAMBDA(parametre;…;hesap)" ve not "Ad Yöneticisi > Yeni" |
| Tasarımcı | İlerleme halkası en çok 4 kategori gösteriyordu, beşinci bölge sessizce düşüyordu | En çok 6, telefonda 3'lü ızgara |
| Tasarımcı | İbre 320 px yükseklikte alt yazıyı kesiyordu | Yarıçap alt yazıya yer bırakacak şekilde küçüldü |
| Alan uzmanı (depo) | Pareto, Gantt, kelebek örnekleri satış değil depo işinden olmalı | İade nedenleri, depo taşıma planı, A/B vardiyası kalite ölçüleri, bölge depoları sevk hedefi; Gantt verisi gerçek bir taşıma sırasıyla (sözleşme → raf → WMS → eğitim → sayım → taşıma) |
| Alan uzmanı (Excel eğitmeni) | Kelebek grafikte farklı birimler (adet ve yüzde) yan yana yanıltır | Vardiyalar sayfasında beş ölçünün hepsi yüzde; ders metninde "aynı birim" uyarısı |
| Mülakatçı | GRUPLAÖLÇÜT ve özet tablo farkı sorulur | Ders 18.4 mülakat sorusu ve sık hata (başlıklı/başlıksız alan karışması) |

---


### 8.x Genel kullanıcı gözüyle üçüncü tur (0.6.1)

111 derse çıkınca sorun tek tek ekranlardan çok **büyüklükteydi**: içerik arttı, onu bulma yolları aynı kaldı.

| Bulgu (390 px) | Önce | Sonra | Karar |
|---|---|---|---|
| Dersler sayfası, 21 modül hep açık | 16.381 px, arama yok | 4.392 px; arama, Temel/Orta/İleri, katlanır modül | İlk bitmemiş modül açık gelir; aramada eşleşen modüller açılır |
| Üstteki "İşlev ara" düğmesi | yalnız işlev arıyor, telefonda yalnız "/" görünüyor | "Ara"; işlev rehberinde eşleşen 5 ders de çıkıyor | Telefonda klavye kısayolu gösterilmez |
| Sık hatalar (111) ve mülakat (128 soru) | 22.567 ve 20.571 px, arama yok | arama kutusu, sonuç sayısı | Sayfalar bölünmedi, süzüldü |
| Seviye testi | soru başlığı kartın kenarına biniyordu | kartın içinde | `legend` fieldset kenarında çizilir; `float:left` ile içeri alındı |
| Telefonda sol kenarda gri gölge | her sayfada | yok | Kapalı kenar çubuğunun gölgesi ekrana sızıyordu; gölge yalnız açıkken |
| Masaüstü ana sayfa | şerit "veride" kelimesinin üstünde | başlık şeritten uzak | |
| Ana sayfa "İleri" kartı | 10 modül adı ve özeti tek paragraf | "10 modül · 63 ders" + modül listesi | |

> 💡 **Ders:** Bunları teknik test bulmadı (152 test geçiyordu). Ölçüm (sayfa yüksekliği) ve görev ("DÜŞEYARA dersini bul") buldu.

> 💡 **Şöyle daha iyi olur (öneri, yapılmadı):** Eğitmen ya da yönetici rolü için ekibe ders yolu atama ve ilerlemeyi görme. Bu, hesap ve sunucu gerektirir; Kesit'in "kurulum ve hesap yok, veri cihazdan çıkmaz" sözüyle çelişir. Ara çözüm: rol yolu bağlantısı (`#yol/operasyon`) paylaşılır, kişi ilerleme yedeğini (JSON) eğitmene gönderir. Gerçek takip istenirse VPS'te ayrı bir sınıf modu gerekir.

> 🧪 **Burada bir test daha yapalım:** Android telefonda Dersler sayfasında modül başlığına dokunup açıp kapatmak ve arama kutusunda Türkçe klavyeyle "ı/İ" içeren bir kelime ("işgünü") aramak.

## 9. Bilinen sınırlar ve sonraki adımlar

- **0.5.0 sınırları:** Harita grafiği yok (§5.17); TAHMİN.ETS çalışmaz, Tahmin Sayfası mevsim endeksiyle anlatılır; `A1:.A1000` kırpılmış başvuru işleci yok (TRIMRANGE var); REGEX işlevlerinde PCRE2'ye özgü yapılar yok; NORMİFADEAYIKLA mod 1 sonuçlarını alt alta, mod 2 gruplarını yan yana taşırır **[doğrulanacak]**; REGEXTEST, TRIMRANGE, PERCENTOF ve ISOMITTED'in Türkçe adları bulunamadı, İngilizce adla yazılır **[doğrulanacak]**; ÖZETÖLÇÜT tek değer sütunu alır; GRUPLAÖLÇÜT toplam satırını "Toplam" diye yazar **[doğrulanacak: Türkçe Excel'deki etiket]**; LAMBDA yardımcılarının (MAP, BYROW, SCAN…) Türkçe Excel'de İngilizce kaldığı ikinci el kaynaktan **[doğrulanacak]**; Birleştir (Consolidate) iletişim kutusu yok, eşdeğeri ETOPLA ile öğretiliyor; Hızlı Doldurma desen tahmini yok, ders formül karşılığını öğretiyor.
- **Yok:** mühendislik işlevleri, Power Pivot/DAX (veri modeli dersi kavramsal; DAX Kesit Power BI'da), sayfa koruması (anlatılıyor, uygulanmıyor), kitaplar arası başvuru.
- **Çözücü:** yalnız doğrusal model (Simplex LP + dal-sınır). Doğrusal olmayan modeli reddeder (Excel'de GRG); evrimsel yöntem yok. Dal-sınırda değişken sayısı küçük tutulmalı (ders modelleri ≤ 7 değişken).
- **Veri Tablosu ve Senaryo:** sonuç panelde gösterilir; kitaba `{=TABLO()}` dizi formülü yazılmaz.
- **VBA alt kümesi:** Chart/PivotTable nesneleri, UserForm, olay yordamları (Worksheet_Change), sınıf modülleri, dosya/Outlook/`CreateObject` yok; açık hata verir. `MsgBox(…, vbYesNo)` tarayıcıda hep "Evet" döner.
- **Grafik:** Excel'in görünümü birebir değil; tür, veri ve kararlar aynı. Pivot grafikte sıralama alfabetik; "büyükten küçüğe" için sıralama seçeneği sonraki adım.
- **Bilinçli fark:** `#DÖNGÜ` ve `#FORMÜL` gösterimi; dizi sabitinde her zaman `,`/`;`.
- **Sonraki:** ders okuma sayfaları (`ders/`, arama motorları için, kardeşlerdeki gibi), Kesit merkez sayfasına (`ysfdurak.github.io`) ve kardeşlerin ekosistem menüsüne bağlantı, gerçek Türkçe Excel'de örneklem testi, sanal ızgara.

---

### Muadil müfredatlarla karşılaştırma (Kasım 2026)

Kaynaklar: Microsoft MO-211 (Excel Expert) beceri listesi, Macquarie/Coursera "Excel Skills for Business: Advanced", Leila Gharani "Visually Effective Excel Dashboards", Maven Analytics "Power Query, Power Pivot & DAX", IIENSTITU ve Yenibiriş ileri Excel programları. Kesit'te **olmayan** ve birden çok kaynakta geçen konular:

| Öncelik | Konu | Hangi kaynakta | Motor/arayüz işi |
|---|---|---|---|
| Yüksek | Veri doğrulama (açılır liste, bağımlı liste) | MO-211, Gharani, IIENSTITU, DataCamp | Izgarada liste ve kural denetimi |
| Yüksek | Özel sayı biçimleri | MO-211 | METNEÇEVİR biçimleyicisi yeniden kullanılır |
| Yüksek | Excel Tablosu (Ctrl+T), yapılandırılmış başvuru, adlandırılmış aralık | Macquarie, Gharani, DataCamp | Formül motorunda ad ve `Tablo[Sütun]` çözümleme |
| Yüksek | Durum çözümlemesi: Hedef Ara, Senaryo Yöneticisi, Veri Tablosu, Çözücü | MO-211, IIENSTITU | Sayısal çözücü; Çözücü için küçük doğrusal programlama |
| Yüksek | Finans işlevleri: DEVRESEL_ÖDEME (PMT), TAKSİT_SAYISI (NPER), NBD, İÇ_VERİM_ORANI, kredi ödeme planı, amortisman | MO-211, Macquarie | İşlev eklemek + LibreOffice vakaları |
| Orta | Formül denetimi: etkileyenleri/etkilenenleri izle, Gözcü Penceresi, Formülü Değerlendir | MO-211 | Ayrıştırıcıdan bağımlılık grafiği (hazır) |
| Orta | Pivot: hesaplanmış alan, ayrıntıya inme, ÖZETVERİAL | MO-211, Gharani | Pivot motoru + işlev |
| Orta | Pano teknikleri: form denetimleri (açılan kutu, onay kutusu, kaydırma çubuğu), dinamik grafik aralığı, dinamik başlık, ilk/son N, hedef–gerçek sapma grafiği | Gharani, Coursera dashboard | Izgarada denetim simülasyonu, KAYDIR/DOLAYLI |
| Orta | Koruma (sayfa, aralık, kitap yapısı), hesaplama seçenekleri, kitaplar arası başvuru, makroyu kitaplar arası kopyalama | MO-211 | Çoğu kavramsal; çoktan seçmeli + kısa uygulama |
| Orta | Veri modeli ve Power Pivot: ilişki, ölçü, basit DAX | Maven, Macquarie, Yenibiriş | Kesit Power BI'a köprü ders; tam DAX orada |
| Düşük | Hızlı Doldurma, seri doldurma, S_SAYI_ÜRET (RANDARRAY), Birleştir (Consolidate), gruplama/anahat, güneş patlaması grafiği, LAMBDA, gelişmiş filtre | MO-211, çeşitli | Tek tek küçük |

**Uygulandı (0.3.0):** Yüksek ve Orta satırların tamamı Modül 15, 16 ve 17 olarak eklendi (Gözcü Penceresi hariç; koruma ve veri modeli kavramsal ders). **Düşük** satır sonraki adım.

> 💡 **Şöyle daha iyi olur:** Sıradaki en değerli ikisi: gelişmiş filtre ve Birleştir (Consolidate); ikisi de var olan motorla yapılabilir. → 0.4.0'da yapıldı (aşağıda).

### İkinci karşılaştırma: ileri Excel ve pano kursları (Kasım 2026, 0.4.0)

Kaynaklar: Excel Off The Grid "Dynamic Formulas Unleashed" (11 bölüm), Microsoft Press "Complete Guide to Next-Gen Excel Formulas" (2026), Udemy LAMBDA ve ileri işlev kursları, Leila Gharani "Visually Effective Excel Dashboards" (18 bölüm), My Online Training Hub pano kursu, GoSkills Excel Dashboards ve Charts, Udemy "50+ Advanced Excel Charts" ve infografik kursları, STL Advanced Excel Dashboards, FutureLearn/The Excel Club, Coursera EDUCBA pano kursları, Chandoo Excel School, Yenibiriş "Orta & İleri" (Gelişmiş Filtre, Birleştir).

| Konu | Kaynaklar | 0.3.0'da | 0.4.0 |
|---|---|---|---|
| LAMBDA, adlandırılmış işlev | Off The Grid, MS Press, Udemy | Yok | Ders 18.1, motor |
| MAP, BYROW, BYCOL, SCAN, REDUCE, MAKEARRAY | Off The Grid, MS Press, MECS | Yok | Ders 18.2–18.3 |
| GROUPBY, PIVOTBY | Off The Grid, MS Press, Chris Menard | Yok | Ders 18.4 |
| TOCOL, WRAPROWS, EXPAND (dizi biçimlendirme), formülle unpivot | Off The Grid, MOTH | VSTACK/AL/BIRAK vardı | Ders 18.5 |
| RANDARRAY, uçucu işlevler | Off The Grid | Yok | Ders 18.7 (kavram + işlev) |
| Eğim, korelasyon, doğrusal tahmin, eğilim | STL, Macquarie | Dağılım + eğilim çizgisi vardı | Ders 18.6 |
| SIKLIK, TOPLAMA | MO-211, Coursera | Yok | Ders 18.7 |
| Gelişmiş Filtre, benzersiz kayıtlar | Yenibiriş, MO-211 | Yok | Ders 19.1–19.2, motor + arayüz |
| 3B başvuru ve Birleştir | Yenibiriş, Macquarie Intermediate | Yok | Ders 19.3 (Mart sırası tuzağıyla) |
| Hızlı Doldurma | MO-211, Yenibiriş | Yok | Ders 19.4 (formül karşılığı) |
| Özel sıralama, Alt Toplam komutu, gruplama | Yenibiriş, MO-211 | ALTTOPLAM işlevi vardı | Ders 19.5 |
| Pano süreci: 5 soru, taslak, yerleşim, koruma, köprü | Gharani, Udemy KPI kursu | Vaka dersi vardı | Ders 20.1 |
| Madde (bullet), ibre, ilerleme halkası | Udemy pano, GoSkills, Coursera, FutureLearn | Yok | Ders 20.2–20.3, 3 grafik türü |
| Pareto | Udemy 50+ grafik | Yok | Ders 20.4 |
| Gantt, kelebek (tornado), halter (dumbbell) | Udemy infografik, GoSkills, STL | Yok | Ders 20.5 |
| Güneş patlaması | Udemy grafik kursları | Yok | Grafik türü (ders yok) |
| En büyüğü vurgulama, dinamik hedef çizgisi | Udemy, Hindi MIS kursu | Yok | Ders 20.6 |
| Formülle KPI panosu | Gharani (Office 365 sürümü) | Kısmen (17.3–17.5) | Ders 20.7 |
| Zaman Çizelgesi | GoSkills, Gharani | Yok | 0.5.0: Ders 20.8, pano |
| Tahmin Sayfası (ETS) | STL, FutureLearn | Yok | 0.5.0: Ders 18.8 mevsim endeksi (algoritma yok) |
| Düzenli ifadeler, M2#, TRIMRANGE, PERCENTOF, ISOMITTED | Off The Grid, MS Press | Yok | 0.5.0: Ders 18.1, 18.9, 18.10 |
| Birleştir iletişim kutusu, Gözcü Penceresi | Yenibiriş, MO-211 | Yok | 0.5.0: Ders 19.3, 15.6 |
| Harita grafiği, kamera aracı, resim arama, Hızlı Doldurma deseni | GoSkills, Udemy | Yok | **Bilinçli olarak yok** (§5.17) |
| Power Pivot/DAX ile pano | Maven, Udemy, Algebra | Köprü ders | Köprü ders (DAX Kesit Power BI'da) |

> 💡 **Not (0.5.0):** Aşağıdaki öneri uygulandı. Kalan eksiklerden en değerlisi **Zaman Çizelgesi** (tarih dilimleyicisi): pano dersinin doğal parçası ve motor (pivot tarih gruplama) hazır. Harita grafiği için Türkiye il sınırları verisi gerekir (≈200 KB); yalnız bölge düzeyi (7 bölge) daha hafif bir başlangıç olur.


### 9.x Türkçe kurslarla üçüncü karşılaştırma (0.6.0)

Bakılan müfredatlar: Uludağ Üniversitesi ULUSEM (İleri Excel), ODTÜ Sürekli Eğitim, Yenibiriş, Boğaziçi Enstitüsü, IIENSTITU. İleri Excel ve pano konularında Kesit zaten daha geniş (LAMBDA, Power Query, Çözücü, VBA); eksik kalanlar **ofis pratikleriydi**.

| Türkçe kurslarda olan konu | 0.5.0 | 0.6.0 |
|---|---|---|
| Kısayollar, Git > Özel, bölmeleri dondur, seri doldurma | dağınık | Ders 21.1 |
| Renge/simgeye göre filtre ve sıralama | yok | Ders 21.2 |
| Köprü ve içindekiler sayfası | yok | Ders 21.3 (KÖPRÜ, FORMÜLMETNİ) |
| Not/açıklama, birimli sayı biçimi | kısmen (15.5) | Ders 21.4 |
| Çözümleyici Araç Takımı, tanımlayıcı istatistik | yok | Ders 21.5 (ÇARPIKLIK, BASIKLIK, TRIMMEAN) |
| Kitabı parolayla şifreleme, Belge Denetçisi | yalnız sayfa koruması | Ders 21.6 |
| Yazdırma ayarları, PDF, PowerPoint'e bağlantılı aktarma, şerit | yok | Ders 21.7 |

Ders: Türkçe kurumsal eğitimler "kâğıda ve e-postaya giden Excel"i (yazdırma, parola, PowerPoint) önemser; uluslararası ileri kurslar bunları atlar. İkisi farklı kitleye hitap eder; Kesit artık ikisini de kapsıyor.

### 9.y Türkçe eğitmenler ve Udemy kurslarıyla dördüncü karşılaştırma (0.8.0)

Bakılanlar: Mustafa Bolat (Excel eğitimleri ve Udemy kursları: pano, form denetimleri, VBA, İK panosu, dizi formülleri), Ömer Bağcı (YouTube ve Udemy: Excel 365 yenilikleri, onay kutuları, dinamik açılır liste, kasa/KDV, İK, yapay zekâ), Faruk Çubukçu (kitap bölümleri: temel işlemler, Özel Yapıştır, finansal tablolar), Udemy'deki Türkçe "Sıfırdan İleri Seviye Excel" kursları.

| Eğitmen müfredatında olan konu | 0.7.0 | 0.8.0 |
|---|---|---|
| Özel Yapıştır (değer, çarp, devrik), Bul/Değiştir | yok | Ders 1.9 (DEVRİK_DÖNÜŞÜM) |
| Hücre biçimlendirme (tarih kodları, telefon, yüzde) | dağınık | Ders 1.10 |
| Kasa defteri, bakiye, KDV dahil/hariç | yok | Ders 2.9 (Kasa sayfası) |
| Dinamik açılır liste + FİLTRE raporu | kısmen (15.3) | Ders 8.9 ("Tümü" seçeneği) |
| Klasik dizi formülleri (Ctrl+Shift+Enter dönemi) | yok | Ders 8.10 (ARA(2;1/…), BÜYÜK dizi k) |
| İK göstergeleri (devir hızı, kıdem, işe alım kaynağı) | yok | Ders 12.5 |
| Finansal tablo analizi (yatay, dikey, trend) | yok | Ders 16.8 (Gelir Tablosu sayfası) |
| Excel 365 onay kutuları | yok | Ders 21.8 |
| Yapay zekâyla formül yazdırma ve denetleme | yok | Ders 21.9 |
| ÇAPRAZEŞLEŞTİR (XMATCH) | anlatımda | Ders 5.8 alıştırmaları |
| Harita grafiği, VBA olayları | yok | eklenmedi (motor sınırı, §5.21) |
| Her konuda bol alıştırma | ileri modüllerde 1–2 | her derste en az 3 |

Ders: eğitmenlerin kursları "iş yerinde ilk hafta"ya (kasa, biçim, Özel Yapıştır, İK listesi) Kesit'ten daha çok yer ayırıyor. Uluslararası kurslarla yapılan önceki karşılaştırmalar bunu göstermemişti; çünkü onlar bu konuları ön bilgi sayıyor.

### 9.z Bilengo, Momentum Plus ve eğitmen siteleriyle beşinci karşılaştırma (0.9.0)

Bakılanlar: Bilengo (bilengo.com: Herkes için Excel 29 ders, Özet Tablo 21 ders, İleri Grafikler 29 ders), Momentum Plus (momentumplus.com.tr: Excel Pivot Tablolarıyla Veri Analizi, 34 ders), Mustafa Bolat'ın Udemy kurs listesi (VBA, Özet Tablo, Grafikler, Access, VBA UserForm + Access), Faruk Çubukçu'nun excelskill.com'u (genel, veri analizi, finans, istatistik, makro). Ömer Bağcı'nın ayrı bir kişisel sitesi bulunamadı. "Momentum Labs" araması spor psikolojisi şirketi çıkardı; Excel kursu olan Momentum Plus kullanıldı.

| Kurslarda olan | 0.8.0 | 0.9.0 |
|---|---|---|
| Değerleri Farklı Göster: Fark, % Farkı | yok | Ders 10.5 (motor `fark`, `farkYuzde`) |
| Değişen toplam (kümülatif), % değişen toplam | yalnız formülle | Ders 10.5 (`birikimli`, `birikimliYuzde`) |
| Otomatik/elle sıralama, değere göre sıralama | yok | Ders 10.6 (`sirala`) |
| İlk 10 değer filtresi | yok | Ders 10.6 (`ilk`) |
| Sıralama gösterimi (rank) | yok | Ders 10.6 (`sira`) |
| Rapor düzeni, boş hücre görünümü, aralığı otomatik genişletme | yok | Ders 10.7 |
| Rapor Filtresi Sayfalarını Göster (filtreye göre sekmeler) | yok | Ders 10.7 |
| Hesaplanmış öğe, çözüm sırası, formülleri listele | yalnız hesaplanmış alan | Ders 10.8 |
| Vaka ve ödev veri setleri | Satışlar | Ders 10.8 (Personel ile İK vakası) |
| Waffle chart | yok | Ders 20.9 (`waffle`) |
| Grafikte max–min gösterme | yalnız biri | Ders 20.9 (`vurgu: ikiUc`, çizgi dahil) |
| Koşullu biçimlendirmeli çizgi/yatay grafik | yok | Ders 20.9 (`esik` + yardımcı seri formülü) |
| Gauge, halka ilerleme, speedometer | var (20.2–20.3) | aynı |
| Veri tipi dönüştürme, resimden veri, kurtarma | kısmen | Ders 21.10 |
| VBA UserForm + Access | yok | eklenmedi (form çizimi yok, §5.22) |

Ders: Pivot konusunda "özet tablo kurmak" ile "özet tablodan rapor üretmek" farklı beceriler. Kesit birinciyi iyi öğretiyordu, ikincisini (gösterim, sıralama, düzen, filtre sayfaları) eksik bırakmıştı. Video kursları bu ikinci kısma ders sayısının yarısını ayırıyor.

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

**S: Çözücü'yü nasıl yazdın, Excel'in Çözücüsü ile aynı mı?**
C: Excel'in Simplex LP yöntemine karşılık gelen kısmı: iki aşamalı Simplex ve tamsayı için dal-sınır. Katsayıları formülü okuyarak değil, kitabı farklı değerlerle çalıştırıp farklarını alarak çıkarıyorum; aynı yolla modelin doğrusal olup olmadığını da sınıyorum. Doğrusal değilse açıkça reddediyorum, çünkü yanlış bir "en iyi" göstermek reddetmekten kötü. Vardiya vakasında LP 22,33 operatör derken tamsayı 23; öğrencinin tamsayı kısıtını unutup unutmadığını bu fark yakalıyor.

**S: Hedef Ara alıştırmasını neye göre denetliyorsun? Herkes farklı başlangıçla farklı ondalık bulabilir.**
C: Çözüm değerine değil sonucun kendisine bakıyorum: öğrencinin bulduğu değeri kitaba yazıp hedef hücreyi yeniden hesaplıyorum; hedefe tolerans içinde yakınsa doğru. Ayrıca doğru hücreleri seçmiş mi (hedef ve değişen hücre) ayrıca söylüyorum.

**S: Model sayfalarında gizli kopya yok; sabit cevabı nasıl yakalıyorsun?**
C: Model sayfaları (Kredi, Üretim) veri değil, girdileri olan bir hesap. Orada kopya yerine **durumlar** kullanıyorum: girdileri değiştirip (`B3: 1.200.000`) formülü yeniden hesaplıyorum. Elle yazılmış taksit girdiyle değişmediği için ikinci durumda tutmuyor.

**S: `=TOPLA(Satışlar[Adet])` ile `=TOPLA(H2:H241)` arasındaki fark ne, motor bunu nasıl çözüyor?**
C: Birincisi tablo büyüdükçe kendisi uzar ve sütunun adını taşıdığı için okunur. Motor köşeli bloğu tek belirteç okuyup tabloyu buluyor ve o anki aralığa çeviriyor; yani hesap aynı, fark tanımın canlı olması.

**S: Excel'de LAMBDA'yı nasıl uyguladın?**
C: LAMBDA'yı bir değer türü yaptım: parametre adları, gövdenin AST'si ve tanımlandığı andaki LET değişkenleri. Ayrıştırıcıya bir işlev düğümünden sonra gelen parantezi "çağrı" olarak okuyan bir kural ekledim: `LAMBDA(x;x*2)(5)`. Ad Yöneticisi'ndeki LAMBDA'lar bilinmeyen işlev adı olarak gelir; önce LET değişkenlerine, sonra adlara bakıp bulursam çağırırım. Hücreye çağrılmamış LAMBDA düşerse Excel gibi #HESAP! veririm. MAP, SCAN gibi yardımcılar diziyi gezip her parça için aynı çağrıyı yapıyor.

**S: Gelişmiş Filtre'de "boş satır her şeyi getirir" neden olur?**
C: Ölçüt alanındaki her satır bir VE grubu; boş satır hiç koşulu olmayan bir grup. Hiç koşulu olmayan grup "her koşulu sağlıyor" sayılır (boş kümede "hepsi" doğrudur), gruplar YA DA ile birleştiği için bütün liste geçer. Kodda bu `[].every()` her zaman `true` döndürdüğü için kendiliğinden oluyor; denetçi bunu ayrıca tespit edip öğrenciye söylüyor.

**S: Pano grafiklerini (madde, ibre) neden kendin çizdin, Excel'de yoklar mı?**
C: Madde ve ibrenin Excel'de hazır türü yok; yığılmış çubuk, ikincil eksen, hata çubuğu gibi parçalarla kuruluyor. Dersin amacı ne zaman hangisinin kullanılacağı; o yüzden Kesit'te tür olarak çizdim, ders metninde Excel'deki kurulum adımlarını anlattım. Denetçi görüntüyü değil kararı denetliyor: beş bölge için ibre değil madde, sekiz neden için pasta değil Pareto.

**S: 3B başvurunun tuzağını nasıl öğretiyorsun?**
C: Ocak, Şubat, Mart sayfaları aynı düzende ama Mart'ta kategoriler farklı sırada. `=TOPLA(Ocak:Mart!B2:B8)` toplamı doğru verir (toplam sıradan bağımsız), ama `=TOPLA(Ocak:Mart!B2)` Elektronik'e Mart'ın Giyim'ini ekler. Alıştırmada kategori kategori toplam istenince bu yakalanıyor; doğru yol etikete göre (ETOPLA ya da Birleştir'de "Sol sütun"). Gizli denemede üç ay sayfası da karıştırılıyor, yani elle yazılan sayı da tutmuyor.

**S: `M2#` nasıl çalışıyor, motorda nereden biliyorsun taşan alanın boyutunu?**
C: Çapa hücre hesaplanırken dizi sonucu taşınca kitap çapanın adresine dizinin satır ve sütun sayısını yazıyor. `M2#` önce çapayı hesaplatıyor, sonra bu kayda bakıp aynı boyutta bir başvuru döndürüyor. Liste uzayınca kayıt da değiştiği için formül kendiliğinden büyüyor. Çapa taşmıyorsa Excel gibi #BAŞV! veriyorum.

**S: Harita grafiğini neden eklemedin?**
C: Excel'in harita grafiği coğrafi eşleştirme için Bing'e bağlanıyor; Kesit'in sözü verinin cihazdan çıkmaması. İl sınırlarını gömmek de yüzlerce KB veri demek. Öğretme değeri, yani "coğrafi dağılımı haritada göster", sıralı çubuk ya da bölge tablosuyla çoğu zaman daha doğru okunuyor; bunu bilinçli bir sınır olarak belgeledim.


**S: Sayfa koruması ile dosya şifreleme arasındaki fark ne?**
C: Sayfa koruması yanlışlıkla değişikliği önler, dosyayı şifrelemez; dosyayı açan herkes veriyi görür ve koruma basit araçlarla kalkar. Parolayla Şifrele dosyanın kendisini şifreler. Hassas veride ikincisini kullanır, parolayı ayrı kanaldan iletirim.

**S: Çözümleyici Araç Takımı'nın çıktısını neden tekrarlanan raporda kullanmazsın?**
C: Çıktı değerdir, formül değil; veri değişince güncellenmez. Aynı tabloyu ORTALAMA, ORTANCA, ÇARPIKLIK gibi formüllerle kurarım.

---

**S: Bir eğitim uygulamasında alıştırma çözümlerinin doğruluğunu nasıl sınadınız; "çözüm kendisiyle karşılaştırılır" sorununu nasıl aştınız?**
C: Testler her alıştırmanın çözümünün denetçiden geçtiğini sınıyor, ama çözüm ile öğrenci aynı yerden yanlış hesaplanırsa test yeşil kalır. Üç katman ekledim: (1) her çözüm hesaplatılıp ilk değerleri gözle incelendi, hep boş ya da hep aynı dönen kontrolleri yakaladım; (2) gizli varyant: sayıları değiştirilmiş kopyada da doğru olmalı; (3) indirilen Excel kitabında İngilizce çözümler LibreOffice'te hesaplatılıp motorun "beklenen" değeriyle karşılaştırıldı (248 aynı, farklar LibreOffice'e özgü). Bu süreçte iki gerçek hata çıktı: iki yönlü doldurulan tablolarda yalnız ilk sütun denetleniyordu, METNEÇEVİR "00000" kodunu uygulamıyordu.

**S: .xlsx dosyasını neden kütüphane kullanmadan yazdınız?**
C: Site dış kaynak yüklemiyor (CSP `default-src 'self'`) ve gereken alt küme küçük: metin, sayı, formül, birkaç stil, tablo, tanımlı ad. .xlsx bir zip içinde XML; zip başlıkları ve CRC32 yaklaşık 60 satır, sıkıştırmayı tarayıcının CompressionStream'i yapıyor. Böylece 100 KB'lık bir kütüphane yerine 150 satırlık, test edilen bir modül oldu. Sınırı: dinamik dizi formülünü dosyaya yazmıyoruz (meta veri ister), onu yönergeye çeviriyoruz.

**S: Eğitmen kurslarıyla karşılaştırmada neyi eksik buldunuz, neyi bilerek eklemediniz?**
C: İş yerinde ilk hafta konularını eksik bulduk: Özel Yapıştır, kasa defteri ve KDV, hücre biçimi, İK listesi, finansal tablo oranları, Excel 365 onay kutuları. Bunlar 9 ders olarak eklendi. Harita grafiği ile VBA olaylarını eklemedik, çünkü tarayıcıdaki motor bunları denetleyemiyor. Denetlenemeyen bir alıştırma vermek yerine konuyu sınırlar bölümüne yazdık.

**S: ARA(2;1/(koşul);sonuç) neden "son eşleşmeyi" verir?**
C: 1/(koşul) dizisi koşul doğruysa 1, yanlışsa #SAYI/0! olur. ARA hataları atlar. 2'yi bulamayınca 2'den küçük olan son değeri seçer, yani son 1'i. Sonuç da o satırdan gelir. Excel 365'te aynı iş ÇAPRAZARA(…;…;…;;;-1) ile daha okunur yapılır.

**S: Özet tabloda "% Değişen Toplam" Pareto tablosu verir mi?**
C: Verir, ama yalnız öğeler değere göre büyükten küçüğe sıralıysa. Birikim görünen sıraya göre yapılır. Motor da bu yüzden sıralamayı gösterimden önce uygular. Alfabetik sırada aynı sütun anlamsız bir birikim verir.

**S: İlk 10 filtresinden sonra Genel Toplam neyi gösterir, motor bunu nasıl yapıyor?**
C: Yalnız görünen öğelerin toplamını gösterir. Motor önce filtresiz tabloyu hesaplar, N öğeyi seçer (sınırda eşitlik varsa hepsini alır), sonra bu öğelerle süzülmüş tabloyu yeniden hesaplar. Toplamı ayrıca düzeltmeye gerek kalmaz.

## 11. Kendini test et

<details><summary>1. `kaydir('=C2*$D$1', 3, 0)` ne döner?</summary>`=C5*$D$1`: göreli C2 üç satır kayar, mutlak $D$1 kalmaz.</details>
<details><summary>2. Varyantta neden yalnız satır karıştırmak yetmez?</summary>Sayma ve toplama sırasız işlemlerdir; karıştırma cevabı değiştirmez. Değerler yeniden örneklenmeli, satır sayısı da değişmeli.</details>
<details><summary>3. `EĞER` neden "tembel" işlev?</summary>Seçilmeyen dal hiç hesaplanmamalı: `=EĞER(A1=0;0;1/A1)` A1=0 iken #SAYI/0! üretmemeli.</details>
<details><summary>4. `2,675`'i iki basamağa yuvarlarken `Math.round(x*100)/100` neden yanlış?</summary>2,675 ikili kayan noktada 2,67499… saklanır; 267,499… aşağı yuvarlanır. Kaydırma ondalık gösterimle yapılmalı.</details>
<details><summary>5. Pivot ile "Toplam" yerine "Say" ne zaman seçilir?</summary>Kimlik numaraları (Sipariş No) ve metin alanlarda; toplamları anlamsızdır.</details>
<details><summary>7. VBA'da `-2^2` kaç, Excel formülünde kaç?</summary>VBA'da -4 (üs önce), Excel formülünde 4 (tekli eksi önce).</details>
<details><summary>8. `RGB(255, 255, 0)` hangi tamsayı?</summary>65535: kırmızı + yeşil×256 + mavi×65536 = 255 + 65280.</details>
<details><summary>VSEÇTOPLA'nın ölçüt alanında "K" yazınca neden Kitap ve Kozmetik birlikte gelir?</summary>Veritabanı işlevleri ve Gelişmiş Filtre'de düz metin ölçütü "ile başlar" demektir. Tam eşleşme için hücreye ="=Kitap" yazılır.</details>
<details><summary>.xlsx'e yazılan formülde XLOOKUP neden `_xlfn.XLOOKUP` diye saklanır?</summary>Excel 2010 sonrası eklenen işlevler dosyada önekle saklanır; önek olmazsa Excel adı tanımaz ve #AD? gösterir. Kullanıcıya gösterilen İngilizce yazımda önek kaldırılır.</details>
<details><summary>9. Grafik neden telefonda minicik yazıyla çıkıyordu?</summary>Öğe sayfaya eklenmeden önce genişliği 0 okunuyordu; 700 px'e çizilip ölçeklendi. Genişlik ana alandan tahmin edildi.</details>
<details><summary>10. SVG'de çift `class` özniteliği neden bütün grafiği bozar?</summary>SVG XML olarak ayrıştırılıyor; XML'de çift öznitelik ayrıştırma hatasıdır, tarayıcı grafik yerine hata belgesi döndürür.</details>
<details><summary>11. `[@Adet]` hangi hücreyi gösterir?</summary>Formülün yazıldığı satırdaki Adet hücresini (aynı satır, tek hücre).</details>
<details><summary>12. `#.##0,` biçim kodu 2.500.000'u nasıl gösterir, TOPLA ne toplar?</summary>`2.500` gösterir (sondaki ayırıcı 1000'e böler); TOPLA yine 2.500.000 toplar: biçim değeri değiştirmez.</details>
<details><summary>13. 1.800.000 kredi taksiti `=DEVRESEL_ÖDEME(36%/12;24;1800000)` neden eksi çıkar?</summary>İşaret kuralı: kredi kasaya giren para (artı), taksit çıkan para (eksi). Artı görmek için tutar eksi verilir.</details>
<details><summary>14. `=NBD(r;B6:G6)` yatırım analizinde neden yanlış?</summary>NBD ilk değeri de bir dönem iskonto eder; 0. yıl yatırımı NBD'nin dışında eklenmeli: `=NBD(r;C6:G6)+B6`.</details>
<details><summary>15. Çözücü LP 22,33 verdi; tamsayı kısıtıyla neden 22 değil 23?</summary>22 kişiyle bazı günlerin talebi karşılanmaz (olurlu değil); yuvarlama aşağı değil, dal-sınırla en iyi olurlu tamsayıdır.</details>
<details><summary>16. Açılan kutu (form denetimi) bağlı hücreye ne yazar?</summary>Seçilen öğenin sıra numarasını; metne `=İNDİS(liste;H1)` ile çevrilir.</details>
<details><summary>17. `=LAMBDA(x;x*2)` hücrede ne gösterir, neden?</summary>#HESAP!: LAMBDA bir işlev üretir, çağrılmadı. `=LAMBDA(x;x*2)(5)` 10 verir.</details>
<details><summary>18. SCAN ile REDUCE farkı?</summary>İkisi de biriktirir; SCAN her adımı taşırır (birikimli toplam), REDUCE yalnız son değeri verir.</details>
<details><summary>19. Gelişmiş Filtre'de ölçüt hücresine `Ank` yazdınız. Ankara'yı getirir mi?</summary>Evet: düz metin "ile başlar" demektir. Tam eşleşme için ="=Ankara" yazılır.</details>
<details><summary>20. Pareto grafiğinde soluk sütunlar ne anlatır?</summary>Birikimli payın %80'i geçtiği yerden sonraki nedenler: önceliği düşük olanlar.</details>
<details><summary>21. Gantt'ı yığılmış çubukla kurarken ilk seri neden görünmez yapılır?</summary>İlk seri başlangıç tarihidir; görevin "nerede başladığını" kaydırmak için vardır, çizilecek uzunluk süredir.</details>
<details><summary>22. `=LAMBDA(a;[b];…)(5)` çağrısında b nedir, nasıl anlaşılır?</summary>Verilmemiştir; değeri boştur ve ISOMITTED(b) DOĞRU döner.</details>
<details><summary>23. M2'de tek bir sayı varken `=TOPLA(M2#)` ne verir?</summary>#BAŞV!: # yalnız taşan bir çapaya uygulanır.</details>
<details><summary>24. Birleştir'de etiket kutuları işaretlenmezse sıra farklı sayfalarda ne olur?</summary>Konuma göre toplar: farklı kategoriler üst üste eklenir, hata vermez.</details>
<details><summary>25. Hücreye "42 kg" yazmak yerine ne yapılır, neden?</summary>42 yazılır, biçim kodu #.##0 "kg" verilir; metin olan "42 kg" TOPLA'ya girmez.</details>
<details><summary>26. ÇARPIKLIK pozitif çıkan fiyatlarda hangi ortalama raporlanmalı?</summary>Ortanca ya da kırpılmış ortalama (TRIMMEAN); birkaç pahalı ürün ortalamayı yukarı çeker.</details>
<details><summary>27. KÖPRÜ hedefinde # neden gerekli?</summary># aynı kitabın içini gösterir; olmazsa Excel hedefi dosya adı sanar.</details>
<details><summary>6. CSP `style-src 'self'` iken kenar çizgisi nasıl renkleniyor?</summary>CSSOM ile (`td.style.boxShadow = …`); CSP satır içi `style` özniteliğini engeller, CSSOM'u engellemez.</details>

---

- 2B doldurmalı bir alıştırmada (ör. 16.8 trend analizi) yalnız ilk sütunu denetlemek hangi yanlışı kaçırır? <details><summary>Cevap</summary>`$B2` yerine `B2` yazılmasını kaçırır. İlk sütunda iki yazım da aynı sonucu verir, sağa doldurunca ayrılırlar. `ikiYon` bu yüzden eklendi.</details>

## 12. Elle yapılacak alıştırma ve 5 dakikalık demo

**Alıştırma (30 dk):** motora kendi elinle yeni bir işlev ekle: `KAREKÖKPİ` (İngilizcesi SQRTPI, √(x·π)). Dört dosyaya dokunacaksın; her birinin rolünü bu sırada görürsün.
1. `docs/motor/islevler.js`: `tanim('SQRTPI', yay(([x]) => { const n = N(x); return hataMi(n) ? n : n < 0 ? H.SAYI : Math.sqrt(n * Math.PI); }));`
2. `docs/motor/formul.js` → `TR_EN`: `'KAREKÖKPİ': 'SQRTPI'`.
3. `docs/icerik/islev-bilgi.js`: bir satır (örnek `=KAREKÖKPİ(2)`).
4. `tests/vakalar.json` → `lo`: `"=SQRTPI(2)"`.
5. `npm test` ve `python3 tools/lo_karsilastir.py`: 178/178 olmalı. İşlev rehberinde görünmeli.

**Alıştırma 2 (20 dk, makro):** Makro atölyesine yeni bir örnek ekle: `ORNEK_MAKROLAR` (`docs/js/sayfalar.js`) içine "Boş hücreleri say" makrosu. A sütunundan son satırı bul, Şehir (D) sütununda boş olanları say, MsgBox ile göster. Sonra `.bas` indirip gerçek Excel'de aynı sayıyı aldığını gör (Satışlar'da boş şehir var). İpucu: `If IsEmpty(Cells(r, 4).Value) Then`; `IsEmpty` yoksa `Cells(r, 4).Value = ""`.

**Alıştırma 3 (15 dk, grafik):** `docs/icerik/dersler-4.js`'teki Ders 13.6'ya dördüncü bir "kötü grafik" ekle: 180 noktalı çizgi grafik ve her noktada veri etiketi (`veriEtiketi: true`, kural `veriEtiketiYok`). `npm test` başlangıç ayarının geçmediğini doğrulamalı.

**Alıştırma 4 (20 dk, finans):** `islevler.js`'e `ÇİFTAZALANBAKİYE`'nin kardeşi `VDB`'yi değil, daha kolayı `SYD`'yi (YILLIK_TOPLAM, yıl sayısı toplamı amortismanı: (maliyet−hurda)·(ömür−dönem+1)·2/(ömür·(ömür+1))) ekle; `TR_EN`'e `'YAT': 'SYD'`, `tests/vakalar.json`'a `"=SYD(30000;7500;10;1)"` (4090,91). LibreOffice karşılaştırması 220/220 olmalı.

**Alıştırma 5 (20 dk, LAMBDA):** *0.5.0'da yapıldı; kendi başınıza baştan yazmak için `formul.js` → `lambdaCagir` ve `islevler.js` → `ISOMITTED`'i silip yeniden kurun.* `ISOMITTED` ekleyin: LAMBDA'nın son parametresi verilmezse `lambdaCagir()` onu "atlanmış" işaretli bir değerle doldursun, `ISOMITTED(x)` DOĞRU döndürsün. İpucu: şu an parametre sayısı tutmazsa `#DEĞER!` dönüyor (`formul.js` → `lambdaCagir`); bunu "eksikse doldur, fazlaysa hata" yapın. Test: `=LAMBDA(a;[b];EĞER(ISOMITTED(b);a;a*b))(5)` → 5. (Excel'de isteğe bağlı parametre köşeli parantezle yazılır; ayrıştırıcıya bu da eklenmeli.)

**5 dakikalık demo akışı**
1. Ana sayfa (20 sn): "Türkçe Excel, Kesit verisi, cevap gizli bir kopyada da denetleniyor."
2. Ders 4.3 (90 sn): `=ÇOKET` yaz, öneri; hücreye tıklayarak aralık; söz dizimi vurgusu; Denetle.
3. Aynı derste sonucu elle yaz (`=31`), Denetle → "gizli denemede tutmadı" (40 sn).
4. Ders 1.3 (40 sn): `$` unutulmuş formül, aşağı doldur, #SAYI/0! ve ipucu.
5. Özet tablo (40 sn): Şehir × Adet, hücreye tıkla → eşdeğer ÇOKETOPLA.
6. Power Query (40 sn): Bayi raporu, üç adım, M kodu.
7. MCP (30 sn): Claude'a "bu formülü İngilizceye çevir" ve "şu formülüm doğru mu".
8. Görselleştirme (40 sn): Ders 13.6'da kesik eksenli sütun grafik, kutuyu boşalt; panoda Kanal dilimleyicisi, KPI'lar birlikte değişir.
9. Makro (40 sn): kaydediciyi başlat, formül yaz, aşağı doldur; koddaki `L2:L241`'i göster, Ders 14.2'de sabit 241'in gizli kopyada yakalandığını göster.
10. Çözücü (40 sn): Ders 16.7 vardiya; tamsayısız çöz (22,33), tamsayı ekle (23); "Excel'in Simplex LP'si, dal-sınırla".

---

## 13. Değişiklik günlüğü

- **2026-11-27 · 0.1.0** İlk sürüm. Motor (131 işlev, LibreOffice 177/177), 48 ders, 99 alıştırma, pivot ve Power Query atölyeleri, MCP (5 araç). Güvenlik taraması temiz, ölçüm yok (`soz`). Kullanıcı gözüyle inceleme: hedef hücreye kaydırma, mobil ders listesi, formül çubuğu, klavye erişimi, kenar çizgileri, arife metni, iki alıştırma. Bulunan ve düzeltilen hatalar: üs birleşmesi (sağdan → soldan), `0,9` yazım tespiti, `ifade` gölgelenmesi, `append` dizileri, `[hidden]` ezilmesi, varyantın sayma sorularındaki açığı, boş şehir.
- **2026-11-27 · 0.2.0** Görselleştirme ve makro: Modül 13 (7 ders: grafik seçimi, 15 tür, pivot grafik ve dilimleyici, koşullu biçim, veri çubuğu/renk ölçeği/simge/mini grafik, kötü grafiği düzeltme, pano vakası) ve Modül 14 (6 ders: kaydedici, Range ve son satır, If/Select Case, biçim, Function ve WorksheetFunction, Office Scripts ve güvenlik). Yeni motorlar `grafik.js`, `kosullu.js`, `vba.js`; atölyeler Görselleştirme (4 sekme) ve Makro; MCP `grafik_ciz`, `makro_calistir`. Makro varyantı uzayan kopya. Veri kitabı `docs/indir/kesit-excel-veri.xlsx`. 61 ders, 124 alıştırma, 79 test, LibreOffice 177/177, tarama temiz.
- **2026-11-27 · 0.2.0 (inceleme)** Muadil müfredatlarla karşılaştırma (§9) ve kullanıcı gözüyle ikinci tur (§8): telefonda pano KPI'ları ve makro Çalıştır düğmesi ilk ekranda, atölyeler arası geçiş satırı, menü iki gruba ayrıldı, dilimleyici davranışı tekleştirildi, sekmelerde ok tuşları.
- **2026-11-27 · 0.3.0** Kitap tasarımı, senaryo ve finans, ileri pano: Modül 15 (7 ders), 16 (7), 17 (6). Motor: yapılandırılmış başvuru, adlar, DOLAYLI/KAYDIR/ADRES/ÖZETVERİAL, 16 finans işlevi (151 işlev), `bicim.js`, `dogrulama.js`, `senaryo.js` (Hedef Ara, Veri Tablosu, Senaryo, Çözücü), hesaplanmış alan, ayrıntıya inme. Model sayfaları (`modeller.js`). MCP `durum_cozumle`. 81 ders, 170 alıştırma, 17 soruluk seviye testi, 108 test, LibreOffice 219/219, tarama temiz. Bulunan hatalar: TU matrisli Çözücü vakası (LP zaten tamsayı), Fiyat sayfasında satır kayması, FAİZ_ORANI çözümsüzde Excel–LO farkı, rehberde `%36` yazımı.
- **2026-11-27 · 0.4.0** İleri Excel ve pano kurslarıyla ikinci karşılaştırma (§9): Modül 18 (modern formüller, 7 ders), 19 (veri araçları, 5), 20 (pano tasarımı ve özel grafikler, 7). Motor: LAMBDA (çağrı, ad, eta, kapanış), MAP/BYROW/BYCOL/SCAN/REDUCE/MAKEARRAY, GRUPLAÖLÇÜT/ÖZETÖLÇÜT, SÜTUNA/SATIRA/SATIRSAR/SÜTUNSAR/GENİŞLET, rastgele işlevler, regresyon ve tahmin, SIKLIK, TOPLAMA, YOKSAY (179 işlev), 3B başvuru, Gelişmiş Filtre (`veriaraclari.js`), 8 grafik türü + vurgu + hedef çizgisi, iki düzeyli kategori. Model sayfaları: İadeler, Ocak/Şubat/Mart/Çeyrek, Görevler, Bölgeler, Vardiyalar, Talep. MCP: Gelişmiş Filtre denetimi, vurgu/hedef çizgisi, Gantt için tarih serisi. 100 ders, 218 alıştırma, 20 soruluk seviye testi, 136 test, LibreOffice 255/255. Bulunan hatalar: adlandırılmış LAMBDA'da `null`/`undefined` karışması (#AD?), %100+ halkanın boş çizilmesi, ibrenin alttan taşması, `=İstanbul` ölçütünün formül sanılması (Excel'de de öyle; ders ve test `="=İstanbul"`a çevrildi), filtre iletisinin YA DA eksikliğini "ile başlar"a bağlaması, boş durumda "Denetim  iken" ön eki.
- **2026-11-27 · 0.5.0** Eksiklerin tamamlanması: Ders 18.8 (mevsim endeksi), 18.9 (düzenli ifadeler), 18.10 (M2#, TRIMRANGE, PERCENTOF), 20.8 (Zaman Çizelgesi); 18.1'e isteğe bağlı parametreli LAMBDA, 19.3'e Birleştir alıştırması; 15.6'ya Gözcü Penceresi. Motor: `#` taşma başvurusu, ISOMITTED, REGEXTEST/NORMİFADEAYIKLA/NORMİFADEDEĞİŞTİR, PERCENTOF, TRIMRANGE (185 işlev), Birleştir. 104 ders, 231 alıştırma, 145 test. Bulunan hatalar: isteğe bağlı parametrenin tref `ozel: 'veri'` alanı yüzünden tanınmaması, Ürün ham sayfasında başlık satırının unutulması (alıştırma 1. satırdan başlıyordu), Zaman Çizelgesi'nin telefonda kabı genişletmesi.
- **2026-11-27 · 0.6.0** Türkçe kurslarla üçüncü karşılaştırma (§9.x): Modül 21 Ofis pratikleri, güvenlik ve paylaşım (7 ders: gezinme ve Git > Özel, renge göre filtre, KÖPRÜ ve içindekiler, not ve birimli biçim, tanımlayıcı istatistik ve Araç Takımı, şifreleme ve Belge Denetçisi, yazdırma ve PowerPoint). Motor: HYPERLINK, FORMULATEXT, SKEW, KURT, TRIMMEAN (190 işlev). 111 ders, 250 alıştırma, 21 soruluk seviye testi, 152 test, LibreOffice 266/266. Bulunan hata: FORMÜLMETNİ rehber örneğinin boş hücrede #YOK vermesi.
- **2026-11-27 · 0.6.1** Genel kullanıcı gözüyle üçüncü tur (§8.x): Dersler sayfasında arama, seviye süzgeci ve katlanır modüller (telefonda 16.381 → 4.392 px), Sık hatalar ve mülakatta arama, üst "Ara" düğmesi ders de buluyor, seviye testi başlık hatası, telefonda sol kenar gölgesi, masaüstü kahraman şeridi, ana sayfa seviye kartları.
- **2026-11-27 · 0.6.2** Veri kitabı derslerle eşitlendi (§5.19): 17 model sayfası, başlıklı sayfalar Excel Tablosu, model formülleri İngilizce yazımla; LibreOffice'te 14 deneme formülü ve 35 model hücresi Kesit'le aynı. Veri sayfasında kitap indirme kartı; model sayfalarında "undefined" kaynak ve boş açıklama düzeltildi. Rehberde "Bilinen sınırlar" güncellendi.
- **2026-11-27 · 0.6.3** Gerçek Excel'de örneklem (§7.x, İngilizce menülü, Türkçe bölgeli Office LTSC): 27 konu: 20'si aynı, 6'sında ders metni ya da motor düzeltildi, 1'i bu Excel sürümünde sınanamadı. Düzeltilenler: dizi sabitinde `\` sütun ayırıcı ve virgüllü ondalık (motor), `#.##0.` ölçekleme ders metni, `{"Web";"Mobil"}` örneği ve ayırıcı açıklaması, FormulaLocal makro yorumu, biçim dersine "hangi dil?" notu ([Red], gg.aa), Çözücü dersine %1 tamsayı toleransı ve birden çok en iyi çözüm notu.
- **2026-11-27 · 0.6.4** Türkçe menülü Excel'de örneklem (§7.y, Office dil paketiyle): 191 işlev adı Excel'e sorduruldu. Düzeltilenler: `Pİ`, `RANK` (SIRA değil), `KIRPORTALAMA` (TRIMMEAN), Excel'de olmayan 5 takma ad kaldırıldı, `#SAYI/0!` (önce #BÖL/0!), renk `[Pembe]`, özet tablo başlıkları ("Toplam Adet", "Mak …"). `npm test` artık tüm test dosyalarını çalıştırıyor (155 test).
- **2026-11-27 · depo** `ysfdurak/kesit-excel` açıldı, `main` gönderildi, Test iş akışı yeşil. ysfdurak.com PR #88 (yalnız kesit-excel: güvenlik taraması + ölçüm kararı `soz`); PR #84 diğer dört projeye indirildi. Aynı gün kullanıcının GitHub oturumuyla tarayıcıdan: Pages (main, kök) açıldı; `main` dal koruması (PR zorunlu, onay gerekmez, `test` denetimi zorunlu), birleşince dal silme, depo açıklaması ve web sitesi. Canlı örneklem: yönlendirme çalışıyor, CSP var, dış kaynak yok, konsol temiz, veri kitabı 200 (87.774 bayt), son sürüm (ATLANMIŞ) yayında.
- **2026-11-27 · 0.6.5** Türkçe web Excel'de 365 işlevleri (§7.z): NORMİFADESINA (REGEXTEST), DİZİOLUŞTUR (MAKEARRAY), KIRPARALIĞI (TRIMRANGE) düzeltildi; 27 ad doğrulandı; dizi sabiti ayırıcılarının masaüstü ile web Excel'de tersine olduğu ders metnine yazıldı. Aynı gün: ATLANMIŞ (ISOMITTED) bulundu, GRUPLAÖLÇÜT Toplam satırı doğrulandı, NORMİFADEAYIKLA mod 1 yan yana taşıyacak şekilde düzeltildi (0.6.6; elle vaka ROWS → COLUMNS, LibreOffice 266/266).
- **2026-11-27 · 0.7.0** İçerik güçlendirme (§5.20): 41 yeni ders (Modül 1–9'a 4'er, yeni Modül 22 Veritabanı işlevleri 5 ders), var olan derslere 78 alıştırma; toplam 152 ders, 492 alıştırma. Motor: VSEÇTOPLA ailesi (12 işlev), METNEÇEVİR sıfır doldurma ve Türkçe binlik düzeltmesi, denetçide iki yönlü doldurma (`ikiYon`). Her dersin altında Excel kitabı ve tek alıştırma kitabı (tarayıcıda üretilir). Veri kitabında başlıklı ham sayfaların kayması düzeltildi. Testler 203, LibreOffice 284/284.
- **2026-11-27 · 0.8.0** Eğitmen müfredatlarıyla dördüncü karşılaştırma (§9.y, §5.21): 9 yeni ders (1.9, 1.10, 2.9, 8.9, 8.10, 12.5, 16.8, 21.8, 21.9), Kasa ve Gelir Tablosu model sayfaları, 39 derse ek alıştırma (`ek-alistirmalar-2.js`); her derste en az 3 alıştırma; toplam 161 ders, 577 alıştırma. Motor: TRANSPOSE, LOOKUP, BÜYÜK/KÜÇÜK dizi k, metinli özel biçim (telefon), denetçide `ikiYon` (204 işlev). Testler 213, LibreOffice 291/291, güvenlik taraması temiz. Bulunan hatalar: Kasa bakiyesinin devirsiz eksiye düşmesi, 2B doldurmada yalnız ilk sütunun denetlenmesi, ÇAPRAZEŞLEŞTİR alıştırmasında elle yazılan sabitin yakalanmaması (varyantsız yapıldı).
- **2026-11-27 · 0.9.0** Bilengo, Momentum Plus ve eğitmen siteleriyle beşinci karşılaştırma (§9.z, §5.22): 6 yeni ders (10.5–10.8, 20.9, 21.10); pivot motoruna fark, % fark, değişen toplam, % değişen toplam, sıra, değere göre sıralama ve İlk N; grafik motoruna waffle, iki uç vurgu (çizgi dahil) ve renk eşiği. Toplam 167 ders, 607 alıştırma. Bulunan hata: ders kitaplarında NUMBERVALUE, WORKDAY.INTL, NETWORKDAYS.INTL, FORMULATEXT `_xlfn.` öneksiz yazılıyordu. Testler 221, LibreOffice 291/291, güvenlik taraması temiz.
