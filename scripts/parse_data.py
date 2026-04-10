"""
parse_data.py — Convert NAICS_Coder_V3.xlsx and NAPCS_ranks.xlsx to JSON.

Outputs:
  webapp/public/data/naics.json   — NAICS hierarchy (all levels 2-6), includes
                                    establishments count from TotalRev
  webapp/public/data/napcs.json   — Top-5 NAPCS products per 6-digit NAICS

Run from the repo root:
  python3 scripts/parse_data.py
"""

import json
import os
import zipfile
import xml.etree.ElementTree as ET

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAICS_XLSX = os.path.join(REPO_ROOT, "NAICS_Coder_V3.xlsx")
NAPCS_XLSX = os.path.join(REPO_ROOT, "NAPCS_ranks.xlsx")
OUT_DIR = os.path.join(REPO_ROOT, "webapp", "public", "data")

NS = {"ns": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def load_shared_strings(z):
    with z.open("xl/sharedStrings.xml") as f:
        tree = ET.parse(f)
    strings = []
    for si in tree.findall(".//ns:si", NS):
        parts = si.findall(".//ns:t", NS)
        strings.append("".join(t.text or "" for t in parts))
    return strings


def sheet_names(z):
    with z.open("xl/workbook.xml") as f:
        tree = ET.parse(f)
    return [s.get("name") for s in tree.findall(".//ns:sheet", NS)]


def iter_rows(z, sheet_path, shared_strings):
    """Yield each row as a dict {col_letter: value}."""
    with z.open(sheet_path) as f:
        tree = ET.parse(f)
    for row in tree.findall(".//ns:row", NS):
        cells = {}
        for c in row.findall("ns:c", NS):
            ref = c.get("r", "")
            col = "".join(ch for ch in ref if ch.isalpha())
            t = c.get("t", "")
            v = c.find("ns:v", NS)
            val = ""
            if v is not None and v.text is not None:
                val = shared_strings[int(v.text)] if t == "s" else v.text
            cells[col] = val
        if cells:
            yield cells


# ---------------------------------------------------------------------------
# NAICS hierarchy
# ---------------------------------------------------------------------------

def parse_naics():
    records = []
    with zipfile.ZipFile(NAICS_XLSX) as z:
        ss = load_shared_strings(z)
        names = sheet_names(z)
        sheet_idx = names.index("Sheet1") + 1  # 1-based
        sheet_path = f"xl/worksheets/sheet{sheet_idx}.xml"

        rows = iter_rows(z, sheet_path, ss)
        header = next(rows)  # skip header row
        _ = header  # {"A": "Code Level", "B": "Code", ...}

        for row in rows:
            raw_level = row.get("A", "")
            if not raw_level:
                continue
            try:
                level = int(float(raw_level))
            except ValueError:
                continue

            label = row.get("C", "")
            # Strip trailing "T" artifact present on every label in the source
            if label.endswith("T"):
                label = label[:-1].rstrip()

            records.append({
                "level": level,
                "code": row.get("B", ""),
                "label": label,
                "description": row.get("D", ""),
                "crossRefs": row.get("E", ""),
                "parentCode": row.get("F", ""),
                "revenue": row.get("G", ""),
            })

    # Augment with establishments count from TotalRev sheet
    estab = parse_establishments()
    for rec in records:
        rec["establishments"] = estab.get(rec["code"], None)

    print(f"NAICS records: {len(records)}, with establishments data: {sum(1 for r in records if r['establishments'] is not None)}")
    return records


# ---------------------------------------------------------------------------
# Establishments count (TotalRev sheet — total row per NAICS code)
# ---------------------------------------------------------------------------

def parse_establishments():
    """Return dict of {naics_code_str: establishments_int} from TotalRev.

    NAICS_Coder_V3.xlsx TotalRev layout:
      col C = NAICS2022 (string), col E = NAPCS2022_LABEL, col F = ESTAB
    Only rows where label == "Total" are industry totals.
    """
    estab = {}
    with zipfile.ZipFile(NAICS_XLSX) as z:
        ss = load_shared_strings(z)
        names = sheet_names(z)
        sheet_idx = names.index("TotalRev") + 1
        sheet_path = f"xl/worksheets/sheet{sheet_idx}.xml"

        rows = iter_rows(z, sheet_path, ss)
        next(rows)  # skip header

        for row in rows:
            label = row.get("E", "")
            if label != "Total":
                continue
            naics_code = row.get("C", "").strip()
            if not naics_code:
                continue
            raw_estab = row.get("F", "")
            try:
                estab[naics_code] = int(float(raw_estab)) if raw_estab else None
            except ValueError:
                estab[naics_code] = None

    return estab


# ---------------------------------------------------------------------------
# NAPCS product rankings
# ---------------------------------------------------------------------------

PRODUCT_COLS = [
    ("D", "E", "F", "G"),   # Product1, Label1, Rev1, Pct1
    ("H", "I", "J", "K"),   # Product2, Label2, Rev2, Pct2
    ("L", "M", "N", "O"),   # Product3, Label3, Rev3, Pct3
    ("P", "Q", "R", "S"),   # Product4, Label4, Rev4, Pct4
    ("T", "U", "V", "W"),   # Product5, Label5, Rev5, Pct5
]


def parse_napcs():
    result = {}
    with zipfile.ZipFile(NAPCS_XLSX) as z:
        ss = load_shared_strings(z)
        names = sheet_names(z)
        sheet_idx = names.index("industries") + 1
        sheet_path = f"xl/worksheets/sheet{sheet_idx}.xml"

        rows = iter_rows(z, sheet_path, ss)
        next(rows)  # skip header

        for row in rows:
            naics_code = row.get("A", "").strip()
            if not naics_code:
                continue

            napcs_join_flag = row.get("C", "")
            ranks_raw = row.get("B", "")

            products = []
            for rank_num, (pc, lc, rc, pctc) in enumerate(PRODUCT_COLS, start=1):
                prod_code = row.get(pc, "").strip()
                if not prod_code:
                    continue

                rev_raw = row.get(rc, "")
                try:
                    rev_thousands = int(float(rev_raw)) if rev_raw else None
                except ValueError:
                    rev_thousands = None

                pct_raw = row.get(pctc, "")
                try:
                    pct = float(pct_raw) if pct_raw else None
                except ValueError:
                    pct = None

                # Normalize NAPCS code from scientific notation if needed
                try:
                    prod_code_norm = str(int(float(prod_code)))
                except ValueError:
                    prod_code_norm = prod_code

                products.append({
                    "rank": rank_num,
                    "code": prod_code_norm,
                    "label": row.get(lc, ""),
                    "revThousands": rev_thousands,
                    "pct": pct,
                })

            result[naics_code] = {
                "napcsJoinFlag": napcs_join_flag,
                "ranks": ranks_raw,
                "products": products,
            }

    print(f"NAPCS industry entries: {len(result)}")
    return result


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    naics = parse_naics()
    naics_path = os.path.join(OUT_DIR, "naics.json")
    with open(naics_path, "w", encoding="utf-8") as f:
        json.dump(naics, f, ensure_ascii=False, separators=(",", ":"))
    print(f"Written: {naics_path} ({os.path.getsize(naics_path):,} bytes)")

    napcs = parse_napcs()
    napcs_path = os.path.join(OUT_DIR, "napcs.json")
    with open(napcs_path, "w", encoding="utf-8") as f:
        json.dump(napcs, f, ensure_ascii=False, separators=(",", ":"))
    print(f"Written: {napcs_path} ({os.path.getsize(napcs_path):,} bytes)")


if __name__ == "__main__":
    main()
