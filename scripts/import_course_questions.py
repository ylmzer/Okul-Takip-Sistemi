import sys
import json
import os
import re
import zipfile
from xml.etree import ElementTree as ET

if sys.platform.startswith('win'):
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())

# ─── regex patterns ───────────────────────────────────────────────────────────
QUESTION_START_RE  = re.compile(r"^\s*(\d+)\s*[\.:\-\)]\s+(.+)")
OPTION_RE          = re.compile(r"^([A-Ea-e])\s*[\)\.:\-]\s*(.*)")
ANSWER_LINE_RE     = re.compile(
    r"(?:cevap|yanıt|answer|doğru\s*cevap|doğru)\s*[:\-]?\s*([A-Ea-e])\s*$",
    re.IGNORECASE
)
BULK_ANSWER_KEY_RE = re.compile(r"\b([A-Ea-e]{4,})\b")
ANSWER_SECTION_HEADER_RE = re.compile(
    r"(?:cevap\s*anahtarı|answer\s*key|yanıt\s*anahtarı|doğru\s*cevaplar|ba[sş]arılar)",
    re.IGNORECASE
)

def clean_text(val):
    if val is None:
        return ""
    val = str(val).strip()
    val = re.sub(r"\s+", " ", val)
    return val

# ─── text extraction ──────────────────────────────────────────────────────────
def extract_lines_from_docx(path):
    """Extract lines preserving table structure as num-letter pairs at end."""
    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    with zipfile.ZipFile(path) as archive:
        document = ET.fromstring(archive.read("word/document.xml"))
    body = document.find("w:body", ns)
    lines = []
    if body is None:
        return lines, []

    # Collect table data separately (for answer key tables)
    table_cells = []  # list of all cell texts
    for tbl in body.findall(".//w:tbl", ns):
        row_data = []
        for row in tbl.findall(".//w:tr", ns):
            cell_texts = []
            for cell in row.findall(".//w:tc", ns):
                cell_text = "".join(
                    n.text or "" for n in cell.findall(".//w:t", ns)
                ).strip()
                cell_texts.append(cell_text)
            if cell_texts:
                row_data.append(cell_texts)
        table_cells.append(row_data)

    # Regular paragraph extraction
    for p in body.findall(".//w:p", ns):
        text = "".join(node.text or "" for node in p.findall(".//w:t", ns)).strip()
        if text:
            lines.append(text)

    # Try to build answer key from tables
    answer_key = {}
    for table in table_cells:
        # Detect pattern: rows like ["1", "C"] or ["1", "2", ..., "A", "B", ...]
        # Pattern 1: Two-column number-answer table
        for row in table:
            if len(row) == 2:
                num_part, letter_part = row[0].strip(), row[1].strip()
                if re.match(r"^\d+$", num_part) and re.match(r"^[A-Ea-e]$", letter_part):
                    answer_key[int(num_part)] = letter_part.upper()

        # Pattern 2: Table where all numbers in one row + all answers in next row
        if len(table) >= 2:
            for ri in range(len(table) - 1):
                num_row   = [c.strip() for c in table[ri]]
                ans_row   = [c.strip() for c in table[ri + 1]]
                nums_valid = all(re.match(r"^\d+$", c) for c in num_row if c)
                ans_valid  = all(re.match(r"^[A-Ea-e]$", c) for c in ans_row if c)
                nums_clean = [int(c) for c in num_row if re.match(r"^\d+$", c)]
                ans_clean  = [c.upper() for c in ans_row if re.match(r"^[A-Ea-e]$", c)]
                if nums_valid and ans_valid and len(nums_clean) == len(ans_clean) and len(nums_clean) >= 3:
                    for num, ans in zip(nums_clean, ans_clean):
                        answer_key[num] = ans

        # Pattern 3: Single-column table with sequential answers (like the sample DOCX)
        # Detect if there are exactly N sequential number cells followed by N letter cells
        all_cells = [r[0].strip() if r else "" for r in table]
        numbers = [c for c in all_cells if re.match(r"^\d+$", c)]
        letters = [c for c in all_cells if re.match(r"^[A-Ea-e]$", c)]
        if numbers and letters and len(numbers) == len(letters):
            for num, letter in zip(numbers, letters):
                answer_key[int(num)] = letter.upper()

    return lines, answer_key


def extract_lines_from_pdf(path):
    lines = []
    try:
        from pypdf import PdfReader
        reader = PdfReader(path)
        for page in reader.pages:
            text = page.extract_text() or ""
            for line in text.split("\n"):
                line = line.strip()
                if line:
                    lines.append(line)
    except Exception:
        pass
    return lines, {}


def extract_lines_from_txt(path):
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        lines = [l.rstrip("\n") for l in f if l.strip()]
    return lines, {}


# ─── bulk answer key detector (from raw text) ─────────────────────────────────
def detect_bulk_answer_key_from_text(full_text, num_questions):
    tail = full_text[int(len(full_text) * 0.5):]

    # 1) Compact key e.g. "CDDADCBCDCABCCBDADAA"
    for m in BULK_ANSWER_KEY_RE.finditer(tail):
        candidate = m.group(1).upper()
        if len(candidate) == num_questions:
            return {i + 1: c for i, c in enumerate(candidate)}

    # 2) Spaced key e.g. "1-C  2-D  ..."
    spaced = re.findall(r"\b(\d+)\s*[-\.:]?\s*([A-Ea-e])\b", tail)
    if spaced:
        key_map = {int(num): letter.upper() for num, letter in spaced}
        if len(key_map) >= num_questions:
            return key_map

    # 3) Sequential single letters after numbers section (tail lines pattern)
    tail_lines = [l.strip() for l in tail.split("\n") if l.strip()]
    num_section = [l for l in tail_lines if re.match(r"^\d+$", l)]
    ans_section = [l for l in tail_lines if re.match(r"^[A-Ea-e]$", l, re.I)]
    if num_section and ans_section and len(num_section) == len(ans_section):
        return {int(n): a.upper() for n, a in zip(num_section, ans_section)}

    return {}


# ─── inline option splitter ───────────────────────────────────────────────────
def split_inline_options(text):
    """Extract options from a string like 'A) opt1 B) opt2 C) opt3 D) opt4'"""
    pattern = re.compile(r"([A-Ea-e])\s*[\)\.\:\-]\s*", re.UNICODE)
    parts = pattern.split(text)
    if len(parts) < 4:
        return None
    result = {}
    i = 1
    while i + 1 < len(parts):
        letter = parts[i].upper()
        content = parts[i + 1].strip()
        result[letter] = content
        i += 2
    return result if len(result) >= 2 else None


# ─── main parser ─────────────────────────────────────────────────────────────
def parse_questions(lines, full_text="", table_answer_key=None):
    questions = []
    current = None
    in_answer_section = False
    inline_answer_key = {}  # {question_number: letter}

    def commit_current():
        nonlocal current
        if current is None:
            return
        if current.get("optionA") and current.get("optionB") and current.get("text"):
            questions.append(current)
        current = None

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue

        # Detect start of answer section
        if ANSWER_SECTION_HEADER_RE.search(line):
            in_answer_section = True
            commit_current()
            continue

        if in_answer_section:
            # Numbered pairs: "1-C  2-D ..."
            pairs = re.findall(r"\b(\d+)\s*[-\.:]?\s*([A-Ea-e])\b", line)
            for num_str, letter in pairs:
                inline_answer_key[int(num_str)] = letter.upper()
            continue

        # Inline answer hint: "Cevap: C"
        ans_m = ANSWER_LINE_RE.match(line)
        if ans_m and current is not None:
            current["correctOption"] = ans_m.group(1).upper()
            continue

        # Option line (separate line)
        opt_m = OPTION_RE.match(line)
        if opt_m and current is not None and not current.get(f"option{opt_m.group(1).upper()}"):
            letter = opt_m.group(1).upper()
            text = opt_m.group(2).strip()
            current[f"option{letter}"] = text
            continue

        # New question?
        q_m = QUESTION_START_RE.match(line)
        if q_m:
            commit_current()
            q_text = q_m.group(2).strip()
            inline = split_inline_options(q_text)
            if inline:
                first_opt = re.search(r"[A-Ea-e]\s*[\)\.\:\-]\s*", q_text)
                clean_q = q_text[:first_opt.start()].strip() if first_opt else q_text
                current = {
                    "questionNumber": int(q_m.group(1)),
                    "text": clean_q,
                    "optionA": inline.get("A", ""),
                    "optionB": inline.get("B", ""),
                    "optionC": inline.get("C", ""),
                    "optionD": inline.get("D", ""),
                    "optionE": inline.get("E", ""),
                    "correctOption": "A"
                }
            else:
                current = {
                    "questionNumber": int(q_m.group(1)),
                    "text": q_text,
                    "optionA": "", "optionB": "", "optionC": "",
                    "optionD": "", "optionE": "",
                    "correctOption": "A"
                }
            continue

        # Multi-line question text continuation (before first option)
        if current is not None and not current.get("optionA"):
            inline = split_inline_options(line)
            if inline:
                first_opt = re.search(r"[A-Ea-e]\s*[\)\.\:\-]\s*", line)
                prefix = line[:first_opt.start()].strip() if first_opt else ""
                if prefix:
                    current["text"] += " " + prefix
                current["optionA"] = inline.get("A", "")
                current["optionB"] = inline.get("B", "")
                current["optionC"] = inline.get("C", "")
                current["optionD"] = inline.get("D", "")
                current["optionE"] = inline.get("E", "")
            else:
                current["text"] += " " + line

    commit_current()

    # Normalize question numbers
    for idx, q in enumerate(questions):
        q["questionNumber"] = idx + 1

    # Build combined answer key (priority: table > inline section > bulk text)
    combined_key = {}

    # 1. Bulk text key
    bulk_key = detect_bulk_answer_key_from_text(full_text, len(questions))
    combined_key.update(bulk_key)

    # 2. Inline answer section (overrides bulk)
    combined_key.update(inline_answer_key)

    # 3. Table answer key (highest priority)
    if table_answer_key:
        combined_key.update(table_answer_key)

    # Apply combined key
    for q in questions:
        qn = q["questionNumber"]
        if qn in combined_key:
            q["correctOption"] = combined_key[qn]

    return questions


# ─── entry point ─────────────────────────────────────────────────────────────
def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Dosya yolu belirtilmedi"}, ensure_ascii=False))
        sys.exit(1)

    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(json.dumps({"error": "Dosya bulunamadı"}, ensure_ascii=False))
        sys.exit(1)

    ext = os.path.splitext(file_path)[1].lower()
    try:
        if ext == ".docx":
            lines, table_key = extract_lines_from_docx(file_path)
        elif ext == ".pdf":
            lines, table_key = extract_lines_from_pdf(file_path)
        elif ext in (".txt", ".text"):
            lines, table_key = extract_lines_from_txt(file_path)
        else:
            print(json.dumps({"error": "Desteklenmeyen dosya türü (.docx, .pdf veya .txt)"}, ensure_ascii=False))
            sys.exit(1)

        full_text = "\n".join(lines)
        questions = parse_questions(lines, full_text, table_key)

        if not questions:
            print(json.dumps({
                "questions": [],
                "warning": "Hiç soru ayrıştırılamadı. Dosya formatını kontrol edin."
            }, ensure_ascii=False))
        else:
            print(json.dumps({"questions": questions}, ensure_ascii=False))

    except Exception as e:
        import traceback
        print(json.dumps({
            "error": f"Ayrıştırma hatası: {str(e)}",
            "detail": traceback.format_exc()
        }, ensure_ascii=False))
        sys.exit(1)


if __name__ == "__main__":
    main()
