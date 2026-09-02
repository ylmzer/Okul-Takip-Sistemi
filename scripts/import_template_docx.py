import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}

OUTCOME_WORDS = (
    "açıklar",
    "belirtir",
    "sıralar",
    "sınıflandırır",
    "ilişkilendirir",
    "tanımlar",
    "ayırt eder",
    "uygular",
    "hazırlar",
    "seçer",
    "yapar",
    "kullanır",
    "gösterir",
    "karşılaştırır",
    "değerlendirir",
    "kaydeder",
    "düzenler",
    "hesaplar",
    "oluşturur",
    "yükler",
    "çalıştırır",
    "çözer",
    "analiz eder",
    "yorumlar",
    "inceler",
    "planlar",
    "tasarlar",
    "gerçekleştirir",
    "dönüştürür",
    "aktarır",
    "ifade eder",
    "fark eder",
    "kavrar",
    "bilir",
    "anlar",
    "özetler",
    "listeler",
    "çizer",
    "sunar",
    "tartışır",
    "araştırır",
    "gözlemler",
    "edinir",
    "geliştirir",
    "bağlar",
    "gruplar",
    "yazar",
    "okur",
)

def clean_text(value):
    return re.sub(r"[ \t]+", " ", str(value or "")).strip()

def paragraph_text(paragraph):
    return clean_text("".join((node.text or "") for node in paragraph.iter(f"{{{NS['w']}}}t")))

def table_to_rows(table):
    rows = []
    for tr in table.findall("w:tr", NS):
        row = []
        for tc in tr.findall("w:tc", NS):
            lines = []
            for paragraph in tc.findall(".//w:p", NS):
                text = paragraph_text(paragraph)
                if text:
                    lines.append(text)
            row.append("\n".join(lines))
        rows.append(row)
    return rows

def table_text(rows):
    parts = []
    for row in rows:
        for cell in row:
            parts.append(cell)
    return " ".join(parts)

def extract_blocks(path):
    blocks = []
    with zipfile.ZipFile(path) as archive:
        document = ET.fromstring(archive.read("word/document.xml"))
    body = document.find("w:body", NS)
    if body is None:
        return blocks
    for child in body:
        tag = child.tag.rsplit("}", 1)[-1]
        if tag == "p":
            text = paragraph_text(child)
            if text:
                blocks.append({"type": "p", "text": text})
        elif tag == "tbl":
            rows = table_to_rows(child)
            blocks.append({"type": "table", "rows": rows, "text": table_text(rows)})
    return blocks

def normalize_text(value):
    return clean_text(value).lower().replace("ı", "i").replace("ş", "s").replace("ğ", "g").replace("ç", "c").replace("ö", "o").replace("ü", "u")

def tr_lower(text):
    return (
        str(text or "")
        .replace("İ", "i")
        .replace("I", "ı")
        .replace("Ğ", "ğ")
        .replace("Ü", "ü")
        .replace("Ş", "ş")
        .replace("Ö", "ö")
        .replace("Ç", "ç")
        .lower()
        .strip()
    )

def is_metadata_text(text):
    t = tr_lower(text)
    if "ders" in t and any(w in t for w in ["ad", "sınıf", "sinif", "süre", "sure", "amaç", "amac", "öğrenme", "ogrenme"]):
        return True
    if any(k in t for k in [
        "eğitim-öğretim ortam", "egitim-ogretim ortam", "ölçme ve değerlendirme", "olcme ve degerlendirme",
        "toplam", "kazanım sayısı", "kazanim sayisi", "uygulama faaliyetleri", "temrinler",
        "dersin uygulanması", "dersin uygulanmasi", "açıklamalar", "aciklamalar"
    ]):
        return True
    return False

def parse_docx(path):
    blocks = extract_blocks(path)
    units_list = []
    
    # Try parsing metadata from paragraphs
    meta = {
        "lessonName": "",
        "grade": "",
        "areaName": "",
        "weeklyHours": None
    }
    for block in blocks:
        if block["type"] == "p":
            text = block["text"].strip()
            # Scan for Dersin Adı
            match = re.search(r"(?:ders(?:in)?\s+ad[ıi]|ders)\s*:\s*(.+)", text, re.I)
            if match and not meta["lessonName"]:
                meta["lessonName"] = match.group(1).strip()
            # Scan for Sınıf
            match = re.search(r"(?:s[ıi]n[ıi]f(?:[ıi])?)\s*:\s*(.+)", text, re.I)
            if match and not meta["grade"]:
                meta["grade"] = match.group(1).strip()
            # Scan for Alan
            match = re.search(r"(?:alan(?:[ıi])?)\s*:\s*(.+)", text, re.I)
            if match and not meta["areaName"]:
                meta["areaName"] = match.group(1).strip()
            # Scan for Haftalık Ders Saati
            match = re.search(r"(?:haftal[ıi]k\s+)?ders\s+saat[ıi]\s*:\s*(\d+)", text, re.I)
            if match and not meta["weeklyHours"]:
                meta["weeklyHours"] = int(match.group(1))

    # Process tables first
    for block in blocks:
        if block["type"] != "table":
            continue
        
        rows = block["rows"]
        if not rows or len(rows) < 2:
            continue

        # Check if this is a cover / metadata table (e.g. 2 columns with DERSİN ADI, SÜRESİ, etc.)
        first_cell = rows[0][0].strip() if rows[0] else ""
        if len(rows[0]) <= 2 and is_metadata_text(first_cell):
            for r in rows:
                if len(r) >= 2:
                    k = tr_lower(r[0])
                    v = r[1].strip()
                    if "ders" in k and "ad" in k and not meta["lessonName"]:
                        meta["lessonName"] = v
                    elif ("sınıf" in k or "sinif" in k) and not meta["grade"]:
                        meta["grade"] = v
                    elif ("süre" in k or "sure" in k) and not meta["weeklyHours"]:
                        digits = re.findall(r"\d+", v)
                        if digits:
                            meta["weeklyHours"] = int(digits[0])
            continue # Skip cover table from becoming units!
            
        # Determine column indexes with robust keyword order
        unit_idx = -1
        topic_idx = -1
        outcome_idx = -1
        hours_idx = -1
        ratio_idx = -1
        
        # Check first 3 rows for header keywords
        for r_idx in range(min(3, len(rows))):
            row = [tr_lower(cell) for cell in rows[r_idx]]
            for c_idx, cell in enumerate(row):
                # Check kazanım FIRST because "ÖĞRENME BİRİMİ KAZANIMLARI" contains both
                if any(k in cell for k in ["kazanım", "kazanim", "hedef"]):
                    outcome_idx = c_idx
                elif any(k in cell for k in ["ünite", "unite", "öğrenme birimi", "ogrenme birimi", "tema", "bölüm", "bolum"]):
                    unit_idx = c_idx
                elif any(k in cell for k in ["konu", "içerik", "icerik"]):
                    topic_idx = c_idx
                elif any(k in cell for k in ["saat", "süre", "sure"]):
                    hours_idx = c_idx
                elif any(k in cell for k in ["oran", "ağırlık", "agirlik"]):
                    ratio_idx = c_idx
                    
        # Apply fallbacks if headers not detected
        col_count = len(rows[0])
        if unit_idx == -1 and outcome_idx == -1:
            if col_count >= 4:
                unit_idx = 0
                topic_idx = 1
                outcome_idx = 2
                hours_idx = 3
            elif col_count == 3:
                unit_idx = 0
                topic_idx = 1
                outcome_idx = 2
            elif col_count == 2:
                unit_idx = 0
                outcome_idx = 1
            else:
                outcome_idx = 0
                
        # Make sure at least outcome_idx is safe
        if outcome_idx == -1:
            outcome_idx = 0
            
        active_unit = None
        
        for row in rows:
            row_tr = [tr_lower(c) for c in row]
            is_header = any(any(k in c for k in ["ünite", "öğrenme birimi", "kazanım", "konular", "kazanim", "ogrenme"]) for c in row_tr)
            if is_header:
                continue

            u_val = row[unit_idx].strip() if 0 <= unit_idx < len(row) else ""
            t_val = row[topic_idx].strip() if 0 <= topic_idx < len(row) else ""
            o_val = row[outcome_idx].strip() if 0 <= outcome_idx < len(row) else ""
            h_val = row[hours_idx].strip() if 0 <= hours_idx < len(row) else ""
            r_val = row[ratio_idx].strip() if 0 <= ratio_idx < len(row) else ""

            # Check if this row marks the end of unit curriculum (practice tasks or notes)
            u_tr = tr_lower(u_val)
            if any(k in u_tr for k in ["uygulama faaliyetleri", "temrinler", "dersin uygulanması", "dersin uygulanmasi", "açıklamalar", "aciklamalar"]):
                break

            # Skip metadata rows or empty unit titles
            if is_metadata_text(u_val):
                continue
            
            # Heuristic: if u_val is empty but t_val starts with "ÜNİTE" or "ÖĞRENME BİRİMİ", treat it as unit name
            if not u_val and (re.match(r"^(?:öğrenme\s+birimi|ünite|bölüm)\s*\d+", t_val, re.I)):
                u_val = t_val
                t_val = ""
            
            if u_val:
                u_clean = " ".join(u_val.split())
                # Look for existing unit to merge
                matched = next((u for u in units_list if tr_lower(u["title"]) == tr_lower(u_clean)), None)
                if matched:
                    active_unit = matched
                else:
                    active_unit = {
                        "title": u_clean,
                        "hours": 0,
                        "ratio": "",
                        "outcomes_list": [],
                        "topics": []
                    }
                    units_list.append(active_unit)
                    
            if active_unit:
                if h_val:
                    hours_digits = "".join(ch for ch in h_val if ch.isdigit())
                    if hours_digits:
                        active_unit["hours"] += int(hours_digits)
                if r_val and not active_unit["ratio"]:
                    active_unit["ratio"] = r_val
                if t_val:
                    for line in t_val.split("\n"):
                        l_clean = line.strip()
                        if l_clean and l_clean not in active_unit["topics"]:
                            active_unit["topics"].append(l_clean)
                if o_val:
                    for line in o_val.split("\n"):
                        l_clean = line.strip()
                        if l_clean and l_clean not in active_unit["outcomes_list"]:
                            active_unit["outcomes_list"].append(l_clean)
                            
    # Paragraph parser fallback if no tables processed
    if not units_list:
        active_unit = None
        for block in blocks:
            if block["type"] != "p":
                continue
            text = block["text"].strip()
            if not text:
                continue
                
            # Check for unit header
            if re.match(r"^(?:öğrenme\s+birimi|ünite|bölüm)\s*\d+|^[ivx]+\s*bölüm", text, re.I):
                active_unit = {
                    "title": text,
                    "hours": 10,
                    "ratio": "",
                    "outcomes_list": [],
                    "topics": []
                }
                units_list.append(active_unit)
            elif active_unit:
                # Outcome ending verb check or list pattern check
                norm_text = normalize_text(text)
                if any(normalize_text(word) in norm_text for word in OUTCOME_WORDS) or re.match(r"^\d+\.\d+\.\s", text):
                    active_unit["outcomes_list"].append(text)
                else:
                    active_unit["topics"].append(text)
                    
    # Format and clean outcomes and topics
    num_units = max(1, len(units_list))
    default_unit_hours = 10
    if meta.get("weeklyHours"):
        default_unit_hours = max(1, round((meta["weeklyHours"] * 36) / num_units))
    default_ratio = f"%{round(100 / num_units)}"

    for unit in units_list:
        if unit["hours"] == 0:
            unit["hours"] = default_unit_hours
        if not unit["ratio"]:
            unit["ratio"] = default_ratio
            
        # Merge numbered list items for outcomes
        raw_outcomes = [o.strip() for o in unit["outcomes_list"] if o.strip()]
        outcomes_clean = []
        i = 0
        n = len(raw_outcomes)
        while i < n:
            o_str = raw_outcomes[i]
            is_marker = re.match(r"^(\d+(?:\.\d+)*\.?|[a-zA-ZçıiöügşÇİÖÜĞŞ]\)|[•▪➢\-*]+)$", o_str)
            if is_marker and i + 1 < n:
                # Find next non-empty outcome
                j = i + 1
                next_o = ""
                while j < n:
                    if raw_outcomes[j]:
                        next_o = raw_outcomes[j]
                        break
                    j += 1
                
                if next_o:
                    prefix = o_str
                    if prefix.isdigit():
                        prefix += "."
                    combined = f"{prefix} {next_o}"
                    if not combined.endswith("."):
                        combined += "."
                    outcomes_clean.append(combined)
                    i = j + 1
                else:
                    if not o_str.endswith("."):
                        o_str += "."
                    outcomes_clean.append(o_str)
                    i += 1
            else:
                if not o_str.endswith("."):
                    o_str += "."
                outcomes_clean.append(o_str)
                i += 1
                
        unit["outcomes"] = "\n".join(outcomes_clean)
        del unit["outcomes_list"]
        
        # Merge numbered list items for topics
        raw_topics = [t.strip() for t in unit["topics"] if t.strip()]
        topics_clean = []
        i = 0
        n = len(raw_topics)
        while i < n:
            t_str = raw_topics[i]
            is_marker = re.match(r"^(\d+(?:\.\d+)*\.?|[a-zA-ZçıiöügşÇİÖÜĞŞ]\)|[•▪➢\-*]+)$", t_str)
            if is_marker and i + 1 < n:
                j = i + 1
                next_t = ""
                while j < n:
                    if raw_topics[j]:
                        next_t = raw_topics[j]
                        break
                    j += 1
                
                if next_t:
                    prefix = t_str
                    if prefix.isdigit():
                        prefix += "."
                    combined = f"{prefix} {next_t}"
                    topics_clean.append(combined)
                    i = j + 1
                else:
                    topics_clean.append(t_str)
                    i += 1
            else:
                topics_clean.append(t_str)
                i += 1
                
        unit["topics"] = topics_clean
        
    res = {"units": units_list}
    if meta["lessonName"]:
        res["lessonName"] = meta["lessonName"]
    if meta["grade"]:
        res["grade"] = meta["grade"]
    if meta["areaName"]:
        res["areaName"] = meta["areaName"]
    if meta["weeklyHours"]:
        res["weeklyHours"] = meta["weeklyHours"]
    return res

def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Word file path required"}, ensure_ascii=False))
        return
        
    path = sys.argv[1]
    try:
        data = parse_docx(path)
        print(json.dumps(data, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": str(e)}, ensure_ascii=False))

if __name__ == "__main__":
    main()
