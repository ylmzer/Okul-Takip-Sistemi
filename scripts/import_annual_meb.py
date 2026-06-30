import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata
from pathlib import Path

from pypdf import PdfReader

try:
    import pdfplumber
except Exception:
    pdfplumber = None


# Bump this when parser logic changes to invalidate caches
PARSER_VERSION = 5


class TocTopics(list):
    pass


OUTCOME_WORDS = (
    "açıklar",
    "açıklar.",
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
    # Ek mesleki fiiller
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
    "sonuç çıkarır",
    "edinir",
    "geliştirir",
    "bağlar",
    "gruplar",
    "yazar",
    "okur",
    "kontrol eder",
    "test eder",
    "doğrular",
    "belirler",
    "eder",
    "alır",
    "verir",
    "takip eder",
    "izler",
    "ayarlar",
    "kurar",
    "bağlar",
    "yapılandırır",
    "biçimlendirir",
    "öğrenir",
)


# Keywords that indicate noise in book TOC entries (body text, not actual TOC)
TOC_NOISE_KEYWORDS = (
    "örnek", "ipucu", "tablo", "şekil", "resim", "grafik",
    "deyince", "olduğu", "olarak", "edilir", "anlamına",
    "işlemi", "sayısı", "eşittir", "formül",
    "sonuç", "çözüm", "cevap", "soru",
    "virgül", "basamak", "ondalık",
    "bölünme", "çarpılması", "bölünmesi",
)


def clean_space(value):
    value = str(value or "").replace("\x00", " ")
    value = re.sub(r"[ \t\r\f\v]+", " ", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    value = re.sub(r" +([.,;:!?])", r"\1", value)
    return value.strip()


def one_line(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()


def normalize(value):
    value = unicodedata.normalize("NFKD", str(value or ""))
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    value = value.casefold()
    value = value.replace("ı", "i")
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def text_quality_score(text):
    if not text:
        return 0
    letters = re.findall(r"[A-Za-zÇĞİÖŞÜçğıöşü]", text)
    cid_noise = len(re.findall(r"\(cid:\d+\)|[\u0350-\u036f]", text))
    return max(0, len(letters) - cid_noise * 3) / max(1, len(text))


def toc_signal_score(text):
    if not text:
        return 0
    return len(re.findall(r"^\s*\d+(?:\.\d+){1,5}\.?\s+.{3,}", text, flags=re.M))


def read_pdf_text(path, max_pages=None):
    reader = PdfReader(str(path))
    pages = reader.pages[:max_pages] if max_pages else reader.pages
    raw_text = "\n".join((page.extract_text() or "") for page in pages)
    cleaned = "".join(ch for ch in raw_text if unicodedata.category(ch)[0] != "C" or ch in "\n\t")
    if pdfplumber and max_pages and text_quality_score(cleaned) < 0.08:
        try:
            with pdfplumber.open(str(path)) as pdf:
                plumber_pages = pdf.pages[:max_pages]
                plumber_text = "\n".join((page.extract_text(x_tolerance=1, y_tolerance=3, layout=False) or "") for page in plumber_pages)
                plumber_cleaned = "".join(ch for ch in plumber_text if unicodedata.category(ch)[0] != "C" or ch in "\n\t")
                if (
                    text_quality_score(plumber_cleaned) > text_quality_score(cleaned)
                    or toc_signal_score(plumber_cleaned) > toc_signal_score(cleaned)
                ):
                    return plumber_cleaned
        except Exception:
            pass
    return cleaned


def read_pdf_tables(path, max_pages=None):
    if not pdfplumber:
        return []
    tables = []
    settings = {
        "vertical_strategy": "lines",
        "horizontal_strategy": "lines",
        "snap_tolerance": 3,
        "join_tolerance": 3,
        "intersection_tolerance": 5,
        "text_tolerance": 2,
    }
    try:
        with pdfplumber.open(str(path)) as pdf:
            pages = pdf.pages[:max_pages] if max_pages else pdf.pages
            for page in pages:
                extracted = page.extract_tables(table_settings=settings) or []
                for table in extracted:
                    cleaned = []
                    for row in table or []:
                        cells = [one_line(cell or "") for cell in row]
                        if any(cells):
                            cleaned.append(cells)
                    if cleaned:
                        tables.append(cleaned)
    except Exception:
        return []
    return tables


def read_pdf_column_lines(path, max_pages=None):
    if not pdfplumber:
        return []
    lines = []
    try:
        with pdfplumber.open(str(path)) as pdf:
            pages = pdf.pages[:max_pages] if max_pages else pdf.pages
            for page_index, page in enumerate(pages):
                words = page.extract_words(x_tolerance=1, y_tolerance=3, keep_blank_chars=False) or []
                grouped = []
                for word in words:
                    y = round(float(word["top"]) / 3) * 3
                    line = next((item for item in grouped if abs(item["y"] - y) <= 2), None)
                    if not line:
                        line = {"page": page_index + 1, "y": y, "words": []}
                        grouped.append(line)
                    line["words"].append(word)

                for line in sorted(grouped, key=lambda item: item["y"]):
                    columns = {"left": [], "topic": [], "outcome": []}
                    for word in sorted(line["words"], key=lambda item: item["x0"]):
                        x = float(word["x0"])
                        if x < 155:
                            columns["left"].append(word["text"])
                        elif x < 290:
                            columns["topic"].append(word["text"])
                        else:
                            columns["outcome"].append(word["text"])
                    lines.append({
                        "page": line["page"],
                        "y": line["y"],
                        "left": one_line(" ".join(columns["left"])),
                        "topic": one_line(" ".join(columns["topic"])),
                        "outcome": one_line(" ".join(columns["outcome"])),
                    })
    except Exception:
        return []
    return lines


def is_outcome_line(line):
    lower = normalize(line)
    return len(line) > 12 and any(normalize(word) in lower for word in OUTCOME_WORDS)


def is_bullet_line(line):
    return bool(re.match(r"^[•▪➢\-\*]\s*|^\s+|^o\s+", line))


def strip_bullet_marker(line):
    return one_line(re.sub(r"^[•▪➢\-\*]\s*|^o\s+", "", str(line or "").strip()))


def split_numbered_line(line):
    match = re.match(r"^(\d+(?:\.\d+)+)\.?\s+(.+)$", line)
    if not match:
        match = re.match(r"^(\d+)\.\s+(.+)$", line)
    if not match:
        match = re.match(r"^(\d+(?:\.\d+)*)\.(?=[A-Za-zÇĞİÖŞÜçğıöşü])\s*(.+)$", line)
    if not match:
        match = re.match(r"^(\d+)\s+([A-Za-zÇĞİÖŞÜçğıöşü].+)$", line)
    if not match:
        return None
    return match.group(1), one_line(match.group(2))


def top_number(number):
    return str(number or "").split(".")[0]


def numbered_text(entry):
    number = str(entry.get("number") or "").strip()
    text = one_line(entry.get("text") or "")
    return f"{number}. {text}" if number else text


def sentence_text(value):
    text = one_line(value)
    return text if not text or text.endswith((".", "!", "?")) else f"{text}."


def build_topic_outcome_pairs(topic_entries, outcome_entries):
    if not topic_entries or not outcome_entries:
        return []

    unused_outcomes = list(outcome_entries)
    pairs = []

    for topic_index, topic in enumerate(topic_entries):
        topic_number = str(topic.get("number") or "")
        matched = [item for item in unused_outcomes if str(item.get("number") or "") == topic_number]
        if not matched:
            matched = [
                item for item in unused_outcomes
                if top_number(item.get("number")) == top_number(topic_number)
            ]
        if not matched and unused_outcomes:
            matched = [unused_outcomes[0]]

        for item in matched:
            if item in unused_outcomes:
                unused_outcomes.remove(item)

        outcomes = [sentence_text(numbered_text(item)) for item in matched if one_line(item.get("text"))]
        pairs.append({
            "number": topic_number,
            "topic": numbered_text(topic),
            "outcomes": outcomes,
        })

    return [pair for pair in pairs if pair["topic"] or pair["outcomes"]]


def extract_archive_pdf(path, lesson_name="", grade="", file_in_rar=""):
    temp_dir = Path(tempfile.mkdtemp(prefix="annual_meb_"))
    subprocess.run(["tar", "-xf", str(path), "-C", str(temp_dir)], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    pdfs = list(temp_dir.rglob("*.pdf"))
    if not pdfs:
        raise RuntimeError("Arşiv içinde PDF bulunamadı.")

    # If file_in_rar is specified, try to find an exact match first
    if file_in_rar:
        target = file_in_rar.replace("\\", "/").lower().strip()
        for pdf in pdfs:
            rel_path = str(pdf.relative_to(temp_dir)).replace("\\", "/").lower().strip()
            if rel_path.endswith(target) or target.endswith(rel_path):
                return pdf, temp_dir, len(pdfs)

    lesson_key = normalize(lesson_name)
    lesson_tokens = [token for token in lesson_key.split() if len(token) > 2]
    grade_digits = re.search(r"\d+", str(grade or ""))
    grade_token = grade_digits.group(0) if grade_digits else ""

    def score(pdf):
        key = normalize(str(pdf.relative_to(temp_dir)))
        points = 0
        points += sum(4 for token in lesson_tokens if token in key)
        if grade_token and grade_token in key:
            points += 6
        if "sinif" in key:
            points += 1
        return points

    selected = sorted(pdfs, key=lambda item: (score(item), item.stat().st_size), reverse=True)[0]
    return selected, temp_dir, len(pdfs)


def resolve_document(path, lesson_name="", grade="", file_in_rar=""):
    suffix = Path(path).suffix.lower()
    if suffix == ".pdf":
        return Path(path), None, 1
    if suffix == ".rar":
        return extract_archive_pdf(path, lesson_name, grade, file_in_rar)
    raise RuntimeError("Desteklenen MEB dosyası PDF veya RAR olmalıdır.")


def parse_weekly_hours(text):
    # Handle: "DERSİN SÜRESİ Haftalık 5 Ders Saati" or "DERSİN SÜRESİ 5 Ders Saati"
    match = re.search(r"DERSİN\s+SÜRESİ\s+.*?(\d+)\s+Ders\s+Saati", text, flags=re.I)
    if match:
        return int(match.group(1))
    match = re.search(r"DERSIN\s+SURESI\s+.*?(\d+)\s+Ders\s+Saati", text, flags=re.I)
    if match:
        return int(match.group(1))
    # Fallback: look for "Haftalık X Ders Saati" anywhere
    match = re.search(r"Haftal[ıi]k\s+(\d+)\s+Ders\s+Saati", text, flags=re.I)
    if match:
        return int(match.group(1))
    return 2


def parse_lesson_name(text, fallback):
    match = re.search(r"DERSİN\s+ADI\s+(.+)", text, flags=re.I)
    if match:
        return one_line(match.group(1))
    return fallback or "MEB Dersi"


def parse_grade(text, fallback):
    match = re.search(r"DERSİN\s+SINIFI\s+(.+)", text, flags=re.I)
    if match:
        return one_line(match.group(1))
    return fallback or "Genel"


def table_section(text):
    patterns = [
        r"DERSİN\s+KAZANIM\s+TABLOSU",
        r"KAZANIM\s+SAYISI\s+VE\s+SÜRE\s+TABLOSU",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.I)
        if match:
            start = match.end()
            end_match = re.search(r"\n\s*TOPLAM\b", text[start:], flags=re.I)
            end = start + end_match.start() if end_match else min(len(text), start + 3500)
            return text[start:end]
    return ""


def parse_int_cell(value):
    match = re.search(r"\d+", str(value or ""))
    return int(match.group(0)) if match else None


def parse_ratio_cell(value):
    match = re.search(r"\d+(?:[,.]\d+)?", str(value or ""))
    return match.group(0).replace(",", ".") if match else ""


def parse_unit_table_from_tables(tables):
    units = []
    for table in tables or []:
        header_index = -1
        indexes = {}
        for row_index, row in enumerate(table):
            keys = [normalize(cell) for cell in row]
            joined = " ".join(keys)
            if "ogrenme" in joined and "kazanim" in joined and ("saat" in joined or "sure" in joined):
                header_index = row_index
                for index, key in enumerate(keys):
                    if "ogrenme" in key or "birim" in key or "unite" in key:
                        indexes["title"] = index
                    elif "kazanim" in key and ("sayi" in key or "sayisi" in key):
                        indexes["outcomeCount"] = index
                    elif "saat" in key or "sure" in key:
                        indexes["hours"] = index
                    elif "oran" in key or "yuzde" in key:
                        indexes["ratio"] = index
                break

        if header_index < 0:
            continue

        for row in table[header_index + 1:]:
            joined = normalize(" ".join(row))
            if not joined or "toplam" in joined:
                continue
            title_idx = indexes.get("title", 0)
            title = clean_unit_title(row[title_idx] if title_idx < len(row) else "")
            if not title or not re.search(r"[A-Za-zÇĞİÖŞÜçğıöşü]", title):
                continue
            outcome_count = parse_int_cell(row[indexes["outcomeCount"]]) if "outcomeCount" in indexes and indexes["outcomeCount"] < len(row) else None
            hours = parse_int_cell(row[indexes["hours"]]) if "hours" in indexes and indexes["hours"] < len(row) else None
            ratio = parse_ratio_cell(row[indexes["ratio"]]) if "ratio" in indexes and indexes["ratio"] < len(row) else ""
            if outcome_count is None or hours is None:
                numeric = [parse_int_cell(cell) for cell in row]
                numeric = [item for item in numeric if item is not None]
                if outcome_count is None and numeric:
                    outcome_count = numeric[0]
                if hours is None and len(numeric) > 1:
                    hours = numeric[1]
            if outcome_count is None or hours is None:
                continue
            units.append({
                "title": title,
                "outcomeCount": outcome_count,
                "hours": hours,
                "ratio": ratio,
                "topics": [],
                "outcomes": "",
            })
    return units


def clean_unit_title(title):
    title = one_line(title)
    title = re.sub(r"^(?:DERS|DERSİN|KAZANIM|TABLOSU|ÖĞRENME|BİRİMİ|ÜNİTE)\s+", "", title, flags=re.I)
    title = re.sub(r"\b(?:KAZANIM|TABLOSU|SAYISI|DERS SAATİ|ORAN)\b", "", title, flags=re.I)
    return one_line(title)


def clean_loose_table_line(line):
    text = one_line(line)
    key = normalize(text)
    had_header_noise = False
    replacements = (
        ("DERSİN KAZANIM", ""),
        ("KAZANIM SAYISI VE", ""),
        ("SÜRE TABLOSU", ""),
        ("TABLOSU", ""),
        ("ÖĞRENME KAZANIM", ""),
        ("ÖĞRENME BİRİMİ", ""),
        ("BİRİMİ/ÜNİTE", ""),
        ("KAZANIM", ""),
        ("DERS SAATİ", ""),
        ("ORAN (%)", ""),
        ("SAYISI", ""),
    )
    if any(normalize(source) in key for source, _ in replacements):
        had_header_noise = True
    for source, target in replacements:
        text = re.sub(re.escape(source), target, text, flags=re.I)
    text = one_line(text)
    if normalize(text) in {"ve", "dersin", "tablosu", "sure tablosu"}:
        text = ""
    return text, had_header_noise


def loose_title_needs_continuation(title):
    key = normalize(title)
    return key.endswith(" ve") or key.endswith(" ile") or key.endswith(" veya")


def parse_unit_table_from_loose_text(text):
    lines = [one_line(line) for line in text.splitlines() if one_line(line)]
    total_index = -1
    for index, line in enumerate(lines):
        if normalize(line) == "toplam":
            total_index = index
            break
    if total_index < 0:
        return []

    start_index = -1
    for index in range(max(0, total_index - 90), total_index):
        key = normalize(lines[index])
        if "ogrenme" in key or "kazanim sayisi" in key or "dersin kazanim" in key:
            start_index = index
            break
    if start_index < 0:
        return []

    units = []
    title_parts = []
    numbers = []
    continuation_budget = 0

    def flush():
        nonlocal title_parts, numbers, continuation_budget
        if len(numbers) < 3:
            return
        title = clean_unit_title(" ".join(title_parts))
        if title and re.search(r"[A-Za-zÇĞİÖŞÜçğıöşü]", title):
            units.append({
                "title": title,
                "outcomeCount": int(float(numbers[0].replace(",", "."))),
                "hours": int(float(numbers[1].replace(",", "."))),
                "ratio": numbers[2].replace(",", "."),
                "topics": [],
                "outcomes": "",
            })
        title_parts = []
        numbers = []
        continuation_budget = 0

    for raw in lines[start_index:total_index]:
        line, had_header_noise = clean_loose_table_line(raw)
        if not line:
            continue
        numeric = re.match(r"^(\d+(?:[,.]\d+)?)(?:\s+(.+))?$", line)
        if numeric:
            numbers.append(numeric.group(1))
            suffix = one_line(numeric.group(2) or "")
            if suffix:
                suffix, _ = clean_loose_table_line(suffix)
                if suffix:
                    title_parts.append(suffix)
                    if len(numbers) >= 3 and loose_title_needs_continuation(" ".join(title_parts)):
                        continuation_budget = 2
            continue
        if len(numbers) >= 3:
            if had_header_noise:
                title_parts.append(line)
                flush()
            elif continuation_budget > 0:
                title_parts.append(line)
                continuation_budget -= 1
            else:
                flush()
                title_parts.append(line)
            continue
        title_parts.append(line)

    flush()
    return units


def parse_unit_table(text, tables=None):
    table_units = parse_unit_table_from_tables(tables or [])
    if table_units:
        return table_units

    section = table_section(text)
    if not section:
        return parse_unit_table_from_loose_text(text)

    units = []
    buffer = []
    ignored = ("ÖĞRENME", "BİRİM", "ÜNİTE", "KAZANIM", "SAYISI", "DERS SAAT", "ORAN")
    for raw in section.splitlines():
        line = one_line(raw)
        if not line:
            continue
        upper = line.upper()
        if any(bit in upper for bit in ignored) and not re.search(r"\d+\s+\d+\s+[\d,.]+$", line):
            continue
        row = re.match(r"^(.*?)(\d+)\s+(\d+)\s+([\d,.]+)\s*$", line)
        if row:
            name = clean_unit_title(" ".join(buffer + [row.group(1)]))
            buffer = []
            if not name:
                continue
            units.append({
                "title": name,
                "outcomeCount": int(row.group(2)),
                "hours": int(row.group(3)),
                "ratio": row.group(4).replace(",", "."),
                "topics": [],
                "outcomes": "",
            })
        elif re.search(r"[A-Za-zÇĞİÖŞÜçğıöşü]", line):
            buffer.append(line)
    return units or parse_unit_table_from_loose_text(text)


def find_topics_section(text):
    match = re.search(r"ÖĞRENME\s+BİRİMİ\s+KONULAR", text, flags=re.I)
    if not match:
        match = re.search(r"ÖĞRENME\s+BİRİMİ[\s\S]{0,220}?KONULAR", text, flags=re.I)
    if not match:
        match = re.search(r"KONULAR\s+ÖĞRENME\s+BİRİMİ\s+KAZANIMLARI", text, flags=re.I)
    if not match:
        total_match = re.search(r"\bTOPLAM\s+\d+\s+\d+\s+[\d,.]+\b", text, flags=re.I)
        if not total_match:
            return ""
        sub = text[total_match.end():]
    else:
        sub = text[match.end():]
    # Discard remarks/instructions and practice activities at the end of the document
    end_match = re.search(r"(UYGULAMA\s+FAALİYET|DERSİN\s+UYGULANMASINA\s+İLİŞKİN\s+AÇIKLAMALAR)", sub, flags=re.I)
    if end_match:
        sub = sub[:end_match.start()]
    return sub


def make_turkish_case_insensitive_regex(title):
    replacements = {
        'ı': '[ıiIİ]', 'i': '[ıiIİ]', 'I': '[ıiIİ]', 'İ': '[ıiIİ]',
        'ş': '[şŞsS]', 'Ş': '[şŞsS]', 's': '[şŞsS]', 'S': '[şŞsS]',
        'ğ': '[ğĞgG]', 'Ğ': '[ğĞgG]', 'g': '[ğĞgG]', 'G': '[ğĞgG]',
        'ü': '[üÜuU]', 'Ü': '[üÜuU]', 'u': '[üÜuU]', 'U': '[üÜuU]',
        'ö': '[öÖoO]', 'Ö': '[öÖoO]', 'o': '[öÖoO]', 'O': '[öÖoO]',
        'ç': '[çÇcC]', 'Ç': '[çÇcC]', 'c': '[çÇcC]', 'C': '[çÇcC]'
    }
    words = title.split()
    regex_words = []
    for word in words:
        regex_word = ""
        for char in word:
            if char in replacements:
                regex_word += replacements[char]
            elif char.isalpha():
                regex_word += f"[{char.lower()}{char.upper()}]"
            else:
                regex_word += re.escape(char)
        regex_words.append(regex_word)
    return r'\b' + r'[\s\r\n]+'.join(regex_words) + r'\b'


def find_unit_positions_original(section, units):
    positions = []
    for index, unit in enumerate(units):
        for title in unit_title_variants(unit["title"]):
            pattern = make_turkish_case_insensitive_regex(title)
            match = re.search(pattern, section)
            if match:
                positions.append((match.start(), index))
                break
    positions.sort()
    return positions


def unit_title_variants(title):
    title = one_line(title)
    variants = [title]
    key = normalize(title)
    if key.endswith(" yazma"):
        variants.append(re.sub(r"Yazma\s*$", "Yazmak", title, flags=re.I))
    if key.endswith(" yapma"):
        variants.append(re.sub(r"Yapma\s*$", "Yapmak", title, flags=re.I))
    if key.endswith(" etme"):
        variants.append(re.sub(r"Etme\s*$", "Etmek", title, flags=re.I))
    if key.endswith(" kullanma"):
        variants.append(re.sub(r"Kullanma\s*$", "Kullanmak", title, flags=re.I))
    return unique_keep_order(variants)


def split_numbered_cell_entries(value):
    text = clean_space(value)
    if not text:
        return []
    matches = list(re.finditer(r"(?<!\d)(\d+(?:\.\d+)*)\.?\s+", text))
    if not matches:
        return [{"number": "", "text": one_line(text)}] if len(text) > 2 else []
    entries = []
    for index, match in enumerate(matches):
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        body = one_line(text[start:end])
        if body:
            entries.append({"number": match.group(1), "text": body})
    return entries


def best_unit_index(value, units):
    key = normalize(value)
    if not key:
        return -1
    best_score = 0.0
    best_index = -1
    for index, unit in enumerate(units):
        unit_key = normalize(unit.get("title") or "")
        score = title_similarity(key, unit_key)
        if key == unit_key or key in unit_key or unit_key in key:
            score = max(score, 1.0)
        if score > best_score:
            best_score = score
            best_index = index
    return best_index if best_score >= 0.3 else -1


def parse_dbf_topics_from_tables(units, tables):
    if not units or not tables:
        return False
    changed = False
    current_unit_index = -1
    for table in tables:
        header_index = -1
        indexes = {}
        for row_index, row in enumerate(table):
            keys = [normalize(cell) for cell in row]
            joined = " ".join(keys)
            if "konu" in joined and "kazanim" in joined:
                header_index = row_index
                for index, key in enumerate(keys):
                    if ("ogrenme" in key or "birim" in key or "unite" in key) and "konu" not in key:
                        indexes["unit"] = index
                    elif "konu" in key:
                        indexes["topic"] = index
                    elif "kazanim" in key:
                        indexes["outcome"] = index
                    elif "aciklama" in key:
                        indexes["explanation"] = index
                break
        if header_index < 0 or "outcome" not in indexes:
            continue

        for row in table[header_index + 1:]:
            if not any(row):
                continue
            joined = normalize(" ".join(row))
            if "aciklama" == joined or "toplam" in joined:
                continue

            unit_cell = row[indexes["unit"]] if indexes.get("unit", -1) < len(row) and indexes.get("unit", -1) >= 0 else ""
            row_unit_index = best_unit_index(unit_cell, units)
            if row_unit_index >= 0:
                current_unit_index = row_unit_index
            if current_unit_index < 0:
                continue

            topic_cell = row[indexes["topic"]] if indexes.get("topic", -1) < len(row) and indexes.get("topic", -1) >= 0 else ""
            outcome_cell = row[indexes["outcome"]] if indexes["outcome"] < len(row) else ""
            topic_entries = split_numbered_cell_entries(topic_cell)
            outcome_entries = [
                item for item in split_numbered_cell_entries(outcome_cell)
                if is_outcome_line(item.get("text") or "") or item.get("number")
            ]
            if not topic_entries and not outcome_entries:
                continue

            unit = units[current_unit_index]
            if topic_entries:
                unit.setdefault("topics", [])
                for item in topic_entries:
                    unit["topics"].append(numbered_text(item) if item.get("number") else item["text"])
            if outcome_entries:
                unit.setdefault("_topic_entries", [])
                unit.setdefault("_outcome_entries", [])
                unit["_topic_entries"].extend(topic_entries)
                unit["_outcome_entries"].extend(outcome_entries)
                existing = unit.get("outcomes") or ""
                additions = [sentence_text(numbered_text(item)) for item in outcome_entries if one_line(item.get("text"))]
                unit["outcomes"] = one_line(f"{existing} {' '.join(additions)}")
            changed = True

    for unit in units:
        if unit.get("topics"):
            unit["topics"] = unique_keep_order(unit["topics"])[:24]
        pairs = build_topic_outcome_pairs(unit.pop("_topic_entries", []), unit.pop("_outcome_entries", []))
        if pairs:
            unit["topicOutcomePairs"] = pairs[:24]
    return changed


def parse_dbf_topics_from_columns(units, column_lines):
    if not units or not column_lines:
        return False
    changed = False
    current_unit_index = -1
    last_topic_entry = None
    last_outcome_entry = None
    unit_entries = {index: {"topics": [], "outcomes": []} for index in range(len(units))}
    pending_entries = {"topics": [], "outcomes": []}
    left_buffers = {}
    header_seen = False

    def active_entries():
        if current_unit_index >= 0:
            return unit_entries[current_unit_index]
        return pending_entries

    def flush_pending(unit_index):
        if unit_index < 0:
            return
        unit_entries[unit_index]["topics"].extend(pending_entries["topics"])
        unit_entries[unit_index]["outcomes"].extend(pending_entries["outcomes"])
        pending_entries["topics"] = []
        pending_entries["outcomes"] = []

    for line in column_lines:
        left = line.get("left") or ""
        topic_text = line.get("topic") or ""
        outcome_text = line.get("outcome") or ""
        joined_key = normalize(f"{left} {topic_text} {outcome_text}")
        if not joined_key:
            continue
        if not header_seen:
            if line.get("page", 0) > 1 and ("konular" in normalize(topic_text) or "kazanim aciklamalari" in joined_key):
                header_seen = True
            continue
        if any(bit in joined_key for bit in ("ders bilgi formu", "ogrenme birimi kazanimlari", "kazanim aciklamalari")):
            continue
        if "uygulama faaliyetleri" in joined_key or "dersin uygulanmasina" in joined_key:
            break

        if left:
            page = line.get("page")
            if not re.match(r"^\d+\.?$", left.strip()):
                left_buffers[page] = one_line(f"{left_buffers.get(page, '')} {left}")
            idx = best_unit_index(left, units)
            if idx < 0:
                idx = best_unit_index(left_buffers.get(page, ""), units)
            if idx >= 0 and idx != current_unit_index:
                if current_unit_index < 0:
                    flush_pending(idx)
                current_unit_index = idx
                left_buffers[page] = ""
                last_topic_entry = None
                last_outcome_entry = None

        if current_unit_index < 0:
            entries = pending_entries
        else:
            entries = unit_entries[current_unit_index]

        if topic_text:
            topic_source = one_line(f"{left} {topic_text}") if re.match(r"^\d+\.?$", left.strip()) else topic_text
            numbered = split_numbered_line(topic_source)
            if numbered:
                number, text_part = numbered
                entry = {"number": number, "text": text_part}
                entries["topics"].append(entry)
                last_topic_entry = entry
                changed = True
            elif last_topic_entry and not is_material_excluded(topic_text) and not is_outcome_line(topic_text):
                last_topic_entry["text"] = one_line(f"{last_topic_entry['text']} {topic_text}")

        if outcome_text:
            if is_bullet_line(outcome_text):
                continue
            numbered = split_numbered_line(outcome_text)
            if numbered:
                number, text_part = numbered
                if len(text_part) > 6 and not is_material_excluded(text_part):
                    if (
                        number == "1"
                        and current_unit_index >= 0
                        and unit_entries[current_unit_index]["outcomes"]
                        and not left
                        and not topic_text
                    ):
                        current_unit_index = -1
                        entries = pending_entries
                        last_topic_entry = None
                        last_outcome_entry = None
                    entry = {"number": number, "text": text_part}
                    entries["outcomes"].append(entry)
                    last_outcome_entry = entry
                    changed = True
                else:
                    last_outcome_entry = None
            elif (
                last_outcome_entry
                and not re.search(r"[.!?]\s*$", last_outcome_entry["text"])
                and not is_bullet_line(outcome_text)
            ):
                last_outcome_entry["text"] = one_line(f"{last_outcome_entry['text']} {outcome_text}")

    if not changed:
        return False

    for index, entries in unit_entries.items():
        unit = units[index]
        topic_entries = entries["topics"]
        outcome_entries = entries["outcomes"]
        if topic_entries:
            unit["topics"] = unique_keep_order([numbered_text(item) for item in topic_entries])[:24]
        if outcome_entries:
            unit["outcomes"] = " ".join(sentence_text(numbered_text(item)) for item in outcome_entries)
        pairs = build_topic_outcome_pairs(topic_entries, outcome_entries)
        if pairs:
            unit["topicOutcomePairs"] = pairs[:24]
    return True


def parse_dbf_topics(text, units):
    section = find_topics_section(text)
    if not section or not units:
        return units
    positions = find_unit_positions_original(section, units)
    if not positions:
        return units

    for order, (start, unit_index) in enumerate(positions):
        end = positions[order + 1][0] if order + 1 < len(positions) else len(section)
        block = section[start:end]
        lines = [one_line(line) for line in block.splitlines()]
        topics = []
        outcomes = []
        topic_entries = []
        outcome_entries = []
        collecting_topics = True
        blank_after_topics = False
        ignoring_explanation = False
        
        title_pattern = make_turkish_case_insensitive_regex(units[unit_index]["title"])
        
        for line in lines:
            if not line:
                if topics:
                    blank_after_topics = True
                continue
            
            title_prefix = re.match(rf"^\s*{title_pattern}\s*", line, flags=re.I)
            if title_prefix:
                line = one_line(line[title_prefix.end():])
                if not line:
                    continue
                
            if is_bullet_line(line):
                bullet_text = strip_bullet_marker(line)
                if collecting_topics and not outcomes and bullet_text and not blank_after_topics:
                    topics.append(bullet_text)
                    topic_entries.append({"number": "", "text": bullet_text})
                    continue
                collecting_topics = False
                ignoring_explanation = True
                continue
                
            numbered = split_numbered_line(line)
            if numbered:
                number, text_part = numbered
                
                # Heuristic: if we see "1." a second time, it's the start of outcomes
                if number == "1" and len(topics) > 0:
                    collecting_topics = False
                    
                is_out = is_outcome_line(text_part)
                if is_out or not collecting_topics:
                    outcomes.append(numbered_text({"number": number, "text": text_part}))
                    outcome_entries.append({"number": number, "text": text_part})
                    collecting_topics = False
                    ignoring_explanation = False
                elif collecting_topics:
                    topics.append(numbered_text({"number": number, "text": text_part}))
                    topic_entries.append({"number": number, "text": text_part})
                    blank_after_topics = False
                continue
                
            if collecting_topics and topics and not is_outcome_line(line):
                topics[-1] = one_line(f"{topics[-1]} {line}")
                if topic_entries:
                    topic_entries[-1]["text"] = one_line(f"{topic_entries[-1]['text']} {line}")
            elif not collecting_topics and not ignoring_explanation and outcomes:
                outcomes[-1] = one_line(f"{outcomes[-1]} {line}")
                if outcome_entries:
                    outcome_entries[-1]["text"] = one_line(f"{outcome_entries[-1]['text']} {line}")
                
        units[unit_index]["topics"] = unique_keep_order(topics)[:40]
        pairs = build_topic_outcome_pairs(topic_entries, outcome_entries)
        if pairs:
            units[unit_index]["topicOutcomePairs"] = pairs[:40]
        if outcomes:
            formatted_outcomes = []
            for out in unique_keep_order(outcomes)[:80]:
                out = out.strip()
                if out:
                    if not out.endswith("."):
                        out += "."
                    formatted_outcomes.append(out)
            units[unit_index]["outcomes"] = " ".join(formatted_outcomes)
    return units


def count_unit_outcome_items(unit):
    pair_count = sum(len(pair.get("outcomes") or []) for pair in unit.get("topicOutcomePairs") or [])
    text_count = len(re.findall(r"(?<!\d)\d+\.\s+", unit.get("outcomes") or ""))
    return max(pair_count, text_count)


def needs_dbf_detail_fallback(units):
    if not units:
        return False
    if not any(unit.get("outcomes") or unit.get("topics") or unit.get("topicOutcomePairs") for unit in units):
        return True
    for unit in units:
        expected = int(unit.get("outcomeCount") or 0)
        actual = count_unit_outcome_items(unit)
        if not unit.get("topics") and not unit.get("topicOutcomePairs"):
            return True
        if expected and actual and actual < max(1, expected - 1):
            return True
        if expected and not actual:
            return True
    return False


def unique_keep_order(items):
    seen = set()
    result = []
    for item in items:
        key = normalize(item)
        if not key or key in seen:
            continue
        seen.add(key)
        result.append(item)
    return result


def readable_ratio(text):
    if not text:
        return 0
    letters = re.findall(r"[A-Za-zÇĞİÖŞÜçğıöşü]", text)
    odd = re.findall(r"[ĂƟƨŦϭϮϯϰϱϲϳϴϵϬ]", text)
    return max(0, len(letters) - len(odd) * 3) / max(1, len(text))


def find_toc_region(text):
    """Find the table of contents region in PDF text.
    
    Searches for 'İÇİNDEKİLER' header and returns only the TOC portion.
    Returns the full text if no TOC header is found (fallback).
    """
    # Search for İÇİNDEKİLER header (case-insensitive, Turkish-aware)
    toc_patterns = [
        r"İÇİNDEKİLER",
        r"İ\s*Ç\s*İ\s*N\s*D\s*E\s*K\s*İ\s*L\s*E\s*R",  # Spaced-out OCR artifact
        r"ICINDEKILER",
        r"İçindekiler",
    ]
    
    toc_start = -1
    for pattern in toc_patterns:
        match = re.search(pattern, text, flags=re.I)
        if match:
            toc_start = match.end()
            break
    
    if toc_start < 0:
        return text, False  # Not found, return full text
    
    toc_text = text[toc_start:]
    
    # Find TOC end: look for markers that indicate body text starts
    toc_end_patterns = [
        r"\n\s*(?:1\s*\.\s*)?ÖĞRENME\s+BİRİMİ\b",  # "1. ÖĞRENME BİRİMİ" heading
        r"\n\s*1\s*\.\s*BÖLÜM\b",                    # "1. BÖLÜM"
        r"\n\s*(?:ÖNSÖZ|GİRİŞ|SUNUŞ|AÇIKLAMALAR)\s*\n",
        r"\n\s*TEMEL\s+KAVRAMLAR\b",                  # "TEMEL KAVRAMLAR" section header
        r"\n\s*NELER\s+ÖĞRENECEKSİNİZ",              # Learning objectives section
    ]
    
    toc_end = len(toc_text)
    for pattern in toc_end_patterns:
        match = re.search(pattern, toc_text, flags=re.I)
        if match:
            toc_end = min(toc_end, match.start())
    
    # Also use heuristic: if we see many consecutive long lines (>100 chars)
    # without dot-leader patterns, that's body text
    lines = toc_text[:toc_end].splitlines()
    long_line_streak = 0
    cut_at_line = len(lines)
    for i, raw_line in enumerate(lines):
        line = one_line(raw_line)
        if len(line) > 120 and not re.search(r"\.{3,}", raw_line):
            long_line_streak += 1
            if long_line_streak >= 3:
                cut_at_line = max(0, i - 2)
                break
        else:
            long_line_streak = 0
    
    result_lines = lines[:cut_at_line]
    return "\n".join(result_lines), True


def is_toc_noise(number, title, line_length):
    """Check if a parsed TOC entry is actually noise from body text."""
    # Very long entries are body text, not TOC items (TOC titles are short)
    if line_length > 120:
        return True
    if len(title) > 100:
        return True
    
    # Large top-level numbers are unlikely in TOC (e.g., 823, 3689)
    top = number.split(".")[0]
    try:
        top_int = int(top)
        if top_int > 20:
            return True
    except ValueError:
        return True

    if number_depth(number) >= 3 and re.match(r"^\d+\s+[A-Za-zÇĞİÖŞÜçğıöşü]", title):
        return False
    
    # Numbers that look like decimal values (e.g., "0" as standalone)
    if top == "0":
        return True
    
    # Math operators and symbols indicate body text
    if re.search(r"[=÷×∗\+\-]{2,}", title):
        return True
    # Starting with math-like content: "4 -8", ",46756 dır"
    if re.match(r"^[,.\d\s\-\+]+[a-zığüşöç]", title, flags=re.I):
        return True
    
    # Contains noise keywords
    title_lower = normalize(title)
    noise_count = sum(1 for kw in TOC_NOISE_KEYWORDS if normalize(kw) in title_lower)
    if noise_count >= 3:
        return True
    
    # Quotes indicate body text
    if '"' in title or '"' in title or '«' in title:
        return True
    
    # Looks like "Öğrenme Birimi Zihin Haritası" - mind map pages
    if re.search(r"zihin\s+haritas", title_lower):
        return True
    
    # "NELER ÖĞRENECEKSİNİZ" sections
    if "neler ogreneceksiniz" in title_lower or "ogrenme birimi" in title_lower.replace("i", "i"):
        return True
    
    return False


def validate_toc_sequence(topics):
    """Post-process TOC entries to remove sequence breaks (noise that slipped through).
    
    Detects large jumps in numbering that indicate body text contamination.
    For example: 1.1, 1.2, 1.3, 823, 1620 → truncate at 823.
    """
    if not topics:
        return topics
    
    # Group by top-level number and find anomalies
    valid_tops = set()
    for item in topics:
        top = item["number"].split(".")[0]
        try:
            top_int = int(top)
            if top_int <= 20:
                valid_tops.add(top)
        except ValueError:
            pass
    
    # Filter: keep only entries whose top-level number is in valid set
    filtered = [item for item in topics if item["number"].split(".")[0] in valid_tops]
    
    # Check for sequence consistency within each top-level group
    result = []
    for item in filtered:
        parts = item["number"].split(".")
        # Check if sub-numbers are reasonable (< 30 at each level)
        valid = True
        for part in parts:
            try:
                if int(part) > 30:
                    valid = False
                    break
            except ValueError:
                valid = False
                break
        if valid:
            result.append(item)
    
    return result


def material_number_sort_key(item):
    parts = []
    for part in str(item.get("number") or "").split("."):
        try:
            parts.append(int(part))
        except ValueError:
            parts.append(999)
    return parts


def normalize_material_topic_order(topics):
    best_by_number = {}
    for item in topics or []:
        number = item.get("number")
        if not number:
            continue
        current = best_by_number.get(number)
        if not current or len(item.get("title") or "") > len(current.get("title") or ""):
            best_by_number[number] = item
    return sorted(best_by_number.values(), key=material_number_sort_key)


def parse_material_toc(text):
    if readable_ratio(text) < 0.12 and not re.search(r"\d+(?:\.\d+){1,5}\.?\s+", text):
        return []
    
    # Step 1: Try to find the actual TOC region
    toc_text, toc_found = find_toc_region(text)
    
    topics = TocTopics()
    pending = None
    noise_count = 0

    def flush_pending():
        nonlocal pending, noise_count
        if not pending:
            return
        title = clean_material_title(pending["title"])
        if (
            len(title) >= 3
            and not is_outcome_line(title)
            and not is_material_excluded(title)
        ):
            if not is_toc_noise(pending["number"], title, pending.get("line_length", 0)):
                topics.append({"number": pending["number"], "title": title})
            else:
                noise_count += 1
        pending = None

    for raw in toc_text.splitlines():
        line = one_line(raw)
        if not line or len(line) < 5:
            continue
        line = re.sub(r"\.{3,}\s*\d+\s*$", "", line).strip()
        line_length = len(line)
        match = re.match(r"^(\d+(?:\.\d+){0,5})\b\.?\s*(.+?)(?:\s+\d+)?$", line)
        if match:
            flush_pending()
            number = match.group(1)
            title = one_line(match.group(2))
            if title:
                pending = {"number": number, "title": title, "line_length": line_length}
            continue

        continuation = re.sub(r"\s+\d+\s*$", "", line).strip()
        if (
            pending
            and continuation
            and len(continuation) < 80
            and not re.match(r"^(sayfa|page)\b", normalize(continuation))
            and not is_material_excluded(continuation)
        ):
            pending["title"] = one_line(f"{pending['title']} {continuation}")
            pending["line_length"] = max(pending.get("line_length", 0), line_length)
            continue

        flush_pending()

    flush_pending()
    
    # Step 2: Post-process to remove sequence anomalies
    raw_count = len(topics)
    topics = TocTopics(normalize_material_topic_order(validate_toc_sequence(topics)))
    noise_count += (raw_count - len(topics))
    
    # Attach metadata to list object
    setattr(topics, "toc_found", toc_found)
    setattr(topics, "noise_count", noise_count)
    
    return topics


def clean_material_title(title):
    title = one_line(title)
    title = re.sub(r"\b(Sa)\s+(?=[yY\?])", r"\1", title)
    title = re.sub(r"(?<=[a-zçğıöşü])(?=[A-ZÇĞİÖŞÜ])", " ", title)
    title = re.sub(r"(?<=\?)(?=[A-ZÇĞİÖŞÜ])", " ", title)
    title = re.sub(r"\b([A-Za-zÇĞİÖŞÜçğıöşü])\s+([A-Za-zÇĞİÖŞÜçğıöşü]{2,})\b", r"\1\2", title)
    title = re.split(r"\b(?:Aşağıdaki|Asagidaki|Aşağıda|Asagida|A.{0,8}daki)\b", title, maxsplit=1, flags=re.I)[0]
    title = re.sub(r"(?<=[a-zçğıöşü])(?=[A-ZÇĞİÖŞÜ])", " ", title)
    title = re.sub(r"(?<=\?)(?=[A-ZÇĞİÖŞÜ])", " ", title)
    title = re.sub(r"\b(Sa)\s+(?=[yY\?])", r"\1", title)
    title = re.sub(r"\s+\d+\s*$", "", title)
    return one_line(title)


def is_material_excluded(title):
    key = normalize(title)
    excluded = (
        "ders ici etkinlik",
        "ders ici",
        "etkinlik",
        "olcme ve degerlendirme",
        "olcme degerlendirme",
        "cevap anahtari",
        "alistirma",
        "uygulama",
        "sira sizde",
        "asagidaki",
        "asagida",
        "yapiniz",
        "yap n z",
        "cozunuz",
        "coz n z",
        "cevaplayiniz",
        "cevaplay n z",
        "inceleyiniz",
        "inceley n z",
        "ornek soru",
        "ornek uygulama",
    )
    if any(bit in key for bit in excluded):
        return True
    if re.match(r"^\d+\s+sa$", key):
        return True
    if re.match(r"^\d+\s+[a-z]{1,2}$", key):
        return True
    return False


def strip_leading_number(value):
    return re.sub(r"^\s*\d+(?:\.\d+)*\.?\s+", "", one_line(value))


def material_topic_text(item):
    return f"{item['number']}. {item['title']}"


def number_depth(number):
    return len(str(number or "").split("."))


def is_descendant_number(child, parent):
    child = str(child or "")
    parent = str(parent or "")
    return child.startswith(f"{parent}.")


def material_title_matches(source_title, material_title):
    source = strip_leading_number(source_title)
    material = strip_leading_number(material_title)
    source_key = normalize(source)
    material_key = normalize(material)
    if not source_key or not material_key:
        return False
    if source_key == material_key or source_key in material_key or material_key in source_key:
        return True
    return title_similarity(source, material) >= 0.55


def collect_material_subtree(material_topics, anchor_index):
    anchor = material_topics[anchor_index]
    anchor_number = anchor["number"]
    anchor_depth = number_depth(anchor_number)
    collected = [anchor]
    for item in material_topics[anchor_index + 1:]:
        depth = number_depth(item["number"])
        if depth <= anchor_depth and not is_descendant_number(item["number"], anchor_number):
            break
        if is_descendant_number(item["number"], anchor_number):
            collected.append(item)
    return collected


def unique_material_items(items):
    seen = set()
    result = []
    for item in items:
        key = item["number"]
        if key in seen:
            continue
        seen.add(key)
        result.append(item)
    return result


def find_material_anchor_indexes(material_topics, titles):
    anchors = []
    for index, item in enumerate(material_topics):
        if any(material_title_matches(title, item["title"]) for title in titles if title):
            anchors.append(index)
    return anchors


def dbf_topic_titles_for_unit(unit):
    titles = [unit.get("title", "")]
    titles.extend(strip_leading_number(topic) for topic in unit.get("topics") or [])
    for pair in unit.get("topicOutcomePairs") or []:
        titles.append(strip_leading_number(pair.get("topic") or ""))
    return [title for title in titles if title]


def material_topics_for_unit(unit, material_topics):
    anchors = find_material_anchor_indexes(material_topics, dbf_topic_titles_for_unit(unit))
    collected = []
    for index in anchors:
        collected.extend(collect_material_subtree(material_topics, index))
    return unique_material_items(collected)


def align_topic_pairs_to_material(unit, material_items):
    pairs = unit.get("topicOutcomePairs") or []
    if not pairs or not material_items:
        return pairs
    aligned = []
    for pair in pairs:
        pair_title = strip_leading_number(pair.get("topic") or "")
        anchors = find_material_anchor_indexes(material_items, [pair_title])
        pair_material_items = []
        for index in anchors:
            pair_material_items.extend(collect_material_subtree(material_items, index))
        pair_material_items = unique_material_items(pair_material_items)
        if pair_material_items:
            aligned.append({
                **pair,
                "topic": material_topic_text(pair_material_items[0]),
                "topics": [material_topic_text(item) for item in pair_material_items],
            })
        else:
            aligned.append(pair)
    return aligned


def title_similarity(a, b):
    """Simple token overlap similarity between two normalized strings."""
    ta = set(normalize(a).split())
    tb = set(normalize(b).split())
    if not ta or not tb:
        return 0.0
    overlap = ta & tb
    # Remove very short/common tokens
    overlap = {t for t in overlap if len(t) > 2}
    if not overlap:
        return 0.0
    return len(overlap) / min(len(ta), len(tb))


def find_best_unit_for_section(section_title, units):
    """Find the best matching unit index for a section title."""
    best_score = 0.0
    best_index = -1
    norm_section = normalize(section_title)
    for idx, unit in enumerate(units):
        score = title_similarity(norm_section, unit["title"])
        if score > best_score:
            best_score = score
            best_index = idx
    return best_index if best_score >= 0.3 else -1


def merge_material_topics(units, material_topics):
    if not material_topics or not units:
        return units

    matched_by_title = False
    for unit in units:
        material_items = material_topics_for_unit(unit, material_topics)
        if material_items:
            hours = int(unit.get("hours") or 4)
            limit = min(16, max(4, hours))
            unit["topics"] = unique_keep_order([material_topic_text(item) for item in material_items])[:limit]
            unit["topicOutcomePairs"] = align_topic_pairs_to_material(unit, material_items)[:limit]
            matched_by_title = True

    # Group material topics by top-level section number
    by_top_level = {}
    for item in material_topics:
        top = item["number"].split(".")[0]
        by_top_level.setdefault(top, []).append(item)

    # First, try numeric matching (section number == unit index)
    numeric_match_used = False
    for top, items in by_top_level.items():
        try:
            idx = int(top) - 1
        except ValueError:
            continue
        if 0 <= idx < len(units):
            topics = [material_topic_text(i) for i in items if len(i["number"].split(".")) <= 5]
            current_topics = units[idx].get("topics") or []
            if topics and (not matched_by_title or len(current_topics) < 4):
                hours = int(units[idx].get("hours") or 4)
                limit = min(16, max(4, hours))
                units[idx]["topics"] = unique_keep_order(topics)[:limit]
                units[idx]["topicOutcomePairs"] = align_topic_pairs_to_material(units[idx], items)[:limit]
                numeric_match_used = True

    # If numeric matching didn't work well, try title similarity matching
    if not numeric_match_used or all(not u.get("topics") for u in units):
        # Group top-level sections by their title
        top_level_titles = {}
        for item in material_topics:
            parts = item["number"].split(".")
            top = parts[0]
            if len(parts) == 1:
                top_level_titles[top] = item["title"]

        # Fallback: if a top group doesn't have a 1-part title line, use its first item's title
        for top, items in by_top_level.items():
            if top not in top_level_titles and items:
                top_level_titles[top] = items[0]["title"]

        for top, section_title in top_level_titles.items():
            idx = find_best_unit_for_section(section_title, units)
            if idx >= 0:
                topics = [
                    material_topic_text(i)
                    for i in material_topics
                    if i["number"].split(".")[0] == top and len(i["number"].split(".")) <= 5
                ]
                if topics and not units[idx].get("topics"):
                    top_items = [i for i in material_topics if i["number"].split(".")[0] == top and len(i["number"].split(".")) <= 5]
                    hours = int(units[idx].get("hours") or 4)
                    limit = min(16, max(4, hours))
                    units[idx]["topics"] = unique_keep_order(topics)[:limit]
                    units[idx]["topicOutcomePairs"] = align_topic_pairs_to_material(units[idx], top_items)[:limit]

    return units


def numbering_gap_warnings(material_topics):
    warnings = []
    by_parent = {}
    for item in material_topics or []:
        number = str(item.get("number") or "")
        parts = number.split(".")
        if len(parts) < 2:
            continue
        try:
            current = int(parts[-1])
        except ValueError:
            continue
        parent = ".".join(parts[:-1])
        by_parent.setdefault(parent, set()).add(current)

    for parent, values in by_parent.items():
        if len(values) < 3 or max(values) > 30:
            continue
        missing = [value for value in range(min(values), max(values) + 1) if value not in values]
        if missing and len(missing) <= 5:
            warnings.append(f"İçindekilerde {parent} altında atlanan madde numaraları olabilir: {', '.join(map(str, missing[:6]))}.")
    return warnings[:8]


def build_quality_warnings(units, material_topics, material_text=""):
    warnings = []
    if material_topics:
        warnings.extend(numbering_gap_warnings(material_topics))
        
        # Check custom metadata attributes set in parse_material_toc
        toc_found = getattr(material_topics, "toc_found", True)
        noise_count = getattr(material_topics, "noise_count", 0)
        
        if not toc_found:
            warnings.append("Kitap içindekiler tablosu başlığı (İÇİNDEKİLER) otomatik tespit edilemedi, ilk sayfalar tarandı.")
        if noise_count > 0:
            warnings.append(f"Kitap içindekilerinden gürültü olabilecek {noise_count} adet satır temizlendi.")
            
        total_topics = sum(len(unit.get("topics") or []) for unit in units)
        if total_topics > 80:
            warnings.append(f"Toplam konu sayısı normalden fazla ({total_topics}), kitap içeriği çok yoğun veya gürültülü olabilir.")
    else:
        warnings.append("Kitap içindekiler okunamadı veya seçilmedi; konu dağılımı DBF verisine göre hazırlandı.")

    for unit in units:
        title = unit.get("title") or "Öğrenme birimi"
        topics = unit.get("topics") or []
        pairs = unit.get("topicOutcomePairs") or []
        hours = int(unit.get("hours") or 4)
        
        # Ek güvenlik kontrolü: konu sayısı ünite saat oranının çok üzerindeyse uyarı üret
        if len(topics) > hours * 2:
            warnings.append(f"{title}: Konu sayısı ders saatine oranla çok yüksek ({len(topics)} konu / {hours} saat).")
            
        if material_topics and not topics:
            warnings.append(f"{title}: kitap içindekilerinden eşleşen konu bulunamadı.")
        for pair in pairs:
            pair_title = pair.get("topic") or pair.get("number") or title
            pair_topics = pair.get("topics") or []
            outcomes = pair.get("outcomes") or []
            if material_topics and pair.get("topic") and not pair_topics:
                warnings.append(f"{title}: '{pair_title}' için kitap içindekilerinde net alt konu eşleşmesi bulunamadı.")
            if not outcomes:
                warnings.append(f"{title}: '{pair_title}' için kazanım metni boş görünüyor.")
            for topic in pair_topics:
                text = strip_leading_number(topic)
                if len(text) < 6 or re.search(r"\b[A-Za-zÇĞİÖŞÜçğıöşü]{1,2}$", text):
                    warnings.append(f"{title}: kısa/kırık konu başlığı olabilir: {topic}")
    return unique_keep_order(warnings)[:20]


def verify_dbf_totals(dbf_text, units, warnings):
    # Find TOPLAM row in the raw text
    patterns = [
        r"DERSİN\s+KAZANIM\s+TABLOSU",
        r"KAZANIM\s+SAYISI\s+VE\s+SÜRE\s+TABLOSU",
    ]
    section = ""
    for pattern in patterns:
        match = re.search(pattern, dbf_text, flags=re.I)
        if match:
            start = match.end()
            # Find the TOPLAM line in the text following the table header
            toplam_match = re.search(r"\n\s*(TOPLAM\s+\d+\s+\d+\s+[\d,.]+)\s*(?:\n|$)", dbf_text[start:], flags=re.I)
            if toplam_match:
                section = toplam_match.group(1)
                break
                
    if not section:
        # Fallback: search for TOPLAM followed by three numbers globally in the document
        global_match = re.search(r"\bTOPLAM\s+(\d+)\s+(\d+)\s+([\d,.]+)\b", dbf_text, flags=re.I)
        if global_match:
            section = global_match.group(0)

    if section:
        # Parse the totals
        total_match = re.search(r"TOPLAM\s+(\d+)\s+(\d+)\s+([\d,.]+)", section, flags=re.I)
        if total_match:
            total_outcomes = int(total_match.group(1))
            total_hours = int(total_match.group(2))
            try:
                total_ratio = int(float(total_match.group(3).replace(",", ".")))
            except:
                total_ratio = 100
            
            # Calculate sums from the parsed units
            sum_outcomes = sum(u.get("outcomeCount") or 0 for u in units)
            sum_hours = sum(u.get("hours") or 0 for u in units)
            sum_ratios = 0
            for u in units:
                try:
                    sum_ratios += int(float(str(u.get("ratio") or 0).replace(",", ".")))
                except:
                    pass
            
            # Perform verification and add warnings if mismatched
            if sum_outcomes != total_outcomes:
                warnings.append(
                    f"Kazanım Sayısı Uyuşmazlığı: Tablodaki toplam kazanım sayısı ({total_outcomes}) ile "
                    f"aktarılan ünitelerin kazanım sayıları toplamı ({sum_outcomes}) uyuşmuyor!"
                )
            if sum_hours != total_hours:
                warnings.append(
                    f"Ders Saati Uyuşmazlığı: Tablodaki toplam ders saati ({total_hours}) ile "
                    f"aktarılan ünitelerin ders saatleri toplamı ({sum_hours}) uyuşmuyor!"
                )
            if sum_ratios != total_ratio:
                warnings.append(
                    f"Oran Uyuşmazlığı: Tablodaki toplam yüzde oranı ({total_ratio}%) ile "
                    f"aktarılan ünitelerin yüzdesel ağırlıkları toplamı ({sum_ratios}%) uyuşmuyor!"
                )


def verify_unit_detail_completeness(units, warnings):
    for unit in units:
        title = unit.get("title") or "Öğrenme birimi"
        expected = int(unit.get("outcomeCount") or 0)
        actual = count_unit_outcome_items(unit)
        if expected and actual and actual < expected:
            warnings.append(f"{title}: DBF tablosunda {expected} kazanım görünüyor, metinden {actual} kazanım aktarılabildi.")
        if expected and not actual:
            warnings.append(f"{title}: DBF tablosunda {expected} kazanım var ancak kazanım metni doğrulanamadı.")
        if not unit.get("topics") and not unit.get("topicOutcomePairs"):
            warnings.append(f"{title}: DBF öğrenme birimi konuları doğrulanamadı.")


def build_template(dbf_text, material_text, meta, source_info, dbf_tables=None, dbf_columns=None):
    units = parse_unit_table(dbf_text, dbf_tables)
    if not units:
        raise RuntimeError("DBF içinde kazanım/süre tablosu okunamadı.")
    column_topics_found = parse_dbf_topics_from_columns(units, dbf_columns or [])
    if not column_topics_found or needs_dbf_detail_fallback(units):
        parse_dbf_topics_from_tables(units, dbf_tables or [])
    if needs_dbf_detail_fallback(units):
        units = parse_dbf_topics(dbf_text, units)
    material_topics = parse_material_toc(material_text or "")
    units = merge_material_topics(units, material_topics)
    warnings = build_quality_warnings(units, material_topics, material_text or "")
    verify_dbf_totals(dbf_text, units, warnings)
    verify_unit_detail_completeness(units, warnings)
    warnings = unique_keep_order(warnings)[:40]
    orig_lesson_name = meta.get("lessonName") or meta.get("title") or ""
    lesson_name = parse_lesson_name(dbf_text, orig_lesson_name)
    if "protokol" in orig_lesson_name.lower() or "pro" in orig_lesson_name.lower():
        if "protokol" not in lesson_name.lower() and "pro" not in lesson_name.lower():
            lesson_name += " (Protokol)"
            
    grade = parse_grade(dbf_text, meta.get("grade") or "")
    area_name = meta.get("area") or meta.get("areaName") or "MEB"
    school_type = meta.get("schoolType") or "mtal"
    weekly_hours = parse_weekly_hours(dbf_text)

    normalized_units = []
    for unit in units:
        topics = unit.get("topics") or []
        outcomes_text = unit.get("outcomes") or ""
        if not outcomes_text and not topics:
            outcomes_text = f"{unit.get('outcomeCount', 0)} kazanım, {unit.get('hours', 0)} ders saati."
        normalized_units.append({
            "title": unit["title"],
            "outcomes": outcomes_text,
            "hours": max(1, int(unit.get("hours") or 1)),
            "topics": topics,
            "topicOutcomePairs": unit.get("topicOutcomePairs") or [],
            "outcomeCount": unit.get("outcomeCount", 0),
            "ratio": unit.get("ratio", ""),
        })

    return {
        "id": meta.get("id") or f"{school_type}-{normalize(area_name).replace(' ', '-')}-{normalize(lesson_name).replace(' ', '-')}-{normalize(grade).replace(' ', '-')}",
        "type": "mesem" if str(school_type).lower() == "mesem" else "mtal",
        "areaId": normalize(area_name).replace(" ", "-") or "meb",
        "areaName": area_name,
        "grade": grade,
        "lessonName": lesson_name,
        "year": meta.get("year") or "2025-2026",
        "weeklyHours": weekly_hours,
        "units": normalized_units,
        "source": source_info,
        "warnings": warnings,
    }


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser()
    parser.add_argument("--dbf", required=True)
    parser.add_argument("--material", default="")
    parser.add_argument("--meta", default="{}")
    args = parser.parse_args()

    meta = json.loads(args.meta or "{}")
    cleanup_dirs = []
    dbf_pdf, dbf_dir, dbf_count = resolve_document(args.dbf, meta.get("lessonName") or meta.get("title") or "", meta.get("grade") or "", meta.get("file_in_rar") or "")
    if dbf_dir:
        cleanup_dirs.append(dbf_dir)

    material_text = ""
    material_pdf_name = ""
    material_count = 0
    if args.material:
        try:
            material_pdf, material_dir, material_count = resolve_document(args.material, meta.get("lessonName") or meta.get("title") or "", meta.get("grade") or "", meta.get("file_in_rar") or "")
            if material_dir:
                cleanup_dirs.append(material_dir)
            material_pdf_name = material_pdf.name
            # Bileşen 3: Akıllı Sayfa Sınırı (İlk geçiş: max_pages=10, TOC bulunamazsa max_pages=30 okuma)
            material_text = read_pdf_text(material_pdf, max_pages=10)
            _, toc_found = find_toc_region(material_text)
            if not toc_found:
                material_text = read_pdf_text(material_pdf, max_pages=30)
        except Exception as exc:
            material_text = ""
            material_pdf_name = f"Okunamadı: {exc}"

    try:
        dbf_text = read_pdf_text(dbf_pdf)
        dbf_tables = []
        dbf_columns = read_pdf_column_lines(dbf_pdf, max_pages=20)
        template = build_template(dbf_text, material_text, meta, {
            "dbfPdf": dbf_pdf.name,
            "dbfCandidateCount": dbf_count,
            "materialPdf": material_pdf_name,
            "materialCandidateCount": material_count,
            "pdfReader": "pdfplumber" if pdfplumber else "pypdf",
            "dbfTableCount": len(dbf_tables),
            "dbfColumnLineCount": len(dbf_columns),
            "parserVersion": PARSER_VERSION,
        }, dbf_tables, dbf_columns)
        print(json.dumps({"template": template, "warnings": template.get("warnings", [])}, ensure_ascii=False))
    finally:
        for directory in cleanup_dirs:
            shutil.rmtree(directory, ignore_errors=True)


if __name__ == "__main__":
    main()
