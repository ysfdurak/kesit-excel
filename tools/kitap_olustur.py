"""Kesit Excel veri setlerinden gerçek Excel'de makro denemek için .xlsx kitabı üretir.

Kullanım: python3 tools/kitap_olustur.py  →  docs/indir/kesit-excel-veri.xlsx
Kaynak: docs/icerik/veri.js (tools/veri_hazirla.py üretir). Tarihler Excel seri sayısı olarak yazılır, biçim
Excel'in İngilizce biçim koduyla verilir (Türkçe Excel ekranda gg.aa.yyyy olarak gösterir).
"""
import json
import pathlib
import re

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
from openpyxl.utils import get_column_letter

KOK = pathlib.Path(__file__).resolve().parent.parent
KAYNAK = KOK / "docs" / "icerik" / "veri.js"
HEDEF = KOK / "docs" / "indir" / "kesit-excel-veri.xlsx"

# Kesit'in Türkçe biçim kodu → Excel biçim kodu
BICIM = {
    "gg.aa.yyyy": "dd.mm.yyyy",
    "gg.aa.yyyy gggg": "dd.mm.yyyy dddd",
    "gg.aa.yyyy ss:dd": "dd.mm.yyyy hh:mm",
    "ss:dd": "hh:mm",
    "aaaa yyyy": "mmmm yyyy",
    "#.##0,00": "#,##0.00",
    "#.##0": "#,##0",
    "0%": "0%",
}


def oku():
    metin = KAYNAK.read_text(encoding="utf-8")
    m = re.search(r"export const TABLOLAR = (\{.*\});?\s*$", metin, re.S)
    if not m:
        raise SystemExit("veri.js biçimi beklenenden farklı")
    return json.loads(m.group(1))


def sayfa_adlari():
    # Kesit'teki sayfa adları (makrolar Worksheets("Bayi") gibi bu adlarla çağırır): docs/icerik/sayfalar.js
    m = re.search(r"SAYFA_ANAHTAR = (\{.*?\});", (KOK / "docs" / "icerik" / "sayfalar.js").read_text(encoding="utf-8"))
    return {v: k for k, v in json.loads(m.group(1).replace("'", '"')).items()}


def main():
    tablolar = oku()
    adlar = sayfa_adlari()
    wb = Workbook()
    bilgi = wb.active
    bilgi.title = "Oku beni"
    satirlar = [
        ["Kesit Excel · veri kitabı"],
        ["Bu kitap, Kesit Excel makro atölyesindeki sayfaların aynısıdır. Makroları gerçek Excel'de denemek için:"],
        ["1. Dosya > Farklı Kaydet > Excel Makro İçerebilen Çalışma Kitabı (.xlsm)."],
        ["2. Alt+F11 > Dosya > Dosya Al ile Kesit'ten indirdiğiniz KesitMakro.bas dosyasını içeri alın."],
        ["3. İlgili sayfaya geçin, Alt+F8 ile makroyu seçip Çalıştır deyin."],
        ["Veriler kurgusaldır. Lisans: PolyForm Shield 1.0.0 (kişisel, okul ve şirket içi kullanım ücretsiz)."],
    ]
    for s in satirlar:
        bilgi.append(s)
    bilgi["A1"].font = Font(bold=True, size=14)
    bilgi.column_dimensions["A"].width = 100

    baslik_dolgu = PatternFill("solid", fgColor="E2F1E8")
    for anahtar in adlar:
        t = tablolar[anahtar]
        ws = wb.create_sheet(adlar[anahtar][:31])
        basliklar = t.get("basliklar")
        bicim = t.get("bicim") or []
        bas = 1
        if basliklar:
            ws.append(basliklar)
            for j in range(1, len(basliklar) + 1):
                c = ws.cell(row=1, column=j)
                c.font = Font(bold=True)
                c.fill = baslik_dolgu
            bas = 2
        for satir in t["satirlar"]:
            ws.append([None if v is None else v for v in satir])
        sutun_say = max([len(basliklar or [])] + [len(r) for r in t["satirlar"]])
        for j in range(1, sutun_say + 1):
            kod = BICIM.get(bicim[j - 1]) if j - 1 < len(bicim) and bicim[j - 1] else None
            if kod:
                for i in range(bas, ws.max_row + 1):
                    ws.cell(row=i, column=j).number_format = kod
            uz = max([len(str(ws.cell(row=i, column=j).value or "")) for i in range(1, min(ws.max_row, 60) + 1)] + [8])
            ws.column_dimensions[get_column_letter(j)].width = min(40, uz + 3 if not kod else max(uz + 3, 13))
        if basliklar:
            ws.freeze_panes = "A2"
    HEDEF.parent.mkdir(parents=True, exist_ok=True)
    wb.save(HEDEF)
    print(f"{HEDEF.relative_to(KOK)} yazıldı: {len(tablolar)} sayfa")


if __name__ == "__main__":
    main()
