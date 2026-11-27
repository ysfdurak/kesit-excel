"""Kesit ortak veri setlerinden (kesit-python/data) Excel derslerinin sayfalarını üretir.

Kullanım: python3 tools/veri_hazirla.py <kesit-python/data klasörü>
Çıktı: docs/icerik/veri.js (tarihler Excel seri sayısı olarak; 1900 sistemi).
Seçim sabit tohumla yapılır, her çalıştırmada aynı satırlar gelir.
"""
import csv, json, random, sys, pathlib, datetime as dt

KAYNAK = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/rp/kesit-python/data")
CIKTI = pathlib.Path(__file__).resolve().parent.parent / "docs/icerik/veri.js"
EPOK = dt.date(1899, 12, 30)
rnd = random.Random(2025)

def oku(yol): return list(csv.DictReader(open(KAYNAK / yol, encoding="utf-8")))
def seri(s):
    if not s: return None
    if " " in s:
        d = dt.datetime.fromisoformat(s); return round((d - dt.datetime(1899, 12, 30)).total_seconds() / 86400, 6)
    return (dt.date.fromisoformat(s) - EPOK).days
def sayi(s): f = float(s); return int(f) if f == int(f) else f

T = {}

# 1) Anadolu Market satış satırları: 2024 ilk yarı, 240 satır
urun = {u["product_id"]: u for u in oku("anadolu_market/products.csv")}
mus = {m["customer_id"]: m for m in oku("anadolu_market/customers.csv")}
sip = {s["order_id"]: s for s in oku("anadolu_market/orders.csv")}
DURUM = {"shipped": "Gönderildi", "delivered": "Teslim edildi", "cancelled": "İptal", "returned": "İade", "pending": "Bekliyor", "processing": "Hazırlanıyor"}
KANAL = {"web": "Web", "mobile": "Mobil", "app": "Mobil", "store": "Mağaza", "phone": "Telefon"}
kal = [k for k in oku("anadolu_market/order_items.csv") if sip[k["order_id"]]["order_date"].startswith("2024-0") and int(sip[k["order_id"]]["order_date"][5:7]) <= 6]
kal = sorted(rnd.sample(kal, min(240, len(kal))), key=lambda k: (sip[k["order_id"]]["order_date"], int(k["item_id"])))
T["satislar"] = {
  "ad": "Satışlar", "kaynak": "Anadolu Market", "aciklama": "2024 ilk yarı sipariş kalemleri (240 satır). Her satır bir siparişteki bir ürün.",
  "basliklar": ["Sipariş No", "Tarih", "Müşteri", "Şehir", "Kanal", "Kategori", "Ürün", "Adet", "Birim Fiyat", "İndirim", "Durum"],
  "bicim": [None, "gg.aa.yyyy", None, None, None, None, None, None, "#.##0,00", "0%", None],
  "satirlar": [[int(k["order_id"]), seri(sip[k["order_id"]]["order_date"]), mus[sip[k["order_id"]]["customer_id"]]["first_name"] + " " + mus[sip[k["order_id"]]["customer_id"]]["last_name"],
               mus[sip[k["order_id"]]["customer_id"]]["city"], KANAL.get(sip[k["order_id"]]["channel"], sip[k["order_id"]]["channel"]), urun[k["product_id"]]["category"], urun[k["product_id"]]["name"],
               int(k["quantity"]), sayi(k["unit_price"]), sayi(k["discount"]), DURUM.get(sip[k["order_id"]]["status"], sip[k["order_id"]]["status"])] for k in kal]}

T["urunler"] = {
  "ad": "Ürünler", "kaynak": "Anadolu Market", "aciklama": "Ürün kataloğu (40 ürün): satış fiyatı, maliyet ve stok.",
  "basliklar": ["Ürün No", "Ürün", "Kategori", "Fiyat", "Maliyet", "Stok"], "bicim": [None, None, None, "#.##0,00", "#.##0,00", None],
  "satirlar": [[int(u["product_id"]), u["name"], u["category"], sayi(u["price"]), sayi(u["cost"]), int(u["stock"])] for u in urun.values()]}

# 2) Pusula İK: 160 çalışan, izinlerden 200 kayıt
per = oku("pusula_ik/ik_employees.csv")
per = sorted(rnd.sample(per, 160), key=lambda p: int(p["emp_id"]))
CIKIS = {"gönüllü": "Gönüllü", "gonullu": "Gönüllü", "zorunlu": "Zorunlu"}
T["personel"] = {
  "ad": "Personel", "kaynak": "Pusula İK", "aciklama": "160 çalışan: işe giriş, varsa çıkış tarihi, eğitim, çalışma şekli.",
  "basliklar": ["Sicil", "Ad Soyad", "Cinsiyet", "Doğum Yılı", "Şehir", "Eğitim", "İşe Giriş", "Çıkış", "Çıkış Türü", "Çalışma Şekli", "Kaynak"],
  "bicim": [None, None, None, None, None, None, "gg.aa.yyyy", "gg.aa.yyyy", None, None, None],
  "satirlar": [[int(p["emp_id"]), p["full_name"], p["gender"], int(p["birth_year"]), p["city"], p["education"], seri(p["hire_date"]), seri(p["term_date"]),
               p["term_type"] or None, p["work_mode"], p["hire_source"]] for p in per]}
sicil = {p["emp_id"] for p in per}
izin = [i for i in oku("pusula_ik/ik_leaves.csv") if i["emp_id"] in sicil and i["start_date"].startswith("2024")]
izin = sorted(rnd.sample(izin, min(200, len(izin))), key=lambda i: (i["start_date"], int(i["leave_id"])))
T["izinler"] = {
  "ad": "İzinler", "kaynak": "Pusula İK", "aciklama": "2024 izin kayıtları (200 satır): başlangıç tarihi ve iş günü cinsinden süre.",
  "basliklar": ["İzin No", "Sicil", "İzin Türü", "Başlangıç", "Gün"], "bicim": [None, None, None, "gg.aa.yyyy", None],
  "satirlar": [[int(i["leave_id"]), int(i["emp_id"]), i["leave_type"], seri(i["start_date"]), int(i["days"])] for i in izin]}

# 3) Lezzet Kurye: 180 sipariş, saatli
res = {r["restaurant_id"]: r for r in oku("lezzet_kurye/lk_restaurants.csv")}
kur = {k["courier_id"]: k for k in oku("lezzet_kurye/lk_couriers.csv")}
ls = [o for o in oku("lezzet_kurye/lk_orders.csv") if o["placed_at"].startswith("2024-10")]
ls = sorted(rnd.sample(ls, 180), key=lambda o: o["placed_at"])
T["teslimat"] = {
  "ad": "Teslimat", "kaynak": "Lezzet Kurye", "aciklama": "Ekim 2024'ten 180 sipariş: verildiği, alındığı ve teslim edildiği an.",
  "basliklar": ["Sipariş", "Restoran", "Mutfak", "Kurye", "Araç", "Sipariş Anı", "Alınma", "Teslim", "Durum", "Ödeme", "Teslimat Ücreti", "Bahşiş"],
  "bicim": [None, None, None, None, None, "gg.aa.yyyy ss:dd", "ss:dd", "ss:dd", None, None, "#.##0,00", "#.##0,00"],
  "satirlar": [[int(o["order_id"]), res[o["restaurant_id"]]["name"], res[o["restaurant_id"]]["cuisine"], kur[o["courier_id"]]["full_name"] if o["courier_id"] else None,
               kur[o["courier_id"]]["vehicle"] if o["courier_id"] else None, seri(o["placed_at"]), seri(o["picked_at"]), seri(o["delivered_at"]),
               o["status"], o["payment"], sayi(o["delivery_fee"]), sayi(o["tip"])] for o in ls]}

# 4) Kirli veri: olduğu gibi (temizleme dersleri için)
def ham(yol, ad, aciklama, metin=False):
    # metin=True: dosya metin olarak içe alınmış gibi; her hücre yazıldığı gibi durur (temizlik derslerinin konusu)
    r = list(csv.reader(open(KAYNAK / yol, encoding="utf-8")))
    if r[0][0] == "Column1": r = r[1:]; basliklar = None
    else: basliklar, r = r[0], r[1:]
    def h(x):
        if x == "": return None
        if metin: return x
        x2 = x.strip()
        try: return sayi(x2)
        except ValueError: return x
    return {"ad": ad, "kaynak": "Kesit kirli veri", "aciklama": aciklama, "basliklar": basliklar, "satirlar": [[h(x) for x in s] for s in r], "ham": True}
T["bayi"] = ham("kirli_veri/bayi.csv", "Bayi raporu", "Bayilerden gelen rapor: üstte başlık satırı, metin olarak gelen tutar ve tarihler, boş ve yinelenen satır.", metin=True)
T["musteri_ham"] = ham("kirli_veri/musteri.csv", "Müşteri (ham)", "Karışık büyük-küçük harf, yinelenen kayıt, boş e-posta, geçersiz tarih (30 Şubat).", metin=True)
T["urun_ham"] = ham("kirli_veri/urun.csv", "Ürün (ham)", "Kod ve ad aynı hücrede, kategori yalnız grubun ilk satırında.")
T["hedef"] = ham("kirli_veri/hedef.csv", "Hedef", "Kategori × ay satış hedefleri (geniş biçim).")

# 5) Bütçe: 2024 ilk yarı gerçekleşen satış (kategori × ay) ve hedef
ay_ad = ["Oca", "Şub", "Mar", "Nis", "May", "Haz"]
gercek = {}
for k in oku("anadolu_market/order_items.csv"):
    s = sip[k["order_id"]]
    if not s["order_date"].startswith("2024-0") or s["status"] in ("cancelled", "returned"): continue
    m = int(s["order_date"][5:7])
    if m > 6: continue
    kat = urun[k["product_id"]]["category"]
    gercek[(kat, m)] = gercek.get((kat, m), 0) + int(k["quantity"]) * float(k["unit_price"]) * (1 - float(k["discount"]))
katlar = sorted({k for k, _ in gercek})
br = []
for kat in katlar:
    for m in range(1, 7):
        g = round(gercek.get((kat, m), 0)); h = round(g * rnd.uniform(0.85, 1.2) / 100) * 100
        br.append([kat, seri(f"2024-{m:02d}-01"), h, g])
T["butce"] = {"ad": "Bütçe", "kaynak": "Anadolu Market", "aciklama": "2024 ilk yarı kategori × ay: hedef ve gerçekleşen net satış (iptal ve iade hariç).",
  "basliklar": ["Kategori", "Ay", "Hedef", "Gerçekleşen"], "bicim": [None, "aaaa yyyy", "#.##0", "#.##0"], "satirlar": br}

# 6) 2025 resmî tatiller (yarım gün arifeler ayrı işaretli)
TAT = [("2024-01-01", "Yılbaşı", 1), ("2024-04-09", "Ramazan Bayramı arifesi", 0.5), ("2024-04-10", "Ramazan Bayramı 1. gün", 1), ("2024-04-11", "Ramazan Bayramı 2. gün", 1),
       ("2024-04-12", "Ramazan Bayramı 3. gün", 1), ("2024-04-23", "Ulusal Egemenlik ve Çocuk Bayramı", 1), ("2024-05-01", "Emek ve Dayanışma Günü", 1),
       ("2024-05-19", "Atatürk'ü Anma, Gençlik ve Spor Bayramı", 1), ("2024-06-15", "Kurban Bayramı arifesi", 0.5), ("2024-06-16", "Kurban Bayramı 1. gün", 1),
       ("2024-06-17", "Kurban Bayramı 2. gün", 1), ("2024-06-18", "Kurban Bayramı 3. gün", 1), ("2024-06-19", "Kurban Bayramı 4. gün", 1),
       ("2024-07-15", "Demokrasi ve Millî Birlik Günü", 1), ("2024-08-30", "Zafer Bayramı", 1), ("2024-10-28", "Cumhuriyet Bayramı arifesi", 0.5), ("2024-10-29", "Cumhuriyet Bayramı", 1),
       ("2025-01-01", "Yılbaşı", 1), ("2025-03-29", "Ramazan Bayramı arifesi", 0.5), ("2025-03-30", "Ramazan Bayramı 1. gün", 1), ("2025-03-31", "Ramazan Bayramı 2. gün", 1),
       ("2025-04-01", "Ramazan Bayramı 3. gün", 1), ("2025-04-23", "Ulusal Egemenlik ve Çocuk Bayramı", 1), ("2025-05-01", "Emek ve Dayanışma Günü", 1),
       ("2025-05-19", "Atatürk'ü Anma, Gençlik ve Spor Bayramı", 1), ("2025-06-05", "Kurban Bayramı arifesi", 0.5), ("2025-06-06", "Kurban Bayramı 1. gün", 1),
       ("2025-06-07", "Kurban Bayramı 2. gün", 1), ("2025-06-08", "Kurban Bayramı 3. gün", 1), ("2025-06-09", "Kurban Bayramı 4. gün", 1),
       ("2025-07-15", "Demokrasi ve Millî Birlik Günü", 1), ("2025-08-30", "Zafer Bayramı", 1), ("2025-10-28", "Cumhuriyet Bayramı arifesi", 0.5), ("2025-10-29", "Cumhuriyet Bayramı", 1)]
T["tatiller"] = {"ad": "Tatiller", "kaynak": "Resmî takvim", "aciklama": "2024 ve 2025 resmî tatilleri (34 gün). Arifeler yarım gündür; tam gün izin hesabında yalnız Süre = 1 olanlar düşülür. 2024 Ramazan Bayramı'na kamuda eklenen idari izin resmî tatil değildir, listede yoktur.",
  "basliklar": ["Tarih", "Gün", "Süre"], "bicim": ["gg.aa.yyyy gggg", None, None], "satirlar": [[seri(t), a, s] for t, a, s in TAT]}

# Boş metin gerçek boş hücredir (Excel'de içe alınan boş alan boştur, "" değil); ham sayfalar olduğu gibi kalır
for t in T.values():
    if not t.get("ham"): t["satirlar"] = [[None if v == "" else v for v in r] for r in t["satirlar"]]

js = "// Üreten: tools/veri_hazirla.py (Kesit ortak veri setlerinden). Elle düzenlemeyin.\nexport const TABLOLAR = " + json.dumps(T, ensure_ascii=False, separators=(",", ":")) + ";\n"
CIKTI.write_text(js, encoding="utf-8")
print(CIKTI, len(js), "bayt;", {k: len(v["satirlar"]) for k, v in T.items()})
