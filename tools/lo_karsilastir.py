"""Motor ile LibreOffice Calc'ı aynı formüllerde karşılaştırır.

Kullanım: python3 tools/lo_karsilastir.py
- tests/vakalar.json "lo" listesi: LibreOffice'te hesaplanıp motorla karşılaştırılır.
- "elle" listesi: LibreOffice 24.2'de olmayan işlevler (ÇAPRAZARA, FİLTRE...). Beklenen değer elle yazılmıştır.
Her formül J sütununa ayrı satırda yazılır; veri A1:F9'dadır.
"""
import json, subprocess, sys, tempfile, pathlib, math, re, datetime
from openpyxl import Workbook, load_workbook

KOK = pathlib.Path(__file__).resolve().parent.parent
V = json.loads((KOK / "tests/vakalar.json").read_text(encoding="utf-8"))

# openpyxl, Excel 2010 sonrası işlevleri dosyaya önekiyle yazmayı bilmez; yazmazsak LibreOffice #NAME? verir.
YENI = ["FORECAST.LINEAR", "AGGREGATE", "STDEV.P", "RANK.EQ", "STDEV.S", "VAR.S", "PERCENTILE.INC", "QUARTILE.INC", "CEILING.MATH", "FLOOR.MATH", "MAXIFS", "MINIFS", "IFS",
        "XOR", "IFNA", "SWITCH", "TEXTJOIN", "CONCAT", "ISOWEEKNUM", "DAYS"]
def onek(f):
    return re.sub(r"(?<![A-Za-z_.])(" + "|".join(re.escape(x) for x in YENI) + r")\(", r"_xlfn.\1(", f)

EPOK = datetime.datetime(1899, 12, 30)
def seriye(v):
    if isinstance(v, datetime.datetime): return (v - EPOK).total_seconds() / 86400
    if isinstance(v, datetime.time): return (v.hour * 3600 + v.minute * 60 + v.second) / 86400
    return v

def lo_hesapla(formuller):
    wb = Workbook(); ws = wb.active; ws.title = "Veri"
    ws.append(V["veri"]["basliklar"])
    for s in V["veri"]["satirlar"]: ws.append(s)
    for r in range(2, len(V["veri"]["satirlar"]) + 2): ws.cell(r, 5).number_format = "dd.mm.yyyy"
    for i, f in enumerate(formuller): ws.cell(i + 1, 10, onek(f))
    with tempfile.TemporaryDirectory() as d:
        g = pathlib.Path(d) / "girdi.xlsx"; wb.save(g)
        cik = pathlib.Path(d) / "cikti"; cik.mkdir()
        subprocess.run(["soffice", "--headless", "--calc", "--convert-to", "xlsx", "--outdir", str(cik), str(g)], check=True, capture_output=True, timeout=180)
        ws2 = load_workbook(cik / "girdi.xlsx", data_only=True)["Veri"]
        return [seriye(ws2.cell(i + 1, 10).value) for i in range(len(formuller))]

def motor():
    r = subprocess.run(["node", str(KOK / "tools/motor_hesapla.mjs")], check=True, capture_output=True, text=True)
    return json.loads(r.stdout)

def esit(a, b):
    if isinstance(a, dict):  # motor hatası
        return isinstance(b, str) and b.startswith("#") and b.upper() == a["hata"].upper()
    if isinstance(a, bool) or isinstance(b, bool): return a == b
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return math.isclose(a, b, rel_tol=1e-9, abs_tol=1e-9)
    if b is None: b = ""
    return a == b

def main():
    lo = lo_hesapla(V["lo"]); m = motor()
    hatali = 0
    for i, f in enumerate(V["lo"]):
        if not esit(m[i], lo[i]): hatali += 1; print(f"FARK  {f}\n      motor={m[i]!r}  libreoffice={lo[i]!r}")
    n = len(V["lo"])
    for j, (f, bek) in enumerate(V["elle"]):
        v = m[n + j]
        if not esit(v, bek): hatali += 1; print(f"FARK  {f}\n      motor={v!r}  beklenen={bek!r}")
    top = len(V["lo"]) + len(V["elle"])
    print(f"{top - hatali}/{top} uyumlu ({len(V['lo'])} LibreOffice, {len(V['elle'])} elle)")
    sys.exit(1 if hatali else 0)

if __name__ == "__main__": main()
