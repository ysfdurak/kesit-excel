# Kesit Excel · Proje rehberi

> Yaşayan belge. Kod değiştikçe aynı commit'te güncellenir. Amaç: kodu kim yazmış olursa olsun projeyi baştan sona anlatabilmek, mülakatta savunabilmek ve güvenle değiştirebilmek.
> Ortak altyapı (GitHub, Pages, güvenlik temeli, lisans) için: `ysfdurak.com` deposundaki `docs/GUVENLIK_TEMELI.md` ve altyapı el kitabı.

---

## 1. Bir bakışta

| | |
|---|---|
| **Ne** | Tarayıcıda çalışan Türkçe Excel eğitimi: kendi formül motoru, 48 ders, 99 denetlenen alıştırma, özet tablo ve Power Query atölyesi, yerel MCP sunucusu |
| **Kimin için** | Excel'i işte kullanacak herkes; özellikle veri analisti, BI, operasyon/planlama, finans, BT iş analisti ve ofis rolleri. Kesit ailesinin (SQL, Power BI, Python, İstatistik) beşinci üyesi |
| **Canlı** | https://ysfdurak.github.io/kesit-excel/ (depo açılıp Pages etkinleşince) |
| **Depo** | `ysfdurak/kesit-excel` |
| **Durum** | 0.1.0 · yerelde tamam, testler yeşil, güvenlik taraması temiz; depo açılmayı bekliyor |
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
| Dersler | Her örnek hatasız; her çözüm denetçiden geçer; tek hücreli sayısal alıştırmada sabit cevap **gizli denemede** yakalanır; hedefin ilk satırı boş bir kaynağa bakmaz | 49 test, 99 alıştırma |
| MCP | 5 araç, TR/EN aynı sonuç, taşma, CSV izinli klasör, dış yol reddi, sabit cevabın gizli denemede yakalanması | 1 test, 30+ doğrulama |
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

- **Yok:** `M2#` taşma başvurusu, adlandırılmış aralık, Tablo başvurusu, DOLAYLI/KAYDIR, finans/mühendislik işlevleri, grafik, koşullu biçimin görseli, VBA, Power Pivot/DAX.
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

## 11. Kendini test et

<details><summary>1. `kaydir('=C2*$D$1', 3, 0)` ne döner?</summary>`=C5*$D$1`: göreli C2 üç satır kayar, mutlak $D$1 kalmaz.</details>
<details><summary>2. Varyantta neden yalnız satır karıştırmak yetmez?</summary>Sayma ve toplama sırasız işlemlerdir; karıştırma cevabı değiştirmez. Değerler yeniden örneklenmeli, satır sayısı da değişmeli.</details>
<details><summary>3. `EĞER` neden "tembel" işlev?</summary>Seçilmeyen dal hiç hesaplanmamalı: `=EĞER(A1=0;0;1/A1)` A1=0 iken #BÖL/0! üretmemeli.</details>
<details><summary>4. `2,675`'i iki basamağa yuvarlarken `Math.round(x*100)/100` neden yanlış?</summary>2,675 ikili kayan noktada 2,67499… saklanır; 267,499… aşağı yuvarlanır. Kaydırma ondalık gösterimle yapılmalı.</details>
<details><summary>5. Pivot ile "Toplam" yerine "Say" ne zaman seçilir?</summary>Kimlik numaraları (Sipariş No) ve metin alanlarda; toplamları anlamsızdır.</details>
<details><summary>6. CSP `style-src 'self'` iken kenar çizgisi nasıl renkleniyor?</summary>CSSOM ile (`td.style.boxShadow = …`); CSP satır içi `style` özniteliğini engeller, CSSOM'u engellemez.</details>

---

## 12. Elle yapılacak alıştırma ve 5 dakikalık demo

**Alıştırma (30 dk):** motora kendi elinle yeni bir işlev ekle: `KAREKÖKPİ` (İngilizcesi SQRTPI, √(x·π)). Dört dosyaya dokunacaksın; her birinin rolünü bu sırada görürsün.
1. `docs/motor/islevler.js`: `tanim('SQRTPI', yay(([x]) => { const n = N(x); return hataMi(n) ? n : n < 0 ? H.SAYI : Math.sqrt(n * Math.PI); }));`
2. `docs/motor/formul.js` → `TR_EN`: `'KAREKÖKPİ': 'SQRTPI'`.
3. `docs/icerik/islev-bilgi.js`: bir satır (örnek `=KAREKÖKPİ(2)`).
4. `tests/vakalar.json` → `lo`: `"=SQRTPI(2)"`.
5. `npm test` ve `python3 tools/lo_karsilastir.py`: 178/178 olmalı. İşlev rehberinde görünmeli.

**5 dakikalık demo akışı**
1. Ana sayfa (20 sn): "Türkçe Excel, Kesit verisi, cevap gizli bir kopyada da denetleniyor."
2. Ders 4.3 (90 sn): `=ÇOKET` yaz, öneri; hücreye tıklayarak aralık; söz dizimi vurgusu; Denetle.
3. Aynı derste sonucu elle yaz (`=31`), Denetle → "gizli denemede tutmadı" (40 sn).
4. Ders 1.3 (40 sn): `$` unutulmuş formül, aşağı doldur, #BÖL/0! ve ipucu.
5. Özet tablo (40 sn): Şehir × Adet, hücreye tıkla → eşdeğer ÇOKETOPLA.
6. Power Query (40 sn): Bayi raporu, üç adım, M kodu.
7. MCP (30 sn): Claude'a "bu formülü İngilizceye çevir" ve "şu formülüm doğru mu".

---

## 13. Değişiklik günlüğü

- **2026-11-27 · 0.1.0** İlk sürüm. Motor (131 işlev, LibreOffice 177/177), 48 ders, 99 alıştırma, pivot ve Power Query atölyeleri, MCP (5 araç). Güvenlik taraması temiz, ölçüm yok (`soz`). Kullanıcı gözüyle inceleme: hedef hücreye kaydırma, mobil ders listesi, formül çubuğu, klavye erişimi, kenar çizgileri, arife metni, iki alıştırma. Bulunan ve düzeltilen hatalar: üs birleşmesi (sağdan → soldan), `0,9` yazım tespiti, `ifade` gölgelenmesi, `append` dizileri, `[hidden]` ezilmesi, varyantın sayma sorularındaki açığı, boş şehir.
