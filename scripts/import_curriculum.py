import json
import re
import sys

try:
    from pypdf import PdfReader
except Exception:
    try:
        from PyPDF2 import PdfReader
    except Exception:
        PdfReader = None


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
    "kayıtlarını yapar",
    "analiz eder",
    "gerçekleştirir",
    "çözer",
    "planlar",
    "yönetir",
    "yazar",
    "okur",
    "çizer",
    "hesaplar",
    "belirler",
)


def clean_space(value):
    value = re.sub(r"\s+", " ", str(value or "")).strip()
    value = value.replace("\x00", "").replace("\u0000", "")
    value = re.sub(r"\s+([.,;:!?])", r"\1", value)
    return value.strip()


def find_section(text, start_pattern, end_patterns):
    start_match = re.search(start_pattern, text, flags=re.I | re.S)
    if not start_match:
        return ""
    start = start_match.end()
    end = len(text)
    for pattern in end_patterns:
        match = re.search(pattern, text[start:], flags=re.I | re.S)
        if match:
            end = min(end, start + match.start())
    return text[start:end]


def normalize_key(value):
    return clean_space(value).casefold()


def is_outcome(value):
    lowered = normalize_key(value)
    return len(value) > 10 and any(re.search(rf"\b{re.escape(word)}\b", lowered) for word in OUTCOME_WORDS)


def parse_unit_table(text):
    table = find_section(
        text,
        r"(?:DERS[İI]N\s+KAZANIM\s+TABLOSU|KAZANIM\s+SAYISI\s+VE\s+S[ÜU]RE\s+TABLOSU)",
        [r"ÖĞRENME\s+B[İI]R[İI]M[İI]\s+KONULAR"],
    )
    if not table:
        return []

    units = []
    buffer = []
    ignored_bits = (
        "ÖĞRENME", "BİRİMİ", "BIRIMI", "ÜNİTE", "UNITE",
        "KAZANIM", "SAYISI", "DERS SAATİ", "DERS SAATI", "ORAN",
        "DERS", "SAAT", "SAATİ", "SAATI"
    )

    for raw_line in table.splitlines():
        line = clean_space(raw_line)
        if not line:
            continue
        upper = line.upper()
        if upper.startswith("TOPLAM"):
            break
        if not re.search(r"[a-zA-ZÇĞİÖŞÜçıöşüğâêîû]", line) and not re.search(r"\d+\s+\d+\s+[\d,.%]+$", line):
            continue
        if any(bit in upper for bit in ignored_bits) and not re.search(r"\d+\s+\d+\s+[\d,.%]+$", line):
            continue

        full_row = re.match(r"(.+?)\s+(\d+)\s+\d+\s+[\d,.%]+$", line)
        count_row = re.match(r"^(\d+)\s+\d+\s+[\d,.%]+$", line)
        if full_row:
            name = clean_space(" ".join([*buffer, full_row.group(1)]))
            if name:
                units.append({"number": len(units) + 1, "name": name, "count": int(full_row.group(2))})
            buffer = []
        elif count_row:
            name = clean_space(" ".join(buffer))
            if name:
                units.append({"number": len(units) + 1, "name": name, "count": int(count_row.group(1))})
            buffer = []
        else:
            buffer.append(line)

    return units


def unit_pattern(unit_name):
    parts = [re.escape(part) for part in clean_space(unit_name).split()]
    return r"\s+".join(parts)


def parse_numbered_items(block):
    items = []
    current = None
    current_number = None

    for raw_line in block.splitlines():
        line = clean_space(raw_line)
        if not line or line.startswith("•") or line.startswith("-"):
            continue

        numbered = re.match(r"^(\d+)\.\s*(?!\d)(.+)$", line)
        if numbered:
            if current:
                items.append({"number": current_number, "text": clean_space(" ".join(current))})
            current_number = int(numbered.group(1))
            current = [numbered.group(2)]
            continue

        if current and not is_outcome(clean_space(" ".join(current))):
            current.append(line)

    if current:
        items.append({"number": current_number, "text": clean_space(" ".join(current))})

    return items


def parse_units_from_main(main):
    matches = re.finditer(r"(?:^|\n)\s*([A-ZÇĞİÖŞÜ][^\n]{3,80}?)\s+\d+\.", main)
    names = []
    for match in matches:
        name = clean_space(match.group(1))
        if name and not any(name.casefold() == existing.casefold() for existing in names):
            names.append(name)
    return [{"number": index + 1, "name": name, "count": 0} for index, name in enumerate(names)]


def parse_curriculum(text, course_name):
    main = find_section(
        text,
        r"ÖĞRENME\s+B[İI]R[İI]M[İI]\s+KONULAR",
        [r"UYGULAMA\s+FAAL[İI]YETLER[İI]", r"ÖLÇME\s+VE\s+DEĞERLEND[İI]RME", r"DERS[İI]N\s+UYGULANMASINA"],
    ) or text
    units = parse_unit_table(text) or parse_units_from_main(main)

    positions = []
    for index, unit in enumerate(units, start=1):
        patterns = [
            rf"(?:^|\n)\s*{index}\.\s+{unit_pattern(unit['name'])}",
            rf"(?:^|\n)\s*{unit_pattern(unit['name'])}",
            unit_pattern(unit["name"]),
        ]
        match = None
        for pattern in patterns:
            match = re.search(pattern, main, flags=re.I)
            if match:
                break
        if match:
            positions.append((match.start(), unit["name"]))

    positions.sort(key=lambda item: item[0])
    items = []

    for idx, (start, unit_name) in enumerate(positions):
        end = positions[idx + 1][0] if idx + 1 < len(positions) else len(main)
        block = main[start:end]
        outcomes = [item for item in parse_numbered_items(block) if is_outcome(item["text"])]
        unit_number = next((unit["number"] for unit in units if unit["name"] == unit_name), idx + 1)
        expected_count = next((unit["count"] for unit in units if unit["name"] == unit_name), 0)
        if expected_count:
            outcomes = outcomes[:expected_count]
        numbered_unit_name = f"{unit_number}. {unit_name}"

        for outcome in outcomes:
            outcome_text = clean_space(outcome["text"])
            if outcome_text and not outcome_text.endswith("."):
                outcome_text += "."
            numbered_outcome = f"{outcome['number']}. {outcome_text}" if outcome.get("number") else outcome_text
            items.append({
                "courseName": course_name,
                "unit": numbered_unit_name,
                "topic": numbered_unit_name,
                "outcome": numbered_outcome,
            })

    return items


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    path = sys.argv[1]
    course_name = sys.argv[2] if len(sys.argv) > 2 else "Ders"
    reader = PdfReader(path)
    text = "\n".join((page.extract_text() or "") for page in reader.pages)
    items = parse_curriculum(text, course_name)
    print(json.dumps({"items": items}, ensure_ascii=False))


if __name__ == "__main__":
    main()
